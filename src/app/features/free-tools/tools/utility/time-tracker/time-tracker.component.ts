import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface TimeEntry {
  id:        string;
  label:     string;
  startMs:   number;   // Date.now() at start
  endMs:     number;   // Date.now() at stop
  duration:  number;   // ms
}

const LS_KEY_SESSIONS  = 'bp_timetracker_sessions_v1';
const LS_KEY_ACTIVE    = 'bp_timetracker_active_v1';

@Component({
  selector: 'app-time-tracker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './time-tracker.component.html',
  styleUrls: ['./time-tracker.component.scss']
})
export class TimeTrackerComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private csvSvc     = inject(CsvDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  form!: FormGroup;

  /** Whether timer is currently running */
  isRunning = false;

  /** Live elapsed time in ms (updated every second) */
  elapsedMs = 0;

  /** Timestamp when the current session started (Date.now()) */
  private sessionStartMs = 0;

  /** setInterval handle — MUST be cleared in ngOnDestroy */
  private intervalId: ReturnType<typeof setInterval> | null = null;

  /** Completed task sessions */
  sessions: TimeEntry[] = [];

  openFaqIndex: number | null = null;
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('timetable-generator'),
    getToolBySlug('billable-hours-calculator'),
    getToolBySlug('time-difference-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'How does the timer stay accurate?',
      a: 'The timer uses Date.now() differences rather than counting interval ticks. The setInterval fires every second to update the display, but the actual elapsed duration is always computed as Date.now() - sessionStartTime. This makes it immune to tab throttling or system clock drift that would cause tick-counting timers to desynchronize over long sessions.'
    },
    {
      q: 'Are my sessions saved if I accidentally close the tab?',
      a: 'Yes. The session start timestamp and current task label are saved to localStorage when you start the timer. If you close the tab while the timer is running and reopen the page, the timer will resume from where it was left off and show the correct elapsed time. Completed sessions are also saved to localStorage.'
    },
    {
      q: 'How do I export my time log?',
      a: 'Click the "Export CSV" button to download all completed sessions as a CSV file. Each row contains the task label, start time, end time, and duration in hours and minutes. You can open this in Excel, Google Sheets, or any CSV-compatible tool.'
    },
    {
      q: 'Can I track multiple tasks at the same time?',
      a: 'This tool supports one active timer at a time (like a stopwatch). To track multiple tasks simultaneously, open the tool in multiple browser tabs. Each tab maintains its own independent timer and session log in localStorage.'
    }
  ];

  ngOnInit(): void {
    this.form = this.fb.group({
      label: ['', [Validators.required, Validators.maxLength(100)]]
    });
    this.loadFromStorage();
    this.updateSeo();
    this.injectJsonLd();
  }

  // ── Timer Controls ────────────────────────────────────────────────────────

  start(): void {
    if (this.isRunning || this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    if (!isPlatformBrowser(this.platformId)) return;

    this.sessionStartMs = Date.now();
    this.elapsedMs = 0;
    this.isRunning = true;

    // Persist active session in case tab is closed
    this.persistActive();

    // Update display every 1000ms — ACCURATE via Date.now() diff
    this.intervalId = setInterval(() => {
      this.elapsedMs = Date.now() - this.sessionStartMs;
      this.cdr.markForCheck();
    }, 1000);

    this.cdr.markForCheck();
  }

  stop(): void {
    if (!this.isRunning || !isPlatformBrowser(this.platformId)) return;

    this.clearInterval();

    const endMs    = Date.now();
    const duration = endMs - this.sessionStartMs;

    const entry: TimeEntry = {
      id:       crypto.randomUUID(),
      label:    this.form.value.label,
      startMs:  this.sessionStartMs,
      endMs,
      duration
    };

    this.sessions = [entry, ...this.sessions];
    this.isRunning = false;
    this.elapsedMs = 0;

    // Clear active session, save sessions
    this.saveSessionsToStorage();
    this.clearActive();

    this.form.reset();
    this.cdr.markForCheck();
  }

  discard(): void {
    if (!this.isRunning) return;
    this.clearInterval();
    this.isRunning = false;
    this.elapsedMs = 0;
    this.clearActive();
    this.form.reset();
    this.cdr.markForCheck();
  }

  deleteSession(id: string): void {
    this.sessions = this.sessions.filter(s => s.id !== id);
    this.saveSessionsToStorage();
    this.cdr.markForCheck();
  }

  clearAllSessions(): void {
    this.sessions = [];
    this.saveSessionsToStorage();
    this.cdr.markForCheck();
  }

  // ── Formatting ────────────────────────────────────────────────────────────

  formatElapsed(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h  = Math.floor(totalSec / 3600);
    const m  = Math.floor((totalSec % 3600) / 60);
    const s  = totalSec % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  formatDate(ms: number): string {
    if (!isPlatformBrowser(this.platformId)) return '';
    return new Date(ms).toLocaleString();
  }

  totalDuration(sessions: TimeEntry[]): string {
    const totalMs = sessions.reduce((acc, s) => acc + s.duration, 0);
    return this.formatElapsed(totalMs);
  }

  // ── CSV Export ────────────────────────────────────────────────────────────

  exportCsv(): void {
    const headers = ['Task / Label', 'Start Time', 'End Time', 'Duration (HH:MM:SS)'];
    const rows = this.sessions.map(s => [
      s.label,
      new Date(s.startMs).toISOString(),
      new Date(s.endMs).toISOString(),
      this.formatElapsed(s.duration)
    ]);
    this.csvSvc.download('time-tracker.csv', headers, rows);
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  getFieldError(field: string): string | null {
    const c = this.form.get(field);
    if (!c?.invalid || !c?.touched) return null;
    if (c.hasError('required'))  return 'Enter a task name before starting the timer.';
    if (c.hasError('maxlength')) return `Max ${c.errors?.['maxlength']?.requiredLength} characters.`;
    return 'Invalid value.';
  }

  // ── LocalStorage ──────────────────────────────────────────────────────────

  private saveSessionsToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(LS_KEY_SESSIONS, JSON.stringify(this.sessions)); } catch {}
  }

  private persistActive(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LS_KEY_ACTIVE, JSON.stringify({
        label: this.form.value.label,
        startMs: this.sessionStartMs
      }));
    } catch {}
  }

  private clearActive(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.removeItem(LS_KEY_ACTIVE); } catch {}
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      // Load completed sessions
      const sessionsRaw = localStorage.getItem(LS_KEY_SESSIONS);
      if (sessionsRaw) this.sessions = JSON.parse(sessionsRaw);

      // Resume active session if it exists
      const activeRaw = localStorage.getItem(LS_KEY_ACTIVE);
      if (activeRaw) {
        const active = JSON.parse(activeRaw) as { label: string; startMs: number };
        this.form.patchValue({ label: active.label });
        this.sessionStartMs = active.startMs;
        this.elapsedMs = Date.now() - this.sessionStartMs;
        this.isRunning = true;

        this.intervalId = setInterval(() => {
          this.elapsedMs = Date.now() - this.sessionStartMs;
          this.cdr.markForCheck();
        }, 1000);
      }
    } catch {
      this.sessions = [];
    }
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  private clearInterval(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private updateSeo(): void {
    const t = 'Free Online Time Tracker — Stopwatch & Session Logger | BriskPeople';
    const d = 'Track time with a browser-based stopwatch. Log task sessions, auto-save to browser storage, and export to CSV. Free time tracker — no signup required.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'time tracker, online stopwatch, task time tracker, browser time logger, free time tracking tool, session logger' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/time-tracker' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Time Tracker', applicationCategory: 'ProductivityApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/time-tracker'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Time Tracker', item: 'https://www.briskpeople.com/free-tools/time-tracker' }
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

  // ── CRITICAL: Destroy interval to prevent memory leak ──────────────────────
  ngOnDestroy(): void {
    this.clearInterval();   // ← CRITICAL: prevents setInterval memory leak
    this.jsonLdScript?.remove();
    this.titleSvc.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}
