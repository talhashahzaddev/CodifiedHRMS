import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-simplifies-featuer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './simplifies-featuer.component.html',
  styleUrls: ['./simplifies-featuer.component.scss']
})
export class SimplifiesFeatuerComponent implements OnInit, OnDestroy {

  // Default fallback SEO (same pattern as Pricing)
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  // Page-specific SEO
  readonly seo = {
    title: 'How HRMS Payroll Simplifies Salary, Attendance & Compliance',
    description: 'Learn how an HRMS payroll management system connects salary, attendance, and compliance to reduce errors and simplify payroll for HR teams',
    focusKeyword: 'HRMS payroll management system'
  };

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {

    // Set Meta Title
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

    // Open Graph (Facebook, LinkedIn)
    this.meta.updateTag({
      property: 'og:title',
      content: this.seo.title
    });

    this.meta.updateTag({
      property: 'og:description',
      content: this.seo.description
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
    // Reset to default when leaving page
    this.titleService.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'keywords', content: this.defaultKeywords });
  }
}