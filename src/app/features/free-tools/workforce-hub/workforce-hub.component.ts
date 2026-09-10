import {
  Component, OnInit, OnDestroy, ChangeDetectionStrategy,
  Inject, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { DOCUMENT } from '@angular/common';
import { WORKFORCE_TOOLS, ToolConfig } from '../config/tools.config';

@Component({
  selector: 'app-workforce-hub',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './workforce-hub.component.html',
  styleUrls: ['./workforce-hub.component.scss']
})
export class WorkforceHubComponent implements OnInit, OnDestroy {
  readonly tools: ToolConfig[] = WORKFORCE_TOOLS;

  openFaqIndex: number | null = null;

  readonly faqs = [
    {
      q: 'What is an absence percentage calculator and why do I need one?',
      a: 'An absence percentage calculator measures the proportion of total available working days that employees miss due to absenteeism. The standard formula is: (Total Absent Days ÷ (Number of Employees × Workdays in Period)) × 100. HR teams use this KPI to benchmark attendance performance, identify chronic absenteeism patterns, and calculate the direct cost impact on productivity. A rate above 3% typically signals systemic issues worth investigating.'
    },
    {
      q: 'How is attrition rate different from employee turnover rate?',
      a: 'Both measure employee departures, but with a subtle difference. Attrition rate typically counts only voluntary departures (resignations, retirements) and positions that are not refilled. Turnover rate counts all separations including terminations and includes positions that are subsequently filled. Our calculator uses the broader formula: (Employees Who Left ÷ Average Headcount) × 100, which captures both voluntary and involuntary separations.'
    },
    {
      q: 'What is a good employee retention rate benchmark?',
      a: 'Industry benchmarks vary significantly. In 2024, the average U.S. retention rate across all industries was approximately 77% (meaning an ~23% annual turnover). Technology companies often see 70–80%, while retail and hospitality can drop below 60%. For most businesses, a retention rate above 85% is considered healthy. Use our Employee Retention Rate Calculator to track your rate each quarter and measure the impact of engagement initiatives.'
    },
    {
      q: 'How do these HR calculators handle overtime for different countries?',
      a: 'Our Overtime Calculator and Time Card Calculator allow you to set custom overtime thresholds and multipliers. In the US, FLSA mandates 1.5× pay after 40 hours per week. In India, the Factories Act requires 2× pay after 48 hours per week. In Pakistan, overtime kicks in after 9 hours/day or 48 hours/week. Simply enter your applicable threshold and multiplier, and the calculator handles the rest. For leave encashment, we apply the specific Indian Income Tax Section 10(10AA) formula.'
    },
    {
      q: 'What is FTE and how do I use the FTE Calculator for budgeting?',
      a: 'Full-Time Equivalent (FTE) standardizes headcount by converting part-time hours into full-time units. If your standard workweek is 40 hours and you have 10 part-time employees each working 20 hours, that equals 5 FTEs. FTE calculations are essential for: (1) ACA compliance threshold tracking (50 FTEs triggers employer mandate), (2) grant applications and government reporting, (3) departmental budget allocation, and (4) capacity planning during hiring cycles.'
    },
    {
      q: 'Can I use these tools for payroll calculations in India?',
      a: 'Yes. The Leave Encashment Calculator specifically applies the Section 10(10AA) tax exemption formula used in Indian payroll — covering both government and private sector employees. The maximum tax-exempt amount for private sector employees is the least of: (a) actual leave encashment received, (b) ₹25 lakh (revised limit), (c) 10 months\' salary, or (d) cash equivalent of unutilized earned leave. Our calculator handles all four tests automatically.'
    },
    {
      q: 'Are these tools free? Do I need to create an account?',
      a: 'All 14 workforce calculators on this page are completely free with no account required, no sign-up, and no usage limits. They run entirely in your browser. BriskPeople offers these tools to help HR professionals perform quick calculations without leaving their browser or opening a spreadsheet.'
    }
  ];

  private readonly seo = {
    title: 'Free Workforce Tools & HR Calculators — BriskPeople',
    description: '14 free online HR calculators: absence rate, attrition, retention, FTE, overtime, shift differential, PTO, leave encashment, utilization rate & more. No sign-up needed.',
    keywords: 'free HR calculators, workforce tools, absence percentage calculator, attrition rate calculator, employee retention rate calculator, FTE calculator, overtime calculator, PTO calculator, utilization rate calculator, time card calculator'
  };

  private jsonLdScript: HTMLScriptElement | null = null;

  constructor(
    private titleService: Title,
    private meta: Meta,
    @Inject(PLATFORM_ID) private platformId: Object,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.titleService.setTitle(this.seo.title);
    this.meta.updateTag({ name: 'description',         content: this.seo.description });
    this.meta.updateTag({ name: 'keywords',            content: this.seo.keywords });
    this.meta.updateTag({ property: 'og:title',        content: this.seo.title });
    this.meta.updateTag({ property: 'og:description',  content: this.seo.description });
    this.meta.updateTag({ property: 'og:type',         content: 'website' });
    this.meta.updateTag({ property: 'og:url',          content: 'https://www.briskpeople.com/free-workforce-tools' });
    this.meta.updateTag({ name: 'twitter:card',        content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title',       content: this.seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: this.seo.description });
    this.injectJsonLd();
  }

  toggleFaq(index: number): void {
    this.openFaqIndex = this.openFaqIndex === index ? null : index;
  }

  private injectJsonLd(): void {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Free Workforce Tools & HR Calculators',
      description: this.seo.description,
      url: 'https://www.briskpeople.com/free-workforce-tools',
      publisher: {
        '@type': 'Organization',
        name: 'BriskPeople',
        url: 'https://www.briskpeople.com'
      },
      hasPart: this.tools.map(t => ({
        '@type': 'WebApplication',
        name: t.title,
        description: t.description,
        url: `https://www.briskpeople.com/free-workforce-tools/${t.slug}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' }
      }))
    };

    this.jsonLdScript = this.document.createElement('script');
    this.jsonLdScript.type = 'application/ld+json';
    this.jsonLdScript.text = JSON.stringify(schema);
    this.document.head.appendChild(this.jsonLdScript);
  }

  ngOnDestroy(): void {
    this.titleService.setTitle('BriskPeople HRMS | Human Resource Management System');
    if (this.jsonLdScript) {
      this.jsonLdScript.remove();
    }
  }
}
