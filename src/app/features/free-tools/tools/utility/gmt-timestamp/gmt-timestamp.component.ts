import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnDestroy, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

@Component({
  selector: 'app-gmt-timestamp',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './gmt-timestamp.component.html',
  styleUrls: ['./gmt-timestamp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GmtTimestampComponent implements OnInit, OnDestroy {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  
  private timerId: any;
  
  utcDateStr: string = '';
  utcTimeStr: string = '';
  unixSecs: number = 0;
  unixMs: number = 0;

  timezones = [
    { name: 'Los Angeles (PT)', offset: -8 },
    { name: 'New York (ET)', offset: -5 },
    { name: 'London (GMT)', offset: 0 },
    { name: 'Berlin (CET)', offset: 1 },
    { name: 'Dubai (GST)', offset: 4 },
    { name: 'Karachi (PKT)', offset: 5 },
    { name: 'Kolkata (IST)', offset: 5.5 },
    { name: 'Tokyo (JST)', offset: 9 },
    { name: 'Sydney (AEST)', offset: 10 }
  ];

  faqs = [
    {
      q: 'Are GMT and UTC the same thing?',
      a: 'Practically, yes. GMT (Greenwich Mean Time) is a time zone, while UTC (Coordinated Universal Time) is a time standard. However, they share the exact same current time.'
    },
    {
      q: 'Is this clock perfectly accurate?',
      a: 'It relies on your device\'s system clock. If your computer\'s clock is out of sync with global NTP servers, this clock will reflect that discrepancy.'
    }
  ];
  openFaqIndex: number | null = 0;

  constructor(
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const slug = 'gmt-timestamp';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    this.tick();
    
    if (isPlatformBrowser(this.platformId)) {
      this.timerId = setInterval(() => this.tick(), 100); // 100ms for smooth MS display if we wanted, but we update every sec usually
    }
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  tick() {
    const now = new Date();
    this.unixMs = now.getTime();
    this.unixSecs = Math.floor(this.unixMs / 1000);
    
    // Format UTC string
    this.utcDateStr = now.toLocaleDateString('en-US', {
      timeZone: 'UTC',
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    
    this.utcTimeStr = now.toLocaleTimeString('en-US', {
      timeZone: 'UTC',
      hour12: false,
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });

    this.cdr.markForCheck();
  }

  formatOffset(offset: number): string {
    const sign = offset >= 0 ? '+' : '-';
    const abs = Math.abs(offset);
    const hrs = Math.floor(abs);
    const mins = (abs % 1) * 60;
    return `UTC ${sign}${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
