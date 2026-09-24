import {
  Component, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef,
  Inject, PLATFORM_ID, computed, signal, Signal, inject, effect, untracked
} from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators, ValidatorFn } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { map } from 'rxjs/operators';

import { getToolBySlug, getAllRelatedTools, ToolConfig, ToolField } from '../config/tools.config';
import { ToolResult, EducationalContent } from '../models/tool-result.model';
import { ToolFormulaService } from '../services/tool-formula.service';
import { ToolBreadcrumbComponent, Crumb } from '../shared/breadcrumb/breadcrumb.component';
import { ToolCardComponent } from '../shared/tool-card/tool-card.component';
import { ResultBoxComponent } from '../shared/result-box/result-box.component';

/** Tools that need custom interactive UI (implemented in Step 4) */
const CUSTOM_UI_SLUGS = new Set([
  'time-card-calculator', 'timetable-generator', 'time-tracker',
  'event-qr-generator', 'upi-qr-generator', 'banner-generator'
]);

/** Tools that auto-refresh with live data (no form needed) */
const LIVE_TOOLS = new Set(['gmt-timestamp']);

@Component({
  selector: 'app-tool-wrapper',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule, RouterModule, ReactiveFormsModule,
    ToolBreadcrumbComponent, ToolCardComponent, ResultBoxComponent
  ],
  templateUrl: './tool-wrapper.component.html',
  styleUrls: ['./tool-wrapper.component.scss']
})
export class ToolWrapperComponent implements OnDestroy {
  private route          = inject(ActivatedRoute);
  private titleService   = inject(Title);
  private meta           = inject(Meta);
  private formulaService = inject(ToolFormulaService);
  private cdr            = inject(ChangeDetectorRef);

  @Inject(PLATFORM_ID) private platformId = inject(PLATFORM_ID);
  @Inject(DOCUMENT)    private document   = inject(DOCUMENT);

  // ── Signals & Computed ────────────────────────────────────────────────────

  /** Current tool config — derived from route param */
  readonly currentTool: Signal<ToolConfig | undefined>;

  /** Results from the formula engine */
  readonly results = signal<ToolResult[]>([]);
  readonly isCalculated = signal(false);

  /** Active FAQ / educational-content tab */
  readonly activeTab = signal<'how-to' | 'formula' | 'pros-cons'>('how-to');

  /** Open FAQ index (-1 = all closed) */
  readonly openFaqIndex = signal<number>(-1);

  /** Breadcrumbs derived from current tool */
  readonly breadcrumbs: Signal<Crumb[]>;

  /** Related tools (up to 4) */
  readonly relatedTools: Signal<ToolConfig[]>;

  /** True if tool needs custom UI rather than generic form */
  readonly isCustomUi: Signal<boolean>;

  /** True if tool auto-refreshes live data (no user input needed) */
  readonly isLiveTool: Signal<boolean>;

  // ── Form ─────────────────────────────────────────────────────────────────
  form: FormGroup = new FormGroup({});
  private formSub?: Subscription;

  // ── JSON-LD ───────────────────────────────────────────────────────────────
  private jsonLdScript: HTMLScriptElement | null = null;
  private canonicalLink: HTMLLinkElement | null = null;

  // ── Live Refresh ──────────────────────────────────────────────────────────
  private liveTimer?: ReturnType<typeof setInterval>;

  constructor() {
    const slugSignal = toSignal(
      this.route.paramMap.pipe(map(p => p.get('toolSlug') ?? '')),
      { initialValue: '' }
    );

    this.currentTool = computed(() => getToolBySlug(slugSignal()));

    this.breadcrumbs = computed<Crumb[]>(() => {
      const t = this.currentTool();
      return [
        { label: 'Home', route: '/' },
        {
          label: t?.category === 'workforce' ? 'Free Workforce Tools' : 'Free Utility Tools',
          route: t?.category === 'workforce' ? '/free-workforce-tools' : '/free-tools'
        },
        { label: t?.title ?? '', route: null }
      ];
    });

    this.relatedTools = computed<ToolConfig[]>(() => {
      const t = this.currentTool();
      return t ? getAllRelatedTools(t.slug) : [];
    });

    this.isCustomUi = computed(() => {
      const t = this.currentTool();
      return t ? CUSTOM_UI_SLUGS.has(t.slug) : false;
    });

    this.isLiveTool = computed(() => {
      const t = this.currentTool();
      return t ? LIVE_TOOLS.has(t.slug) : false;
    });

    // ── Side effects: run when tool changes ──────────────────────────────────
    effect(() => {
      const tool = this.currentTool();
      untracked(() => {
        this.tearDown();

        if (!tool) return;

        this.updateSeo(tool);
        this.injectJsonLd(tool);
        this.results.set([]);
        this.isCalculated.set(false);
        this.activeTab.set('how-to');
        this.openFaqIndex.set(-1);

        if (LIVE_TOOLS.has(tool.slug)) {
          // Auto-calculate immediately and then every second
          this.performCalculation(tool, {});
          this.liveTimer = setInterval(() => {
            this.performCalculation(tool, {});
          }, 1000);
        } else if (!CUSTOM_UI_SLUGS.has(tool.slug)) {
          this.buildForm(tool);
        }

        this.cdr.markForCheck();
      });
    });
  }

  // ── Form Builder ──────────────────────────────────────────────────────────

  private buildForm(tool: ToolConfig): void {
    this.formSub?.unsubscribe();

    const group: Record<string, FormControl> = {};
    for (const field of tool.fields) {
      const validators: ValidatorFn[] = [];
      if (field.type === 'number') {
        if (field.min !== undefined) validators.push(Validators.min(field.min));
        if (field.max !== undefined) validators.push(Validators.max(field.max));
      }
      const defaultVal = field.defaultValue !== undefined
        ? field.defaultValue
        : field.type === 'number' ? '' : '';
      group[field.key] = new FormControl(defaultVal, validators);
    }

    this.form = new FormGroup(group);

    // Auto-calculate on value change (debounced)
    this.formSub = this.form.valueChanges
      .pipe(debounceTime(250))
      .subscribe(values => this.performCalculation(tool, values));

    // Calculate immediately with defaults if any fields have default values
    const hasDefaults = tool.fields.some(f => f.defaultValue !== undefined && f.defaultValue !== '');
    if (hasDefaults) {
      this.performCalculation(tool, this.form.getRawValue());
    }
  }

