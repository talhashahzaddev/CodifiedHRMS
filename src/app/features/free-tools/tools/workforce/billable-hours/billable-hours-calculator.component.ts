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

export interface BillableHoursResult {
  billableHours: number;
  nonBillableHours: number;
  totalHoursWorked: number;
  billablePct: number;
  status: 'high' | 'moderate' | 'low';
  statusLabel: string;
  revenue: number;
  revenuePerEmployee: number;
  billablePerEmployee: number;
  targetBillableHours: number;
  gapHours: number;
  revenuePotentialLost: number;
  numEmployees: number;
  currency: string;
  targetBillablePct: number;
  targetMet: boolean;
}

@Component({
  selector: 'app-billable-hours-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './billable-hours-calculator.component.html',
  styleUrls: ['./billable-hours-calculator.component.scss']
})
export class BillableHoursCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: BillableHoursResult | null = null;
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
    getToolBySlug('utilization-rate-calculator'),
    getToolBySlug('project-cost-calculator'),
    getToolBySlug('overtime-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What are billable hours?',
      a: 'Billable hours are hours worked on tasks that can be charged to a client or attributed directly to revenue-generating activities. In contrast, non-billable hours include internal meetings, administrative tasks, training, business development, and general overhead. For professional services firms, maximizing billable hours relative to total work hours is a primary business objective.'
    },
    {
      q: 'What is a good billable hours percentage?',
      a: 'Benchmarks vary by firm type: consulting firms typically target 70–80%; law firms often aim for 75–85%; IT and engineering firms target 75–80%; creative agencies typically achieve 60–75%. Rates above 85% sustainably are rare and may indicate that non-billable work (such as business development) is being neglected, which creates long-term pipeline risk.'
    },
    {
      q: 'What types of work are considered non-billable?',
      a: 'Non-billable work typically includes: internal meetings and team standups, administrative tasks (expense reports, timesheets), training and professional development, business development and proposal writing, marketing activities, internal project management overhead, corrective rework that is the firm\'s fault, and unbillable wait time (e.g., waiting for client feedback).'
    },
    {
      q: 'How does billing rate affect revenue projections?',
      a: 'Revenue = Billable Hours × Billing Rate. Even a 10% improvement in billable percentage compounds significantly with a high billing rate. For example, 1 consultant at $200/hr: if they increase from 70% to 80% billable over a 160-hour month, that\'s 16 additional hours × $200 = $3,200 more revenue per month per consultant.'
    },
    {
      q: 'How should I track billable hours accurately?',
      a: 'Best practices include: use time-tracking software with project codes so employees categorize each activity at the time of work (not retrospectively); enforce daily timesheet completion; audit weekly to catch miscategorization; train staff on what counts as billable; and reconcile billable hours against invoiced hours to identify revenue leakage. Manual tracking in spreadsheets almost always underestimates non-billable time.'
    },
    {
      q: 'What is the difference between billable % and utilization rate?',
      a: 'Billable % = Billable Hours ÷ Total Hours Worked. Utilization Rate = Billable Hours ÷ Total Available Hours (including non-worked time like absence). Billable % measures the quality of work performed (how much of actual work time is productive/chargeable). Utilization Rate measures capacity usage (how much of total possible time is billable). A person can have a high billable % but low utilization if they take lots of time off.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      totalHoursWorked:   [null, [Validators.required, Validators.min(1)]],
      nonBillableHours:   [null, [Validators.required, Validators.min(0)]],
      billingRatePerHour: [null, [Validators.required, Validators.min(0)]],
      numEmployees:       [1,    [Validators.required, Validators.min(1)]],
      targetBillablePct:  [75,   [Validators.required, Validators.min(0), Validators.max(100)]],
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

    // Edge case: non-billable > total
    if (v.nonBillableHours > v.totalHoursWorked) {
      this.formError = `Non-billable hours (${v.nonBillableHours}) cannot exceed total hours worked (${v.totalHoursWorked}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const billableHours      = v.totalHoursWorked - v.nonBillableHours;
    const billablePct        = (billableHours / v.totalHoursWorked) * 100;
    const revenue            = billableHours * v.billingRatePerHour;
    const revenuePerEmployee = v.numEmployees > 0 ? revenue / v.numEmployees : 0;
    const billablePerEmployee = v.numEmployees > 0 ? billableHours / v.numEmployees : 0;

    const targetBillableHours  = v.totalHoursWorked * (v.targetBillablePct / 100);
    const gapHours             = Math.max(0, targetBillableHours - billableHours);
    const revenuePotentialLost = gapHours * v.billingRatePerHour;
    const targetMet            = billableHours >= targetBillableHours;

    let status: BillableHoursResult['status'];
    let statusLabel: string;
    if (billablePct >= 80)     { status = 'high';     statusLabel = 'High Billability'; }
    else if (billablePct >= 70) { status = 'moderate'; statusLabel = 'Moderate Billability'; }
    else                        { status = 'low';      statusLabel = 'Low Billability'; }

    this.result = {
      billableHours, nonBillableHours: v.nonBillableHours,
      totalHoursWorked: v.totalHoursWorked, billablePct,
      status, statusLabel, revenue,
      revenuePerEmployee, billablePerEmployee,
      targetBillableHours, gapHours, revenuePotentialLost,
      numEmployees: v.numEmployees, currency: v.currency,
      targetBillablePct: v.targetBillablePct, targetMet
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ numEmployees: 1, targetBillablePct: 75, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('billable-hours-report.csv',
      ['Metric', 'Value'],
      [
        ['Total Hours Worked', r.totalHoursWorked],
        ['Non-Billable Hours', r.nonBillableHours],
        ['Billable Hours', r.billableHours.toFixed(1)],
        ['Billable Percentage', r.billablePct.toFixed(2) + '%'],
        ['Status', r.statusLabel],
        ['Billing Revenue', r.revenue.toFixed(2)],
        ['Revenue per Employee', r.revenuePerEmployee.toFixed(2)],
        ['Billable Hours per Employee', r.billablePerEmployee.toFixed(1)],
        ['Target Billable %', r.targetBillablePct + '%'],
        ['Target Billable Hours', r.targetBillableHours.toFixed(1)],
        ['Gap Hours (to hit target)', r.gapHours.toFixed(1)],
        ['Revenue Potential Lost', r.revenuePotentialLost.toFixed(2)],
        ['Target Met', r.targetMet ? 'Yes' : 'No'],
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
    if (c.hasError('max'))      return `Maximum value is ${c.errors?.['max']?.max}.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const tool = getToolBySlug('billable-hours-calculator');
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
    const tool = getToolBySlug('billable-hours-calculator');
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
