import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PricingPlan } from '../../models/pricing.model';
import { PaymentService, SubscriptionPlanDto } from '../../core/services/payment.service';
import { Subject, takeUntil } from 'rxjs';
import { Title, Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss']
})
export class PricingComponent implements OnInit, OnDestroy {

private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

readonly seo = {
  title: 'Affordable HRMS Software Price Plans | BriskPeople',
  description: 'Explore BriskPeople HRMS software price plans. Choose the right plan based on your team size and manage attendance, payroll, and performance in one system.',
  focusKeyword: 'hrms software price'
};



  billingCycle: 'monthly' | 'annual' = 'monthly';
  plans: PricingPlan[] = [];
  allPlans: PricingPlan[] = [];
  displayedPlans: PricingPlan[] = [];
  currentIndex: number = 0;
  itemsPerPage: number = 3;
  isLoading: boolean = true;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private paymentService: PaymentService,
     private titleService: Title,
    private meta: Meta
  ) { }

  ngOnInit(): void {
    this.loadSubscriptionPlans();
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
              name: 'Custom HRMS',
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
  openFaqIndex: number | null = null;

faqs = [
  { question: 'Can I change my plan later?', answer: 'Yes, you can upgrade or downgrade your plan at any time from your account settings. Prorated charges or credits will be applied automatically to your account.' },
  { question: 'What is your cancellation policy?', answer: 'You can cancel your subscription at any time. Your subscription will remain active until the end of the current billing cycle, and you will not be charged again.' },
  { question: 'Do you offer a free trial?', answer: 'Yes, we offer a 14-day free trial on our Starter and Business plans. No credit card is required to get started. You can explore all the features and decide which plan is right for you.' },
  { question: 'What payment methods do you accept?', answer: 'We accept all major credit cards, including Visa, Mastercard, and American Express. For Enterprise plans, we also support invoicing and bank transfers.' },
  { question: 'What is an HRMS and what does it do?', answer: 'An HRMS (Human Resource Management System) is software used to manage employee records, attendance, payroll, leave, and performance in one place. It helps businesses organize HR work and reduce manual tasks.' },
  { question: 'Is HRMS suitable for small businesses?', answer: 'Yes. HRMS is useful for small businesses as well as large organizations. Small teams use it to keep employee data organized, while growing businesses use it to manage HR processes more efficiently.' },
  { question: 'What problems does HRMS solve?', answer: 'HRMS helps reduce paperwork, manual tracking, and data errors. It centralizes employee information, improves attendance tracking, supports payroll processing, and keeps HR records consistent.' },
  { question: 'Do I need technical knowledge to use HRMS?', answer: 'No. Most HRMS platforms are designed to be user-friendly. HR teams and managers can use the system without technical expertise after basic setup and guidance.' },
  { question: 'Can HRMS handle payroll and attendance together?', answer: 'Yes. HRMS systems usually connect attendance data with payroll, making it easier to calculate salaries, deductions, and work hours accurately.' },
  { question: 'Is employee data secure in an HRMS?', answer: 'HRMS platforms use controlled access and data protection practices to keep employee information secure. Access is usually limited based on user roles and permissions.' },
  { question: 'Can HRMS grow as my company grows?', answer: 'Yes. HRMS is built to scale. You can add more employees, enable more features, or upgrade plans as your business and workforce expand.' },
  { question: 'How long does it take to start using an HRMS?', answer: 'Most businesses can start using an HRMS within a short time after setup. Basic employee data can be added quickly, and features can be enabled step by step.' },
  { question: 'Will HRMS replace my HR team?', answer: 'No. HRMS supports HR teams by handling repetitive tasks and organizing data. It does not replace human decision-making or people management.' },
  { question: 'What should I check before purchasing an HRMS?', answer: 'Before choosing an HRMS, check if it supports your team size, payroll needs, attendance tracking, performance management, data security, and future growth requirements.' },
];

// 2. Add this method to your component class:
toggleFaq(index: number): void {
  this.openFaqIndex = this.openFaqIndex === index ? null : index;
}
}
