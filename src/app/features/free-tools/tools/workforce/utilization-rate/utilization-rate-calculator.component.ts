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

export interface UtilizationResult {
  utilizationRate: number;
  status: 'high' | 'moderate' | 'low';
  statusLabel: string;
  billableHours: number;
  totalHoursAvailable: number;
  unbilledHours: number;
  utilizationGap: number;
  targetMet: boolean;
  targetUtilizationRate: number;
  billableRevenue: number | null;
  revenueLost: number | null;
  currency: string;
}

@Component({
  selector: 'app-utilization-rate-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './utilization-rate-calculator.component.html',
  styleUrls: ['./utilization-rate-calculator.component.scss']
})
export class UtilizationRateCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: UtilizationResult | null = null;
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
    getToolBySlug('fte-calculator'),
    getToolBySlug('billable-hours-calculator'),
    getToolBySlug('time-card-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is employee utilization rate?',
      a: 'Employee utilization rate is the percentage of an employee\'s total available time that is spent on billable or productive work. It is calculated as (Billable Hours ÷ Total Available Hours) × 100. It is the primary revenue-efficiency KPI for professional services, consulting, legal, IT, and staffing firms.'
    },
    {
      q: 'What is a good utilization rate?',
      a: 'Benchmarks vary by industry. For professional services and consulting firms: 75–85% is generally healthy; above 85% risks burnout; below 70% indicates underutilization or underperformance. For legal firms, a 70–80% realization rate is typical. Manufacturing and customer service teams often target 80–90%. Always benchmark against your specific industry.'
    },
    {
      q: 'How is utilization rate different from efficiency?',
      a: 'Utilization measures whether employees are working on billable tasks (the right tasks). Efficiency measures how productively they perform those tasks relative to a standard. An employee can be 100% utilized but inefficient (doing billable work slowly), or highly efficient but underutilized (doing excellent work but on non-billable tasks). Both metrics are needed for a complete performance picture.'
    },
    {
      q: 'What counts as "total available hours"?',
      a: 'Total available hours = Total working hours in the period, after subtracting holidays and approved leave. Do not include public holidays, planned absence, or leave in the denominator — these are not "available" time. Some firms use "contracted hours" (e.g., 40h/week × 48 weeks), while others use actual calendar hours minus time off.'
    },
    {
      q: 'What causes low utilization rate?',
      a: 'Common causes include: insufficient client/project pipeline (not enough billable work to fill capacity), excessive administrative burden, poor project scheduling, high team meeting overhead, scope creep causing unbillable rework, or a sales-delivery gap (sales team not keeping the delivery team fully booked). Address root causes — not just the metric.'
    },
    {
      q: 'How do I improve team utilization rate?',
      a: 'Strategies include: streamlining administrative processes to reduce non-billable overhead, improving sales pipeline visibility to reduce capacity gaps, cross-training team members to increase flexibility, converting recurring non-billable tasks to products or retainers, and implementing weekly utilization dashboards so managers can identify and address gaps in real time.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      billableHours:        [null, [Validators.required, Validators.min(0)]],
      totalHoursAvailable:  [null, [Validators.required, Validators.min(1)]],
      targetUtilizationRate:[80,   [Validators.required, Validators.min(0), Validators.max(100)]],
      billingRatePerHour:   [null, [Validators.min(0)]],
      currency:             ['USD'],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // Edge case: billable > available
    if (v.billableHours > v.totalHoursAvailable) {
      this.formError = `Billable hours (${v.billableHours}) cannot exceed total available hours (${v.totalHoursAvailable}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const utilizationRate = (v.billableHours / v.totalHoursAvailable) * 100;
    const unbilledHours   = v.totalHoursAvailable - v.billableHours;
    const utilizationGap  = v.targetUtilizationRate - utilizationRate;
    const targetMet       = utilizationRate >= v.targetUtilizationRate;

    // Revenue fields (only if billing rate is provided)
    const rate = v.billingRatePerHour ?? 0;
    const billableRevenue = rate > 0 ? v.billableHours * rate : null;
    const revenueLost     = rate > 0 ? unbilledHours * rate : null;

    // Status thresholds
    let status: UtilizationResult['status'];
    let statusLabel: string;
    if (utilizationRate >= 80)      { status = 'high';     statusLabel = 'High Utilization'; }
    else if (utilizationRate >= 70)  { status = 'moderate'; statusLabel = 'Moderate Utilization'; }
    else                             { status = 'low';      statusLabel = 'Low Utilization'; }

    this.result = {
      utilizationRate, status, statusLabel,
      billableHours: v.billableHours,
      totalHoursAvailable: v.totalHoursAvailable,
      unbilledHours, utilizationGap, targetMet,
      targetUtilizationRate: v.targetUtilizationRate,
      billableRevenue, revenueLost, currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ targetUtilizationRate: 80, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    const rows: (string | number)[][] = [
      ['Utilization Rate', r.utilizationRate.toFixed(2) + '%'],
      ['Status', r.statusLabel],
      ['Billable Hours', r.billableHours],
      ['Total Available Hours', r.totalHoursAvailable],
      ['Unbilled Hours', r.unbilledHours.toFixed(1)],
      ['Target Utilization Rate', r.targetUtilizationRate + '%'],
      ['Utilization Gap', r.utilizationGap.toFixed(2) + '%'],
      ['Target Met', r.targetMet ? 'Yes' : 'No'],
    ];
    if (r.billableRevenue !== null) rows.push(['Revenue Generated', r.billableRevenue.toFixed(2)]);
    if (r.revenueLost     !== null) rows.push(['Revenue Opportunity Lost', r.revenueLost.toFixed(2)]);
    if (r.billableRevenue !== null || r.revenueLost !== null) rows.push(['Currency', r.currency]);
    this.csvService.download('utilization-rate-report.csv', ['Metric', 'Value'], rows);
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
    const tool = getToolBySlug('utilization-rate-calculator');
    if (!tool) return;
    const t = tool.seoTitle;
    const d = tool.seoDescription;
    const url = `https://www.briskpeople.com/free-workforce-tools/${tool.slug}`;
    
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: tool.keywords });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: url });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
    
    // Set canonical tag
    let canonicalLink = this.document.querySelector('link[rel="canonical"]');
    if (canonicalLink) canonicalLink.remove();
    canonicalLink = this.document.createElement('link');
    canonicalLink.setAttribute('rel', 'canonical');
    canonicalLink.setAttribute('href', url);
    this.document.head.appendChild(canonicalLink);
  }

  private injectJsonLd(): void {
    const tool = getToolBySlug('utilization-rate-calculator');
    if (!tool) return;
    const url = `https://www.briskpeople.com/free-workforce-tools/${tool.slug}`;
    const schemas: any[] = [
      {
        '@context': 'https://schema.org', '@type': 'WebApplication',
        name: tool.title, applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: tool.seoDescription,
        url: url
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools', item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: tool.title, item: url }
        ]
      }
    ];

    if (this.faqs && this.faqs.length > 0) {
      schemas.push({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: this.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      });
    }

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
