import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { UTILITY_TOOLS, ToolConfig } from '../config/tools.config';

@Component({
  selector: 'app-free-tools-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './free-tools-hub.component.html',
  styleUrls: ['./free-tools-hub.component.scss']
})
export class FreeToolsHubComponent implements OnInit, OnDestroy {
  readonly tools: ToolConfig[] = UTILITY_TOOLS;

  openFaqIndex: number | null = null;

  readonly toolCategories = [
    {
      label: 'Calendar & Events',
      icon: 'event',
      slugs: ['add-to-calendar-link-generator', 'event-qr-generator', 'timetable-generator']
    },
    {
      label: 'QR & Link Generators',
      icon: 'qr_code_2',
      slugs: ['event-qr-generator', 'upi-qr-generator', 'mailto-link-generator', 'banner-generator']
    },
    {
      label: 'Time & Timezone Tools',
      icon: 'schedule',
      slugs: ['time-zone-converter', 'time-difference-calculator', 'time-tracker', 'unix-timestamp-converter', 'iso-time-formatter', 'gmt-timestamp']
    },
    {
      label: 'Age & Date Tools',
      icon: 'cake',
      slugs: ['age-calculator', 'age-difference-calculator']
    }
  ];

  readonly faqs = [
    {
      q: 'How do I generate an "Add to Calendar" link for my event?',
      a: 'Use our Add to Calendar Link Generator. Enter your event title, start/end date and time, location, and description. The tool instantly generates a direct link for Google Calendar, Outlook (Web), Yahoo Calendar, and a downloadable .ics file that works with Apple Calendar, Outlook desktop, and any iCalendar-compatible app. Share these links in your emails, websites, or social posts so attendees can add the event in one click.'
    },
    {
      q: 'What is a UPI QR Code and how does this generator work?',
      a: 'A UPI QR Code is a scannable image that encodes a UPI payment URI in the format: upi://pay?pa=YOUR_UPI_ID&pn=NAME&am=AMOUNT&cu=INR&tn=NOTE. When a user scans this code with Google Pay, PhonePe, Paytm, or any UPI-enabled app, it pre-fills all payment details. Our generator creates a standards-compliant UPI QR code instantly — just enter your UPI Virtual Payment Address (VPA), payee name, and amount, then download the PNG.'
    },
    {
      q: 'Can I convert any timezone with the Time Zone Converter?',
      a: 'Yes. The Time Zone Converter uses the browser\'s native Intl.DateTimeFormat API, which supports all IANA time zone identifiers (e.g., Asia/Karachi, America/New_York, Europe/London, Asia/Tokyo). Simply enter the source time and time zone, then add up to 3 target time zones. The tool displays all conversions simultaneously and shows a visual 24-hour timeline to help schedule across teams in different regions.'
    },
    {
      q: 'What is a Unix timestamp and why would I need to convert it?',
      a: 'A Unix timestamp (also called Epoch time) is the number of seconds that have elapsed since January 1, 1970, 00:00:00 UTC. Developers encounter Unix timestamps constantly in database records, API responses, log files, and JWT tokens. Our converter works bidirectionally: paste a Unix timestamp (in seconds or milliseconds) to get a human-readable date, or enter a date and time to get its Unix timestamp instantly.'
    },
    {
      q: 'How accurate is the Age Calculator?',
      a: 'The Age Calculator computes exact age by accounting for leap years, variable month lengths, and whether the current day is before or after the birth day in the current year. The result is broken down into years, months, and days. It also shows the exact number of days until the next birthday. You can also set a custom "calculate as of" date — useful for verifying ages at a specific point in time (e.g., for an insurance policy, a legal document, or an HR record).'
    },
    {
      q: 'Is my data saved when I use these tools? Are they private?',
      a: 'All calculations happen entirely in your browser. No data is sent to any server. The Time Tracker and Timetable Generator optionally use your browser\'s localStorage to save sessions between visits, but this data stays on your device and is never transmitted. You can clear it at any time by clearing your browser\'s site data.'
    },
    {
      q: 'What is ISO 8601 format and when do I need it?',
      a: 'ISO 8601 is the international standard for representing dates and times (e.g., 2024-11-15T09:00:00+05:00). It\'s used in APIs, databases, machine-readable data exchanges, and technical documentation. Our ISO Time Formatter takes any date and time input and outputs every ISO 8601 variation: full datetime with UTC offset, UTC "Z" notation, date-only, week date (2024-W46-5), and ordinal date (2024-320) — all ready to copy with one click.'
    }
  ];

  private readonly seo = {
    title: 'Free Online Tools — Calendar, QR, Time & More | BriskPeople',
    description: '14 free utility tools: Add to Calendar link generator, QR code maker, UPI QR generator, time zone converter, Unix timestamp converter, ISO formatter, age calculator & more.',
    keywords: 'free online tools, add to calendar link generator, QR code generator, UPI QR code, time zone converter, unix timestamp converter, age calculator, ISO 8601 formatter, mailto link generator'
  };

  private jsonLdScript: HTMLScriptElement | null = null;

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.seo.title);
    this.meta.updateTag({ name: 'description',         content: this.seo.description });
    this.meta.updateTag({ name: 'keywords',            content: this.seo.keywords });
    this.meta.updateTag({ property: 'og:title',        content: this.seo.title });
    this.meta.updateTag({ property: 'og:description',  content: this.seo.description });
    this.meta.updateTag({ property: 'og:type',         content: 'website' });
    this.meta.updateTag({ property: 'og:url',          content: 'https://www.briskpeople.com/free-tools' });
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: this.seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: this.seo.description });
    this.injectJsonLd();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  getToolsBySlug(slugs: string[]): ToolConfig[] {
    return slugs
      .map(s => this.tools.find(t => t.slug === s))
      .filter((t): t is ToolConfig => !!t);
  }

  private injectJsonLd(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Free Utility & Developer Tools',
      description: this.seo.description,
      url: 'https://www.briskpeople.com/free-tools',
      publisher: {
        '@type': 'Organization',
        name: 'BriskPeople',
        url: 'https://www.briskpeople.com'
      },
      hasPart: this.tools.map(t => ({
        '@type': 'WebApplication',
        name: t.title,
        description: t.description,
        url: `https://www.briskpeople.com/free-tools/${t.slug}`,
        applicationCategory: 'UtilitiesApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      }))
    };

    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schema);
    this.document.head.appendChild(this.jsonLdScript);
  }

  ngOnDestroy(): void {
    this.titleService.setTitle('BriskPeople HRMS | Human Resource Management System');
    if (this.jsonLdScript) {
      this.jsonLdScript.remove();
    }
  }
}
