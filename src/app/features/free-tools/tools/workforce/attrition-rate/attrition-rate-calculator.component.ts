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

export interface AttritionResult {
  avgHeadcount: number;
  attritionRate: number;
  level: 'low' | 'moderate' | 'high' | 'very-high';
  levelLabel: string;
  replacementCostPerEmployee: number;
  totalFinancialLoss: number;
  currency: string;
  employeesLeft: number;
  retentionRate: number;
  hasWarning: boolean;
  warningMsg: string;
}

@Component({
  selector: 'app-attrition-rate-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './attrition-rate-calculator.component.html',
  styleUrls: ['./attrition-rate-calculator.component.scss']
})
export class AttritionRateCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: AttritionResult | null = null;
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
    getToolBySlug('employee-retention-rate-calculator'),
    getToolBySlug('absence-percentage-calculator'),
    getToolBySlug('fte-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is a healthy attrition rate?',
      a: 'General benchmarks: below 10% is considered low/healthy; 10–20% is moderate and common in many industries; 20–40% is high and signals structural HR problems; above 40% is very high and typically seen in retail, hospitality, or call centers. Your benchmark should be set relative to your industry average, not a universal standard.'
    },
    {
      q: 'What is the difference between attrition and turnover?',
      a: 'Attrition typically refers to voluntary departures (resignations, retirements) without replacement — headcount shrinks. Turnover includes all separations (voluntary and involuntary) and positions may be refilled. This calculator uses the standard SHRM formula that counts all departures divided by average headcount, which captures both.'
    },
    {
      q: 'How is Replacement Cost Percentage calculated?',
      a: 'Replacement cost as a % of salary typically ranges from 50% (junior roles) to 200%+ (senior/specialist roles). It includes: recruitment costs, background checks, training time, productivity ramp-up, management time, and overtime for remaining staff. SHRM estimates the average cost to replace an employee is 50–60% of their annual salary.'
    },
    {
      q: 'What does the Average Headcount formula smooth out?',
      a: 'Using (Start + End) ÷ 2 for average headcount smooths out the distortion caused by large hiring waves or layoffs during the period. Without it, a company that doubled headcount mid-year would show a falsely low attrition rate because departures are divided by a much larger ending headcount.'
    },
    {
      q: 'How do I reduce a high attrition rate?',
      a: 'Start with exit interviews to identify root causes. Common factors include: below-market compensation, poor management, limited career growth, work-life balance issues, and toxic culture. Data from these interviews should drive targeted interventions. Track attrition by department, tenure, and role level to identify the highest-impact areas first.'
    },
    {
      q: 'Is a very low attrition rate always good?',
      a: 'Not necessarily. Attrition below 5% can indicate that underperformers are not being managed out, that the team lacks fresh perspectives, or that there is an unhealthy fear of change. Healthy organizations typically see 5–10% natural attrition as part of normal workforce renewal. The goal is optimal attrition, not zero attrition.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      employeesAtStart:     [null, [Validators.required, Validators.min(0)]],
      employeesAtEnd:       [null, [Validators.required, Validators.min(0)]],
      employeesLeft:        [null, [Validators.required, Validators.min(0)]],
      avgSalary:            [null, [Validators.required, Validators.min(0)]],
      replacementCostPct:   [50,   [Validators.required, Validators.min(0), Validators.max(500)]],
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
    const avgHeadcount = (v.employeesAtStart + v.employeesAtEnd) / 2;

    // Edge case: both Start and End are 0
    if (avgHeadcount === 0) {
      this.formError = 'Average headcount is zero. Enter valid values for Employees at Start and Employees at End.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const attritionRate = (v.employeesLeft / avgHeadcount) * 100;
    const retentionRate = 100 - Math.min(attritionRate, 100);
    const replacementCostPerEmployee = (v.avgSalary ?? 0) * ((v.replacementCostPct ?? 0) / 100);
    const totalFinancialLoss = v.employeesLeft * replacementCostPerEmployee;

    // Warning: employees left > average headcount (logically questionable)
    const hasWarning = v.employeesLeft > avgHeadcount;
    const warningMsg = hasWarning
      ? `Employees that left (${v.employeesLeft}) exceeds average headcount (${avgHeadcount.toFixed(1)}). Please verify your data.`
      : '';

    let level: AttritionResult['level'];
    let levelLabel: string;
    if (attritionRate <= 10)      { level = 'low';       levelLabel = 'Low Attrition — Workforce is stable'; }
    else if (attritionRate <= 20) { level = 'moderate';  levelLabel = 'Moderate Attrition'; }
    else if (attritionRate <= 40) { level = 'high';      levelLabel = 'High Attrition'; }
    else                          { level = 'very-high'; levelLabel = 'Very High Attrition'; }

    this.result = {
      avgHeadcount, attritionRate, level, levelLabel, retentionRate,
      replacementCostPerEmployee, totalFinancialLoss,
      employeesLeft: v.employeesLeft, currency: v.currency,
      hasWarning, warningMsg
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ replacementCostPct: 50, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('attrition-rate-report.csv',
      ['Metric', 'Value'],
      [
        ['Average Headcount', r.avgHeadcount.toFixed(1)],
        ['Employees That Left', r.employeesLeft],
        ['Attrition Rate', r.attritionRate.toFixed(2) + '%'],
        ['Retention Rate', r.retentionRate.toFixed(2) + '%'],
        ['Attrition Level', r.levelLabel],
        ['Replacement Cost per Employee', r.replacementCostPerEmployee.toFixed(2)],
        ['Total Estimated Financial Loss', r.totalFinancialLoss.toFixed(2)],
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
    const tool = getToolBySlug('attrition-rate-calculator');
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
    const tool = getToolBySlug('attrition-rate-calculator');
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
