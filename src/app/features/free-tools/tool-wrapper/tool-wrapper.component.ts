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

  // ── Educational Content ───────────────────────────────────────────────────

  getEducationalContent(slug: string): EducationalContent {
    return EDUCATIONAL_CONTENT[slug] ?? DEFAULT_EDUCATIONAL_CONTENT;
  }

  // ── SEO ───────────────────────────────────────────────────────────────────

  private updateSeo(tool: ToolConfig): void {
    this.titleService.setTitle(tool.seoTitle);
    this.meta.updateTag({ name: 'description',         content: tool.seoDescription });
    this.meta.updateTag({ name: 'keywords',            content: tool.keywords });
    this.meta.updateTag({ property: 'og:title',        content: tool.seoTitle });
    this.meta.updateTag({ property: 'og:description',  content: tool.seoDescription });
    this.meta.updateTag({ property: 'og:type',         content: 'website' });
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: tool.seoTitle });
    this.meta.updateTag({ name: 'twitter:description', content: tool.seoDescription });
  }

  private injectJsonLd(tool: ToolConfig): void {
    const base = tool.category === 'workforce' ? '/free-workforce-tools' : '/free-tools';
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: tool.title,
      description: tool.seoDescription,
      url: `https://www.briskpeople.com${base}/${tool.slug}`,
      applicationCategory: tool.category === 'workforce' ? 'BusinessApplication' : 'UtilitiesApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      publisher: { '@type': 'Organization', name: 'BriskPeople', url: 'https://www.briskpeople.com' }
    };

    if (this.jsonLdScript) this.jsonLdScript.remove();
    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schema);
    this.document.head.appendChild(this.jsonLdScript);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private tearDown(): void {
    this.formSub?.unsubscribe();
    if (this.liveTimer !== undefined) {
      clearInterval(this.liveTimer);
      this.liveTimer = undefined;
    }
    if (this.jsonLdScript) { this.jsonLdScript.remove(); this.jsonLdScript = null; }
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
    cons: ['Does not distinguish between excused and unexcused absences', 'Should be segmented by department for deeper insights']
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
    cons: ['Treats voluntary resignations and involuntary terminations equally', 'A more precise analysis would segment by departure type']
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
    cons: ['Does not show retention by department, tenure, or role level', 'Best used alongside exit interview data for full context']
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
    cons: ['Does not account for state-level double-time thresholds (e.g., California)', 'Employer taxes (FICA, EPF) are not included in the result']
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
    cons: ['Does not account for complex multi-rate shift blending', 'FLSA regular rate calculations for OT with differentials are more complex']
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
    cons: ['Does not account for PTO carryover caps', 'Waiting periods for new hires are not modelled']
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
    cons: ['Assumes basic salary only; HRA and other allowances form part of full CTC', 'State-level leave encashment rules may differ']
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
    cons: ['Does not annualise for monthly ACA FTE reporting automatically', 'Seasonal and variable-hours workers need separate averaging']
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
    cons: ['Does not account for planned leave or holidays in available hours', 'Realization rate (billed vs. collected) is a separate metric']
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
    cons: ['Does not model blended rates across team members', 'Does not include non-billable overhead recovery fees']
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
    cons: ['Assumes a simple multiplicative model — complex project cost structures may need a detailed bottom-up estimate']
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
    cons: ['Does not account for task weighting — a large and a small task count equally']
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
    cons: ['EVM requires careful baseline planning to be meaningful', 'SV tends toward zero at project end regardless of efficiency']
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
