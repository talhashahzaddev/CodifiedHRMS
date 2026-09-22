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

export interface ProjectCostResult {
  laborCost: number;
  materialsCost: number;
  overheadCost: number;
  totalCost: number;
  profitMargin: number;
  finalPrice: number;
  costBreakdown: {
    laborPct: number;
    materialsPct: number;
    overheadPct: number;
  };
  currency: string;
}

@Component({
  selector: 'app-project-cost-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './project-cost-calculator.component.html',
  styleUrls: ['./project-cost-calculator.component.scss']
})
export class ProjectCostCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: ProjectCostResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly currencies = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD (C$)' },
    { value: 'AUD', label: 'AUD (A$)' }
  ];

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('billable-hours-calculator'),
    getToolBySlug('utilization-rate-calculator'),
    getToolBySlug('fte-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is included in Direct Labor Cost?',
      a: 'Direct labor cost includes the wages and salaries of the employees who are directly working on the project. To be accurate, you should use the fully burdened labor rate, which includes the base wage plus taxes, benefits, and insurance.'
    },
    {
      q: 'What constitutes overhead (indirect costs)?',
      a: 'Overhead includes the ongoing business expenses not directly attributable to creating the product or service. This includes rent, utilities, administrative salaries, software licenses, and general insurance.'
    },
    {
      q: 'How is Profit Margin different from Markup?',
      a: 'Markup is a percentage added to the cost to get the final price (e.g., $100 cost + 20% markup = $120 price). Profit margin is the percentage of the final price that is profit (e.g., if you sell for $120 and cost is $100, the profit is $20. Margin = 20/120 = 16.6%). This calculator uses Profit Margin to calculate the final price: Final Price = Total Cost / (1 - Margin/100).'
    },
    {
      q: 'Why should I track cost breakdown percentages?',
      a: 'Cost breakdown percentages help you identify where your money is going. If labor constitutes 80% of your project cost, you know that managing hours and efficiency is the most critical factor for project profitability.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      estimatedHours: [null, [Validators.required, Validators.min(1)]],
      averageHourlyRate: [null, [Validators.required, Validators.min(0)]],
      materialsCost: [0, [Validators.required, Validators.min(0)]],
      overheadPct: [15, [Validators.required, Validators.min(0), Validators.max(100)]],
      targetProfitMargin: [20, [Validators.required, Validators.min(0), Validators.max(99)]],
      currency: ['USD'],
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    const laborCost = v.estimatedHours * v.averageHourlyRate;
    const materialsCost = v.materialsCost;
    
    // Overhead is calculated as a % of Direct Costs (Labor + Materials)
    const directCosts = laborCost + materialsCost;
    const overheadCost = directCosts * (v.overheadPct / 100);
    
    const totalCost = directCosts + overheadCost;
    
    // Price = Cost / (1 - Margin%)
    // E.g., if cost is 80 and margin is 20%, Price = 80 / 0.8 = 100.
    const finalPrice = totalCost / (1 - (v.targetProfitMargin / 100));

    // Percentages of total cost
    const laborPct = totalCost > 0 ? (laborCost / totalCost) * 100 : 0;
    const materialsPct = totalCost > 0 ? (materialsCost / totalCost) * 100 : 0;
    const calculatedOverheadPct = totalCost > 0 ? (overheadCost / totalCost) * 100 : 0;

    this.result = {
      laborCost,
      materialsCost,
      overheadCost,
      totalCost,
      profitMargin: v.targetProfitMargin,
      finalPrice,
      costBreakdown: {
        laborPct,
        materialsPct,
        overheadPct: calculatedOverheadPct
      },
      currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ materialsCost: 0, overheadPct: 15, targetProfitMargin: 20, currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    this.csvService.download('project-cost-estimate.csv',
      ['Metric', 'Value'],
      [
        ['Direct Labor Cost', r.laborCost.toFixed(2)],
        ['Materials & Equipment', r.materialsCost.toFixed(2)],
        ['Overhead Cost', r.overheadCost.toFixed(2)],
        ['Total Project Cost', r.totalCost.toFixed(2)],
        ['Target Profit Margin (%)', r.profitMargin.toFixed(2) + '%'],
        ['Recommended Final Price', r.finalPrice.toFixed(2)],
        ['Currency', r.currency],
        ['---', '---'],
        ['Labor % of Cost', r.costBreakdown.laborPct.toFixed(1) + '%'],
        ['Materials % of Cost', r.costBreakdown.materialsPct.toFixed(1) + '%'],
        ['Overhead % of Cost', r.costBreakdown.overheadPct.toFixed(1) + '%']
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
    const tool = getToolBySlug('project-cost-calculator');
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
    const tool = getToolBySlug('project-cost-calculator');
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
