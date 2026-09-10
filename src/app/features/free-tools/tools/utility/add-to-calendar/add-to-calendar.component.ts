import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { BlobDownloadService } from '../../../services/blob-download.service';
import { ClipboardService } from '../../../services/clipboard.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface CalendarLinks {
  google:  string;
  outlook: string;
  yahoo:   string;
  ics:     string; // raw ICS content for download
}

@Component({
  selector: 'app-add-to-calendar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './add-to-calendar.component.html',
  styleUrls: ['./add-to-calendar.component.scss']
})
export class AddToCalendarComponent implements OnInit, OnDestroy {
  private fb          = inject(FormBuilder);
  private titleSvc    = inject(Title);
  private meta        = inject(Meta);
  private blobSvc     = inject(BlobDownloadService);
  private clipboard   = inject(ClipboardService);
  private cdr         = inject(ChangeDetectorRef);
  private platformId  = inject(PLATFORM_ID);
  private document    = inject(DOCUMENT);

  form!: FormGroup;
  links: CalendarLinks | null = null;
  copiedKey: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('event-qr-generator'),
    getToolBySlug('time-zone-converter'),
    getToolBySlug('timetable-generator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is an ".ics" file?',
      a: 'An .ics file (iCalendar) is a standard file format (RFC 5545) for calendar data. It is supported by virtually all calendar apps: Apple Calendar, Google Calendar (import), Outlook Desktop, Thunderbird, and more. When a user opens or downloads the .ics file, their calendar app prompts them to add the event.'
    },
    {
      q: 'Why does my Google Calendar link have "Z" at the end of the dates?',
      a: 'The "Z" suffix means the time is expressed in UTC (Coordinated Universal Time). Google Calendar requires event times in the UTC-based format YYYYMMDDTHHmmssZ. We automatically convert your local date/time to UTC for the Google link, ensuring your event displays at the correct local time for each attendee regardless of their timezone settings.'
    },
    {
      q: 'Does this work for all-day events?',
      a: 'Yes. Toggle "All-Day Event" and you will only need to provide start/end dates — no times. The generated links and .ics file will correctly encode the event as an all-day event in all supported calendar applications.'
    },
    {
      q: 'Why is the Outlook link different from the Google link?',
      a: 'Each calendar provider uses a different URL scheme and parameter format. Google Calendar uses its own render API, while Outlook Web (Outlook Live) uses a deeplink compose URL. Yahoo uses yet another format. Our generator handles all the differences automatically.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.setDefaultDates();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      title:       ['', [Validators.required, Validators.maxLength(200)]],
      startDate:   ['', Validators.required],
      startTime:   ['09:00'],
      endDate:     ['', Validators.required],
      endTime:     ['10:00'],
      location:    [''],
      description: [''],
      allDay:      [false],
      timezone:    ['UTC']
    });

    // When allDay is toggled, update validators
    this.form.get('allDay')!.valueChanges.subscribe(allDay => {
      const startTimeCtrl = this.form.get('startTime')!;
      const endTimeCtrl   = this.form.get('endTime')!;
      if (allDay) {
        startTimeCtrl.clearValidators();
        endTimeCtrl.clearValidators();
      } else {
        startTimeCtrl.setValidators(Validators.required);
        endTimeCtrl.setValidators(Validators.required);
      }
      startTimeCtrl.updateValueAndValidity();
      endTimeCtrl.updateValueAndValidity();
    });
  }

  private setDefaultDates(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    this.form.patchValue({ startDate: dateStr, endDate: dateStr });
  }

  generate(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const allDay = v.allDay as boolean;

    // Format dates to the required UTC format for Google/Yahoo
    const startDt = allDay
      ? this.formatAllDay(v.startDate)
      : this.formatUtc(v.startDate, v.startTime);
    const endDt = allDay
      ? this.formatAllDay(v.endDate, true)
      : this.formatUtc(v.endDate, v.endTime);

    // ISO format for Outlook
    const startIso = allDay ? v.startDate : `${v.startDate}T${v.startTime}:00`;
    const endIso   = allDay ? v.endDate   : `${v.endDate}T${v.endTime}:00`;

    const title       = encodeURIComponent(v.title);
    const location    = encodeURIComponent(v.location || '');
    const description = encodeURIComponent(v.description || '');

    // ── Google Calendar ───────────────────────────────────────────────────────
    const google = [
      'https://calendar.google.com/calendar/render?action=TEMPLATE',
      `&text=${title}`,
      `&dates=${startDt}/${endDt}`,
      v.description ? `&details=${description}` : '',
      v.location    ? `&location=${location}`   : ''
    ].join('');

    // ── Outlook Web ───────────────────────────────────────────────────────────
    const outlook = [
      'https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent',
      `&subject=${title}`,
      `&startdt=${encodeURIComponent(startIso)}`,
      `&enddt=${encodeURIComponent(endIso)}`,
      v.description ? `&body=${description}` : '',
      v.location    ? `&location=${location}` : ''
    ].join('');

    // ── Yahoo Calendar ────────────────────────────────────────────────────────
    const durHours = this.durationHours(v.startDate, v.startTime, v.endDate, v.endTime);
    const yahoo = [
      'https://calendar.yahoo.com/?v=60',
      `&title=${title}`,
      `&st=${encodeURIComponent(startDt.replace(/[TZ]/g, '').slice(0, 15))}`,
      `&dur=${durHours}`,
      v.description ? `&desc=${description}` : '',
      v.location    ? `&in_loc=${location}`  : ''
    ].join('');

    // ── ICS content (RFC 5545) ─────────────────────────────────────────────────
    const uid = `${Date.now()}-briskpeople@briskpeople.com`;
    const now = this.nowUtcString();
    const icsLines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//BriskPeople//Free Tools//EN',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      allDay
        ? `DTSTART;VALUE=DATE:${v.startDate.replace(/-/g, '')}`
        : `DTSTART:${startDt}`,
      allDay
        ? `DTEND;VALUE=DATE:${this.addOneDay(v.endDate)}`
        : `DTEND:${endDt}`,
      `SUMMARY:${this.icsEscape(v.title)}`,
      v.location    ? `LOCATION:${this.icsEscape(v.location)}`       : '',
      v.description ? `DESCRIPTION:${this.icsEscape(v.description)}` : '',
      'END:VEVENT',
      'END:VCALENDAR'
    ].filter(Boolean).join('\r\n');

    this.links = { google, outlook, yahoo, ics: icsLines };
    this.cdr.markForCheck();
  }

  // ── Clipboard ─────────────────────────────────────────────────────────────
  async copyLink(key: keyof CalendarLinks, value: string): Promise<void> {
    if (!this.links) return;
    const success = await this.clipboard.copy(value);
    if (success) {
      this.copiedKey = key;
      this.cdr.markForCheck();
      setTimeout(() => { this.copiedKey = null; this.cdr.markForCheck(); }, 2000);
    }
  }

  // ── ICS Download ──────────────────────────────────────────────────────────
  downloadIcs(): void {
    if (!this.links) return;
    this.blobSvc.downloadText(
      `${this.form.value.title || 'event'}.ics`,
      this.links.ics,
      'text/calendar;charset=utf-8'
    );
  }

  reset(): void {
    this.form.reset({ startTime: '09:00', endTime: '10:00', allDay: false, timezone: 'UTC' });
    this.links = null;
    this.setDefaultDates();
    this.cdr.markForCheck();
  }

  toggleFaq(i: number): void {
    this.openFaqIndex = this.openFaqIndex === i ? null : i;
  }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required'))   return 'This field is required.';
    if (c.hasError('maxlength'))  return `Maximum ${c.errors?.['maxlength']?.requiredLength} characters.`;
    return 'Invalid value.';
  }

  // ── Date/Time Helpers ─────────────────────────────────────────────────────
  private formatUtc(date: string, time: string): string {
    // Combine date + time, treat as local, convert to UTC
    const d = new Date(`${date}T${time}:00`);
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      '00Z'
    );
  }

  private formatAllDay(date: string, isEnd = false): string {
    // For all-day end dates Google needs the next day
    if (isEnd) return this.addOneDay(date).replace(/-/g, '');
    return date.replace(/-/g, '');
  }

  private addOneDay(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  private nowUtcString(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return (
      d.getUTCFullYear().toString() +
      pad(d.getUTCMonth() + 1) +
      pad(d.getUTCDate()) +
      'T' +
      pad(d.getUTCHours()) +
      pad(d.getUTCMinutes()) +
      pad(d.getUTCSeconds()) +
      'Z'
    );
  }

  private durationHours(sd: string, st: string, ed: string, et: string): string {
    const start = new Date(`${sd}T${st || '00:00'}:00`);
    const end   = new Date(`${ed}T${et || '00:00'}:00`);
    const diffMs = end.getTime() - start.getTime();
    const hrs  = Math.max(0, Math.floor(diffMs / 3600000));
    const mins = Math.max(0, Math.floor((diffMs % 3600000) / 60000));
    return `${String(hrs).padStart(2, '0')}${String(mins).padStart(2, '0')}`;
  }

  private icsEscape(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  }

  // ── SEO ───────────────────────────────────────────────────────────────────
  private updateSeo(): void {
    const t = 'Free Add to Calendar Link Generator — Google, Outlook, Yahoo & ICS | BriskPeople';
    const d = 'Generate Add to Calendar links for Google Calendar, Outlook, Yahoo, and download an .ics file. Free event link generator — no signup required.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'add to calendar link generator, google calendar link, outlook calendar link, ICS file generator, event link builder' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/add-to-calendar-link-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Add to Calendar Link Generator', applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/add-to-calendar-link-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Add to Calendar Link Generator', item: 'https://www.briskpeople.com/free-tools/add-to-calendar-link-generator' }
        ]
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: this.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }
    ];
    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schemas);
    this.document.head.appendChild(this.jsonLdScript);
  }

  ngOnDestroy(): void {
    this.jsonLdScript?.remove();
    this.titleSvc.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}
