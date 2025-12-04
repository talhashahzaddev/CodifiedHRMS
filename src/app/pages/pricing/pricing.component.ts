import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PricingPlan } from '../../models/pricing.model';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent {
  billingCycle: 'monthly' | 'annual' = 'monthly';

  plans: PricingPlan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 29,
      pricePeriod: 'month',
      description: 'Perfect for small teams getting started',
      features: [
        'Employee Directory',
        'Leave Management',
        'Basic Reporting',
        'Standard Support'
      ],
      isPopular: false
    },
    {
      id: 'business',
      name: 'Business',
      price: 79,
      pricePeriod: 'month',
      description: 'For growing teams that need advanced features',
      features: [
        'All Starter features',
        'Performance Management',
        'Applicant Tracking (ATS)',
        'Advanced Reporting',
        'Priority Support'
      ],
      isPopular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 0,
      pricePeriod: 'month',
      description: 'Custom solutions for large organizations',
      features: [
        'All Business features',
        'Single Sign-On (SSO)',
        'Custom Integrations',
        'Dedicated Account Manager',
        '24/7 Premium Support'
      ],
      isPopular: false,
      isCustom: true
    }
  ];

  toggleBillingCycle(): void {
    this.billingCycle = this.billingCycle === 'monthly' ? 'annual' : 'monthly';
  }

  getDisplayPrice(plan: PricingPlan): number {
    if (plan.isCustom) return 0;
    return this.billingCycle === 'annual' ? Math.round(plan.price * 10 * 0.8) : plan.price;
  }

  getPriceLabel(plan: PricingPlan): string {
    if (plan.isCustom) return 'Custom';
    return `$${this.getDisplayPrice(plan)}`;
  }
}

