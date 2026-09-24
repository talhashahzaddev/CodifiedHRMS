import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

interface AgeResult {
  years: number;
  months: number;
  days: number;
  nextBirthday: {
    daysRemaining: number;
    monthsRemaining: number;
    date: Date;
  };
}

@Component({
  selector: 'app-age-calculator',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './age-calculator.component.html',
  styleUrls: ['./age-calculator.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AgeCalculatorComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  result: AgeResult | null = null;
  errorMsg: string | null = null;

  faqs = [
    {
      q: 'Does it calculate the exact days?',
      a: 'Yes, it counts calendar months and then precise days, handling leap years properly.'
    },
    {
      q: 'How does it calculate the next birthday?',
      a: 'It takes your birth month and day and applies it to the current (or next) year, then finds the difference in days from the "As Of" date.'
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
    const slug = 'age-calculator';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    const now = new Date();
    const defaultDob = new Date(now.getFullYear() - 30, now.getMonth(), now.getDate());

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    this.form = this.fb.group({
      dob: [formatDate(defaultDob), Validators.required],
      asOfDate: [formatDate(now), Validators.required]
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) this.calculateAge();
    });

    if (isPlatformBrowser(this.platformId)) {
      this.calculateAge();
    }
  }

  getFieldError(field: string): string | null {
    const ctrl = this.form.get(field);
    if (ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched)) {
      if (ctrl.hasError('required')) return 'Required.';
    }
    return null;
  }

  calculateAge() {
    this.errorMsg = null;
    const { dob, asOfDate } = this.form.value;
    
    // Create UTC dates to avoid local timezone offset shifts
    const d1 = new Date(dob);
    const d2 = new Date(asOfDate);
    
    if (isNaN(d1.getTime()) || isNaN(d2.getTime())) {
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    if (d2 < d1) {
      this.errorMsg = '"As Of Date" cannot be earlier than "Date of Birth".';
      this.result = null;
      this.cdr.markForCheck();
      return;
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

    // Next birthday calculation
    let nextBday = new Date(d2.getUTCFullYear(), d1.getUTCMonth(), d1.getUTCDate());
    
    // If the birthday this year has already passed
    if (nextBday < d2) {
      nextBday = new Date(d2.getUTCFullYear() + 1, d1.getUTCMonth(), d1.getUTCDate());
    }

    // Difference in days to next birthday
    const diffTime = nextBday.getTime() - d2.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const monthsRemaining = Math.floor(daysRemaining / 30);

    this.result = {
      years,
      months,
      days,
      nextBirthday: {
        daysRemaining,
        monthsRemaining,
        date: nextBday
      }
    };

    this.cdr.markForCheck();
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
