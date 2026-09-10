import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface CompletionResult {
  completionPct: number;
  completedTasks: number;
  remainingTasks: number;
  totalTasks: number;
  // Date-based (optional)
  hasDates: boolean;
  totalDurationDays: number | null;
  elapsedDays: number | null;
  timeElapsedPct: number | null;
  daysRemaining: number | null;
  projectedFinishDate: Date | null;
  isOverdue: boolean;
  // Plan-based comparison
  hasPlan: boolean;
  plannedPct: number | null;
  varianceFromPlan: number | null;
  // Overall schedule status
  scheduleStatus: 'ahead' | 'on-track' | 'behind' | 'complete' | 'not-started' | null;
  scheduleStatusLabel: string;
  statusClass: 'low' | 'moderate' | 'high' | 'on-track';
}

@Component({
  selector: 'app-completion-percentage-calculator',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, DecimalPipe, DatePipe],
  templateUrl: './completion-percentage-calculator.component.html',
  styleUrls: ['./completion-percentage-calculator.component.scss']
})
export class CompletionPercentageCalculatorComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private title      = inject(Title);
  private meta       = inject(Meta);
  private csvService = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;
  result: CompletionResult | null = null;
  formError: string | null = null;
  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('schedule-variance-calculator'),
    getToolBySlug('project-cost-calculator'),
    getToolBySlug('billable-hours-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'What is project completion percentage?',
      a: 'Project completion percentage (also called "% Complete") is the proportion of total work units (tasks, milestones, hours, or deliverables) that have been finished relative to the total planned scope. It is the most fundamental project health metric and feeds into Earned Value (EV) calculations in formal project management frameworks.'
    },
    {
      q: 'How is completion % different from schedule variance?',
      a: 'Completion % tells you how much of the work is done. Schedule Variance (SV = EV − PV) tells you how much that completed work is worth relative to what should have been done by now. Completion % is a work quantity measure; SV is a financial/value measure. Both are needed for a complete Earned Value Management (EVM) picture — this calculator combines both when you provide schedule dates.'
    },
    {
      q: 'What does the Projected Finish Date calculation assume?',
      a: 'The projected finish date assumes your current completion velocity (tasks completed ÷ days elapsed) will continue at the same rate until the end. This is the simplest reliable forecast method. For projects with variable velocity, use a rolling 2-week average completion rate for better accuracy. The projection is only available when both Start Date and Due Date are provided.'
    },
    {
      q: 'What if completion % is much higher than time elapsed %?',
      a: 'If your completion % significantly exceeds time elapsed %, your project is ahead of schedule — completing work faster than the baseline plan anticipated. Verify that the % complete estimate is accurate (teams often over-estimate completion early in a project). If accurate, consider whether resources could be reallocated or the deadline could be safely moved up.'
    },
    {
      q: 'What does Variance from Planned % mean?',
      a: 'If you enter a "Planned Completion %" — the % of work that should have been done by today according to your project plan — the calculator compares it against your actual completion % to give the variance. A positive variance means you are ahead of your planned milestone. A negative variance means you are behind your plan.'
    },
    {
      q: 'How do I handle tasks with different complexity levels?',
      a: 'For this calculator, all tasks are treated as equal (simple count). For weighted completion %, multiply each task by its effort weight (e.g., a 3-day task counts as 3, a 1-day task counts as 1). Sum the weighted completed values ÷ total weighted values × 100. This gives a more accurate picture for heterogeneous task lists, but requires a more detailed time-tracking system.'
    }
  ];

  ngOnInit(): void {
    this.buildForm();
    this.updateSeo();
    this.injectJsonLd();
  }

  private buildForm(): void {
    this.form = this.fb.group({
      totalTasks:       [null, [Validators.required, Validators.min(1)]],
      completedTasks:   [null, [Validators.required, Validators.min(0)]],
      plannedPct:       [null, [Validators.min(0), Validators.max(100)]],
      startDate:        [null],
      dueDate:          [null],
    });
  }

  /** Parse 'YYYY-MM-DD' string into a local-midnight Date (no timezone shift) */
  private parseDate(str: string): Date {
    const [y, m, d] = str.split('-').map(Number);
    return new Date(y, m - 1, d);
  }

  calculate(): void {
    this.formError = null;
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const v = this.form.getRawValue();

    // Edge case: completed > total
    if (v.completedTasks > v.totalTasks) {
      this.formError = `Completed tasks (${v.completedTasks}) cannot exceed total tasks (${v.totalTasks}).`;
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const completionPct  = (v.completedTasks / v.totalTasks) * 100;
    const remainingTasks = v.totalTasks - v.completedTasks;

    // ── Date-based calculations (optional) ──────────────────────
    const hasDates = !!(v.startDate && v.dueDate);
    let totalDurationDays: number | null = null;
    let elapsedDays: number | null       = null;
    let timeElapsedPct: number | null    = null;
    let daysRemaining: number | null     = null;
    let projectedFinishDate: Date | null = null;
    let isOverdue                        = false;

    if (hasDates) {
      const start   = this.parseDate(v.startDate);
      const due     = this.parseDate(v.dueDate);
      const today   = new Date();
      today.setHours(0, 0, 0, 0);

      // Validate: start must be before due
      if (start >= due) {
        this.formError = 'Start date must be before the due date.';
        this.result = null;
        this.cdr.markForCheck();
        return;
      }

      const MS_PER_DAY     = 1000 * 60 * 60 * 24;
      totalDurationDays    = Math.round((due.getTime() - start.getTime()) / MS_PER_DAY);
      elapsedDays          = Math.max(0, Math.round((today.getTime() - start.getTime()) / MS_PER_DAY));
      const clampedElapsed = Math.min(elapsedDays, totalDurationDays);
      timeElapsedPct       = (clampedElapsed / totalDurationDays) * 100;
      daysRemaining        = Math.round((due.getTime() - today.getTime()) / MS_PER_DAY);
      isOverdue            = daysRemaining < 0;

      // Projected finish: velocity = completed / elapsed; finish = today + remaining / velocity
      if (v.completedTasks > 0 && elapsedDays > 0 && remainingTasks > 0) {
        const velocity         = v.completedTasks / elapsedDays; // tasks per day
        const daysToFinish     = remainingTasks / velocity;
        projectedFinishDate    = new Date(today.getTime() + daysToFinish * MS_PER_DAY);
      } else if (completionPct === 100) {
        projectedFinishDate = today;
      }
    }

    // ── Plan-based comparison (optional) ───────────────────────
    const hasPlan          = v.plannedPct !== null && v.plannedPct !== undefined && v.plannedPct !== '';
    const plannedPct       = hasPlan ? v.plannedPct : null;
    const varianceFromPlan = hasPlan ? completionPct - plannedPct! : null;

    // ── Overall schedule status ──────────────────────────────────
    let scheduleStatus: CompletionResult['scheduleStatus'] = null;
    let scheduleStatusLabel = '';
    let statusClass: CompletionResult['statusClass'] = 'on-track';

    if (completionPct === 100)      { scheduleStatus = 'complete';   scheduleStatusLabel = '✅ Complete';       statusClass = 'low'; }
    else if (completionPct === 0)   { scheduleStatus = 'not-started'; scheduleStatusLabel = '⏳ Not Started';   statusClass = 'moderate'; }
    else if (hasPlan && varianceFromPlan !== null) {
      if (varianceFromPlan > 2)     { scheduleStatus = 'ahead';    scheduleStatusLabel = '🟢 Ahead of Plan';   statusClass = 'low'; }
      else if (varianceFromPlan >= -2) { scheduleStatus = 'on-track'; scheduleStatusLabel = '🟡 On Plan';      statusClass = 'on-track'; }
      else                          { scheduleStatus = 'behind';   scheduleStatusLabel = '🔴 Behind Plan';    statusClass = 'high'; }
    } else if (hasDates && timeElapsedPct !== null) {
      const gap = completionPct - timeElapsedPct;
      if (gap > 5)                  { scheduleStatus = 'ahead';    scheduleStatusLabel = '🟢 Ahead of Schedule'; statusClass = 'low'; }
      else if (gap >= -5)           { scheduleStatus = 'on-track'; scheduleStatusLabel = '🟡 On Schedule';    statusClass = 'on-track'; }
      else                          { scheduleStatus = 'behind';   scheduleStatusLabel = '🔴 Behind Schedule'; statusClass = 'high'; }
    }

    this.result = {
      completionPct, completedTasks: v.completedTasks,
      remainingTasks, totalTasks: v.totalTasks,
      hasDates, totalDurationDays, elapsedDays,
      timeElapsedPct, daysRemaining, projectedFinishDate, isOverdue,
      hasPlan, plannedPct, varianceFromPlan,
      scheduleStatus, scheduleStatusLabel, statusClass
    };
    this.cdr.markForCheck();
  }

  reset(): void {
    this.form.reset();
    this.result = null;
    this.formError = null;
    this.cdr.markForCheck();
  }

  downloadCsv(): void {
    if (!this.result) return;
    const r = this.result;
    const rows: (string | number)[][] = [
      ['Total Tasks', r.totalTasks],
      ['Completed Tasks', r.completedTasks],
      ['Remaining Tasks', r.remainingTasks],
      ['Completion Percentage', r.completionPct.toFixed(2) + '%'],
    ];
    if (r.hasDates) {
      rows.push(['Total Duration (Days)', r.totalDurationDays ?? ''],
                ['Elapsed Days', r.elapsedDays ?? ''],
                ['Time Elapsed (%)', r.timeElapsedPct !== null ? r.timeElapsedPct.toFixed(2) + '%' : ''],
                ['Days Remaining', r.daysRemaining ?? ''],
                ['Overdue', r.isOverdue ? 'Yes' : 'No'],
                ['Projected Finish Date', r.projectedFinishDate ? r.projectedFinishDate.toLocaleDateString() : 'N/A']);
    }
    if (r.hasPlan) {
      rows.push(['Planned Completion %', r.plannedPct !== null ? r.plannedPct + '%' : ''],
                ['Variance from Plan', r.varianceFromPlan !== null ? r.varianceFromPlan.toFixed(2) + '%' : '']);
    }
    if (r.scheduleStatus) rows.push(['Schedule Status', r.scheduleStatusLabel]);
    this.csvService.download('completion-percentage-report.csv', ['Metric', 'Value'], rows);
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
    const t = 'Free Completion Percentage Calculator — Project Progress Tool | Brisk People';
    const d = 'Calculate project or task completion percentage instantly. Optional: add start/due dates for time elapsed %, days remaining, projected finish, and schedule status. Free, no sign-up.';
    this.title.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'completion percentage calculator, project completion calculator, task completion %, project progress tool, % complete calculator' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:type',        content: 'website' });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-workforce-tools/completion-percentage-calculator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',      content: t });
    this.meta.updateTag({ name: 'twitter:description', content: d });
  }

  private injectJsonLd(): void {
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Completion Percentage Calculator', applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        description: 'Free project completion percentage calculator with schedule status, projected finish date, and plan variance.',
        url: 'https://www.briskpeople.com/free-workforce-tools/completion-percentage-calculator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',                     item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Workforce Tools',     item: 'https://www.briskpeople.com/free-workforce-tools' },
          { '@type': 'ListItem', position: 3, name: 'Completion Percentage Calculator', item: 'https://www.briskpeople.com/free-workforce-tools/completion-percentage-calculator' }
        ]
      },
      {
        '@context': 'https://schema.org', '@type': 'FAQPage',
        mainEntity: this.faqs.map(f => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } }))
      }
    ];
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
