import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-switch-hrms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './switch-hrms.component.html',
  styleUrls: ['./switch-hrms.component.scss']
})
export class SwitchHrmsComponent implements OnInit, OnDestroy {

  // Default fallback SEO
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  // Page-specific SEO
  readonly seo = {
    title: 'Why Switch to HRMS From Old Spreadsheets for HR Management',
    description: 'Still using spreadsheets for HR? Learn why HRMS is better for payroll, attendance, compliance, and growing workforce management.',
    focusKeyword: 'HRMS vs spreadsheets'
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
    // Reset default SEO on route change
    this.titleService.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'keywords', content: this.defaultKeywords });
  }
}