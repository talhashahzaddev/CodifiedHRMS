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
    path: 'book-demo',
    loadComponent: () => import('./pages/book-demo/book-demo.component').then(m => m.BookDemoComponent)
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
    path: 'hrms-payroll-salary-attendance-compliance',
    loadComponent: () => import('./pages/blog/simplifies-featuer/simplifies-featuer.component').then(m => m.SimplifiesFeatuerComponent)
  },
  {
    path: 'hrms-vs-spreadsheets-for-hr-management',
    loadComponent: () => import('./pages/blog/switch-hrms/switch-hrms.component').then(m => m.SwitchHrmsComponent)
  },
  {
    path: 'choose-best-employee-attendance-tracker',
    loadComponent: () => import('./pages/blog/attendance-tracker/attendance-tracker.component').then(m => m.AttendanceTrackerComponent)
  },
  // ── Free Tools Hub Pages ──────────────────────────────────────────────────
  {
    path: 'free-workforce-tools',
    loadComponent: () =>
      import('./features/free-tools/workforce-hub/workforce-hub.component')
        .then(m => m.WorkforceHubComponent)
  },
  // ── Workforce Tool Dedicated Routes (Batch 1) ─────────────────────────────
  {
    path: 'free-workforce-tools/absence-percentage-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/absence-percentage/absence-percentage-calculator.component')
        .then(m => m.AbsencePercentageCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/schedule-variance-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/schedule-variance/schedule-variance-calculator.component')
        .then(m => m.ScheduleVarianceCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/attrition-rate-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/attrition-rate/attrition-rate-calculator.component')
        .then(m => m.AttritionRateCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/employee-retention-rate-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/employee-retention-rate/employee-retention-rate-calculator.component')
        .then(m => m.EmployeeRetentionRateCalculatorComponent)
  },
  // ── Workforce Tool Dedicated Routes (Batch 2) ─────────────────────────────
  {
    path: 'free-workforce-tools/fte-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/fte/fte-calculator.component')
        .then(m => m.FteCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/utilization-rate-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/utilization-rate/utilization-rate-calculator.component')
        .then(m => m.UtilizationRateCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/billable-hours-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/billable-hours/billable-hours-calculator.component')
        .then(m => m.BillableHoursCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/completion-percentage-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/completion-percentage/completion-percentage-calculator.component')
        .then(m => m.CompletionPercentageCalculatorComponent)
  },
  // ── Workforce Tool Dedicated Routes (Batch 3) ─────────────────────────────
  {
    path: 'free-workforce-tools/overtime-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/overtime/overtime-calculator.component')
        .then(m => m.OvertimeCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/shift-differential-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/shift-differential/shift-differential-calculator.component')
        .then(m => m.ShiftDifferentialCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/pto-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/pto/pto-calculator.component')
        .then(m => m.PtoCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/time-card-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/time-card/time-card-calculator.component')
        .then(m => m.TimeCardCalculatorComponent)
  },
  // ── Workforce Tool Dedicated Routes (Batch 4) ─────────────────────────────
  {
    path: 'free-workforce-tools/leave-encashment-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/leave-encashment/leave-encashment-calculator.component')
        .then(m => m.LeaveEncashmentCalculatorComponent)
  },
  {
    path: 'free-workforce-tools/project-cost-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/workforce/project-cost/project-cost-calculator.component')
        .then(m => m.ProjectCostCalculatorComponent)
  },
  // ── Fallback: generic ToolWrapper for remaining workforce tools ────────────
  {
    path: 'free-workforce-tools/:toolSlug',
    loadComponent: () =>
      import('./features/free-tools/tool-wrapper/tool-wrapper.component')
        .then(m => m.ToolWrapperComponent)
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  // ── Free Utility Tools Hub ────────────────────────────────────────────────
  {
    path: 'free-tools',
    loadComponent: () =>
      import('./features/free-tools/free-tools-hub/free-tools-hub.component')
        .then(m => m.FreeToolsHubComponent)
  },

  // ── Utility Tool Dedicated Routes (Batch 1 — Generators & Links) ──────────
  {
    path: 'free-tools/add-to-calendar-link-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/add-to-calendar/add-to-calendar.component')
        .then(m => m.AddToCalendarComponent)
  },
  {
    path: 'free-tools/event-qr-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/event-qr/event-qr.component')
        .then(m => m.EventQrComponent)
  },
  {
    path: 'free-tools/mailto-link-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/mailto/mailto.component')
        .then(m => m.MailtoComponent)
  },
  {
    path: 'free-tools/upi-qr-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/upi-qr/upi-qr.component')
        .then(m => m.UpiQrComponent)
  },

  // ── Utility Tool Dedicated Routes (Batch 2 — Canvas & Storage) ────────────
  {
    path: 'free-tools/banner-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/banner-generator/banner-generator.component')
        .then(m => m.BannerGeneratorComponent)
  },
  {
    path: 'free-tools/timetable-generator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/timetable/timetable.component')
        .then(m => m.TimetableComponent)
  },
  {
    path: 'free-tools/time-tracker',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/time-tracker/time-tracker.component')
        .then(m => m.TimeTrackerComponent)
  },

  // ── Utility Tool Dedicated Routes (Batch 3 — Date/Time Math) ─────────────
  {
    path: 'free-tools/time-zone-converter',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/time-zone-converter/time-zone-converter.component')
        .then(m => m.TimeZoneConverterComponent)
  },
  {
    path: 'free-tools/time-difference-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/time-difference/time-difference.component')
        .then(m => m.TimeDifferenceComponent)
  },
  {
    path: 'free-tools/age-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/age-calculator/age-calculator.component')
        .then(m => m.AgeCalculatorComponent)
  },
  {
    path: 'free-tools/age-difference-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/age-difference/age-difference.component')
        .then(m => m.AgeDifferenceComponent)
  },

  // ── Utility Tool Dedicated Routes (Batch 4 — Dev Tools) ──────────────────
  {
    path: 'free-tools/unix-timestamp-converter',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/unix-timestamp/unix-timestamp.component')
        .then(m => m.UnixTimestampComponent)
  },
  {
    path: 'free-tools/iso-time-formatter',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/iso-formatter/iso-formatter.component')
        .then(m => m.IsoFormatterComponent)
  },
  {
    path: 'free-tools/gmt-timestamp',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/gmt-timestamp/gmt-timestamp.component')
        .then(m => m.GmtTimestampComponent)
  },

  // ── Salary Tax Calculator ──────────────────────────────────────────────────
  {
    path: 'free-tools/salary-tax-calculator',
    loadComponent: () =>
      import('./features/free-tools/tools/utility/salary-tax-calculator/salary-tax-calculator.component')
        .then(m => m.SalaryTaxCalculatorComponent)
  },

  // ── Catch-all ─────────────────────────────────────────────────────────────
  {
    path: '**',
    redirectTo: ''
  }
];

