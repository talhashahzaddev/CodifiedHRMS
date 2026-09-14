import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';
import { ClipboardService } from '../../../services/clipboard.service';

@Component({
  selector: 'app-unix-timestamp',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './unix-timestamp.component.html',
  styleUrls: ['./unix-timestamp.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnixTimestampComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  epochType: 'seconds' | 'milliseconds' = 'seconds';
  copiedField: string | null = null;
  private isSyncing = false; // Prevents infinite change loops

  faqs = [
    {
      q: 'What is a Unix Timestamp?',
      a: 'A Unix timestamp tracks time as the number of seconds (or milliseconds) that have elapsed since the Unix Epoch (January 1, 1970 00:00:00 UTC). It is independent of time zones.'
    },
    {
      q: 'How does it detect seconds vs milliseconds?',
      a: 'Standard Unix timestamps in seconds are typically 10 digits long. If the number you enter is 13 digits or more, the tool assumes it\'s in milliseconds (like the native JavaScript Date.now()).'
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
    const slug = 'unix-timestamp-converter';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    const now = new Date();
    const epochSecs = Math.floor(now.getTime() / 1000);
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    this.form = this.fb.group({
      epoch: [epochSecs, Validators.required],
      humanDate: [dateStr, Validators.required],
      humanTime: [timeStr, Validators.required]
    });

    if (isPlatformBrowser(this.platformId)) {
      this.setupSync();
    }
  }

  private setupSync() {
    this.form.get('epoch')?.valueChanges.subscribe(val => {
      if (this.isSyncing) return;
      this.syncFromEpoch(val);
    });

    this.form.get('humanDate')?.valueChanges.subscribe(() => {
      if (this.isSyncing) return;
      this.syncFromHuman();
    });

    this.form.get('humanTime')?.valueChanges.subscribe(() => {
      if (this.isSyncing) return;
      this.syncFromHuman();
    });
  }

  private syncFromEpoch(epochVal: any) {
    if (!epochVal || isNaN(Number(epochVal))) return;
    this.isSyncing = true;
    
    const num = Number(epochVal);
    // Auto-detect seconds vs ms based on length
    // current seconds are 10 digits (~1.7 billion). MS is 13 digits.
    const isMs = String(Math.floor(Math.abs(num))).length >= 13;
    this.epochType = isMs ? 'milliseconds' : 'seconds';
    
    const d = new Date(isMs ? num : num * 1000);
    
    if (!isNaN(d.getTime())) {
      const dateStr = d.toISOString().split('T')[0];
      const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
      
      this.form.patchValue({ humanDate: dateStr, humanTime: timeStr }, { emitEvent: false });
    }
    this.isSyncing = false;
    this.cdr.markForCheck();
  }

  private syncFromHuman() {
    const { humanDate, humanTime } = this.form.value;
    if (!humanDate || !humanTime) return;
    this.isSyncing = true;
    
    // Parse time to handle optional seconds
    const parts = humanTime.split(':');
    const h = parts[0] || '00';
    const m = parts[1] || '00';
    const s = parts[2] || '00';
    
    const d = new Date(`${humanDate}T${h}:${m}:${s}`);
    
    if (!isNaN(d.getTime())) {
      const isMs = this.epochType === 'milliseconds';
      const epoch = isMs ? d.getTime() : Math.floor(d.getTime() / 1000);
      this.form.patchValue({ epoch }, { emitEvent: false });
    }
    
    this.isSyncing = false;
    this.cdr.markForCheck();
  }

  copy(val: string | number, field: string) {
    this.clipboard.copy(String(val)).then(success => {
      if (success) {
        this.copiedField = field;
        this.cdr.markForCheck();
        setTimeout(() => {
          this.copiedField = null;
          this.cdr.markForCheck();
        }, 2000);
      }
    });
  }

  getFieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched)) {
      if (ctrl.hasError('required')) return 'Required.';
    }
    return null;
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
