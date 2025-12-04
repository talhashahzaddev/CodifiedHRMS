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
      title: 'Payroll Management',
      description: 'Simplify and automate your entire salary processing workflow with precision and ease.',
      icon: 'payments'
    },
    {
      id: '2',
      title: 'Attendance',
      description: 'Accurately track employee work hours, leaves, and overtime with our integrated system.',
      icon: 'schedule'
    },
    {
      id: '3',
      title: 'Performance',
      description: 'Manage employee reviews, set goals, and foster a culture of continuous improvement.',
      icon: 'trending_up'
    },
    {
      id: '4',
      title: 'Recruitment',
      description: 'Streamline your hiring process from job posting to offer letter with our applicant tracking system.',
      icon: 'groups'
    },
    {
      id: '5',
      title: 'Timesheets',
      description: 'Log time against projects and tasks for better resource management and billing.',
      icon: 'hourglass_top'
    },
    {
      id: '6',
      title: 'Self Service',
      description: 'Empower your employees with access to their own information, requests, and documents.',
      icon: 'account_circle'
    },
    {
      id: '7',
      title: 'Analytics',
      description: 'Gain valuable, data-driven insights into your workforce to make strategic HR decisions.',
      icon: 'pie_chart'
    }
  ];
}

