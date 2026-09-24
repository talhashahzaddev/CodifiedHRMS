import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

interface TimelineSlot {
  label: string;      // e.g. "09:00 AM"
  isoString: string;
  sourceLabel: string;
  targets: string[];  // The time in target zones
  isCurrent?: boolean; // highlight the specifically selected time
}

@Component({
  selector: 'app-time-zone-converter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './time-zone-converter.component.html',
  styleUrls: ['./time-zone-converter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeZoneConverterComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  timeline: TimelineSlot[] = [];
  targetZones: string[] = [];

  // Used to populate a dropdown of common IANA time zones
  commonTimeZones = [
    'UTC',
    'Asia/Karachi',
    'Asia/Kolkata',
    'Asia/Tokyo',
    'Asia/Singapore',
    'Asia/Dubai',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'America/New_York',
    'America/Chicago',
    'America/Los_Angeles',
    'America/Toronto',
    'Australia/Sydney'
  ];

  faqs = [
    {
      q: 'Does this account for Daylight Saving Time (DST)?',
      a: 'Yes. By using the browser\'s native Intl API, the calculations automatically respect the Daylight Saving Time rules currently in effect for the selected date and time zones.'
    },
    {
      q: 'Can I add more than three target zones?',
      a: 'Currently, the timeline is optimized for comparing a source zone against three target zones to keep the interface clean and easy to read. You can change any of the target zones at any time.'
    },
    {
      q: 'Is my data sent to a server?',
      a: 'No. All timezone calculations happen instantly inside your browser using JavaScript.'
    }
  ];

  openFaqIndex: number | null = 0;

  constructor(
    private fb: FormBuilder,
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const slug = 'time-zone-converter';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    // Initialize with current local time and timezone if possible
    const now = new Date();
    const currentHours = String(now.getHours()).padStart(2, '0');
    const currentMinutes = String(now.getMinutes()).padStart(2, '0');
    
    let localTz = 'Asia/Karachi';
    if (isPlatformBrowser(this.platformId)) {
      try {
        localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;
        if (!this.commonTimeZones.includes(localTz)) {
          this.commonTimeZones.push(localTz);
          this.commonTimeZones.sort();
        }
      } catch (e) {}
    }

    this.form = this.fb.group({
      sourceTime: [`${currentHours}:${currentMinutes}`, Validators.required],
      sourceZone: [localTz, Validators.required],
      targetZone1: ['America/New_York', Validators.required],
      targetZone2: ['Europe/London', Validators.required],
      targetZone3: ['Asia/Tokyo', Validators.required]
    });

    this.form.valueChanges.subscribe(() => this.calculateTimeline());
    
    if (isPlatformBrowser(this.platformId)) {
      this.calculateTimeline();
    }
  }

  getFieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched)) {
      if (ctrl.hasError('required')) return 'This field is required.';
    }
    return null;
  }

  calculateTimeline() {
    if (this.form.invalid) return;

    const { sourceTime, sourceZone, targetZone1, targetZone2, targetZone3 } = this.form.value;
    this.targetZones = [targetZone1, targetZone2, targetZone3].filter(z => !!z);

    const [hrs, mins] = sourceTime.split(':').map(Number);

    // Let's create an anchor date for today
    let anchorDate = new Date();
    anchorDate.setHours(hrs, mins, 0, 0); // local time approximation
    
    // Generate 25 slots (-12h to +12h), centering on the selected time
    this.timeline = [];
    
    for (let offset = -12; offset <= 12; offset++) {
      const slotDate = new Date(anchorDate.getTime() + (offset * 60 * 60 * 1000));
      
      const isCurrent = offset === 0;
      
      const sourceLabel = this.formatInZone(slotDate, sourceZone);
      const targets = this.targetZones.map(z => this.formatInZone(slotDate, z));
      
      let relativeLabel = 'Selected Time';
      if (offset < 0) relativeLabel = `${offset}h`;
      if (offset > 0) relativeLabel = `+${offset}h`;
      
      this.timeline.push({
        label: relativeLabel,
        isoString: slotDate.toISOString(),
        sourceLabel,
        targets,
        isCurrent
      });
    }

    this.cdr.markForCheck();
  }

  private formatInZone(date: Date, timeZone: string): string {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone,
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
        weekday: 'short'
      }).format(date);
    } catch (e) {
      return 'Invalid TZ';
    }
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
