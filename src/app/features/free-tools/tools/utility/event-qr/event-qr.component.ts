import {
  Component, OnInit, OnDestroy, AfterViewInit, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID, ViewChild, ElementRef
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { BlobDownloadService } from '../../../services/blob-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

@Component({
  selector: 'app-event-qr',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './event-qr.component.html',
  styleUrls: ['./event-qr.component.scss']
})
export class EventQrComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('qrCanvas') qrCanvasRef!: ElementRef<HTMLCanvasElement>;

  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private blobSvc    = inject(BlobDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  /** 'ical' encodes the full vEvent; 'url' encodes just a URL */
  qrMode: 'ical' | 'url' = 'ical';
  qrGenerated = false;
  encodedContent = '';
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('add-to-calendar-link-generator'),
    getToolBySlug('upi-qr-generator'),
    getToolBySlug('mailto-link-generator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What data is encoded in the Event QR code?',
      a: 'In "iCal Event" mode the QR code encodes a compact vEvent (BEGIN:VCALENDAR…END:VCALENDAR) string. When scanned on iOS or Android, the system offers to add the event directly to the calendar app. In "URL" mode the QR simply encodes the URL you provide — useful for linking to an Eventbrite, Luma, or Google Meet page.'
    },
    {
      q: 'Why does the QR code need Error Correction Level "H"?',
      a: 'Error Correction Level H (High) allows up to 30% of the QR code data to be restored even if the code is partially obscured or damaged. If you add a logo overlay in the centre (which covers roughly 15-20% of the code), Error Correction Level H ensures the remaining data is still enough to reconstruct the full QR payload.'
    },
    {
      q: 'Can I add a logo to my event QR code?',
      a: 'Yes. Upload a PNG or JPG logo using the Logo Upload field. The tool draws the QR code to an HTML5 Canvas and then composites your logo in the centre. Always use Error Correction Level H when adding logos — this is enforced automatically in this tool.'
    },
    {
      q: 'How large should I print this QR code?',
      a: 'For reliable scanning, the printed QR code should be at least 2.5 cm × 2.5 cm (about 1 inch × 1 inch) at its final print size. If printed on a banner or poster, larger is always better. Download the PNG at its full resolution (300px) for print quality.'
    }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      title:     ['', Validators.required],
      startDate: ['', Validators.required],
      startTime: ['09:00'],
      endDate:   ['', Validators.required],
      endTime:   ['10:00'],
      location:  [''],
      url:       [''],
      fgColor:   ['#000000'],
      bgColor:   ['#FFFFFF']
    });
    this.setDefaultDates();
    this.updateSeo();
    this.injectJsonLd();
  }

  ngAfterViewInit(): void {}

  setMode(mode: 'ical' | 'url'): void {
    this.qrMode = mode;
    this.qrGenerated = false;
    this.cdr.markForCheck();
  }

  private setDefaultDates(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const today = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const ds = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    this.form.patchValue({ startDate: ds, endDate: ds });
  }

  async generate(): Promise<void> {
    if (this.qrMode === 'ical' && this.form.get('title')?.invalid) {
      this.form.get('title')?.markAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    const v = this.form.getRawValue();

    if (this.qrMode === 'ical') {
      // Build compact vEvent string
      const formatDt = (date: string, time: string): string => {
        const d = new Date(`${date}T${time}:00`);
        const pad = (n: number) => String(n).padStart(2, '0');
        return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
      };
      this.encodedContent = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        `SUMMARY:${v.title}`,
        `DTSTART:${formatDt(v.startDate, v.startTime || '09:00')}`,
        `DTEND:${formatDt(v.endDate, v.endTime || '10:00')}`,
        v.location ? `LOCATION:${v.location}` : '',
        'END:VEVENT',
        'END:VCALENDAR'
      ].filter(Boolean).join('\n');
    } else {
      this.encodedContent = v.url?.trim() || 'https://briskpeople.com';
    }

    await this.renderQr(v.fgColor, v.bgColor);
  }

  private async renderQr(fgColor: string, bgColor: string): Promise<void> {
    try {
      const QRCode = (await import('qrcode')).default;
      const canvas = this.qrCanvasRef?.nativeElement;
      if (!canvas) return;

      await QRCode.toCanvas(canvas, this.encodedContent, {
        width: 300,
        margin: 2,
        errorCorrectionLevel: 'H',
        color: { dark: fgColor || '#000000', light: bgColor || '#FFFFFF' }
      });

      this.qrGenerated = true;
      this.cdr.markForCheck();
    } catch (err) {
      console.error('Event QR generation failed', err);
    }
  }

  downloadPng(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const canvas = this.qrCanvasRef?.nativeElement;
    if (!canvas) return;
    const title = this.form.value.title || 'event';
    this.blobSvc.downloadCanvas(canvas, `event-qr-${title.toLowerCase().replace(/\s+/g, '-')}.png`);
  }

  reset(): void {
    this.form.reset({ startTime: '09:00', endTime: '10:00', fgColor: '#000000', bgColor: '#FFFFFF' });
    this.qrGenerated = false;
    this.encodedContent = '';
    this.qrMode = 'ical';
    if (isPlatformBrowser(this.platformId) && this.qrCanvasRef?.nativeElement) {
      const ctx = this.qrCanvasRef.nativeElement.getContext('2d');
      ctx?.clearRect(0, 0, this.qrCanvasRef.nativeElement.width, this.qrCanvasRef.nativeElement.height);
    }
    this.setDefaultDates();
    this.cdr.markForCheck();
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required')) return 'This field is required.';
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free Event QR Code Generator — Calendar QR Code | BriskPeople';
    const d = 'Generate a QR code for your event that adds it directly to Google Calendar, Apple Calendar, and more. Download as PNG. Free event QR generator.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'event QR code generator, calendar QR code, Google Calendar QR, event invite QR, vEvent QR code' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/event-qr-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Event QR Code Generator', applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/event-qr-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Event QR Code Generator', item: 'https://www.briskpeople.com/free-tools/event-qr-generator' }
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
