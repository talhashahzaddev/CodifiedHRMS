import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { Feature } from '../../models/feature.model';

@Component({
  selector: 'app-features',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './features.component.html',
  styleUrls: ['./features.component.scss']
})
export class FeaturesComponent {
  features: Feature[] = [
    {
      id: '1',
      title: 'Employee Management',
      description: 'Manage employees, managers, and HR roles with department positions in one centralized system.',
      icon: 'groups',
      route: '/employee-management'
    },
    {
      id: '2',
      title: 'Attendance',
      description: 'Accurately track employee work hours, leaves, and overtime with our integrated system.',
      icon: 'schedule',
      route: '/attendance-management'
    },
    {
      id: '3',
      title: 'Leave Management',
      description: 'Streamline employee leave requests, approvals, and balance tracking with a transparent, easy-to-use system.',
      icon: 'event_available',
      route: '/leave-management'
    },
    {
      id: '4',
      title: 'Timesheets',
      description: 'Log time against projects and tasks for better resource management and billing.',
      icon: 'hourglass_top',
      route: '/timesheet-management-software'
    },
    {
      id: '5',
      title: 'Performance',
      description: 'Manage employee reviews, set goals, and foster a culture of continuous improvement.',
      icon: 'trending_up',
      route: '/performance-management'
    },
    {
      id: '6',
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and approvals. Pay employees on time while reducing errors and administrative effort.',
      icon: 'payments',
      route: '/payroll-management'
    },
    {
      id: '7',
      title: 'AI Assistant',
      description: 'Track goals and reviews with intelligent AI support. Get smarter insights and guidance to help employees grow consistently',
      icon: 'smart_toy',
      route: '/ai-assistant'
    },
    {
      id: '8',
      title: 'Seamless Onboarding',
      description: 'Create a positive first-day experience for every new hire. Keep onboarding simple, structured, and stress-free for teams.',
      icon: 'rocket_launch',
      route: '/onboarding-software'
    }
  ];
}

