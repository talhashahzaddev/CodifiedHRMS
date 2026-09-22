import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Inject,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

// ─────────────────────────────────────────────────────────────────────────────
// FBR Tax Slab Definitions — FBR Salaried Individual
// Source: Finance Act / FBR Notifications
// ─────────────────────────────────────────────────────────────────────────────
interface TaxSlab {
  min: number;
  max: number;
  fixed: number;
  rate: number;
  excess: number;
}

const FBR_TAX_SLABS: Record<string, TaxSlab[]> = {
  '2026-2027': [
    { min: 0,       max: 600000,    fixed: 0,       rate: 0,  excess: 0 },
    { min: 600001,  max: 1200000,   fixed: 0,       rate: 1,  excess: 600000 },
    { min: 1200001, max: 2200000,   fixed: 6000,    rate: 11, excess: 1200000 },
    { min: 2200001, max: 3200000,   fixed: 116000,  rate: 20, excess: 2200000 },
    { min: 3200001, max: 4100000,   fixed: 316000,  rate: 25, excess: 3200000 },
    { min: 4100001, max: 5600000,   fixed: 541000,  rate: 29, excess: 4100000 },
    { min: 5600001, max: 7000000,   fixed: 976000,  rate: 32, excess: 5600000 },
    { min: 7000001, max: 999999999, fixed: 1424000, rate: 35, excess: 7000000 },
  ],
  '2025-2026': [
    { min: 0,       max: 600000,    fixed: 0,      rate: 0,  excess: 0 },
    { min: 600001,  max: 1200000,   fixed: 0,      rate: 1,  excess: 600000 },
    { min: 1200001, max: 2200000,   fixed: 6000,   rate: 11, excess: 1200000 },
    { min: 2200001, max: 3200000,   fixed: 116000, rate: 23, excess: 2200000 },
    { min: 3200001, max: 4100000,   fixed: 346000, rate: 30, excess: 3200000 },
    { min: 4100001, max: 999999999, fixed: 616000, rate: 35, excess: 4100000 },
  ],
  '2024-2025': [
    { min: 0,       max: 600000,    fixed: 0,      rate: 0,  excess: 0 },
    { min: 600001,  max: 1200000,   fixed: 0,      rate: 5,  excess: 600000 },
    { min: 1200001, max: 2200000,   fixed: 30000,  rate: 15, excess: 1200000 },
    { min: 2200001, max: 3200000,   fixed: 180000, rate: 25, excess: 2200000 },
    { min: 3200001, max: 4100000,   fixed: 430000, rate: 30, excess: 3200000 },
    { min: 4100001, max: 999999999, fixed: 700000, rate: 35, excess: 4100000 },
  ],
  '2023-2024': [
    { min: 0,       max: 600000,    fixed: 0,       rate: 0,    excess: 0 },
    { min: 600001,  max: 1200000,   fixed: 0,       rate: 2.5,  excess: 600000 },
    { min: 1200001, max: 2400000,   fixed: 15000,   rate: 12.5, excess: 1200000 },
    { min: 2400001, max: 3600000,   fixed: 165000,  rate: 22.5, excess: 2400000 },
    { min: 3600001, max: 6000000,   fixed: 435000,  rate: 27.5, excess: 3600000 },
    { min: 6000001, max: 999999999, fixed: 1095000, rate: 35,   excess: 6000000 },
  ],
};

const FISCAL_YEARS = [
  { label: '2026-27', value: '2026-2027' },
  { label: '2025-26', value: '2025-2026' },
  { label: '2024-25', value: '2024-2025' },
  { label: '2023-24', value: '2023-2024' },
];

export interface TaxResult {
  grossAnnual: number;
  annualTax: number;
  monthlyTax: number;
  annualTakeHome: number;
  monthlyTakeHome: number;
  effectiveRate: number;
  activeSlabIndex: number;
  slabs: TaxSlab[];
}

