import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser, DecimalPipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface PtoResult {
  accrualRatePerPeriod: number;
  totalAccruedToDate: number;
  remainingBalance: number;
  daysRemaining: number;
  standardHoursPerDay: number;
  isNegativeBalance: boolean;
  projectedYearEndBalance: number;
}

@Component({
  selector: 'app-pto-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DecimalPipe],
  templateUrl: './pto-calculator.component.html',
  styleUrls: ['./pto-calculator.component.scss']
})
export class PtoCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: PtoResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly accrualFrequencies = [
    { value: 'weekly', label: 'Weekly (52 periods)' },
    { value: 'biweekly', label: 'Bi-Weekly (26 periods)' },
    { value: 'semimonthly', label: 'Semi-Monthly (24 periods)' },
    { value: 'monthly', label: 'Monthly (12 periods)' }
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('absence-percentage-calculator'),
    getToolBySlug('leave-encashment-calculator'),
    getToolBySlug('time-card-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is PTO accrual?',
      a: 'PTO (Paid Time Off) accrual is a system where employees earn time off progressively throughout the year based on how much they work or how long they are employed. Instead of getting their entire annual PTO allowance in a lump sum on January 1st, they earn a fraction of it each pay period.'
    },
    {
      q: 'How do you calculate the accrual rate per pay period?',
      a: 'Divide the total annual PTO hours granted by the number of pay periods in the year. For example, if an employee gets 120 hours of PTO per year and is paid bi-weekly (26 pay periods), the accrual rate is 120 ÷ 26 = 4.615 hours per pay period.'
    },
    {
      q: 'How many pay periods are in a year?',
      a: 'Weekly = 52 periods. Bi-Weekly (every two weeks) = 26 periods. Semi-Monthly (twice a month) = 24 periods. Monthly = 12 periods.'
    },
    {
      q: 'What does "Carryover" mean?',
      a: 'Carryover refers to unused PTO hours from the previous year that roll over into the current year. Some companies cap carryover (e.g., maximum 40 hours can roll over) and some have a "use it or lose it" policy where carryover is 0.'
    },
    {
      q: 'Why would a PTO balance be negative?',
      a: 'A negative balance occurs when an employee takes more time off than they have accrued up to that point in the year. Many employers allow employees to "borrow" against future accruals within the same calendar year.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      annualPtoHours:       [null, [Validators.required, Validators.min(0)]],
      accrualFrequency:     ['biweekly'],
      periodsPassed:        [null, [Validators.required, Validators.min(0), Validators.max(52)]],
      carryoverHours:       [0,    [Validators.required, Validators.min(0)]],
      ptoHoursUsed:         [0,    [Validators.required, Validators.min(0)]],
      standardHoursPerDay:  [8,    [Validators.required, Validators.min(1), Validators.max(24)]],
    });
  }

  private getPeriodsPerYear(freq: string): number {
    switch (freq) {
      case 'weekly': return 52;
      case 'biweekly': return 26;
      case 'semimonthly': return 24;
      case 'monthly': return 12;
      default: return 26;
    }
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const periodsPerYear = this.getPeriodsPerYear(v.accrualFrequency);

    if (v.periodsPassed > periodsPerYear) {
      this.formError = `Periods passed (${v.periodsPassed}) cannot exceed the total periods in the year (${periodsPerYear}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const accrualRatePerPeriod = v.annualPtoHours / periodsPerYear;
    const accruedThisYear = accrualRatePerPeriod * v.periodsPassed;
    const totalAccruedToDate = v.carryoverHours + accruedThisYear;
    
    const remainingBalance = totalAccruedToDate - v.ptoHoursUsed;
    const isNegativeBalance = remainingBalance < 0;
    const daysRemaining = remainingBalance / v.standardHoursPerDay;

    const projectedYearEndBalance = v.carryoverHours + v.annualPtoHours - v.ptoHoursUsed;

    this.result = {
      accrualRatePerPeriod,
      totalAccruedToDate,
      remainingBalance,
      daysRemaining,
      standardHoursPerDay: v.standardHoursPerDay,
      isNegativeBalance,
      projectedYearEndBalance
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ accrualFrequency: 'biweekly', carryoverHours: 0, ptoHoursUsed: 0, standardHoursPerDay: 8 });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('pto-accrual-report.csv',
      ['Metric', 'Value'],
      [
        ['Accrual Rate per Period (hrs)', r.accrualRatePerPeriod.toFixed(3)],
        ['Total Accrued to Date (hrs)', r.totalAccruedToDate.toFixed(2)],
        ['Current PTO Balance (hrs)', r.remainingBalance.toFixed(2)],
        ['Current PTO Balance (days)', r.daysRemaining.toFixed(2)],
        ['Projected Year-End Balance (hrs)', r.projectedYearEndBalance.toFixed(2)],
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
    const t = 'Free PTO Accrual Calculator — Paid Time Off Tool | Brisk People';
    const d = 'Calculate your PTO (Paid Time Off) accrual balance instantly. Find out how many hours you earn per pay period and your current available days off. Free HR tool.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'PTO calculator, paid time off calculator, vacation accrual, calculate PTO balance, accrual rate calculator' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/pto-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'PTO Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free online Paid Time Off (PTO) calculator for tracking vacation accruals and remaining balances.',
        url: 'https://www.briskpeople.com/free-workforce-tools/pto-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                 item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'PTO Calculator',       item: 'https://www.briskpeople.com/free-workforce-tools/pto-calculator' }
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
