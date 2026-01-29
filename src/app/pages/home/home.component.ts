import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Feature } from '../../models/feature.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'BriskPeople HRMS | Human Resource Management System',
    description: 'BriskPeople HRMS is a Human Resource Management System for employee records, attendance, payroll, onboarding, and performance management in one platform.',
    focusKeyword: 'Human Resource Management System (HRMS)',
    altTags: ['Human Resource Management System', 'HR MANAGEMENT', 'Time Tracker software', 'Payroll Management', 'employee performance tracking system'] as const
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

  features: Feature[] = [
    {
      id: '1',
      title: 'AI Assistant',
      description: 'Track goals and reviews with intelligent AI support. Get smarter insights and guidance to help employees grow consistently',
      icon: 'smart_toy',
      route: '/ai-assistant'
    },
    {
      id: '2',
      title: 'Seamless Onboarding',
      description: 'Create a positive first-day experience for every new hire. Keep onboarding simple, structured, and stress-free for teams.',
      icon: 'rocket_launch',
      route: '/onboarding-software'
    },
    {
      id: '3',
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and approvals. Pay employees on time while reducing errors and administrative effort.',
      icon: 'payments',
      route: '/payroll-management'
    }
  ];

  HR_MANAGEMENT_SIMPLIFIED: string[] = [
    'Easy access to employee documents and key information',
    'A centralized employee database that grows with your team',
    'Clear HR workflows for daily tasks and approvals',
    'Organized HR processes for consistent people management'

  ];

  TIME_AND_ATTENDANCE: string[] = [
    'Clear tracking of employee working hours and attendance',
    'Attendance records that support accurate payroll processing',
    'Real-time check-in and check-out entries',
    'Consistent attendance rules and policies across teams'

  ];

  PAYROLL_MANAGEMENT: string[] = [
    'Salary calculations based on attendance and work hours',
    'Clear payslips with earnings and deductions details',
    'Payroll records that support planning and audits'

  ];
  PERFORMANCE_MANAGEMENT: string[] = [
    'Self-review tools for employees and managers',
    'Performance reports stored inside the HR system',
    'Goal tracking linked to team and individual targets',
    '360 performance reviews with defined review formats'

  ];
}