@Component({
  selector: 'app-salary-tax-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './salary-tax-calculator.component.html',
  styleUrls: ['./salary-tax-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SalaryTaxCalculatorComponent implements OnInit, OnDestroy {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;

  fiscalYears = FISCAL_YEARS;
  result: TaxResult | null = null;

  openFaqIndex: number | null = 0;
  private destroy$ = new Subject<void>();

  faqs = [
    {
      q: 'Who qualifies as a "salaried individual" under FBR?',
      a: 'A salaried individual is anyone who derives more than 50% of their total income from salary — including wages, pay, compensation, and benefits received from an employer as per Section 12 of the Income Tax Ordinance, 2001.',
    },
    {
      q: 'Is the tax deducted monthly or paid annually?',
      a: 'For salaried employees, tax is deducted at source by the employer on a monthly basis (monthly salary × 12 = annualized). The employer deposits it with FBR and issues a salary certificate. You still file an annual income tax return.',
    },
    {
      q: 'Does this calculator include provincial taxes or Zakat?',
      a: 'No. This calculator computes only the federal income tax on salaried income as per FBR slabs. Provincial taxes, Zakat deductions, and other levies are not included. Consult a tax professional for a complete picture.',
    },
    {
      q: 'What is the tax-free threshold for 2026-27?',
      a: 'For fiscal year 2026-27, annual salaried income up to PKR 600,000 (PKR 50,000/month) is fully exempt from income tax — the rate is 0%.',
    },
    {
      q: 'How accurate are these figures?',
      a: 'The calculator uses the official FBR tax slab rates published in the Finance Act for each fiscal year. While we strive for accuracy, always verify with official FBR resources or a certified tax advisor before filing.',
    },
    {
      q: 'What happens if I switch from monthly to annual input?',
      a: 'When you select "Monthly Salary", the tool multiplies your input by 12 to get the gross annual salary used for tax calculation. The results always show both monthly and annual figures regardless of your input mode.',
    },
  ];

  constructor(
    private fb: FormBuilder,
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    const slug = 'salary-tax-calculator';
    const config = getToolBySlug(slug);
    if (config) {
      this.tool = config;
      this.relatedTools = getRelatedTools(slug);
      this.title.setTitle(this.tool.seoTitle);
      this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });
      this.meta.updateTag({ name: 'keywords', content: this.tool.keywords });
    }

    this.form = this.fb.group({
      fiscalYear: ['2026-2027', Validators.required],
      salaryMode: ['monthly'], // 'monthly' | 'annual'
      salaryAmount: [150000, [Validators.required, Validators.min(0)]],
    });

    this.form.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.calculateTax();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.calculateTax();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isMonthly(): boolean {
    return this.form.get('salaryMode')?.value === 'monthly';
  }

  toggleSalaryMode(): void {
    const current = this.form.get('salaryMode')?.value;
    this.form.patchValue({ salaryMode: current === 'monthly' ? 'annual' : 'monthly' });
  }

  calculateTax(): void {
    const { fiscalYear, salaryMode, salaryAmount } = this.form.value;
    const rawAmount = parseFloat(String(salaryAmount).replace(/,/g, '')) || 0;

    if (rawAmount < 0) {
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const grossAnnual = salaryMode === 'monthly' ? rawAmount * 12 : rawAmount;
    const slabs = FBR_TAX_SLABS[fiscalYear] ?? FBR_TAX_SLABS['2026-2027'];

    // Find active slab
    let activeSlabIndex = 0;
    let annualTax = 0;

    for (let i = 0; i < slabs.length; i++) {
      const slab = slabs[i];
      if (grossAnnual >= slab.min && grossAnnual <= slab.max) {
        activeSlabIndex = i;
        annualTax = slab.fixed + ((grossAnnual - slab.excess) * slab.rate) / 100;
        break;
      }
    }

    const monthlyTax = annualTax / 12;
    const annualTakeHome = grossAnnual - annualTax;
    const monthlyTakeHome = annualTakeHome / 12;
    const effectiveRate = grossAnnual > 0 ? (annualTax / grossAnnual) * 100 : 0;

    this.result = {
      grossAnnual,
      annualTax,
      monthlyTax,
      annualTakeHome,
      monthlyTakeHome,
      effectiveRate,
      activeSlabIndex,
      slabs,
    };

    this.cdr.markForCheck();
  }

  formatPKR(value: number): string {
    return new Intl.NumberFormat('en-PK', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.round(value));
  }

  formatSlabRange(slab: TaxSlab): string {
    if (slab.max >= 999999999) {
      return `PKR ${this.formatPKR(slab.min)}+`;
    }
    return `PKR ${this.formatPKR(slab.min)} – ${this.formatPKR(slab.max)}`;
  }

  formatFixedTax(slab: TaxSlab): string {
    return slab.fixed === 0 ? '—' : `PKR ${this.formatPKR(slab.fixed)}`;
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
