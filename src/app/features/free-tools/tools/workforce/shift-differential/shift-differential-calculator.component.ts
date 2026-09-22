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

export interface ShiftDiffResult {
  regularHours: number;
  shiftHours: number;
  basePay: number;
  differentialPay: number;
  totalGrossPay: number;
  diffType: 'flat' | 'percentage';
  effectiveHourlyRate: number;
  currency: string;
}

@Component({
  selector: 'app-shift-differential-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, CurrencyPipe, DecimalPipe],
  templateUrl: './shift-differential-calculator.component.html',
  styleUrls: ['./shift-differential-calculator.component.scss']
})
export class ShiftDifferentialCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: ShiftDiffResult | null = null;
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
    getToolBySlug('overtime-calculator'),
    getToolBySlug('time-card-calculator'),
    getToolBySlug('fte-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is shift differential pay?',
      a: 'Shift differential is extra compensation paid to employees who work less desirable hours, such as night shifts, weekends, or holidays. It is an incentive to compensate for the inconvenience of working outside standard daytime business hours.'
    },
    {
      q: 'Is shift differential legally required?',
      a: 'In most jurisdictions (including the US under the FLSA), shift differential is not legally required for private-sector employers; it is a matter of employer policy or union contract. However, if paid, it must be included when calculating the regular rate of pay for overtime purposes.'
    },
    {
      q: 'What is the difference between a flat rate and a percentage shift differential?',
      a: 'A flat rate adds a specific dollar amount to the hourly wage (e.g., +$2.00/hr for the night shift). A percentage adds a proportion of the base pay (e.g., +10% of the $20/hr base = +$2.00/hr). Percentages automatically scale with raises, while flat rates must be manually updated.'
    },
    {
      q: 'How does shift differential affect overtime?',
      a: 'Under FLSA rules, shift differential pay must be included in the "regular rate" of pay before calculating the time-and-a-half overtime rate. If an employee earns $20/hr base + $2/hr shift diff = $22/hr regular rate. Overtime would be paid at 1.5 × $22 = $33/hr.'
    },
    {
      q: 'What are typical shift differential rates?',
      a: 'Rates vary heavily by industry. In healthcare, night shift differentials might be 10-15% or $2-$5 per hour, with additional weekend differentials. In manufacturing, 2nd shift (evening) might get 5-10% and 3rd shift (overnight) 10-15%.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      baseHourlyRate:    [null, [Validators.required, Validators.min(0)]],
      regularHours:      [null, [Validators.required, Validators.min(0)]],
      shiftHours:        [null, [Validators.required, Validators.min(0)]],
      diffType:          ['flat'], // 'flat' | 'percentage'
      diffAmount:        [null, [Validators.required, Validators.min(0)]],
      currency:          ['USD'],
    });

    // Clear amount when switching types to prevent confusing validation states
    this.form.get('diffType')?.valueChanges.subscribe(() => {
      this.form.get('diffAmount')?.setValue(null);
    });
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();
    const baseRate = v.baseHourlyRate;
    const regHours = v.regularHours;
    const shiftHours = v.shiftHours;
    const isFlat = v.diffType === 'flat';
    
    // Validate percentage max
    if (!isFlat && v.diffAmount > 500) {
      this.formError = 'Percentage differential cannot exceed 500%.';
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const shiftRateAddOn = isFlat ? v.diffAmount : baseRate * (v.diffAmount / 100);
    const totalShiftRate = baseRate + shiftRateAddOn;

    const basePay = (regHours * baseRate) + (shiftHours * baseRate);
    const differentialPay = shiftHours * shiftRateAddOn;
    const totalGrossPay = basePay + differentialPay;
    
    const totalHours = regHours + shiftHours;
    const effectiveHourlyRate = totalHours > 0 ? totalGrossPay / totalHours : 0;

    this.result = {
      regularHours: regHours,
      shiftHours,
      basePay,
      differentialPay,
      totalGrossPay,
      diffType: v.diffType,
      effectiveHourlyRate,
      currency: v.currency
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset({ diffType: 'flat', currency: 'USD' });
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    const totalHours = r.regularHours + r.shiftHours;
    this.csvService.download('shift-differential-report.csv',
      ['Metric', 'Value'],
      [
        ['Regular Hours', r.regularHours.toFixed(2)],
        ['Shift Hours (with Diff)', r.shiftHours.toFixed(2)],
        ['Total Hours Worked', totalHours.toFixed(2)],
        ['Base Pay (All Hours)', r.basePay.toFixed(2)],
        ['Differential Pay Premium', r.differentialPay.toFixed(2)],
        ['Total Gross Pay', r.totalGrossPay.toFixed(2)],
        ['Effective Hourly Rate', r.effectiveHourlyRate.toFixed(2)],
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
    return 'Invalid value.';
  }

  private updateSeo(): void {
    const tool = getToolBySlug('shift-differential-calculator');
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
    const tool = getToolBySlug('shift-differential-calculator');
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
