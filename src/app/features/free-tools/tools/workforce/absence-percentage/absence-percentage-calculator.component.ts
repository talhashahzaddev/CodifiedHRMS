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

export interface AbsenceResult {
  absenteeismRate: number;
  status: 'low' | 'moderate' | 'high';
  statusLabel: string;
  totalPossibleDays: number;
  daysAbsent: number;
  timeLostHours: number;
  financialImpact: number;
  yearlyProjectionDays: number;
  yearlyProjectionHours: number;
  targetAllowanceDays: number;
  currency: string;
}

@Component({
  selector: 'app-absence-percentage-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './absence-percentage-calculator.component.html',
  styleUrls: ['./absence-percentage-calculator.component.scss']
})
export class AbsencePercentageCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: AbsenceResult | null = null;
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
    getToolBySlug('attrition-rate-calculator'),
    getToolBySlug('employee-retention-rate-calculator'),
    getToolBySlug('fte-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is a good absence percentage?',
      a: 'Most HR benchmarks consider below 2% as excellent, 2–5% as moderate and acceptable, and above 5% as high absenteeism requiring intervention. The UK CIPD reports an average of ~7.8 days lost per employee per year (~3.2%). Your target should be set based on your industry and historical baseline.'
    },
    {
      q: 'How is absence percentage different from absence rate?',
      a: '"Absence percentage" and "absenteeism rate" are interchangeable terms. Both refer to (Total Absent Days ÷ Total Possible Working Days) × 100. Some reports call it the "lost time rate" when expressed in hours rather than days.'
    },
    {
      q: 'Should I include part-time employees in the calculation?',
      a: 'Yes, but pro-rate their contracted days. If a part-timer works 3 days per week, their possible working days in a 20-day period = 12 (3 ÷ 5 × 20). Sum all employee possible days together before dividing into total absent days.'
    },
    {
      q: 'Does this calculator include authorized leave?',
      a: 'The formula treats all absent days equally — authorized (sick leave, casual leave) and unauthorized. For deeper analysis, calculate separate rates for each category. Unauthorized absences require different HR interventions than authorized ones.'
    },
    {
      q: 'How do I use the Yearly Projection?',
      a: 'The projection extrapolates your current period\'s absence pattern to a standard 250-working-day year. Use it for annual HR budgeting, workforce planning, and setting attendance improvement targets. If the projection exceeds your policy threshold, early intervention is recommended.'
    },
    {
      q: 'What does the Financial Impact figure represent?',
      a: 'Financial impact = Absent Days × Average Daily Salary. This is the direct salary cost of absenteeism. It excludes indirect costs such as overtime pay for cover staff, temporary replacement fees, reduced team productivity, and management time spent on absence management.'
    },
    {
      q: 'How do I reduce high absenteeism?',
      a: 'Evidence-based strategies include: structured Return-to-Work interviews, Employee Assistance Programmes (EAP), flexible or hybrid work policies, workload auditing, proactive manager relationship reviews, and recognition programmes for consistent attendance. Address root causes — most chronic absence is linked to stress, poor work environment, or health issues.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      totalEmployees:    [null, [Validators.required, Validators.min(1)]],
      totalWorkdays:     [null, [Validators.required, Validators.min(1)]],
      totalDaysAbsent:   [null, [Validators.required, Validators.min(0)]],
      workHoursPerDay:   [8,    [Validators.required, Validators.min(1), Validators.max(24)]],
      avgSalaryPerDay:   [null, [Validators.required, Validators.min(0)]],
      currency:          ['USD'],
      targetAbsenceRate: [2,    [Validators.required, Validators.min(0), Validators.max(100)]],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const totalPossibleDays = v.totalEmployees * v.totalWorkdays;

    // Edge case: division by zero
    if (totalPossibleDays === 0) {
      this.formError = 'Total employees and working days cannot both be zero.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    // Edge case: absent days exceed possible days
    if (v.totalDaysAbsent > totalPossibleDays) {
      this.formError = `Total days absent (${v.totalDaysAbsent}) cannot exceed total possible working days (${totalPossibleDays}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const absenteeismRate     = (v.totalDaysAbsent / totalPossibleDays) * 100;
    const timeLostHours       = v.totalDaysAbsent * v.workHoursPerDay;
    const financialImpact     = v.totalDaysAbsent * (v.avgSalaryPerDay ?? 0);
    const yearlyProjectionDays  = (v.totalDaysAbsent / v.totalWorkdays) * 250;
    const yearlyProjectionHours = yearlyProjectionDays * v.workHoursPerDay;
    const targetAllowanceDays   = Math.ceil((v.targetAbsenceRate / 100) * totalPossibleDays);

    let status: AbsenceResult['status'];
    let statusLabel: string;
    if (absenteeismRate < 2)      { status = 'low';      statusLabel = 'Low Absenteeism'; }
    else if (absenteeismRate <= 5) { status = 'moderate'; statusLabel = 'Moderate Absenteeism'; }
    else                           { status = 'high';     statusLabel = 'High Absenteeism'; }

    this.result = {
      absenteeismRate, status, statusLabel,
      totalPossibleDays, daysAbsent: v.totalDaysAbsent,
      timeLostHours, financialImpact,
      yearlyProjectionDays, yearlyProjectionHours,
      targetAllowanceDays, currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ workHoursPerDay: 8, currency: 'USD', targetAbsenceRate: 2 });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('absence-percentage-report.csv',
      ['Metric', 'Value', 'Unit'],
      [
        ['Absenteeism Rate', r.absenteeismRate.toFixed(2), '%'],
        ['Status', r.statusLabel, ''],
        ['Total Possible Working Days', r.totalPossibleDays, 'days'],
        ['Total Days Absent', r.daysAbsent, 'days'],
        ['Time Lost', r.timeLostHours.toFixed(1), 'hours'],
        ['Financial Impact', r.financialImpact.toFixed(2), r.currency],
        ['Yearly Projection', r.yearlyProjectionDays.toFixed(1), 'days'],
        ['Yearly Projection', r.yearlyProjectionHours.toFixed(1), 'hours'],
        ['Target Allowance', r.targetAllowanceDays, 'days'],
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
    if (c.hasError('min')) return `Minimum value is ${c.errors?.['min']?.min}.`;
    if (c.hasError('max')) return `Maximum value is ${c.errors?.['max']?.max}.`;
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const tool = getToolBySlug('absence-percentage-calculator');
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
    const tool = getToolBySlug('absence-percentage-calculator');
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