  // ── Calculation ───────────────────────────────────────────────────────────

  calculate(): void {
    const tool = this.currentTool();
    if (!tool || this.form.invalid) return;
    this.performCalculation(tool, this.form.getRawValue());
  }

  refreshLive(): void {
    const tool = this.currentTool();
    if (!tool) return;
    this.performCalculation(tool, {});
  }

  private performCalculation(tool: ToolConfig, values: Record<string, any>): void {
    const results = this.formulaService.calculate(tool.slug, values);
    this.results.set(results);
    this.isCalculated.set(true);
    this.cdr.markForCheck();
  }

  // ── Tab ───────────────────────────────────────────────────────────────────

  setTab(tab: 'how-to' | 'formula' | 'pros-cons'): void {
    this.activeTab.set(tab);
  }

  toggleFaq(index: number): void {
    this.openFaqIndex.update(cur => cur === index ? -1 : index);
  }

  // ── Educational Content ───────────────────────────────────────────────────

  getEducationalContent(slug: string): EducationalContent {
    return EDUCATIONAL_CONTENT[slug] ?? DEFAULT_EDUCATIONAL_CONTENT;
  }

  // ── SEO ───────────────────────────────────────────────────────────────────

  private updateSeo(tool: ToolConfig): void {
    const base   = tool.category === 'workforce' ? '/free-workforce-tools' : '/free-tools';
    const pageUrl = `https://www.briskpeople.com${base}/${tool.slug}`;
    const ogImage = tool.ogImage ?? 'https://www.briskpeople.com/assets/og/briskpeople-tools-og.jpg';

    this.titleService.setTitle(tool.seoTitle);
    this.meta.updateTag({ name: 'description',         content: tool.seoDescription });
    this.meta.updateTag({ name: 'keywords',            content: tool.keywords });
    this.meta.updateTag({ property: 'og:title',        content: tool.seoTitle });
    this.meta.updateTag({ property: 'og:description',  content: tool.seoDescription });
    this.meta.updateTag({ property: 'og:type',         content: 'website' });
    this.meta.updateTag({ property: 'og:url',          content: pageUrl });
    this.meta.updateTag({ property: 'og:image',        content: ogImage });
    this.meta.updateTag({ property: 'og:site_name',    content: 'BriskPeople' });
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: tool.seoTitle });
    this.meta.updateTag({ name: 'twitter:description', content: tool.seoDescription });
    this.meta.updateTag({ name: 'twitter:image',       content: ogImage });
    this.meta.updateTag({ name: 'robots',              content: 'index, follow' });

    // ── Canonical link tag ────────────────────────────────────────────────────
    if (this.canonicalLink) this.canonicalLink.remove();
    this.canonicalLink = this.document.createElement('link');
    this.canonicalLink.setAttribute('rel', 'canonical');
    this.canonicalLink.setAttribute('href', pageUrl);
    this.document.head.appendChild(this.canonicalLink);
  }

  private injectJsonLd(tool: ToolConfig): void {
    const base    = tool.category === 'workforce' ? '/free-workforce-tools' : '/free-tools';
    const pageUrl = `https://www.briskpeople.com${base}/${tool.slug}`;
    const edu     = this.getEducationalContent(tool.slug);

    // ── WebApplication schema ─────────────────────────────────────────────────
    const webAppSchema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.title,
      description: tool.seoDescription,
      url: pageUrl,
      applicationCategory: tool.category === 'workforce' ? 'BusinessApplication' : 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'BriskPeople', url: 'https://www.briskpeople.com' }
    };

    // ── HowTo schema ──────────────────────────────────────────────────────────
    const howToSchema: Record<string, any> = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: `How to use the ${tool.title}`,
      description: tool.seoDescription,
      step: edu.howToUse.map((step, i) => ({
        '@type': 'HowToStep',
        position: i + 1,
        name: `Step ${i + 1}`,
        text: step
      }))
    };

    const schemas: Record<string, any>[] = [webAppSchema, howToSchema];

    // ── FAQ schema (if FAQs are defined) ─────────────────────────────────────
    if (edu.faqs && edu.faqs.length > 0) {
      const faqSchema: Record<string, any> = {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: edu.faqs.map(faq => ({
          '@type': 'Question',
          name: faq.q,
          acceptedAnswer: { '@type': 'Answer', text: faq.a }
        }))
      };
      schemas.push(faqSchema);
    }

    if (this.jsonLdScript) this.jsonLdScript.remove();
    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schemas);
    this.document.head.appendChild(this.jsonLdScript);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private tearDown(): void {
    this.formSub?.unsubscribe();
    if (this.liveTimer !== undefined) {
      clearInterval(this.liveTimer);
      this.liveTimer = undefined;
    }
    if (this.jsonLdScript)  { this.jsonLdScript.remove();  this.jsonLdScript  = null; }
    if (this.canonicalLink) { this.canonicalLink.remove(); this.canonicalLink = null; }
  }

  isSelect(field: ToolField): boolean { return field.type === 'select'; }
  isTextArea(field: ToolField): boolean { return field.type === 'textarea'; }
  isInput(field: ToolField): boolean { return !this.isSelect(field) && !this.isTextArea(field); }
  inputType(field: ToolField): string { return field.type === 'textarea' ? 'text' : field.type; }

  ngOnDestroy(): void {
    this.tearDown();
    this.titleService.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}

// ════════════════════════════════════════════════════════════════════════════
// EDUCATIONAL CONTENT MAP
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_EDUCATIONAL_CONTENT: EducationalContent = {
  howToUse: ['Fill in all required fields in the form.', 'Results update automatically as you type.', 'Click "Calculate" to confirm your result.'],
  pros: ['Free and instant', 'No sign-up required', 'Runs entirely in your browser'],
  cons: ['Results are for estimation purposes — verify critical figures with a qualified professional.']
};

