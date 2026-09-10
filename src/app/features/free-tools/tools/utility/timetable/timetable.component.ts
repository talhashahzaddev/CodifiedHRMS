import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  ChangeDetectorRef, inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, DOCUMENT, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Title, Meta } from '@angular/platform-browser';
import { Subject, fromEvent } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CsvDownloadService } from '../../../services/csv-download.service';
import { BlobDownloadService } from '../../../services/blob-download.service';
import { getToolBySlug, ToolConfig } from '../../../config/tools.config';

export interface TimetableCell {
  subject:     string;
  description: string;
  color:       string;
}

export type TimetableGrid = Record<string, TimetableCell | null>; // key: "dayIdx-hourIdx"

const LS_KEY = 'bp_timetable_v1';

const DAYS  = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const HOURS: string[] = [];
for (let h = 6; h <= 22; h++) {
  HOURS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) HOURS.push(`${String(h).padStart(2, '0')}:30`);
}

const CELL_COLORS = [
  '#e3f2fd', '#e8f5e9', '#fff8e1', '#fce4ec',
  '#f3e5f5', '#e0f7fa', '#fff3e0', '#ede7f6'
];

@Component({
  selector: 'app-timetable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './timetable.component.html',
  styleUrls: ['./timetable.component.scss']
})
export class TimetableComponent implements OnInit, OnDestroy {
  private fb         = inject(FormBuilder);
  private titleSvc   = inject(Title);
  private meta       = inject(Meta);
  private csvSvc     = inject(CsvDownloadService);
  private blobSvc    = inject(BlobDownloadService);
  private cdr        = inject(ChangeDetectorRef);
  private platformId = inject(PLATFORM_ID);
  private document   = inject(DOCUMENT);

  readonly days  = DAYS;
  readonly hours = HOURS;
  readonly cellColors = CELL_COLORS;

  grid: TimetableGrid = {};
  editingKey: string | null = null;
  openFaqIndex: number | null = null;
  editForm!: FormGroup;
  private saveSubject = new Subject<void>();
  private destroy$    = new Subject<void>();
  private jsonLdScript: HTMLScriptElement | null = null;

  readonly relatedTools: ToolConfig[] = [
    getToolBySlug('time-tracker'),
    getToolBySlug('add-to-calendar-link-generator'),
    getToolBySlug('time-difference-calculator'),
  ].filter((t): t is ToolConfig => !!t);

  readonly faqs = [
    {
      q: 'Will my timetable be saved if I close the browser?',
      a: 'Yes. The timetable is automatically saved to your browser\'s localStorage every time you make a change (with a 500ms debounce to avoid excessive writes). When you revisit the page, your timetable is restored instantly. Your data is stored locally on your device only — nothing is sent to any server.'
    },
    {
      q: 'How do I edit or remove a cell?',
      a: 'Click any cell to open the edit panel. You can change the subject, description, and color. To remove a cell\'s content, click the cell and then click "Clear Cell". To remove all cells at once, use the "Clear All" button at the top of the timetable.'
    },
    {
      q: 'How does the PNG export work?',
      a: 'The PNG export uses html2canvas, a JavaScript library that renders the timetable DOM element to an HTML5 Canvas and then exports it as a PNG file. The library is loaded dynamically only when you click "Export PNG", so it does not affect the initial page load speed.'
    },
    {
      q: 'Can I use this as a class timetable or work schedule?',
      a: 'Absolutely. The grid spans 6:00 AM to 10:00 PM in 30-minute increments across all 7 days of the week. You can use it for university class schedules, employee shift rosters, personal weekly planners, or project sprint planning. Export to CSV for spreadsheets or PNG for sharing.'
    }
  ];

  ngOnInit(): void {
    this.editForm = this.fb.group({
      subject:     ['', Validators.required],
      description: [''],
      color:       [CELL_COLORS[0]]
    });

    this.loadFromStorage();
    this.updateSeo();
    this.injectJsonLd();

    // Debounced auto-save
    this.saveSubject.pipe(
      debounceTime(500),
      takeUntil(this.destroy$)
    ).subscribe(() => this.saveToStorage());
  }

  // ── Grid helpers ──────────────────────────────────────────────────────────
  cellKey(dayIdx: number, hourIdx: number): string {
    return `${dayIdx}-${hourIdx}`;
  }

  getCell(dayIdx: number, hourIdx: number): TimetableCell | null {
    return this.grid[this.cellKey(dayIdx, hourIdx)] ?? null;
  }

