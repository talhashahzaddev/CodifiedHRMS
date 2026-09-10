import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

interface AgeDiffResult {
  years: number;
  months: number;
  days: number;
  totalDays: number;
  older: 'Person 1' | 'Person 2' | 'Same age';
}

@Component({
  selector: 'app-age-difference',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './age-difference.component.html',
  styleUrls: ['./age-difference.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgeDifferenceComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  result: AgeDiffResult | null = null;

  faqs = [
    {
      q: 'Does it matter which date I put first?',
      a: 'No. The calculator automatically identifies the older and younger person based on the dates.'
    },
    {
      q: 'Is it accurate for leap years?',
      a: 'Yes, because we use standard calendar date logic to calculate the gap.'
    }
  ];

  openFaqIndex: number | null = 0;

  constructor(
    private fb: FormBuilder,
    private title: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const slug = 'age-difference-calculator';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    const now = new Date();
    const dob1 = new Date(now.getFullYear() - 35, now.getMonth(), now.getDate());
    const dob2 = new Date(now.getFullYear() - 30, now.getMonth() + 3, now.getDate() + 10);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    this.form = this.fb.group({
      dob1: [formatDate(dob1), Validators.required],
      dob2: [formatDate(dob2), Validators.required]
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) this.calculateDiff();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.calculateDiff();
    }
  }

  getFieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched)) {
      if (ctrl.hasError('required')) return 'Required.';
    }
    return null;
  }

  calculateDiff() {
    const { dob1, dob2 } = this.form.value;
    
    let d1 = new Date(dob1);
    let d2 = new Date(dob2);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    let older: AgeDiffResult['older'] = 'Same age';
    if (d1 < d2) { older = 'Person 1'; }
    else if (d2 < d1) { 
      older = 'Person 2'; 
      // Swap so d1 is always the earlier date (older person's DOB)
      const temp = d1; d1 = d2; d2 = temp;
    }

    let years = d2.getUTCFullYear() - d1.getUTCFullYear();
    let months = d2.getUTCMonth() - d1.getUTCMonth();
    let days = d2.getUTCDate() - d1.getUTCDate();

    if (days < 0) {
      const prevMonth = new Date(d2.getUTCFullYear(), d2.getUTCMonth(), 0);
      days += prevMonth.getUTCDate();
      months--;
    }

    if (months < 0) {
      months += 12;
      years--;
    }

    const totalDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));

    this.result = {
      years,
      months,
      days,
      totalDays,
      older
    };

    this.cdr.markForCheck();
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
