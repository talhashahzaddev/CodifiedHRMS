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

export interface ScheduleVarianceResult {
  sv: number;
  spi: number;
  svPct: number;
  status: 'ahead' | 'on-track' | 'behind';
  statusLabel: string;
  ev: number;
  pv: number;
  currency: string;
}

@Component({
  selector: 'app-schedule-variance-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './schedule-variance-calculator.component.html',
  styleUrls: ['./schedule-variance-calculator.component.scss']
})
export class ScheduleVarianceCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: ScheduleVarianceResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly currencies = [
    { value: 'USD', label: 'USD — US Dollar ($)' },
    { value: 'INR', label: 'INR — Indian Rupee (₹)' },
    { value: 'EUR', label: 'EUR — Euro (€)' },
    { value: 'GBP', label: 'GBP — British Pound (£)' },
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('completion-percentage-calculator'),
    getToolBySlug('project-cost-calculator'),
    getToolBySlug('billable-hours-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What does a negative Schedule Variance mean?',
      a: 'A negative SV means your project is behind schedule — you have earned less value than you planned to by this point. For example, SV = -$10,000 means $10,000 worth of planned work has not yet been completed on time.'
    },
    {
      q: 'What is a good Schedule Performance Index (SPI)?',
      a: 'SPI = 1.0 is perfectly on schedule. SPI > 1.0 means you are ahead — completing more work than planned per dollar spent. SPI < 1.0 means behind schedule. Values below 0.8 typically trigger a formal schedule recovery plan in project management offices.'
    },
    {
      q: 'What is Earned Value (EV)?',
      a: 'Earned Value is the budgeted cost of work actually performed (BCWP). It represents the monetary value of the work that has been completed as of today, measured at the planned cost rate — not the actual cost. EV = % Complete × Budget At Completion (BAC).'
    },
    {
      q: 'What is Planned Value (PV)?',
      a: 'Planned Value is the budgeted cost of work scheduled (BCWS) — the amount of budget that was supposed to be spent on work by a specific date, according to the project baseline plan.'
    },
    {
      q: 'Can SPI be used to forecast project completion?',
      a: 'Yes. The Estimate at Completion (EAC) using SPI = BAC ÷ CPI × SPI. The Independent Estimate At Completion (IEAC) = BAC ÷ SPI. These forecasts become more reliable after 20% of the project is complete.'
    },
    {
      q: 'Is Schedule Variance the same as Cost Variance?',
      a: 'No. Schedule Variance (SV = EV − PV) measures time-related performance. Cost Variance (CV = EV − AC) measures cost performance — whether you are over or under budget. Both are separate Earned Value Management (EVM) metrics and should be tracked together.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      currency:     ['USD'],
      earnedValue:  [null, [Validators.required, Validators.min(0)]],
      plannedValue: [null, [Validators.required, Validators.min(0)]],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const ev = v.earnedValue ?? 0;
    const pv = v.plannedValue ?? 0;

    // Edge case: both zero
    if (ev === 0 && pv === 0) {
      this.result = { sv: 0, spi: 0, svPct: 0, status: 'on-track', statusLabel: 'On Schedule', ev, pv, currency: v.currency };
      this.cdr.markForCheck();
      return;
    }

    // Edge case: PV = 0 (division by zero for SPI)
    if (pv === 0) {
      this.formError = 'Planned Value cannot be zero when Earned Value is greater than zero. Enter a valid Planned Value.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const sv    = ev - pv;
    const spi   = ev / pv;
    const svPct = (sv / pv) * 100;

    let status: ScheduleVarianceResult['status'];
    let statusLabel: string;
    if (sv > 0)      { status = 'ahead';    statusLabel = 'Ahead of Schedule'; }
    else if (sv < 0) { status = 'behind';   statusLabel = 'Behind Schedule'; }
    else             { status = 'on-track'; statusLabel = 'On Schedule'; }

    this.result = { sv, spi, svPct, status, statusLabel, ev, pv, currency: v.currency };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('schedule-variance-report.csv',
      ['Metric', 'Value'],
      [
        ['Earned Value (EV)', r.ev.toFixed(2)],
        ['Planned Value (PV)', r.pv.toFixed(2)],
        ['Schedule Variance (SV)', r.sv.toFixed(2)],
        ['Schedule Performance Index (SPI)', r.spi.toFixed(2)],
        ['Variance Percentage (SV%)', r.svPct.toFixed(2) + '%'],
        ['Status', r.statusLabel],
        ['Currency', r.currency],
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
    const t = 'Free Schedule Variance Calculator — EVM SV & SPI Tool | Brisk People';
    const d = 'Calculate Schedule Variance (SV) and Schedule Performance Index (SPI) instantly using Earned Value Management formulas. Free online EVM tool — no sign-up needed.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'schedule variance calculator, SPI calculator, earned value management, EVM calculator, SV SPI formula, project schedule variance' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/schedule-variance-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Schedule Variance Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free EVM Schedule Variance (SV) and Schedule Performance Index (SPI) calculator.',
        url: 'https://www.briskpeople.com/free-workforce-tools/schedule-variance-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'Schedule Variance Calculator', item: 'https://www.briskpeople.com/free-workforce-tools/schedule-variance-calculator' }
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
