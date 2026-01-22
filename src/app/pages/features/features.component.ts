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
      title: 'AI Assistant',
      description: 'Track goals and reviews with intelligent AI support. Get smarter insights and guidance to help employees grow consistently',
      icon: 'smart_toy'
    },
    {
      id: '2',
      title: 'Seamless Onboarding',
      description: 'Create a positive first-day experience for every new hire. Keep onboarding simple, structured, and stress-free for teams.',
      icon: 'rocket_launch'
    },
    {
      id: '3',
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and approvals. Pay employees on time while reducing errors and administrative effort.',
      icon: 'payments'
    },
    {
      id: '4',
      title: 'Attendance',
      description: 'Accurately track employee work hours, leaves, and overtime with our integrated system.',
      icon: 'schedule'
    },
    {
      id: '5',
      title: 'Performance',
      description: 'Manage employee reviews, set goals, and foster a culture of continuous improvement.',
      icon: 'trending_up'
    },
    {
      id: '6',
      title: 'Timesheets',
      description: 'Log time against projects and tasks for better resource management and billing.',
      icon: 'hourglass_top'
    },
    {
      id: '7',
      title: 'Employee Management',
      description: 'Manage employees, managers, and HR roles with department positions in one centralized system.',
      icon: 'groups' 
    },
    {
      id: '8',
      title: 'Leave Management',
      description: 'Gain valuable, data-driven insights into your workforce to make strategic HR decisions.',
      icon: 'event_available'
    }
  ];
}

