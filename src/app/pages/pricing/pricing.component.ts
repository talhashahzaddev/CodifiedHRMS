import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PricingPlan } from '../../models/pricing.model';
import { PaymentService, SubscriptionPlanDto } from '../../core/services/payment.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit, OnDestroy {
  billingCycle: 'monthly' | 'annual' = 'monthly';
  plans: PricingPlan[] = [];
  allPlans: PricingPlan[] = [];
  displayedPlans: PricingPlan[] = [];
  currentIndex: number = 0;
  itemsPerPage: number = 3;
  isLoading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private paymentService: PaymentService) { }

  ngOnInit(): void {
    this.loadSubscriptionPlans();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSubscriptionPlans(): void {
    this.isLoading = true;
    this.error = null;

    this.paymentService.getActiveSubscriptionPlans()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (apiPlans) => {
          // Transform API plans to PricingPlan format
          this.allPlans = apiPlans.map(plan => this.transformToPricingPlan(plan));

          // Add custom plan template at the end if it doesn't exist
          const hasCustomPlan = this.allPlans.some(p => p.isCustom);
          if (!hasCustomPlan) {
            this.allPlans.push({
              id: 'custom',
              name: 'Custom HRMS Software',
              price: 0,
              pricePeriod: 'month',
              description: 'Custom solutions for large organizations',
              features: [
                'AI Assistant',
                'Attendance Management',
                'Leave Management System',
                'Employee Management',
                'Timesheet Management',
                'Performance Management'
              ],
              isPopular: false,
              isCustom: true
            });
          }

          // Mark middle plan as popular if there are 3 or more plans
          if (this.allPlans.length >= 3 && !this.allPlans.some(p => p.isPopular)) {
            const middleIndex = Math.floor(this.allPlans.length / 2);
            this.allPlans[middleIndex].isPopular = true;
          }

          this.updateDisplayedPlans();
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading subscription plans:', err);
          this.error = err.message || 'Failed to load subscription plans';
          this.isLoading = false;

          // Fallback to default plans on error
          this.loadDefaultPlans();
        }
      });
  }

  loadDefaultPlans(): void {
    this.allPlans = [
      {
        id: 'starter',
        name: 'Starter',
        price: 29,
        pricePeriod: 'month',
        description: 'Perfect for small teams getting started',
        features: ['Employee Directory', 'Leave Management', 'Basic Reporting', 'Standard Support'],
        isPopular: false
      },
      {
        id: 'business',
        name: 'Business',
        price: 79,
        pricePeriod: 'month',
        description: 'For growing teams that need advanced features',
        features: ['All Starter features', 'Performance Management', 'Advanced Reporting', 'Priority Support'],
        isPopular: true
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        price: 0,
        pricePeriod: 'month',
        description: 'Custom solutions for large organizations',
        features: ['All Business features', 'Single Sign-On (SSO)', 'Custom Integrations', 'Dedicated Account Manager'],
        isPopular: false,
        isCustom: true
      }
    ];
    this.updateDisplayedPlans();
  }

  transformToPricingPlan(apiPlan: SubscriptionPlanDto): PricingPlan {
    // Extract features from JSONB object or use empty array
    let features: string[] = [];
    if (apiPlan.features) {
      if (Array.isArray(apiPlan.features)) {
        // If features is an array, convert each item to string
        features = apiPlan.features.map((f: any) => String(f));
      } else if (typeof apiPlan.features === 'object' && apiPlan.features !== null) {
        // If features is an object, convert keys/values to strings
        features = Object.entries(apiPlan.features).map(([key, value]) => {
          if (typeof value === 'string') {
            return value;
          }
          return `${key}: ${value}`;
        });
      }
    }

    // If no features from API, use default based on plan name
    if (features.length === 0) {
      features = this.getDefaultFeatures(apiPlan.name, apiPlan.maxUsers);
    }

    const price = this.billingCycle === 'monthly'
      ? (apiPlan.monthlyPrice || 0)
      : (apiPlan.annualPrice || 0);

    return {
      id: apiPlan.planId,
      name: apiPlan.name,
      price: price,
      monthlyPrice: apiPlan.monthlyPrice,
      annualPrice: apiPlan.annualPrice,
      pricePeriod: 'month', // Default, will be determined dynamically
      description: this.getDescription(apiPlan),
      features: features,
      isPopular: false, // Will be set separately
      isCustom: apiPlan.isCustom
    };
  }
