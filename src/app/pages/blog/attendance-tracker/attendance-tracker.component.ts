import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-attendance-tracker',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './attendance-tracker.component.html',
  styleUrls: ['./attendance-tracker.component.scss'],
})
export class AttendanceTrackerComponent implements OnInit, OnDestroy {

  // Default fallback SEO
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  // Page-specific SEO
  readonly seo = {
    title: 'Best Employee Attendance Tracker for Small Teams | BriskPeople',
    description: 'Learn how to choose the best attendance tracker for small teams. Discover key features like payroll integration, mobile clock-in, and real-time reporting.',
    focusKeyword: 'Employee Attendance Tracker'
  };

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {

    // Meta Title
    this.titleService.setTitle(this.seo.title);

    // Meta Description
    this.meta.updateTag({
      name: 'description',
      content: this.seo.description
    });

    // Focus Keyword
    this.meta.updateTag({
      name: 'keywords',
      content: this.seo.focusKeyword
    });

    // Open Graph (Facebook / LinkedIn)
    this.meta.updateTag({
      property: 'og:title',
      content: this.seo.title
    });

    this.meta.updateTag({
      property: 'og:description',
      content: this.seo.description
    });

    this.meta.updateTag({
      property: 'og:type',
      content: 'article'
    });

    // Twitter
    this.meta.updateTag({
      name: 'twitter:title',
      content: this.seo.title
    });

    this.meta.updateTag({
      name: 'twitter:description',
      content: this.seo.description
    });
  }

  ngOnDestroy(): void {
    // Reset to default SEO on route change
    this.titleService.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'keywords', content: this.defaultKeywords });
  }
}