const EDUCATIONAL_CONTENT: Record<string, EducationalContent> = {
  'absence-percentage-calculator': {
    howToUse: [
      'Enter the total number of absent days across all employees for the period.',
      'Enter the number of employees in the team or company.',
      'Enter the number of working days in the period (e.g., 22 for a typical month).',
      'The absence percentage updates instantly.'
    ],
    formula: '(Absent Days ÷ (Employees × Workdays)) × 100',
    formulaNote: 'This is the SHRM-recommended formula for measuring the absenteeism rate. It measures what proportion of total available working hours were lost to absence.',
    pros: ['Industry-standard KPI used by SHRM and CIPD', 'Instant calculation — no spreadsheet required', 'Benchmark status shown automatically'],
    cons: ['Does not distinguish between excused and unexcused absences', 'Should be segmented by department for deeper insights'],
    faqs: [
      { q: 'What is a good absence percentage rate?', a: 'According to CIPD research, the average employee absence rate in the UK is around 5.8 days per year, equivalent to roughly 2.3%. Most HR benchmarks consider anything below 3% healthy and rates above 5% a sign that systemic issues need attention.' },
      { q: 'How do you calculate absence percentage?', a: 'The standard SHRM formula is: Absence Percentage = (Total Absent Days ÷ (Total Employees × Working Days in Period)) × 100. For example, 45 absent days across 50 employees over 22 working days = (45 ÷ (50 × 22)) × 100 = 4.09%.' },
      { q: 'What is the difference between absence rate and absenteeism rate?', a: 'They are the same metric with different names. “Absence rate” and “absenteeism rate” both refer to the percentage of available working time lost to employee absence.' },
      { q: 'How do I reduce my absence percentage?', a: 'Common strategies include: Return-to-Work interviews after every absence, flexible working arrangements, occupational health support, Employee Assistance Programmes (EAPs), and manager training to recognise early warning signs of burnout.' },
      { q: 'Does the absence percentage calculator include holidays?', a: 'No. The “Working Days in Period” field should only include scheduled working days — exclude public holidays and weekends. Absence percentage measures unplanned absence, not planned leave.' }
    ]
  },
  'attrition-rate-calculator': {
    howToUse: [
      'Enter the number of employees at the start of the period.',
      'Enter the number at the end of the period.',
      'Enter how many employees left during the period.',
      'The attrition and implied retention rates appear instantly.'
    ],
    formula: '(Employees Left ÷ Average Headcount) × 100',
    formulaNote: 'Average headcount = (Start + End) ÷ 2. This smooths out the effect of significant hiring or reduction events during the period.',
    pros: ['Follows SHRM and industry-standard methodology', 'Shows implied retention rate simultaneously', 'Benchmark status (Low / Average / High) included'],
    cons: ['Treats voluntary resignations and involuntary terminations equally', 'A more precise analysis would segment by departure type'],
    faqs: [
      { q: 'What is a good employee attrition rate?', a: 'Most HR benchmarks consider an annual attrition rate below 10% healthy. Rates of 15–20% are concerning and above 20% typically signal systemic cultural or management problems. However, acceptable rates vary significantly by industry — retail and hospitality typically run 30–60%.' },
      { q: 'What is the difference between attrition and turnover?', a: 'Turnover counts all separations (voluntary and involuntary) and usually includes replacement hiring. Attrition specifically refers to headcount reduction where positions are not refilled — such as retirement, role elimination, or strategic downsizing.' },
      { q: 'How do I calculate monthly attrition rate?', a: 'Use the formula: (Employees Who Left in Month ÷ Average Headcount in Month) × 100. Average headcount = (Headcount at Start + Headcount at End) ÷ 2. Multiply by 12 to get an annualized figure.' },
      { q: 'What causes high employee attrition?', a: 'Common causes include below-market compensation, poor management, lack of career growth, toxic workplace culture, burnout, and poor onboarding. Exit interviews and employee engagement surveys are the best tools for identifying the specific drivers.' },
      { q: 'Is attrition always bad?', a: 'Not necessarily. Some attrition is healthy — it removes poor performers and brings in fresh talent. “Desirable attrition” involves underperformers leaving, while “undesirable attrition” involves high-performers quitting. HR should track both and aim to reverse the latter.' }
    ]
  },
  'employee-retention-rate-calculator': {
    howToUse: [
      'Enter your headcount at the start of the period.',
      'Enter the headcount at the end of the period.',
      'Enter how many new hires joined during that time.',
      'The retention rate reflects only employees who were present at the start.'
    ],
    formula: '((End Headcount − New Hires) ÷ Start Headcount) × 100',
    formulaNote: 'New hires are excluded so the rate measures how well you retained existing employees, not just net headcount change.',
    pros: ['Isolates retention of existing workforce vs. new hiring', 'Benchmark status shown (Excellent / Average / Below Average)'],
    cons: ['Does not show retention by department, tenure, or role level', 'Best used alongside exit interview data for full context'],
    faqs: [
      { q: 'What is a good employee retention rate?', a: 'A retention rate above 90% is generally considered excellent. Rates of 80–90% are acceptable depending on the industry. Below 80% is a signal to investigate root causes. For high-skill or specialist roles, even a 90% retention rate may be considered low.' },
      { q: 'How is retention rate different from attrition rate?', a: 'Retention rate and attrition rate are complementary. If your attrition rate is 12%, your retention rate is approximately 88%. Retention rate focuses on who stayed; attrition rate focuses on who left. Both should be tracked together for a complete picture.' },
      { q: 'How do I calculate employee retention rate?', a: 'Formula: ((Headcount at End − New Hires During Period) ÷ Headcount at Start) × 100. For example: (92 − 5) ÷ 100 × 100 = 87%. The new hires are excluded because we are measuring how well existing employees were retained, not net headcount change.' },
      { q: 'What factors most affect employee retention?', a: 'Research consistently shows the top retention drivers are: competitive compensation, clear career progression, strong management relationships, flexible working, psychological safety, and purpose-driven work. Onboarding quality is especially critical — employees who have poor onboarding are twice as likely to leave within 90 days.' },
      { q: 'How often should I calculate retention rate?', a: 'Monthly tracking is ideal for large organizations so you can catch trends early. Quarterly reporting is common for mid-sized companies. Always calculate it for the same period each time to make comparisons meaningful.' }
    ]
  },
  'overtime-calculator': {
    howToUse: [
      'Enter the number of regular hours worked.',
      'Enter the overtime hours worked.',
      'Enter the employee\'s base hourly rate.',
      'Set the overtime multiplier (US FLSA default is 1.5×, some jurisdictions use 2×).',
      'Total gross pay and effective hourly rate are shown.'
    ],
    formula: 'Total Pay = (Regular Hrs × Rate) + (OT Hrs × Rate × Multiplier)',
    formulaNote: 'Under the US Fair Labor Standards Act (FLSA), overtime must be paid at 1.5× the regular rate for all hours over 40 per week. India\'s Factories Act requires 2× after 48 hours.',
    pros: ['Supports any custom OT multiplier (1.25×, 1.5×, 2×)', 'Shows effective hourly rate for cost analysis'],
    cons: ['Does not account for state-level double-time thresholds (e.g., California)', 'Employer taxes (FICA, EPF) are not included in the result'],
    faqs: [
      { q: 'What is time and a half overtime?', a: 'Time and a half means the employee is paid 1.5× their regular hourly rate for overtime hours. Under the US FLSA, this applies to any hours worked beyond 40 in a workweek. For example, if an employee earns $20/hour, their overtime rate is $30/hour.' },
      { q: 'How do I calculate overtime pay?', a: 'Use the formula: Total Pay = (Regular Hours × Hourly Rate) + (Overtime Hours × Hourly Rate × OT Multiplier). Example: 40 regular hours at $20/hr plus 8 OT hours at 1.5× = ($800) + ($240) = $1,040 gross pay.' },
      { q: 'Does overtime apply daily or weekly?', a: 'In the US under FLSA, overtime is calculated weekly (over 40 hours per week). Some US states like California also apply daily overtime for hours beyond 8 per day. In the UK, there is no statutory overtime rate — it depends on the employment contract. In India, the Factories Act mandates 2× pay for hours over 9 per day or 48 per week.' },
      { q: 'Is overtime calculated on base salary or total compensation?', a: 'Under FLSA, overtime is calculated on the “regular rate of pay”, which must include most forms of compensation — not just base wages. This includes non-discretionary bonuses, shift differentials, and commissions, but excludes gifts and vacation pay.' },
      { q: 'Can salaried employees get overtime?', a: 'Yes. In the US, salaried employees earning below $684/week ($35,568/year as of 2020) are generally entitled to overtime under FLSA. Salaried employees above this threshold may be exempt if they meet the duties test for executive, administrative, or professional exemptions.' }
    ]
  },
  'shift-differential-calculator': {
    howToUse: [
      'Enter the employee\'s base hourly rate.',
      'Enter the shift differential percentage (e.g., 10 for 10% night shift premium).',
      'Enter the total hours worked on the shift.',
      'Results show adjusted rate, total earnings, and the premium earned.'
    ],
    formula: 'Adjusted Rate = Base Rate × (1 + Differential%) | Total = Adjusted Rate × Hours',
    formulaNote: 'Shift differentials are typically 5–25% above base rate for evening, night, weekend, or hazardous duty shifts. They are part of regular rate calculations for FLSA overtime.',
    pros: ['Instantly shows the cost of shift coverage vs. day shift', 'Useful for scheduling budget planning'],
    cons: ['Does not account for complex multi-rate shift blending', 'FLSA regular rate calculations for OT with differentials are more complex'],
    faqs: [
      { q: 'What is a shift differential?', a: 'A shift differential is additional pay given to employees who work outside standard business hours — typically evenings, nights, weekends, or holidays. It compensates employees for the inconvenience and is usually expressed as a percentage above the base hourly rate (e.g., 15% night shift premium).' },
      { q: 'How much is a typical shift differential?', a: 'Shift differentials typically range from 5–25% above base pay depending on the shift type and industry. Evening shifts (6PM–12AM) usually attract 5–10%, night shifts (12AM–6AM) 10–20%, and weekend/holiday shifts can go up to 25% or more in some sectors like healthcare and manufacturing.' },
      { q: 'Are shift differentials included in overtime calculations?', a: 'Yes. Under the US FLSA, shift differentials must be included in the “regular rate of pay” used to calculate overtime. This means overtime pay is calculated on the higher, differential-inclusive rate — not just the base hourly rate.' },
      { q: 'Is shift differential pay taxable?', a: 'Yes. Shift differential pay is treated as ordinary earned income and is subject to the same income tax, Social Security, and Medicare withholding as regular wages. It should appear on the employee\'s W-2 or pay stub as part of total compensation.' },
      { q: 'How do I calculate shift differential pay?', a: 'Formula: Adjusted Rate = Base Rate × (1 + Differential%). Then: Total Shift Pay = Adjusted Rate × Hours Worked. Example: $20/hr base rate with a 15% night differential = $20 × 1.15 = $23/hr adjusted rate. For 8 hours: $23 × 8 = $184 total.' }
    ]
  },
  'pto-calculator': {
    howToUse: [
      'Enter the annual PTO entitlement in days.',
      'Select or enter the number of pay periods per year (12 = monthly, 26 = biweekly, 52 = weekly).',
      'Enter how many pay periods the employee has worked so far.',
      'Enter any PTO days already used.',
      'Current balance and projected year-end balance are displayed.'
    ],
    formula: 'Balance = (Annual PTO ÷ Pay Periods) × Periods Worked − Days Used',
    formulaNote: 'PTO accrual can be monthly, biweekly, or weekly. This calculator uses a pro-rata accrual model consistent with most US and UK employer policies.',
    pros: ['Works for any accrual frequency', 'Shows projected year-end balance for planning purposes'],
    cons: ['Does not account for PTO carryover caps', 'Waiting periods for new hires are not modelled'],
    faqs: [
      { q: 'How much PTO do most employees get?', a: 'According to the Bureau of Labor Statistics, US private sector employees receive an average of 10 days of PTO after 1 year of service, rising to around 15 days after 5 years and 18–20 days after 10+ years. Many tech companies now offer 20–30 days or unlimited PTO.' },
      { q: 'How does PTO accrual work?', a: 'PTO accrues incrementally with each pay period. For example, 15 days of annual PTO with 26 biweekly pay periods = 0.577 days earned per pay period. After 13 pay periods (half a year), you\'d have accrued 7.5 days.' },
      { q: 'Do unused PTO days carry over?', a: 'It depends on your employer\'s policy. Some companies allow unlimited carryover, others cap it (e.g., you can carry over up to 5 unused days), and others have a “use it or lose it” policy. California, Montana, and Nebraska legally prohibit “use it or lose it” PTO policies.' },
      { q: 'Is PTO paid out when you leave a job?', a: 'This varies by state and employment contract. In some US states (e.g., California, Colorado, Illinois), accrued PTO is legally considered earned wages and must be paid out on termination. In others, employers can have a policy of forfeiting unused PTO. Always check your employment agreement.' },
      { q: 'What is the difference between PTO and vacation days?', a: 'PTO (Paid Time Off) is a pooled bank of leave days that can be used for any reason — vacation, illness, personal days, or mental health. Vacation days are a specific type of leave solely for personal time off. Many modern companies are moving from separate vacation/sick buckets to a single PTO bank.' }
    ]
  },
  'leave-encashment-calculator': {
    howToUse: [
      'Select your employment type (Government or Private Sector).',
      'Enter your last drawn basic salary per month.',
      'Enter the number of earned leave days you wish to encash.',
      'Enter your total years of service.',
      'The tool applies Section 10(10AA) of the Income Tax Act automatically.'
    ],
    formula: 'Encashment = (Basic ÷ 26) × Leave Days | Exemption = Min(Actual, ₹25L, 10×Basic, Earned Leave Value)',
    formulaNote: 'Section 10(10AA) exempts leave encashment for government employees fully. For private sector, the exemption is the least of four limits. The ₹25 lakh cap was revised in 2023 (Budget 2023).',
    pros: ['Applies the exact Income Tax Act Sec 10(10AA) formula', 'Handles both government and private sector', 'Shows all four exemption limits'],
    cons: ['Assumes basic salary only; HRA and other allowances form part of full CTC', 'State-level leave encashment rules may differ'],
    faqs: [
      { q: 'What is leave encashment?', a: 'Leave encashment is a payment made by an employer to an employee in lieu of earned/privilege leave that has not been taken. In India, it is governed under Section 10(10AA) of the Income Tax Act and provides a tax exemption for leave salary received at retirement or resignation.' },
      { q: 'How is leave encashment calculated in India?', a: 'The encashment amount = (Last Basic Salary ÷ 26) × Number of Leave Days. For private sector employees, the income tax exemption under Section 10(10AA) is the least of: actual leave encashment received, ₹25,00,000 (Budget 2023 limit), 10 months of average basic salary, or the cash equivalent of earned leave (max 30 days per year of service).' },
      { q: 'Is leave encashment fully tax-exempt for government employees?', a: 'Yes. Under Section 10(10AA)(i), leave encashment received by central and state government employees at the time of retirement is fully exempt from income tax, with no upper limit.' },
      { q: 'What is the ₹25 lakh limit on leave encashment?', a: 'Budget 2023 raised the tax exemption cap on leave encashment for private sector employees from ₹3,00,000 to ₹25,00,000. This limit applies cumulatively across all employers during an employee\'s career, not per employer.' },
      { q: 'Can leave encashment be received during employment?', a: 'Yes. Some employers allow partial encashment of accumulated leave during service. However, leave encashment during employment is fully taxable as salary income in India — the Section 10(10AA) exemption only applies to leave encashment received at the time of leaving the job or retirement.' }
    ]
  },
  'fte-calculator': {
    howToUse: [
      'Enter the number of full-time employees.',
      'Enter the number of part-time employees.',
      'Enter the average hours worked per week by part-time employees.',
      'Enter the standard full-time hours per week (default: 40).',
      'FTE count and ACA threshold status are shown.'
    ],
    formula: 'Total FTE = Full-Time Count + (Part-Time Count × Avg PT Hours ÷ Standard FT Hours)',
    formulaNote: 'For US Affordable Care Act (ACA) compliance, 50+ FTE triggers the employer mandate. Part-time hours are annualised (×52 weeks ÷ 12 months) for monthly FTE reporting.',
    pros: ['Shows ACA Applicable Large Employer (ALE) status', 'Works for any standard hours model (40hr, 48hr, etc.)'],
    cons: ['Does not annualise for monthly ACA FTE reporting automatically', 'Seasonal and variable-hours workers need separate averaging'],
    faqs: [
      { q: 'What does FTE mean?', a: 'FTE stands for Full-Time Equivalent. It is a standardized unit of measurement that represents the workload of one full-time employee working a standard week (typically 40 hours). For example, two part-time employees each working 20 hours per week = 1.0 FTE.' },
      { q: 'How do I calculate FTE?', a: 'Formula: Total FTE = Full-Time Employee Count + (Part-Time Employee Count × Average Part-Time Hours Per Week ÷ Standard Full-Time Hours Per Week). Example: 5 full-time + (10 part-time × 20 hrs ÷ 40 hrs) = 5 + 5 = 10.0 FTE.' },
      { q: 'Why does FTE matter for ACA compliance in the US?', a: 'Under the US Affordable Care Act (ACA), employers with 50 or more Full-Time Equivalents are classified as Applicable Large Employers (ALEs) and must offer health insurance to full-time employees or face penalties. The FTE count is calculated monthly using the IRS method.' },
      { q: 'What is the standard number of hours for 1.0 FTE?', a: 'In the US, 1.0 FTE is typically defined as 40 hours per week (2,080 hours per year). In the UK, it is often 37.5 hours per week. The standard varies by organization and industry — you can set a custom standard hours figure in this calculator.' },
      { q: 'How is FTE used in workforce budgeting?', a: 'FTE is the standard unit for headcount budgeting because it normalizes part-time, contract, and full-time employees onto a single comparable scale. HR and finance teams use FTE counts to set departmental headcount budgets, calculate labor cost per FTE, and plan future hiring needs.' }
    ]
  },
  'utilization-rate-calculator': {
    howToUse: [
      'Enter the total billable hours worked in the period.',
      'Enter the total available hours (e.g. 160 for a typical 40hr × 4-week month).',
      'The utilization rate, benchmark status, and non-billable hours are shown.'
    ],
    formula: 'Utilization Rate = (Billable Hours ÷ Available Hours) × 100',
    formulaNote: 'Professional services firms typically target 75–85% utilization. Below 60% is considered low; above 90% risks employee burnout.',
    pros: ['Direct input from any timesheet system', 'Benchmark status included'],
    cons: ['Does not account for planned leave or holidays in available hours', 'Realization rate (billed vs. collected) is a separate metric'],
    faqs: [
      { q: 'What is a good employee utilization rate?', a: 'For professional services firms (consulting, law, agencies), a utilization rate of 75–85% is generally considered healthy. Below 60% suggests significant unused capacity; above 90% is a burnout risk. The ideal target varies by role — senior partners often have lower utilization targets due to business development time.' },
      { q: 'How do I calculate utilization rate?', a: 'Formula: Utilization Rate = (Billable Hours ÷ Available Hours) × 100. Example: An employee works 130 billable hours in a month with 160 total available hours. Utilization = (130 ÷ 160) × 100 = 81.25%.' },
      { q: 'What is the difference between utilization rate and productivity?', a: 'Utilization rate measures the proportion of time spent on billable or revenue-generating work. Productivity measures output quality and quantity relative to input. A highly utilized employee is not necessarily productive if the work quality is poor. Both metrics are needed for a complete performance picture.' },
      { q: 'What hours should be included in available hours?', a: 'Available hours should represent the total hours an employee is contracted to work, excluding scheduled PTO, public holidays, and pre-approved leave. A typical full-time employee has 160 available hours per month (40hrs/week × 4 weeks). Adjust for actual working days in any given month.' },
      { q: 'How do agencies track utilization rate?', a: 'Most agencies use time-tracking software (e.g., Harvest, Toggl, Clockify) where employees log time against client projects (billable) and internal work (non-billable). Utilization is then automatically calculated by dividing logged billable hours by total logged hours or contracted hours.' }
    ]
  },
  'billable-hours-calculator': {
    howToUse: [
      'Enter the total billable hours worked.',
      'Enter the billing rate per hour.',
      'Enter your overhead percentage (admin, rent, etc.).',
      'Enter any write-off or discount percentage.',
      'Net realized revenue is shown after all deductions.'
    ],
    formula: 'Net Revenue = (Hours × Rate) × (1 − Overhead%) × (1 − Write-Off%)',
    formulaNote: 'Overhead typically runs 15–35% for professional services. Write-offs account for discounts given to clients and unbilled time. Net revenue is your actual realized income.',
    pros: ['Models both overhead and write-off impact together', 'Shows effective realized rate per hour'],
    cons: ['Does not model blended rates across team members', 'Does not include non-billable overhead recovery fees'],
    faqs: [
      { q: 'How do I calculate revenue from billable hours?', a: 'Gross Revenue = Billable Hours × Billing Rate. Net Revenue then deducts overhead costs and write-offs: Net Revenue = Gross Revenue × (1 − Overhead%) × (1 − Write-Off%). Example: 150 hours at $150/hr = $22,500 gross. With 20% overhead and 5% write-off: $22,500 × 0.80 × 0.95 = $17,100 net.' },
      { q: 'What is a typical overhead rate for consulting or agency work?', a: 'Overhead rates for professional services firms typically range from 15–35%. Boutique agencies and solo consultants can be as low as 10–15%. Large firms with significant office space, support staff, and technology costs often run 30–40% overhead. Tracking your actual overhead rate against industry norms is essential for pricing profitably.' },
      { q: 'What is a write-off in billable hours?', a: 'A write-off occurs when a firm decides not to charge a client for time already worked — for example, due to scope creep, quality issues, or a courtesy discount. Write-off rates of 5–10% are common in law and consulting. High write-off rates signal either poor project scoping or underpricing.' },
      { q: 'What is the effective realized rate per hour?', a: 'The effective realized rate is your net revenue divided by the total hours worked. It shows how much you actually earn per hour after overhead and write-offs. For example, if you billed 150 hours at $150 and your net revenue after deductions is $17,100, your effective realized rate is $17,100 ÷ 150 = $114/hr.' },
      { q: 'How many billable hours should a consultant work per year?', a: 'An independent consultant or agency employee with a 75–80% utilization target working 2,080 hours per year (52 weeks × 40hrs) would have approximately 1,560–1,664 billable hours annually. Many consultants realistically bill 1,200–1,400 hours per year when accounting for sales, admin, and professional development time.' }
    ]
  },
  'project-cost-calculator': {
    howToUse: [
      'Enter the base project cost.',
      'Set your target margin percentage.',
      'Enter the applicable tax rate.',
      'Add a contingency buffer percentage for risk.',
      'The total project cost and breakdown are shown.'
    ],
    formula: 'Total = Base × (1 + Margin%) × (1 + Tax%) × (1 + Contingency%)',
    formulaNote: 'Applying margin before tax ensures the markup covers your full cost. Contingency is added last as a buffer above the final priced amount.',
    pros: ['Sequential application of margin, tax, and contingency', 'Shows each component\'s contribution'],
    cons: ['Assumes a simple multiplicative model — complex project cost structures may need a detailed bottom-up estimate'],
    faqs: [
      { q: 'How do I calculate total project cost?', a: 'Use this sequential formula: Total = Base Cost × (1 + Margin%) × (1 + Tax%) × (1 + Contingency%). Apply margin first, then tax on top of the margin-included price, then contingency as a final buffer. Example: $50,000 base with 20% margin, 10% tax, 5% contingency = $50,000 × 1.20 × 1.10 × 1.05 = $69,300.' },
      { q: 'What is a typical contingency budget for a project?', a: 'Most project management frameworks recommend a contingency reserve of 5–15% of the total project cost. Simple, well-defined projects typically use 5–10%. Complex, novel, or high-uncertainty projects may justify 15–20%. Agile projects often use a rolling contingency budget per sprint.' },
      { q: 'What is the difference between project cost and project budget?', a: 'Project cost is the actual expenditure — what you spend. Project budget is the approved financial plan — what you are allowed to spend. The budget includes cost estimates, contingency reserves, and management reserves. A project can be under budget but over on specific cost line items.' },
      { q: 'How is profit margin calculated on a project?', a: 'Gross Profit Margin = ((Revenue − Cost) ÷ Revenue) × 100. For project pricing, you add the desired margin to cost: Price = Cost ÷ (1 − Margin%). For example, to achieve a 20% margin on a $40,000 cost project: Price = $40,000 ÷ 0.80 = $50,000 (giving a $10,000 profit, 20% of $50,000).' },
      { q: 'Should I apply tax before or after margin?', a: 'Apply margin to the base cost first to establish the selling price, then apply tax to the margin-inclusive price. This ensures the tax is charged on the full transaction value and the margin covers the pre-tax cost. Adding contingency last buffers against uncertainty above the fully costed, taxed amount.' }
    ]
  },
  'completion-percentage-calculator': {
    howToUse: [
      'Enter the number of tasks, items, or units completed.',
      'Enter the total number of tasks, items, or units.',
      'Completion percentage and status are displayed.'
    ],
    formula: '(Completed ÷ Total) × 100',
    formulaNote: 'Simple percentage-complete is the most widely used EVM metric for work packages where effort is evenly distributed.',
    pros: ['Instant and universally applicable', 'Status label (Early Stage / In Progress / On Track / Complete) helps at a glance'],
    cons: ['Does not account for task weighting — a large and a small task count equally'],
    faqs: [
      { q: 'How do I calculate completion percentage?', a: 'Formula: Completion % = (Completed Items ÷ Total Items) × 100. Example: 75 tasks completed out of 100 total = (75 ÷ 100) × 100 = 75% complete. This is the standard percent-complete metric used in Earned Value Management (EVM) per PMI PMBOK.' },
      { q: 'What is the difference between completion percentage and progress percentage?', a: 'They are typically the same calculation. “Completion percentage” usually refers to deliverables or milestones completed, while “progress percentage” can also refer to time elapsed or effort expended. In EVM, percent complete is based on work performed vs. planned scope, not time.' },
      { q: 'How do I account for partially completed tasks?', a: 'For a simple calculator, partially complete tasks are often counted as 0% (not started) or 50% (in progress). A more precise approach is to weight each task by its estimated effort. This tool uses a simple count model — for weighted completion, you would need to calculate a weighted average manually.' },
      { q: 'What does “Early Stage” vs “On Track” status mean?', a: 'The status labels are based on completion percentage ranges: Early Stage (0–24%), In Progress (25–49%), On Track (50–99%), and Complete (100%). These help managers quickly assess at-a-glance whether a project or task batch is in its beginning, middle, or near-completion phase.' },
      { q: 'Can I use this for project milestone tracking?', a: 'Yes. Enter your total number of milestones as “Total” and your completed milestones as “Completed.” You can also use it for sprint story points (e.g., 45 story points completed out of 60 planned = 75% complete), KPI achievement, or any ratio-based progress metric.' }
    ]
  },
  'schedule-variance-calculator': {
    howToUse: [
      'Enter Earned Value (EV) — the budgeted cost of work performed.',
      'Enter Planned Value (PV) — the budgeted cost of work scheduled.',
      'Schedule Variance (SV = EV − PV) and Schedule Performance Index (SPI = EV ÷ PV) are shown.'
    ],
    formula: 'SV = EV − PV  |  SPI = EV ÷ PV',
    formulaNote: 'A positive SV means ahead of schedule. SPI > 1 means you\'re completing more work than planned for the cost spent. Both are core Earned Value Management (EVM) metrics per PMI PMBOK.',
    pros: ['Industry-standard EVM metrics (PMI PMBOK)', 'Immediate insight into schedule health'],
    cons: ['EVM requires careful baseline planning to be meaningful', 'SV tends toward zero at project end regardless of efficiency'],
    faqs: [
      { q: 'What is Schedule Variance (SV) in project management?', a: 'Schedule Variance (SV) is an Earned Value Management metric that shows how much ahead or behind schedule a project is in dollar (or budget) terms. SV = Earned Value (EV) − Planned Value (PV). A positive SV means you have completed more work than planned; a negative SV means you are behind schedule.' },
      { q: 'What is the Schedule Performance Index (SPI)?', a: 'SPI = EV ÷ PV. An SPI of 1.0 means work is being completed exactly as planned. SPI > 1.0 means you are ahead of schedule (completing more work per budget unit than planned). SPI < 1.0 means you are behind. An SPI of 0.85 means you are only completing 85 cents of planned work for every dollar spent.' },
      { q: 'How is Earned Value (EV) calculated?', a: 'EV = Budget at Completion (BAC) × Percent Complete. Example: If a project has a $100,000 budget (BAC) and you are 45% complete, EV = $100,000 × 0.45 = $45,000. This represents the budgeted cost of the work actually performed to date.' },
      { q: 'What is Planned Value (PV)?', a: 'Planned Value (PV) is the budgeted cost of work scheduled to be completed by a specific point in time. It comes from the project baseline schedule. If you planned to complete 50% of a $100,000 project by month 3, then PV at month 3 = $50,000.' },
      { q: 'Can Schedule Variance be used without EVM?', a: 'SV in its strict EVM form requires a performance measurement baseline with Earned Value tracking. However, a simplified version can be calculated as: Planned Completion % − Actual Completion % (e.g., planned 50% by now, actual 45% = schedule variance of −5%). This is less rigorous but directionally useful for simple projects.' }
    ]
  },
  'time-difference-calculator': {
    howToUse: [
      'Enter the start date and time.',
      'Enter the end date and time.',
      'The exact duration broken into months, days, hours, and minutes is shown.',
      'Total values in days, hours, minutes, and seconds are also displayed.'
    ],
    formula: 'Δt = End DateTime − Start DateTime',
    formulaNote: 'The month and day breakdown accounts for variable month lengths. The total seconds, minutes, hours, and days are exact.',
    pros: ['Handles cross-month and cross-year spans accurately', 'Shows both human-readable breakdown and total units'],
    cons: ['Does not account for timezone differences between the two times — both must be in the same timezone']
  },
  'unix-timestamp-converter': {
    howToUse: [
      'To convert Epoch → Human: paste any Unix timestamp (seconds or milliseconds) into the Epoch field.',
      'To convert Human → Epoch: select a date and time in the Date/Time field.',
      'Both directions work simultaneously. The tool auto-detects milliseconds vs. seconds.'
    ],
    formula: 'Date = new Date(timestamp × 1000)  |  Timestamp = Date.getTime() / 1000',
    formulaNote: 'Unix time counts seconds since 1970-01-01T00:00:00 UTC (the "Unix Epoch"). Millisecond-precision timestamps are > 10¹⁰.',
    pros: ['Bidirectional conversion in one form', 'Auto-detects seconds vs. milliseconds precision', 'Shows ISO 8601, UTC, and local time formats'],
    cons: ['32-bit Unix timestamps overflow in 2038 — this tool uses 64-bit JavaScript Date, so no overflow']
  },
  'iso-time-formatter': {
    howToUse: [
      'Enter any date and time.',
      'Optionally specify the target IANA timezone.',
      'All ISO 8601 variants are shown: full datetime, UTC, date-only, week date, and ordinal date.'
    ],
    formula: 'Full: YYYY-MM-DDTHH:mm:ss±HH:MM  |  Week: YYYY-Www-D  |  Ordinal: YYYY-DDD',
    formulaNote: 'ISO 8601 is the international standard (ISO/IEC 8601:2019) used in APIs, databases, and machine-readable interchange formats.',
    pros: ['All 5 ISO 8601 formats in one click', 'Supports any IANA timezone for offset calculation'],
    cons: ['Week numbering follows ISO 8601 (Mon=day 1) — differs from US week numbering']
  },
  'gmt-timestamp': {
    howToUse: [
      'No input needed — the current UTC time and Unix timestamp refresh automatically every second.',
      'The current local equivalent time in 10 major timezones is shown.',
      'Use the Refresh button to force an immediate update.'
    ],
    formula: 'UTC = Local Time − UTC Offset',
    formulaNote: 'GMT (Greenwich Mean Time) and UTC (Coordinated Universal Time) are effectively equivalent for most practical purposes. UTC is the modern successor to GMT.',
    pros: ['Live seconds-precision display', 'Instant reference for 10 major world timezones'],
    cons: ['Accuracy depends on your device\'s system clock']
  },
  'age-calculator': {
    howToUse: [
      'Enter the date of birth.',
      'Optionally set a custom "Calculate As Of" date for age at a specific point in time.',
      'Age in years, months, and days is shown, along with total days lived and days until the next birthday.'
    ],
    formula: 'Age = Current Date − Date of Birth (accounting for leap years and variable month lengths)',
    formulaNote: 'The calculator accounts for leap years, variable month lengths, and whether the current day is before or after the birth day in the current month.',
    pros: ['Exact breakdown in years, months, and days', 'Supports custom "as of" date for historical or legal calculations', 'Shows next birthday countdown'],
    cons: ['Does not account for legal age definitions that differ by jurisdiction']
  },
  'age-difference-calculator': {
    howToUse: [
      'Enter the date of birth for Person 1.',
      'Enter the date of birth for Person 2.',
      'The age difference in years, months, and days is shown, along with total difference in days.'
    ],
    formula: 'Diff = Older DOB − Younger DOB (signed, in Y/M/D and total days)',
    formulaNote: 'Automatically detects which date is older. Result shows exact calendar difference.',
    pros: ['Handles any date pair — past or future', 'Shows both breakdown and total days'],
    cons: ['Does not account for time-of-day within the birth date']
  },
  'mailto-link-generator': {
    howToUse: [
      'Enter the recipient email address in the To field.',
      'Optionally add CC, BCC, Subject, and Body.',
      'Copy the generated mailto: link and use it in HTML, email signatures, or marketing materials.',
      'The HTML anchor tag version is also generated for direct embedding.'
    ],
    formula: 'mailto:to?cc=&bcc=&subject=&body= (RFC 6068 encoded)',
    formulaNote: 'Mailto links follow RFC 6068. All parameters are URL-encoded per the RFC. Body line breaks should use %0D%0A for maximum client compatibility.',
    pros: ['Standards-compliant RFC 6068 encoding', 'Generates both raw link and HTML anchor tag', 'Works with Gmail, Outlook, Apple Mail, and all major clients'],
    cons: ['Mailto links are visible in page source — avoid embedding sensitive addresses on public pages']
  },
  'add-to-calendar-link-generator': {
    howToUse: [
      'Enter the event title, start date/time, end date/time, location, and description.',
      'Four calendar links are generated instantly: Google Calendar, Outlook Web, Yahoo Calendar, and a note about .ICS download.',
      'Share these links in emails, on websites, or in social media posts.'
    ],
    formula: 'Google: calendar.google.com/render?action=TEMPLATE&dates=...  |  Outlook: outlook.live.com/deeplink/compose?...',
    formulaNote: 'Each calendar platform uses its own URL scheme. All parameters are RFC 3986 URI-encoded. The .ICS format (RFC 5545) is the universal iCalendar standard.',
    pros: ['Covers all 4 major calendar platforms in one form', 'No API key required — pure URL encoding', 'Works in any browser without installation'],
    cons: ['Google Calendar link requires the user to be signed in to Google', 'All-day events require a different date format (YYYYMMDD without time)']
  },
  'time-zone-converter': {
    howToUse: [
      'Enter the source time (HH:MM format).',
      'Select the source timezone using the IANA identifier (e.g., Asia/Karachi, America/New_York).',
      'Add up to 3 target timezones.',
      'Equivalent times in all selected zones are shown instantly.'
    ],
    formula: 'Target Time = Source Time converted via Intl.DateTimeFormat with IANA timezone',
    formulaNote: 'Uses the browser\'s native Intl.DateTimeFormat API with IANA timezone identifiers. Automatically handles DST transitions for all supported zones.',
    pros: ['Handles DST automatically via IANA database', 'Works for all IANA-registered timezones (600+)', 'No external library dependency'],
    cons: ['Limited to time-of-day conversion — use the Date / Time Difference calculator for date-spanning durations']
  }
};
