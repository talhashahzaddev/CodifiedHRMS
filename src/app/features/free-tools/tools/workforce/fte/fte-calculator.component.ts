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

export interface FteResult {
  fullTimeEmployees: number;
  partTimeEmployees: number;
  fullTimeFTE: number;
  partTimeFTE: number;
  totalFTE: number;
  fteRatio: number;
  totalWeeklyHours: number;
  totalEmployees: number;
  salaryBudget: number | null;
  currency: string;
  hasWarning: boolean;
  warningMsg: string;
}

@Component({
  selector: 'app-fte-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './fte-calculator.component.html',
  styleUrls: ['./fte-calculator.component.scss']
})
export class FteCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: FteResult | null = null;
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
    getToolBySlug('billable-hours-calculator'),
    getToolBySlug('overtime-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What does FTE stand for?',
      a: 'FTE stands for Full-Time Equivalent. It is a standardized unit of workforce capacity where 1.0 FTE = one employee working the standard full-time schedule (typically 40 hours/week). A part-timer working 20 hours/week = 0.5 FTE. FTE makes headcount comparable regardless of the full-time/part-time mix.'
    },
    {
      q: 'Why is FTE important for HR and budgeting?',
      a: 'FTE is the standard unit used in workforce planning, payroll budgeting, project staffing models, and regulatory reporting. It enables apples-to-apples comparisons of workforce capacity across teams and periods. Under the ACA in the US, businesses with 50+ FTE are classified as Applicable Large Employers with specific compliance obligations.'
    },
    {
      q: 'How do I convert part-time hours to FTE?',
      a: 'Part-Time FTE = Number of Part-Time Employees × (Their Weekly Hours ÷ Standard Full-Time Hours). For example, 10 part-timers working 25 hours/week with a 40-hour standard = 10 × (25 ÷ 40) = 6.25 FTE. Multiple part-time employees with different hours should each be calculated separately, then summed.'
    },
    {
      q: 'What is FTE Ratio and what does it tell me?',
      a: 'FTE Ratio = Total FTE ÷ Total Headcount. It tells you the average intensity of your workforce relative to full-time hours. A ratio of 0.75 means the average employee works 75% of the standard full-time schedule. A ratio below 0.7 might indicate heavy reliance on part-time labour, which has different cost and productivity implications than a full-time workforce.'
    },
    {
      q: 'What is the difference between headcount and FTE?',
      a: 'Headcount counts individuals — each person counts as 1 regardless of hours worked. FTE adjusts for hours worked. A team of 20 (10 full-time + 10 half-time) has a headcount of 20 but an FTE of 15. FTE is a better measure of actual workforce capacity; headcount is a better measure of HR administrative load.'
    },
    {
      q: 'How is FTE used in project staffing?',
      a: '"This project needs 3 FTE for 6 months" means the equivalent of 3 full-time workers for 6 months. This could be 6 half-time employees, 3 full-time employees, or any combination totalling 3 FTE. Project staffing in FTE allows resource planning to be independent of the specific employment arrangement.'
    },
    {
      q: 'What is the estimated salary budget output?',
      a: 'Salary Budget = Total FTE × Average Annual Salary. This estimates the annual payroll cost of your workforce on an FTE-adjusted basis. It is a planning tool — actual payroll will differ because it is calculated on actual hours × actual pay rates, not on average FTE × average salary. Use this for top-down budget estimation, not precise payroll calculation.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      fullTimeEmployees:    [null, [Validators.required, Validators.min(0)]],
      partTimeEmployees:    [null, [Validators.required, Validators.min(0)]],
      partTimeHoursPerWeek: [20,  [Validators.required, Validators.min(1), Validators.max(80)]],
      standardHoursPerWeek: [40,  [Validators.required, Validators.min(1), Validators.max(80)]],
      avgAnnualSalary:      [null, [Validators.min(0)]],
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

    // Edge case: zero employees
    if ((v.fullTimeEmployees ?? 0) === 0 && (v.partTimeEmployees ?? 0) === 0) {
      this.formError = 'Enter at least one full-time or part-time employee.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    // Warning: part-time hours exceed standard (each would count > 1 FTE)
    const hasWarning = v.partTimeHoursPerWeek > v.standardHoursPerWeek;
    const warningMsg = hasWarning
      ? `Part-time hours (${v.partTimeHoursPerWeek}) exceed the standard hours (${v.standardHoursPerWeek}). These employees will each count as more than 1.0 FTE.`
      : '';

    const ft = v.fullTimeEmployees ?? 0;
    const pt = v.partTimeEmployees ?? 0;
    const fullTimeFTE    = ft;
    const partTimeFTE    = pt * (v.partTimeHoursPerWeek / v.standardHoursPerWeek);
    const totalFTE       = fullTimeFTE + partTimeFTE;
    const totalEmployees = ft + pt;
    const fteRatio       = totalEmployees > 0 ? totalFTE / totalEmployees : 0;
    const totalWeeklyHours = (ft * v.standardHoursPerWeek) + (pt * v.partTimeHoursPerWeek);
    const salaryBudget   = v.avgAnnualSalary && v.avgAnnualSalary > 0 ? totalFTE * v.avgAnnualSalary : null;

    this.result = {
      fullTimeEmployees: ft, partTimeEmployees: pt,
      fullTimeFTE, partTimeFTE, totalFTE,
      fteRatio, totalWeeklyHours, totalEmployees,
      salaryBudget, currency: v.currency,
      hasWarning, warningMsg
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ partTimeHoursPerWeek: 20, standardHoursPerWeek: 40, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    const rows: (string | number)[][] = [
      ['Full-Time Employees', r.fullTimeEmployees],
      ['Part-Time Employees', r.partTimeEmployees],
      ['Total Headcount', r.totalEmployees],
      ['Full-Time FTE', r.fullTimeFTE.toFixed(2)],
      ['Part-Time FTE', r.partTimeFTE.toFixed(2)],
      ['Total FTE', r.totalFTE.toFixed(2)],
      ['FTE Ratio', r.fteRatio.toFixed(4)],
      ['Total Weekly Hours', r.totalWeeklyHours],
    ];
    if (r.salaryBudget !== null) {
      rows.push(['Estimated Annual Salary Budget', r.salaryBudget.toFixed(2)]);
      rows.push(['Currency', r.currency]);
    }
    this.csvService.download('fte-report.csv', ['Metric', 'Value'], rows);
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
    const tool = getToolBySlug('fte-calculator');
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
    const tool = getToolBySlug('fte-calculator');
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
