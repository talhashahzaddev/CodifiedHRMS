import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';
import { ClipboardService } from '../../../services/clipboard.service';

interface IsoFormat {
  label: string;
  value: string;
  description: string;
}

@Component({
  selector: 'app-iso-formatter',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './iso-formatter.component.html',
  styleUrls: ['./iso-formatter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IsoFormatterComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  formats: IsoFormat[] = [];
  copiedIndex: number | null = null;

  faqs = [
    {
      q: 'What is ISO 8601?',
      a: 'ISO 8601 is an international standard covering the exchange of date and time-related data. It eliminates ambiguity between different regional date formats (e.g. MM/DD/YYYY vs DD/MM/YYYY) by establishing a strict YYYY-MM-DD hierarchy.'
    },
    {
      q: 'What does the "Z" mean?',
      a: 'The "Z" stands for "Zulu time", which is the military term for Coordinated Universal Time (UTC). If a time string ends in Z, it means there is zero offset from UTC.'
    }
  ];
  openFaqIndex: number | null = 0;

  constructor(
    private fb: FormBuilder,
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef,
    public clipboard: ClipboardService
  ) {}

  ngOnInit() {
    const slug = 'iso-time-formatter';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    this.form = this.fb.group({
      inputDate: [dateStr, Validators.required],
      inputTime: [timeStr, Validators.required]
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) this.generateFormats();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.generateFormats();
    }
  }

  generateFormats() {
    const { inputDate, inputTime } = this.form.value;
    const d = new Date(`${inputDate}T${inputTime}:00`);
    
    if (isNaN(d.getTime())) {
      this.formats = [];
      this.cdr.markForCheck();
      return;
    }

    const Y = d.getFullYear();
    const M = String(d.getMonth() + 1).padStart(2, '0');
    const D = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    
    // Offset calc
    const tzOffset = -d.getTimezoneOffset();
    const dif = tzOffset >= 0 ? '+' : '-';
    const offH = String(Math.floor(Math.abs(tzOffset) / 60)).padStart(2, '0');
    const offM = String(Math.abs(tzOffset) % 60).padStart(2, '0');
    const offsetStr = `${dif}${offH}:${offM}`;

    // Ordinal Date (YYYY-DDD)
    const start = new Date(Y, 0, 0);
    const diff = (d.getTime() - start.getTime()) + ((start.getTimezoneOffset() - d.getTimezoneOffset()) * 60 * 1000);
    const oneDay = 1000 * 60 * 60 * 24;
    const dayOfYear = String(Math.floor(diff / oneDay)).padStart(3, '0');

    // Week Date (YYYY-Www-D)
    // Basic ISO week logic (Thursday based)
    const dCopy = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const dayNum = dCopy.getUTCDay() || 7;
    dCopy.setUTCDate(dCopy.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(dCopy.getUTCFullYear(),0,1));
    const weekNo = String(Math.ceil((((dCopy.getTime() - yearStart.getTime()) / 86400000) + 1)/7)).padStart(2, '0');
    
    const isoUtc = d.toISOString(); // native JS is perfect UTC ISO
    
    this.formats = [
      {
        label: 'Local Date & Time (with offset)',
        value: `${Y}-${M}-${D}T${h}:${m}:${s}${offsetStr}`,
        description: 'Complete representation with local timezone offset'
      },
      {
        label: 'UTC Date & Time (Z)',
        value: isoUtc,
        description: 'Coordinated Universal Time using "Z" notation'
      },
      {
        label: 'Calendar Date',
        value: `${Y}-${M}-${D}`,
        description: 'Year, Month, and Day only'
      },
      {
        label: 'Year and Month',
        value: `${Y}-${M}`,
        description: 'Reduced precision'
      },
      {
        label: 'Ordinal Date',
        value: `${Y}-${dayOfYear}`,
        description: 'Year and Day of Year (1-365/366)'
      },
      {
        label: 'Week Date',
        value: `${dCopy.getUTCFullYear()}-W${weekNo}-${dayNum}`,
        description: 'Year, Week Number, and Day of Week (1=Monday)'
      },
      {
        label: 'Basic Format (no separators)',
        value: `${Y}${M}${D}T${h}${m}${s}${offsetStr.replace(':', '')}`,
        description: 'Compact representation'
      }
    ];

    this.cdr.markForCheck();
  }

  copy(val: string, index: number) {
    this.clipboard.copy(val).then(success => {
      if (success) {
        this.copiedIndex = index;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.copiedIndex = null;
          this.cdr.markForCheck();
        }, 2000);
      }
    });
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
