import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-performance',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './performance.component.html',
  styleUrls: ['./performance.component.scss']
})
export class PerformanceComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Performance Management Software | Track Goals & Appraisals | BriskPeople',
    description: 'Enhance employee performance with Brisk People\'s performance management software. Set goals, track progress, and streamline appraisals for better results.',
    focusKeyword: 'Performance Management',
    altTags: ['performance management systems', 'performance of management', 'performance manager', 'performance management software'] as const
  };

  constructor(
    private titleService: Title,
    private meta: Meta
  ) { }

  ngOnInit(): void {
    this.titleService.setTitle(this.seo.title);
    this.meta.updateTag({ name: 'description', content: this.seo.description });
    this.meta.updateTag({ name: 'keywords', content: this.seo.focusKeyword });
    this.meta.updateTag({ property: 'og:title', content: this.seo.title });
    this.meta.updateTag({ property: 'og:description', content: this.seo.description });
    this.meta.updateTag({ name: 'twitter:title', content: this.seo.title });
    this.meta.updateTag({ name: 'twitter:description', content: this.seo.description });
  }

  ngOnDestroy(): void {
    this.titleService.setTitle(this.defaultTitle);
    this.meta.updateTag({ name: 'description', content: this.defaultDescription });
    this.meta.updateTag({ name: 'keywords', content: this.defaultKeywords });
  }

  features = [
    {
      id: 1,
      title: 'My Performance',
      description:
        'Track your performance with detailed reports on key metrics and areas of improvement. The AI Assistant helps employees stay aligned with personal and organizational goals.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'performance management systems'
    },
    {
      id: 2,
      title: 'Appraisals',
      description:
        'Automate and streamline performance appraisals. The AI Assistant analyzes employee data, providing insightful feedback for fair evaluations and career development.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'performance management software'
    },
    {
      id: 3,
      title: 'Skills Matrix',
      description:
        'Assess employees\' skills using the AI Assistant. Track growth in competencies and identify skill gaps, empowering you to focus on development areas for continuous improvement.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'performance manager'
    },
    {
      id: 4,
      title: 'Goals & KRAs',
      description:
        'Set clear performance goals and Key Result Areas (KRAs). The AI Assistant helps employees stay focused on achieving measurable results, adjusting targets based on ongoing performance.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'performance of management'
    },
    {
      id: 5,
      title: 'Performance Reports',
      description:
        'Access comprehensive reports on individual and team performance. Track trends, identify top performers, and make data-driven decisions for talent development.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'performance management systems'
    },
    {
      id: 6,
      title: 'Development Plans',
      description:
        'Link performance reviews with training and development opportunities. Create tailored development plans to close skill gaps and support career growth.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'performance management software'
    }
  ];
  intuitiveFeatures = [
    'Set Clear Goals & KRAs: Align individual performance with organizational strategy by defining clear, measurable goals. Track progress and adjust in real-time to meet targets.',
    'Continuous Feedback: Create a culture of continuous improvement by integrating real-time feedback into your performance management system.',
    'Customizable Appraisals: Tailor appraisals to match your organization\'s goals and values, ensuring that assessments align with both company and employee expectations.',
    'Integrated Skills Matrix: Identify skill gaps and future leaders, enabling your HR team to plan targeted training and development initiatives.',
    'Goal Tracking: Keep employees focused and aligned with company goals, allowing them to track their achievements and growth over time.'
  ];
  managersDecisionMaking = [
    'Make Data-Driven Decisions: Use real-time performance data to guide talent management decisions.',
    'Employee Feedback Loop: Foster a culture of continuous feedback to drive employee development and engagement.',
    'Performance Trends: Track long-term performance trends to better understand employee growth.'
  ];
  employeesBenefits = [
    'Track Performance: Stay updated on progress towards personal goals and organizational objectives.',
    'Continuous Feedback: Access real-time feedback for ongoing personal and professional growth.',
    'Access from Anywhere: Employees can view and update performance records from their desktop or mobile device.'
  ];
  otherFeatures = [
    'Advanced Reporting: Comprehensive reports on individual and team performance, available anytime.',
    'Customizable Goals & KRAs: Tailor goals and KPIs based on team or department-specific needs.',
    'Integrated Learning: Directly link performance reviews with training and development opportunities to close skill gaps.',
    'Seamless Integration: Easily integrate performance management with your existing HR and payroll systems.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Employee Dashboard',
      description:
        'Employees can view their goals, performance reviews, appraisals, and skill development plans through their personalized dashboard.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769171079/leave-calander_xbxzb8.jpg',
      alt: 'performance management systems'
    },
    {
      id: 2,
      title: 'Manager Dashboard',
      description:
        'Managers can quickly review employee performance, provide feedback, and track progress against KPIs and goals.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/pending-leave-request_mswhgd.jpg',
      alt: 'performance management software'
    }
  ];
}
