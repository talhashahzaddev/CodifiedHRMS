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

export interface RetentionResult {
  retentionRate: number;
  employeesLeft: number;
  turnoverRate: number;
  turnoverCost: number;
  maxAllowableLoss: number;
  targetMet: boolean;
  targetRetention: number;
  currency: string;
  hasInconsistency: boolean;
  inconsistencyMsg: string;
}

@Component({
  selector: 'app-employee-retention-rate-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './employee-retention-rate-calculator.component.html',
  styleUrls: ['./employee-retention-rate-calculator.component.scss']
})
export class EmployeeRetentionRateCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: RetentionResult | null = null;
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
    getToolBySlug('absence-percentage-calculator'),
    getToolBySlug('fte-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is the difference between retention rate and attrition rate?',
      a: 'Retention rate measures what percentage of your existing employees you kept during a period. Attrition rate measures what percentage of your average headcount left. They are inversely related but not exact inverses because they use different denominators. Retention rate = ((End − New Hires) ÷ Start) × 100; it focuses on retaining original employees only.'
    },
    {
      q: 'Why are new hires excluded from the retention formula?',
      a: 'New hires are excluded because the retention rate is designed to measure your ability to retain employees who were already with you at the start. Including new hires could inflate the rate — a company might hire 50 people and lose 30 originals but appear to have grown headcount. The formula isolates the stability of your existing workforce.'
    },
    {
      q: 'What is a good employee retention rate?',
      a: 'A retention rate of 85–95% is generally considered strong. The SHRM average across all industries in the US is approximately 77–80%. Tech companies often see 70–80%, while healthcare and government sectors exceed 90%. Set your target based on your industry benchmark and the strategic cost of turnover in your specific roles.'
    },
    {
      q: 'How is Estimated Turnover Cost calculated?',
      a: 'Turnover cost = Employees Left × Cost Per Hire. Cost per hire includes job posting fees, recruiter time, interview time, onboarding, training, and the productivity gap during ramp-up. SHRM reports the average cost per hire in the US is approximately $4,700. For senior roles, this can be 3–5× the annual salary.'
    },
    {
      q: 'What does the "Target Check" output mean?',
      a: 'The Target Check tells you: "Based on your target retention %, how many employees can you afford to lose?" If Employees Left ≤ Max Allowable Loss, your target is met (shown in green). If Employees Left > Max Allowable Loss, your target is missed (shown in red) and you need to investigate why attrition exceeded your planned threshold.'
    },
    {
      q: 'Can the retention rate exceed 100%?',
      a: 'In theory, no. However, if the formula yields a value above 100% due to data entry (e.g., End Headcount − New Hires > Start), it indicates a data inconsistency. The calculator will flag this and display a warning. Review your inputs to ensure the figures reflect the same time period.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      employeesAtStart: [null, [Validators.required, Validators.min(1)]],
      newHires:         [0,    [Validators.required, Validators.min(0)]],
      employeesAtEnd:   [null, [Validators.required, Validators.min(0)]],
      costPerHire:      [4000, [Validators.min(0)]],
      targetRetention:  [90,   [Validators.min(0), Validators.max(100)]],
      currency:         ['USD'],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // Edge case: start = 0
    if (v.employeesAtStart === 0) {
      this.formError = 'Employees at Start cannot be zero. Enter a valid starting headcount.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const retained    = v.employeesAtEnd - v.newHires;
    const rawRetRate  = (retained / v.employeesAtStart) * 100;
    const retentionRate = Math.max(0, Math.min(rawRetRate, 100));

    // Calculate employees left (those present at start who are no longer there)
    const employeesLeft = (v.employeesAtStart + v.newHires) - v.employeesAtEnd;

    // Turnover rate
    const avgHeadcount = (v.employeesAtStart + v.employeesAtEnd) / 2;
    const turnoverRate = avgHeadcount > 0 ? Math.max(0, (employeesLeft / avgHeadcount) * 100) : 0;

    const costPerHire   = v.costPerHire ?? 0;
    const turnoverCost  = Math.max(0, employeesLeft) * costPerHire;

    const targetRetention  = v.targetRetention ?? 90;
    const maxAllowableLoss = v.employeesAtStart * (1 - targetRetention / 100);
    const targetMet        = Math.max(0, employeesLeft) <= maxAllowableLoss;

    // Data inconsistency: retained employees > starting employees (shouldn't happen)
    const hasInconsistency = retained > v.employeesAtStart;
    const inconsistencyMsg = hasInconsistency
      ? `Data inconsistency detected: (Employees at End − New Hires) = ${retained} exceeds the starting headcount of ${v.employeesAtStart}. Please check your inputs.`
      : '';

    this.result = {
      retentionRate, employeesLeft: Math.max(0, employeesLeft),
      turnoverRate, turnoverCost,
      maxAllowableLoss: Math.round(maxAllowableLoss),
      targetMet, targetRetention, currency: v.currency,
      hasInconsistency, inconsistencyMsg
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ newHires: 0, costPerHire: 4000, targetRetention: 90, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('retention-rate-report.csv',
      ['Metric', 'Value'],
      [
        ['Retention Rate', r.retentionRate.toFixed(2) + '%'],
        ['Employees Left', r.employeesLeft],
        ['Turnover Rate', r.turnoverRate.toFixed(2) + '%'],
        ['Estimated Turnover Cost', r.turnoverCost.toFixed(2)],
        ['Target Retention', r.targetRetention + '%'],
        ['Max Allowable Loss (to hit target)', r.maxAllowableLoss],
        ['Target Status', r.targetMet ? 'Target Met' : 'Target Missed'],
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
    const tool = getToolBySlug('employee-retention-rate-calculator');
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
    const tool = getToolBySlug('employee-retention-rate-calculator');
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
