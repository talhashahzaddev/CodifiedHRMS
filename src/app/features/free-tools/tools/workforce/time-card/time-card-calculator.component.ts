import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser, DecimalPipe, CurrencyPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface TimeCardDay {
  dayName: string;
  hoursWorked: number;
}

export interface TimeCardResult {
  days: TimeCardDay[];
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  grossPay: number | null;
  currency: string;
}

@Component({
  selector: 'app-time-card-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DecimalPipe, CurrencyPipe],
  templateUrl: './time-card-calculator.component.html',
  styleUrls: ['./time-card-calculator.component.scss']
})
export class TimeCardCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: TimeCardResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  readonly currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('overtime-calculator'),
    getToolBySlug('shift-differential-calculator'),
    getToolBySlug('billable-hours-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'How are decimal hours calculated?',
      a: 'Decimal hours convert minutes into a fraction of an hour (Minutes ÷ 60). For example, 30 minutes = 0.5 hours. 15 minutes = 0.25 hours. 45 minutes = 0.75 hours. 8 hours and 15 minutes is entered as 8.25.'
    },
    {
      q: 'Does this calculator include unpaid lunch breaks?',
      a: 'You should only enter net working hours per day. If you were at work for 9 hours but took a 1-hour unpaid lunch break, enter 8 hours.'
    },
    {
      q: 'When does overtime apply?',
      a: 'This calculator uses the standard weekly overtime rule: any total hours over 40 in a week are calculated as overtime at 1.5x the hourly rate. It does not calculate daily overtime rules (like California\'s 8-hour daily limit).'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      hourlyRate: [null, [Validators.min(0)]],
      currency: ['USD'],
      days: this.fb.array(this.daysOfWeek.map(d => this.fb.group({
        dayName: [d],
        hoursWorked: [null, [Validators.min(0), Validators.max(24)]]
      })))
    });
  }

  get daysArray(): FormArray {
    return this.form.get('days') as FormArray;
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    let totalHours = 0;
    const daysResult: TimeCardDay[] = [];

    for (const d of v.days) {
      const hrs = Number(d.hoursWorked) || 0;
      totalHours += hrs;
      daysResult.push({ dayName: d.dayName, hoursWorked: hrs });
    }

    if (totalHours === 0) {
      this.formError = 'Please enter hours for at least one day.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const regularHours = Math.min(totalHours, 40);
    const overtimeHours = Math.max(0, totalHours - 40);

    let grossPay: number | null = null;
    if (v.hourlyRate > 0) {
      grossPay = (regularHours * v.hourlyRate) + (overtimeHours * v.hourlyRate * 1.5);
    }

    this.result = {
      days: daysResult,
      totalHours,
      regularHours,
      overtimeHours,
      grossPay,
      currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ currency: 'USD' });
    this.daysArray.controls.forEach((ctrl, idx) => {
      ctrl.patchValue({ dayName: this.daysOfWeek[idx], hoursWorked: null });
    });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    const rows: (string | number)[][] = [];
    
    r.days.forEach(d => {
      rows.push([d.dayName, d.hoursWorked.toFixed(2)]);
    });
    
    rows.push(['---', '---']);
    rows.push(['Total Hours', r.totalHours.toFixed(2)]);
    rows.push(['Regular Hours', r.regularHours.toFixed(2)]);
    rows.push(['Overtime Hours (weekly >40)', r.overtimeHours.toFixed(2)]);
    
    if (r.grossPay !== null) {
      rows.push(['Estimated Gross Pay', r.grossPay.toFixed(2)]);
      rows.push(['Currency', r.currency]);
    }
    
    this.csvService.download('weekly-timecard-report.csv', ['Day / Metric', 'Value (Hours)'], rows);
  }

  print(): void {
    if (isPlatformBrowser(this.platformId)) { window.print(); }
  }

  toggleFaq(i: number): void {
    this.openFaqIndex = this.openFaqIndex === i ? null : i;
  }

  private updateSeo(): void {
    const t = 'Free Weekly Time Card Calculator — Timesheet Tool | Brisk People';
    const d = 'Calculate weekly timesheet hours, overtime, and gross pay instantly. Enter daily hours worked (in decimals) to generate a free time card summary.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'time card calculator, timesheet calculator, weekly hours calculator, calculate weekly pay, timesheet tool' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/time-card-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Time Card Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free weekly time card calculator with daily hour tracking and overtime computation.',
        url: 'https://www.briskpeople.com/free-workforce-tools/time-card-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                 item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'Time Card Calculator', item: 'https://www.briskpeople.com/free-workforce-tools/time-card-calculator' }
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
    this.title.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}
