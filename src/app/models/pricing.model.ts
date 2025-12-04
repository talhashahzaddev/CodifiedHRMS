export interface PricingPlan {
  id: string;
  name: string;
  price: number;
  pricePeriod: 'month' | 'year';
  description: string;
  features: string[];
  isPopular?: boolean;
  isCustom?: boolean;
}

