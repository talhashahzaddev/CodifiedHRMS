import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
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
export class HomeComponent {
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
      route: '/dashboard-onboarding'
    },
    {
      id: '3',
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and approvals. Pay employees on time while reducing errors and administrative effort.',
      icon: 'payments',
      route: '/payroll'
    }
  ];

  HR_MANAGEMENT_SIMPLIFIED: string[] = [
    'Easy access to documents and information.',
    'An employee database that scales.',
    'Smart HR workflows.',
    'Automation of HR processes.'
  ];

  TIME_AND_ATTENDANCE: string[] = [
    'Enhanced employee accountability',
    'Accurate payroll processing',
    'Flexible, instantaneous attendance recording',
    'Attendance policies that are transparent and consistent'
  ];

  PAYROLL_MANAGEMENT: string[] = [
    'Quickly determine payroll calculations and deductions',
    'Generate accurate Payslips',
    'Using payroll management to plan future costs',
    'Secure Data’s and Privacy'
  ];
  PERFORMANCE_MANAGEMENT: string[] = [
    '360 Performance reviews and templates',
    'Management By Objectives',
    'Self-Evaluation Tools',
    'Performance reports'
  ];
}

