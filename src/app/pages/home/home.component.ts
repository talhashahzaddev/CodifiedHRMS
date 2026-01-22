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
    }
  ];
}