  openEdit(dayIdx: number, hourIdx: number): void {
    const key  = this.cellKey(dayIdx, hourIdx);
    const cell = this.grid[key];
    this.editingKey = key;
    this.editForm.patchValue({
      subject:     cell?.subject     || '',
      description: cell?.description || '',
      color:       cell?.color       || CELL_COLORS[0]
    });
    this.cdr.markForCheck();
  }

  closeEdit(): void {
    this.editingKey = null;
    this.editForm.reset({ color: CELL_COLORS[0] });
    this.cdr.markForCheck();
  }

  saveCell(): void {
    if (!this.editingKey || this.editForm.invalid) return;
    const v = this.editForm.getRawValue();
    this.grid = {
      ...this.grid,
      [this.editingKey]: { subject: v.subject, description: v.description || '', color: v.color }
    };
    this.closeEdit();
    this.saveSubject.next();
    this.cdr.markForCheck();
  }

  clearCell(): void {
    if (!this.editingKey) return;
    const updated = { ...this.grid };
    delete updated[this.editingKey];
    this.grid = updated;
    this.closeEdit();
    this.saveSubject.next();
    this.cdr.markForCheck();
  }

  clearAll(): void {
    this.grid = {};
    this.editingKey = null;
    this.saveToStorage();
    this.cdr.markForCheck();
  }

  // ── LocalStorage ──────────────────────────────────────────────────────────
  private saveToStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(this.grid));
    } catch { /* quota exceeded */ }
  }

  private loadFromStorage(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) this.grid = JSON.parse(raw);
    } catch {
      this.grid = {};
    }
  }

  // ── CSV Export ────────────────────────────────────────────────────────────
  exportCsv(): void {
    const headers = ['Time', ...DAYS];
    const rows = HOURS.map((hour, hIdx) => {
      const row: (string | number | null)[] = [hour];
      DAYS.forEach((_, dIdx) => {
        const cell = this.getCell(dIdx, hIdx);
        row.push(cell ? cell.subject + (cell.description ? ` — ${cell.description}` : '') : '');
      });
      return row;
    });
    this.csvSvc.download('timetable.csv', headers, rows);
  }

  // ── PNG Export via html2canvas ────────────────────────────────────────────
  async exportPng(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) return;
    const tableEl = this.document.getElementById('timetableGrid');
    if (!tableEl) return;

    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(tableEl as HTMLElement, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      this.blobSvc.downloadCanvas(canvas, 'timetable.png');
    } catch (err) {
      console.error('html2canvas export failed', err);
    }
  }

  toggleFaq(i: number): void { this.openFaqIndex = this.openFaqIndex === i ? null : i; }

  trackByHour(_: number, hour: string): string { return hour; }
  trackByDay(_: number, day: string): string   { return day; }

  private updateSeo(): void {
    const t = 'Free Timetable Generator — Weekly Schedule Maker | BriskPeople';
    const d = 'Create a weekly timetable online. Add subjects, colors, and descriptions to each slot. Auto-saves in your browser. Export as CSV or PNG. Free schedule generator.';
    this.titleSvc.setTitle(t);
    this.meta.updateTag({ name: 'description',        content: d });
    this.meta.updateTag({ name: 'keywords',           content: 'timetable generator, weekly schedule maker, class schedule creator, work schedule generator, online timetable' });
    this.meta.updateTag({ property: 'og:title',       content: t });
    this.meta.updateTag({ property: 'og:description', content: d });
    this.meta.updateTag({ property: 'og:url',         content: 'https://www.briskpeople.com/free-tools/timetable-generator' });
    this.meta.updateTag({ name: 'twitter:card',       content: 'summary_large_image' });
  }

  private injectJsonLd(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const schemas = [
      {
        '@context': 'https://schema.org', '@type': 'SoftwareApplication',
        name: 'Timetable Generator', applicationCategory: 'ProductivityApplication',
        operatingSystem: 'Web', offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        url: 'https://www.briskpeople.com/free-tools/timetable-generator'
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home',       item: 'https://www.briskpeople.com' },
          { '@type': 'ListItem', position: 2, name: 'Free Tools', item: 'https://www.briskpeople.com/free-tools' },
          { '@type': 'ListItem', position: 3, name: 'Timetable Generator', item: 'https://www.briskpeople.com/free-tools/timetable-generator' }
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
    this.destroy$.next();
    this.destroy$.complete();
    this.jsonLdScript?.remove();
    this.titleSvc.setTitle('BriskPeople HRMS | Human Resource Management System');
  }
}
