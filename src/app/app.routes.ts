import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'features',
    loadComponent: () => import('./pages/features/features.component').then(m => m.FeaturesComponent)
  },
  {
    path: 'pricing',
    loadComponent: () => import('./pages/pricing/pricing.component').then(m => m.PricingComponent)
  },
  {
    path: 'sign-up',
    loadComponent: () => import('./pages/sign-up/sign-up.component').then(m => m.SignUpComponent)
  },
  {
    path: 'about',
    loadComponent: () => import('./pages/about/about.component').then(m => m.AboutComponent)
  },
  {
    path: 'blog',
    loadComponent: () => import('./pages/blog/blog.component').then(m => m.BlogComponent)
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./pages/privacy-policy/privacy-policy.component').then(m => m.PrivacyPolicyComponent)
  },
  {
    path: 'ai-assistant',
    loadComponent: () => import('./pages/ai-assistant/ai-assistant.component').then(m => m.AiAssistantComponent)
  },
  {
    path: 'onboarding-software',
    loadComponent: () => import('./pages/dashboard-onboarding/dashboard-onboarding.component').then(m => m.DashboardOnboardingComponent)
  },
  {
    path: 'payroll-management',
    loadComponent: () => import('./pages/payroll/payroll.component').then(m => m.PayrollComponent)
  },
  {
    path: 'attendance-management',
    loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent)
  },
  {
    path: 'performance-management',
    loadComponent: () => import('./pages/performance/performance.component').then(m => m.PerformanceComponent)
  },
  {
    path: 'timesheet-management-software',
    loadComponent: () => import('./pages/timesheet/timesheet.component').then(m => m.TimesheetComponent)
  },
  {
    path: 'employee-management',
    loadComponent: () => import('./pages/employee-management/employee-management.component').then(m => m.EmployeeManagementComponent)
  },
  {
    path: 'leave-management',
    loadComponent: () => import('./pages/leave-management/leave-management.component').then(m => m.LeaveManagementComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];

