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
      title: 'Automated Payroll',
      description: 'Run payroll in minutes, not days. We handle taxes, compliance, and direct deposits automatically.',
      icon: 'payments'
    },
    {
      id: '2',
      title: 'Seamless Onboarding',
      description: 'Create amazing first-day experiences with structured onboarding checklists and automated paperwork.',
      icon: 'rocket_launch'
    },
    {
      id: '3',
      title: 'Performance Tracking',
      description: 'Set goals, conduct reviews, and provide continuous feedback to help your employees grow.',
      icon: 'trending_up'
    }
  ];
}