getDescription(plan: SubscriptionPlanDto): string {
  // 1️⃣ Custom plans
  if (plan.isCustom) {
    return 'Custom solutions for large organizations';
  }

  // 2️⃣ Base description lines
  const lines: string[] = [];

  if (plan.maxUsers) {
    lines.push(`Perfect for teams up to ${plan.maxUsers} users`);
  } else {
    lines.push('Flexible pricing plan for your business needs');
  }

  // 3️⃣ Add status line (bold)
  const price = this.billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
  const planNameLower = plan.name.toLowerCase();

  if ((!price || price === 0) || planNameLower.includes('starter')) {
    lines.push('<strong>Active + Inactive</strong>'); // Starter / free
  } else {
    lines.push('<strong>Active Only</strong>'); // Paid plans
  }

  // Join lines with <br> so it renders properly in HTML
  return lines.join('<br>');
}



formatDescription(description: string): string {
  return description.split('\n').join('<br>');
}


  
  getDefaultFeatures(planName: string, maxUsers?: number): string[] {
    const baseFeatures = ['Employee Directory', 'Leave Management', 'Basic Reporting'];

    if (maxUsers) {
      baseFeatures.unshift(`Up to ${maxUsers} users`);
    }

    if (planName.toLowerCase().includes('starter') || planName.toLowerCase().includes('basic')) {
      return [...baseFeatures, 'Standard Support'];
    } else if (planName.toLowerCase().includes('business') || planName.toLowerCase().includes('professional')) {
      return [...baseFeatures, 'Performance Management', 'Advanced Reporting', 'Priority Support'];
    } else if (planName.toLowerCase().includes('enterprise') || planName.toLowerCase().includes('custom')) {
      return [...baseFeatures, 'Performance Management', 'Single Sign-On (SSO)', 'Custom Integrations', 'Dedicated Support'];
    }

    return baseFeatures;
  }

  updateDisplayedPlans(): void {
    const endIndex = Math.min(this.currentIndex + this.itemsPerPage, this.allPlans.length);
    this.displayedPlans = this.allPlans.slice(this.currentIndex, endIndex);
    this.plans = this.displayedPlans;
  }

  next(): void {
    if (this.canGoNext()) {
      this.currentIndex += this.itemsPerPage;
      this.updateDisplayedPlans();
    }
  }

  previous(): void {
    if (this.canGoPrevious()) {
      this.currentIndex = Math.max(0, this.currentIndex - this.itemsPerPage);
      this.updateDisplayedPlans();
    }
  }

  canGoNext(): boolean {
    return this.currentIndex + this.itemsPerPage < this.allPlans.length;
  }

  canGoPrevious(): boolean {
    return this.currentIndex > 0;
  }

  onBillingCycleChange(cycle: 'monthly' | 'annual'): void {
    this.billingCycle = cycle;
    // Prices will update automatically since getDisplayPrice uses this.billingCycle
    // Just trigger change detection
    this.updateDisplayedPlans();
  }

  toggleBillingCycle(): void {
    this.billingCycle = this.billingCycle === 'monthly' ? 'annual' : 'monthly';
    this.updateDisplayedPlans();
  }

  getDisplayPrice(plan: PricingPlan): number {
    if (plan.isCustom) return 0;
    // Use current billingCycle to get the correct price
    return this.billingCycle === 'monthly'
      ? (plan.monthlyPrice || 0)
      : (plan.annualPrice || 0);
  }

  getPriceLabel(plan: PricingPlan): string {
    if (plan.isCustom) return 'Custom';
    const price = this.getDisplayPrice(plan);
    return `$${price}`;
  }

  getCarouselIndicators(): number[] {
    const totalPages = Math.ceil(this.allPlans.length / this.itemsPerPage);
    return Array.from({ length: totalPages }, (_, i) => i);
  }

  getCurrentPageIndex(): number {
    return Math.floor(this.currentIndex / this.itemsPerPage);
  }

  goToPage(pageIndex: number): void {
    this.currentIndex = pageIndex * this.itemsPerPage;
    this.updateDisplayedPlans();
  }

  isCenterCard(index: number): boolean {
    // Check if index is valid (not negative, within displayed range)
    if (index < 0) return false;

    // When showing 3 cards, the middle one (index 1) is the center
    if (this.itemsPerPage === 3) {
      return index === 1;
    } else if (this.itemsPerPage === 2) {
      return index === 1;
    } else {
      return index === 0;
    }
  }
}

