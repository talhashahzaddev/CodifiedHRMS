import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser, CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface OvertimeResult {
  regularHours: number;
  overtimeHours: number;
  regularPay: number;
  overtimePay: number;
  totalGrossPay: number;
  overtimeMultiplier: number;
  effectiveHourlyRate: number;
  overtimePctOfTotalPay: number;
  currency: string;
}

@Component({
  selector: 'app-overtime-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './overtime-calculator.component.html',
  styleUrls: ['./overtime-calculator.component.scss']
})
export class OvertimeCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: OvertimeResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly currencies = [
    { value: 'USD', label: 'USD — US Dollar ($)' },
    { value: 'EUR', label: 'EUR — Euro (€)' },
    { value: 'GBP', label: 'GBP — British Pound (£)' },
    { value: 'INR', label: 'INR — Indian Rupee (₹)' },
    { value: 'CAD', label: 'CAD — Canadian Dollar (C$)' },
    { value: 'AUD', label: 'AUD — Australian Dollar (A$)' },
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('time-card-calculator'),
    getToolBySlug('shift-differential-calculator'),
    getToolBySlug('billable-hours-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'How is overtime calculated?',
      a: 'Overtime is generally calculated by multiplying any hours worked over the standard limit (typically 40 hours per week) by an overtime multiplier (typically 1.5x the regular hourly rate, known as "time and a half"). Total Pay = (Regular Hours × Regular Rate) + (Overtime Hours × Regular Rate × Overtime Multiplier).'
    },
    {
      q: 'What is standard overtime pay (time and a half)?',
      a: 'In many jurisdictions (like the US under the FLSA), employers must pay at least 1.5 times the employee\'s regular hourly rate for all hours worked over 40 in a workweek. If your regular rate is $20/hr, your overtime rate is $30/hr.'
    },
    {
      q: 'Is overtime calculated daily or weekly?',
      a: 'It depends on your local labor laws. In most of the US (FLSA), overtime is strictly calculated on a weekly basis (over 40 hours). However, some states (like California) also require daily overtime for any hours worked over 8 in a single day, or double time for hours over 12. This calculator uses a simple weekly standard threshold approach.'
    },
    {
      q: 'Are salaried employees eligible for overtime?',
      a: 'It depends on their classification. "Exempt" salaried employees (usually managerial, professional, or administrative roles earning above a certain salary threshold) are not legally entitled to overtime pay. "Non-exempt" employees, even if paid a salary, must be paid overtime for hours exceeding the standard limit.'
    },
    {
      q: 'Does paid time off (PTO) count towards overtime hours?',
      a: 'Generally, no. Federal and most local laws define overtime based on hours actually worked. If you take 8 hours of PTO and work 35 hours in a week, you have 43 total paid hours but only 35 hours worked, so no overtime is due.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      regularHourlyRate:  [null, [Validators.required, Validators.min(0)]],
      totalHoursWorked:   [null, [Validators.required, Validators.min(0)]],
      standardHoursLimit: [40,   [Validators.required, Validators.min(1)]],
      overtimeMultiplier: [1.5,  [Validators.required, Validators.min(1)]],
      currency:           ['USD'],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const rate = v.regularHourlyRate;
    const hours = v.totalHoursWorked;
    const limit = v.standardHoursLimit;
    const multiplier = v.overtimeMultiplier;

    const regularHours = Math.min(hours, limit);
    const overtimeHours = Math.max(0, hours - limit);

    const regularPay = regularHours * rate;
    const overtimePay = overtimeHours * (rate * multiplier);
    const totalGrossPay = regularPay + overtimePay;

    const effectiveHourlyRate = hours > 0 ? totalGrossPay / hours : 0;
    const overtimePctOfTotalPay = totalGrossPay > 0 ? (overtimePay / totalGrossPay) * 100 : 0;

    this.result = {
      regularHours,
      overtimeHours,
      regularPay,
      overtimePay,
      totalGrossPay,
      overtimeMultiplier: multiplier,
      effectiveHourlyRate,
      overtimePctOfTotalPay,
      currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ standardHoursLimit: 40, overtimeMultiplier: 1.5, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('overtime-pay-report.csv',
      ['Metric', 'Value'],
      [
        ['Regular Hours', r.regularHours.toFixed(2)],
        ['Overtime Hours', r.overtimeHours.toFixed(2)],
        ['Total Hours Worked', (r.regularHours + r.overtimeHours).toFixed(2)],
        ['Regular Pay', r.regularPay.toFixed(2)],
        ['Overtime Pay', r.overtimePay.toFixed(2)],
        ['Total Gross Pay', r.totalGrossPay.toFixed(2)],
        ['Overtime Rate Multiplier', r.overtimeMultiplier.toFixed(2) + 'x'],
        ['Effective Hourly Rate', r.effectiveHourlyRate.toFixed(2)],
        ['Overtime % of Total Pay', r.overtimePctOfTotalPay.toFixed(2) + '%'],
        ['Currency', r.currency]
      ]
    );
  }

  print(): void {
    if (isPlatformBrowser(this.platformId)) { window.print(); }
  }

  toggleFaq(i: number): void {
    this.openFaqIndex = this.openFaqIndex === i ? null : i;
  }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required')) return 'This field is required.';
    if (c.hasError('min'))      return `Minimum value is ${c.errors?.['min']?.min}.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free Overtime Calculator — Time and a Half Pay Tool | Brisk People';
    const d = 'Calculate overtime pay instantly. Enter your hourly rate and total hours worked to find your time-and-a-half overtime pay, regular pay, and total gross wages. Free HR tool.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'overtime calculator, time and a half calculator, calculate overtime pay, gross pay calculator, overtime wages' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/overtime-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Overtime Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free online overtime calculator to calculate regular pay, overtime pay, and total gross wages.',
        url: 'https://www.briskpeople.com/free-workforce-tools/overtime-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                 item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'Overtime Calculator',  item: 'https://www.briskpeople.com/free-workforce-tools/overtime-calculator' }
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
