import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { getToolBySlug, getRelatedTools, ToolConfig } from '../../../config/tools.config';

@Component({
  selector: 'app-time-difference',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './time-difference.component.html',
  styleUrls: ['./time-difference.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TimeDifferenceComponent implements OnInit {
  tool!: ToolConfig;
  relatedTools: ToolConfig[] = [];
  form!: FormGroup;
  
  result: {
    totalMilliseconds: number;
    years: number;
    months: number;
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isPast: boolean; // if endDate is before startDate
  } | null = null;

  faqs = [
    {
      q: 'How are months calculated?',
      a: 'A month is calculated based on calendar dates. For example, March 15 to April 15 is considered exactly 1 month, regardless of the number of days in March. This provides the most intuitive "human" answer.'
    },
    {
      q: 'Does it support leap years?',
      a: 'Yes, because the calculations rely on the native JavaScript Date object, all leap years and varying month lengths are accounted for perfectly.'
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
    const slug = 'time-difference-calculator';
    const config = getToolBySlug(slug);
    if (!config) return;
    this.tool = config;
    this.relatedTools = getRelatedTools(slug);

    this.title.setTitle(this.tool.seoTitle);
    this.meta.updateTag({ name: 'description', content: this.tool.seoDescription });

    const now = new Date();
    const future = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7); // +7 days

    const formatTime = (d: Date) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    this.form = this.fb.group({
      startDate: [formatDate(now), Validators.required],
      startTime: [formatTime(now), Validators.required],
      endDate: [formatDate(future), Validators.required],
      endTime: [formatTime(future), Validators.required]
    });

    this.form.valueChanges.subscribe(() => {
      if (this.form.valid) {
        this.calculateDiff();
      } else {
        this.result = null;
        this.cdr.markForCheck();
      }
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
    const { startDate, startTime, endDate, endTime } = this.form.value;
    
    // Parse to local date objects
    const start = new Date(`${startDate}T${startTime}:00`);
    const end = new Date(`${endDate}T${endTime}:00`);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      this.result = null;
      this.cdr.markForCheck();
      return;
    }

    const diffMs = end.getTime() - start.getTime();
    const isPast = diffMs < 0;
    
    const d1 = isPast ? end : start;
    const d2 = isPast ? start : end;

    // We do calendar-based math for Y/M/D
    let years = d2.getFullYear() - d1.getFullYear();
    let months = d2.getMonth() - d1.getMonth();
    let days = d2.getDate() - d1.getDate();
    
    let hours = d2.getHours() - d1.getHours();
    let minutes = d2.getMinutes() - d1.getMinutes();
    let seconds = d2.getSeconds() - d1.getSeconds();

    // Borrowing
    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours < 0) { hours += 24; days--; }
    
    if (days < 0) {
      // Find how many days were in the *previous* month of d2
      const prevMonth = new Date(d2.getFullYear(), d2.getMonth(), 0);
      days += prevMonth.getDate();
      months--;
    }
    
    if (months < 0) {
      months += 12;
      years--;
    }

    this.result = {
      totalMilliseconds: Math.abs(diffMs),
      years,
      months,
      days,
      hours,
      minutes,
      seconds,
      isPast
    };

    this.cdr.markForCheck();
  }

  toggleFaq(index: number) {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }
}
