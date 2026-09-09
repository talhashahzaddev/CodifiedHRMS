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

export interface LeaveEncashmentResult {
  dailyRate: number;
  encashableDays: number;
  grossEncashmentValue: number;
  remainingDaysAfterEncashment: number;
  currency: string;
}

@Component({
  selector: 'app-leave-encashment-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './leave-encashment-calculator.component.html',
  styleUrls: ['./leave-encashment-calculator.component.scss']
})
export class LeaveEncashmentCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: LeaveEncashmentResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'INR', label: 'INR (₹)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('pto-calculator'),
    getToolBySlug('overtime-calculator'),
    getToolBySlug('attrition-rate-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is leave encashment?',
      a: 'Leave encashment is the process of converting an employee\'s unused paid leave (vacation/PTO days) into cash. This commonly happens when an employee resigns, retires, or during an annual encashment window where employees can cash out a portion of their unused leave.'
    },
    {
      q: 'How is the daily rate calculated?',
      a: 'The standard calculation is: (Monthly Basic Salary ÷ Standard Days in Month). Often, companies use 30 or 26 days as the denominator for monthly salaried employees. If an employee is paid hourly, it is simply (Hourly Rate × Standard Hours per Day).'
    },
    {
      q: 'Is leave encashment taxable?',
      a: 'In most countries, leave encashment received during employment is fully taxable as salary income. However, leave encashment received at the time of retirement or resignation may have tax exemptions up to a certain limit (e.g., in India, subject to Section 10(10AA) of the Income Tax Act).'
    },
    {
      q: 'Do companies have to pay out unused leave when you quit?',
      a: 'It depends heavily on local labor laws and company policy. In some US states (like California), earned vacation is considered wages and must be paid out upon termination. In other states, it is only required if the company\'s internal policy says so. Always check your local jurisdiction.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      monthlySalary: [null, [Validators.required, Validators.min(0)]],
      daysInMonth:   [30,   [Validators.required, Validators.min(1), Validators.max(31)]],
      totalLeaveBalance: [null, [Validators.required, Validators.min(0)]],
      daysToEncash:  [null, [Validators.required, Validators.min(0)]],
      currency:      ['USD'],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    if (v.daysToEncash > v.totalLeaveBalance) {
      this.formError = `Days to encash (${v.daysToEncash}) cannot exceed the total leave balance (${v.totalLeaveBalance}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const dailyRate = v.monthlySalary / v.daysInMonth;
    const grossEncashmentValue = dailyRate * v.daysToEncash;
    const remainingDaysAfterEncashment = v.totalLeaveBalance - v.daysToEncash;

    this.result = {
      dailyRate,
      encashableDays: v.daysToEncash,
      grossEncashmentValue,
      remainingDaysAfterEncashment,
      currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ daysInMonth: 30, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('leave-encashment-report.csv',
      ['Metric', 'Value'],
      [
        ['Calculated Daily Pay Rate', r.dailyRate.toFixed(2)],
        ['Leave Days Encashed', r.encashableDays.toFixed(2)],
        ['Gross Encashment Amount', r.grossEncashmentValue.toFixed(2)],
        ['Remaining Leave Balance (Days)', r.remainingDaysAfterEncashment.toFixed(2)],
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
    if (c.hasError('max'))      return `Maximum value is ${c.errors?.['max']?.max}.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const t = 'Free Leave Encashment Calculator | PTO Payout Tool | Brisk People';
    const d = 'Calculate the cash value of your unused vacation days instantly. Enter your salary and leave balance to determine your gross leave encashment payout.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'leave encashment calculator, PTO payout calculator, calculate unused vacation pay, encashment formula, HR tools' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/leave-encashment-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Leave Encashment Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free online Leave Encashment calculator for computing PTO and vacation payout values.',
        url: 'https://www.briskpeople.com/free-workforce-tools/leave-encashment-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                 item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'Leave Encashment Calculator', item: 'https://www.briskpeople.com/free-workforce-tools/leave-encashment-calculator' }
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
