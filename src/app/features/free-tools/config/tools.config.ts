/**
 * tools.config.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Single source of truth for all 28 Free Tools.
 * Used by: hub pages (for card grids), ToolWrapperComponent (for SEO + routing),
 * and individual tool components (for related-tools linking).
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type ToolCategory = 'workforce' | 'utility';

export interface ToolField {
  key: string;
  label: string;
  type: 'number' | 'text' | 'time' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  defaultValue?: string | number;
  options?: { label: string; value: string }[]; // for 'select' type
  min?: number;
  max?: number;
  step?: number;
}

export interface ToolConfig {
  slug: string;
  category: ToolCategory;
  title: string;
  subtitle: string;
  description: string;          // Short description for cards (≤ 120 chars)
  longDescription: string;      // Intro paragraph on the tool page
  icon: string;                 // Material Symbol name
  seoTitle: string;             // <title> tag
  seoDescription: string;       // <meta name="description">
  keywords: string;             // <meta name="keywords">
  ogImage?: string;             // OpenGraph image URL (falls back to site default)
  relatedSlugs: string[];       // 3–4 slugs for "Related Tools" section
  fields: ToolField[];          // Reactive Form field definitions
}

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY A — WORKFORCE TOOLS  (route: /free-workforce-tools/:slug)
// ─────────────────────────────────────────────────────────────────────────────
export const WORKFORCE_TOOLS: ToolConfig[] = [
  {
    slug: 'absence-percentage-calculator',
    category: 'workforce',
    title: 'Absence Percentage Calculator',
    subtitle: 'Measure workforce absenteeism rate in seconds',
    description: 'Calculate your team\'s absenteeism rate with a simple formula: (Absent Days ÷ (Employees × Workdays)) × 100.',
    longDescription: 'Track how much work time is being lost to absences. Enter the number of absent days, total employees, and working days in the period to get your exact absenteeism rate — a critical KPI for every HR team.',
    icon: 'person_off',
    seoTitle: 'Free Absence Percentage Calculator | Absenteeism Rate Tool — BriskPeople',
    seoDescription: 'Calculate your team\'s absence percentage and absenteeism rate instantly. Free HR tool — no sign-up required. Formula: (Absent ÷ (Employees × Workdays)) × 100.',
    keywords: 'absence percentage calculator, absenteeism rate calculator, employee absence rate, HR absenteeism formula',
    relatedSlugs: ['attrition-rate-calculator', 'employee-retention-rate-calculator', 'fte-calculator', 'utilization-rate-calculator'],
    fields: [
      { key: 'absentDays',   label: 'Total Absent Days',      type: 'number', placeholder: 'e.g. 45', defaultValue: 0, min: 0 },
      { key: 'employees',    label: 'Number of Employees',     type: 'number', placeholder: 'e.g. 50', defaultValue: 0, min: 1 },
      { key: 'workdays',     label: 'Working Days in Period',  type: 'number', placeholder: 'e.g. 22', defaultValue: 22, min: 1 }
    ]
  },
  {
    slug: 'attrition-rate-calculator',
    category: 'workforce',
    title: 'Attrition Rate Calculator',
    subtitle: 'Find out how fast you\'re losing talent',
    description: 'Calculate monthly or annual employee attrition rate: (Employees Who Left ÷ Avg Headcount) × 100.',
    longDescription: 'High attrition is costly. Use this calculator to measure how many employees are leaving relative to your average headcount, and benchmark against industry standards.',
    icon: 'trending_down',
    seoTitle: 'Free Attrition Rate Calculator | Employee Turnover Rate — BriskPeople',
    seoDescription: 'Calculate your employee attrition rate instantly. Free HR tool using the formula: (Employees Left ÷ Average Headcount) × 100. No sign-up required.',
    keywords: 'attrition rate calculator, employee turnover rate, staff attrition formula, HR turnover calculator',
    relatedSlugs: ['employee-retention-rate-calculator', 'absence-percentage-calculator', 'fte-calculator', 'utilization-rate-calculator'],
    fields: [
      { key: 'employeesLeft',     label: 'Employees Who Left',         type: 'number', placeholder: 'e.g. 8',  defaultValue: 0, min: 0 },
      { key: 'startHeadcount',    label: 'Headcount at Start of Period', type: 'number', placeholder: 'e.g. 100', defaultValue: 0, min: 1 },
      { key: 'endHeadcount',      label: 'Headcount at End of Period',   type: 'number', placeholder: 'e.g. 95', defaultValue: 0, min: 1 }
    ]
  },
  {
    slug: 'employee-retention-rate-calculator',
    category: 'workforce',
    title: 'Employee Retention Rate Calculator',
    subtitle: 'Measure how well you\'re keeping your team',
    description: 'Calculate retention rate: ((End Headcount − New Hires) ÷ Start Headcount) × 100.',
    longDescription: 'Retention rate shows the percentage of employees who stayed during a given period. A high retention rate signals a healthy workplace culture, lower recruitment costs, and stronger institutional knowledge.',
    icon: 'people',
    seoTitle: 'Free Employee Retention Rate Calculator — BriskPeople HR Tools',
    seoDescription: 'Calculate your employee retention rate instantly. Formula: ((End − New Hires) ÷ Start) × 100. Free HR calculator tool by BriskPeople.',
    keywords: 'employee retention rate calculator, staff retention formula, HR retention tool, workforce retention calculator',
    relatedSlugs: ['attrition-rate-calculator', 'absence-percentage-calculator', 'fte-calculator', 'utilization-rate-calculator'],
    fields: [
      { key: 'startHeadcount', label: 'Headcount at Start of Period', type: 'number', placeholder: 'e.g. 100', defaultValue: 0, min: 1 },
      { key: 'endHeadcount',   label: 'Headcount at End of Period',   type: 'number', placeholder: 'e.g. 92',  defaultValue: 0, min: 0 },
      { key: 'newHires',       label: 'New Hires During Period',      type: 'number', placeholder: 'e.g. 5',   defaultValue: 0, min: 0 }
    ]
  },
  {
    slug: 'time-card-calculator',
    category: 'workforce',
    title: 'Time Card Calculator',
    subtitle: 'Calculate regular hours, overtime & total pay',
    description: 'Enter clock-in/clock-out times for each day. Automatically calculates regular hours, overtime, and gross pay.',
    longDescription: 'Enter your daily clock-in and clock-out times (with optional breaks) for up to 7 days. The calculator computes regular hours (up to 8 hrs/day), overtime, total hours worked, and gross pay based on your hourly rate.',
    icon: 'schedule',
    seoTitle: 'Free Time Card Calculator — Calculate Hours Worked & Overtime | BriskPeople',
    seoDescription: 'Free online time card calculator. Enter clock-in and clock-out times to calculate total hours worked, overtime, and gross pay automatically.',
    keywords: 'time card calculator, hours worked calculator, overtime calculator, timesheet calculator, clock in clock out calculator',
    relatedSlugs: ['overtime-calculator', 'shift-differential-calculator', 'pto-calculator', 'fte-calculator'],
    fields: [
      { key: 'hourlyRate',       label: 'Hourly Rate ($)',              type: 'number', placeholder: 'e.g. 20',    defaultValue: 0, min: 0, step: 0.01 },
      { key: 'otMultiplier',     label: 'Overtime Multiplier',          type: 'number', placeholder: 'e.g. 1.5',   defaultValue: 1.5, min: 1, step: 0.25 },
      { key: 'dailyOtThreshold', label: 'Daily OT Threshold (hours)',   type: 'number', placeholder: 'e.g. 8',     defaultValue: 8, min: 1 },
      // Note: Per-day time entries are handled dynamically in the component
      { key: 'breakMins',        label: 'Daily Break (minutes)',         type: 'number', placeholder: 'e.g. 30',    defaultValue: 30, min: 0 }
    ]
  },
  {
    slug: 'overtime-calculator',
    category: 'workforce',
    title: 'Overtime Calculator',
    subtitle: 'Calculate total overtime pay instantly',
    description: 'Compute overtime pay: Base Pay + (OT Hours × Hourly Rate × Multiplier).',
    longDescription: 'Quickly calculate how much overtime an employee has earned. Supports custom overtime multipliers (1.5×, 2×, etc.) and handles both daily and weekly overtime thresholds.',
    icon: 'more_time',
    seoTitle: 'Free Overtime Calculator — Calculate OT Pay Instantly | BriskPeople',
    seoDescription: 'Calculate overtime pay instantly. Formula: Base Pay + (OT Hours × Hourly Rate × Multiplier). Free online overtime calculator — no sign-up needed.',
    keywords: 'overtime calculator, OT pay calculator, overtime pay formula, time and a half calculator',
    relatedSlugs: ['time-card-calculator', 'shift-differential-calculator', 'pto-calculator', 'leave-encashment-calculator'],
    fields: [
      { key: 'regularHours',   label: 'Regular Hours Worked',      type: 'number', placeholder: 'e.g. 40',  defaultValue: 40, min: 0 },
      { key: 'overtimeHours',  label: 'Overtime Hours',            type: 'number', placeholder: 'e.g. 8',   defaultValue: 0,  min: 0, step: 0.5 },
      { key: 'hourlyRate',     label: 'Hourly Rate ($)',            type: 'number', placeholder: 'e.g. 25',  defaultValue: 0,  min: 0, step: 0.01 },
      { key: 'otMultiplier',   label: 'OT Multiplier (e.g. 1.5)',  type: 'number', placeholder: 'e.g. 1.5', defaultValue: 1.5, min: 1, step: 0.25 }
    ]
  },
  {
    slug: 'shift-differential-calculator',
    category: 'workforce',
    title: 'Shift Differential Calculator',
    subtitle: 'Calculate shift premium pay for nights & weekends',
    description: 'Calculate extra pay for non-standard shifts: Base Rate + (Base Rate × Shift Differential %).',
    longDescription: 'Shift differentials reward employees for working evenings, nights, or weekends. Enter your base hourly rate and the differential percentage to calculate the adjusted pay rate and total shift earnings.',
    icon: 'dark_mode',
    seoTitle: 'Free Shift Differential Calculator — Night & Weekend Pay | BriskPeople',
    seoDescription: 'Calculate shift differential pay for night shifts, weekend shifts, and holiday work. Formula: Base Rate + (Base Rate × Differential %). Free HR tool.',
    keywords: 'shift differential calculator, night shift pay calculator, shift premium calculator, weekend shift pay',
    relatedSlugs: ['overtime-calculator', 'time-card-calculator', 'leave-encashment-calculator', 'pto-calculator'],
    fields: [
      { key: 'baseRate',         label: 'Base Hourly Rate ($)',      type: 'number', placeholder: 'e.g. 20',  defaultValue: 0, min: 0, step: 0.01 },
      { key: 'differential',     label: 'Shift Differential (%)',    type: 'number', placeholder: 'e.g. 15',  defaultValue: 0, min: 0, step: 0.5 },
      { key: 'hoursWorked',      label: 'Hours Worked on Shift',     type: 'number', placeholder: 'e.g. 8',   defaultValue: 8, min: 0, step: 0.5 }
    ]
  },
  {
    slug: 'pto-calculator',
    category: 'workforce',
    title: 'PTO Calculator',
    subtitle: 'Track paid time off accrual & balance',
    description: 'Calculate your PTO balance based on accrual rate, hours worked, and days already taken.',
    longDescription: 'Enter your annual PTO accrual rate, pay periods per year, and days already used to calculate your current running balance. Supports hourly accrual and annual lump-sum policies.',
    icon: 'beach_access',
    seoTitle: 'Free PTO Calculator — Calculate Paid Time Off Balance | BriskPeople',
    seoDescription: 'Calculate your PTO accrual and remaining balance instantly. Supports hourly accrual, annual grants, and partial-year calculations. Free HR tool.',
    keywords: 'PTO calculator, paid time off calculator, vacation accrual calculator, leave balance calculator',
    relatedSlugs: ['leave-encashment-calculator', 'time-card-calculator', 'overtime-calculator', 'absence-percentage-calculator'],
    fields: [
      { key: 'annualPto',       label: 'Annual PTO Days',          type: 'number', placeholder: 'e.g. 15',  defaultValue: 15, min: 0 },
      { key: 'payPeriods',      label: 'Pay Periods per Year',     type: 'number', placeholder: 'e.g. 26',  defaultValue: 26, min: 1 },
      { key: 'periodsWorked',   label: 'Pay Periods Completed',    type: 'number', placeholder: 'e.g. 13',  defaultValue: 0, min: 0 },
      { key: 'daysUsed',        label: 'PTO Days Already Used',    type: 'number', placeholder: 'e.g. 3',   defaultValue: 0, min: 0 }
    ]
  },
  {
    slug: 'leave-encashment-calculator',
    category: 'workforce',
    title: 'Leave Encashment Calculator',
    subtitle: 'Calculate tax-exempt leave encashment (India Sec 10(10AA))',
    description: 'Calculates leave encashment amount with Indian income tax exemption under Section 10(10AA) for government and private employees.',
    longDescription: 'Under Section 10(10AA) of the Indian Income Tax Act, leave encashment received at retirement or resignation is partially or fully tax-exempt. This tool applies the correct exemption formula based on employment type (government vs. private sector).',
    icon: 'currency_rupee',
    seoTitle: 'Free Leave Encashment Calculator — Section 10(10AA) Tax Exemption | BriskPeople',
    seoDescription: 'Calculate leave encashment amount and tax exemption under Section 10(10AA) for Indian employees. Free payroll tool by BriskPeople.',
    keywords: 'leave encashment calculator, section 10(10AA) exemption, leave salary calculator India, leave encashment tax free',
    relatedSlugs: ['pto-calculator', 'overtime-calculator', 'shift-differential-calculator', 'absence-percentage-calculator'],
    fields: [
      { key: 'employeeType',    label: 'Employee Type',            type: 'select', defaultValue: 'private',
        options: [{ label: 'Government Employee', value: 'govt' }, { label: 'Private Employee', value: 'private' }] },
      { key: 'basicSalary',     label: 'Last Basic Salary (₹/month)', type: 'number', placeholder: 'e.g. 50000', defaultValue: 0, min: 0 },
      { key: 'leaveBalance',    label: 'Leave Balance (days)',        type: 'number', placeholder: 'e.g. 30',    defaultValue: 0, min: 0 },
      { key: 'yearsOfService',  label: 'Years of Service',           type: 'number', placeholder: 'e.g. 10',    defaultValue: 0, min: 0, step: 0.5 }
    ]
  },
  {
    slug: 'fte-calculator',
    category: 'workforce',
    title: 'FTE Calculator',
    subtitle: 'Convert part-time hours to full-time equivalents',
    description: 'Convert part-time employee hours into Full-Time Equivalents (FTE) for accurate workforce planning.',
    longDescription: 'Full-Time Equivalent (FTE) standardizes headcount by converting part-time hours to full-time units. Essential for budgeting, capacity planning, and ACA compliance reporting.',
    icon: 'groups',
    seoTitle: 'Free FTE Calculator — Full-Time Equivalent Calculator | BriskPeople',
    seoDescription: 'Calculate Full-Time Equivalents (FTE) from part-time hours. Free workforce planning tool. Formula: Total Hours ÷ Standard Full-Time Hours.',
    keywords: 'FTE calculator, full time equivalent calculator, part time to FTE, workforce FTE formula',
    relatedSlugs: ['utilization-rate-calculator', 'absence-percentage-calculator', 'attrition-rate-calculator', 'completion-percentage-calculator'],
    fields: [
      { key: 'fullTimeHours',  label: 'Standard Full-Time Hours/Week', type: 'number', placeholder: 'e.g. 40', defaultValue: 40, min: 1 },
      { key: 'partTimeCount',  label: 'Number of Part-Time Employees', type: 'number', placeholder: 'e.g. 10', defaultValue: 0,  min: 0 },
      { key: 'avgPartTimeHrs', label: 'Avg Hours/Week (Part-Time)',    type: 'number', placeholder: 'e.g. 20', defaultValue: 0,  min: 0, step: 0.5 },
      { key: 'fullTimeCount',  label: 'Number of Full-Time Employees', type: 'number', placeholder: 'e.g. 5',  defaultValue: 0,  min: 0 }
    ]
  },
  {
    slug: 'utilization-rate-calculator',
    category: 'workforce',
    title: 'Utilization Rate Calculator',
    subtitle: 'Measure how productively your team\'s time is used',
    description: 'Calculate employee or team utilization: (Billable Hours ÷ Available Hours) × 100.',
    longDescription: 'Utilization rate tells you what percentage of your employees\' available time is spent on billable or productive work. Industry benchmarks vary by sector — this tool helps you track your current rate.',
    icon: 'pie_chart',
    seoTitle: 'Free Utilization Rate Calculator — Billable Hours Tool | BriskPeople',
    seoDescription: 'Calculate employee utilization rate: (Billable Hours ÷ Available Hours) × 100. Free HR and project management tool by BriskPeople.',
    keywords: 'utilization rate calculator, billable hours calculator, employee utilization formula, workforce productivity calculator',
    relatedSlugs: ['billable-hours-calculator', 'fte-calculator', 'completion-percentage-calculator', 'project-cost-calculator'],
    fields: [
      { key: 'billableHours',   label: 'Billable Hours',          type: 'number', placeholder: 'e.g. 120', defaultValue: 0, min: 0, step: 0.5 },
      { key: 'availableHours',  label: 'Total Available Hours',   type: 'number', placeholder: 'e.g. 160', defaultValue: 160, min: 1, step: 0.5 }
    ]
  },
  {
    slug: 'billable-hours-calculator',
    category: 'workforce',
    title: 'Billable Hours Calculator',
    subtitle: 'Forecast revenue from billable time',
    description: 'Calculate revenue from billable hours after deducting overhead and write-offs.',
    longDescription: 'Calculate potential revenue from billable hours, then apply overhead cost percentages and write-off rates to arrive at your net realized revenue. Perfect for agencies, consultancies, and professional services teams.',
    icon: 'receipt_long',
    seoTitle: 'Free Billable Hours Calculator — Revenue Forecasting Tool | BriskPeople',
    seoDescription: 'Calculate revenue from billable hours with overhead deductions and write-off rates. Free tool for agencies and professional services teams.',
    keywords: 'billable hours calculator, revenue forecasting, professional services calculator, agency revenue calculator',
    relatedSlugs: ['utilization-rate-calculator', 'project-cost-calculator', 'overtime-calculator', 'fte-calculator'],
    fields: [
      { key: 'billableHours',   label: 'Billable Hours',               type: 'number', placeholder: 'e.g. 150',  defaultValue: 0,  min: 0, step: 0.5 },
      { key: 'hourlyRate',      label: 'Billable Rate ($/hour)',        type: 'number', placeholder: 'e.g. 150',  defaultValue: 0,  min: 0, step: 0.01 },
      { key: 'overheadPct',     label: 'Overhead Cost (%)',             type: 'number', placeholder: 'e.g. 20',   defaultValue: 20, min: 0, max: 100, step: 0.5 },
      { key: 'writeOffPct',     label: 'Write-Off Rate (%)',            type: 'number', placeholder: 'e.g. 5',    defaultValue: 0,  min: 0, max: 100, step: 0.5 }
    ]
  },
  {
    slug: 'project-cost-calculator',
    category: 'workforce',
    title: 'Project Cost Calculator',
    subtitle: 'Build up full project cost with margin, tax & contingency',
    description: 'Calculate total project cost by sequentially adding margin, tax, and contingency percentages to a base cost.',
    longDescription: 'Start with your base project cost and layer on profit margin, applicable taxes, and a contingency buffer to arrive at the true total project cost. Sequential percentage additions are applied in the correct order.',
    icon: 'calculate',
    seoTitle: 'Free Project Cost Calculator — Margin, Tax & Contingency | BriskPeople',
    seoDescription: 'Calculate total project cost with sequential margin, tax, and contingency additions. Free tool for project managers and HR professionals.',
    keywords: 'project cost calculator, project budget calculator, total cost with margin, project contingency calculator',
    relatedSlugs: ['billable-hours-calculator', 'utilization-rate-calculator', 'completion-percentage-calculator', 'schedule-variance-calculator'],
    fields: [
      { key: 'baseCost',        label: 'Base Project Cost ($)',    type: 'number', placeholder: 'e.g. 50000', defaultValue: 0, min: 0, step: 0.01 },
      { key: 'marginPct',       label: 'Profit Margin (%)',        type: 'number', placeholder: 'e.g. 20',    defaultValue: 20, min: 0, max: 100, step: 0.5 },
      { key: 'taxPct',          label: 'Tax Rate (%)',             type: 'number', placeholder: 'e.g. 10',    defaultValue: 0,  min: 0, max: 100, step: 0.5 },
      { key: 'contingencyPct',  label: 'Contingency Buffer (%)',   type: 'number', placeholder: 'e.g. 5',     defaultValue: 5,  min: 0, max: 100, step: 0.5 }
    ]
  },
  {
    slug: 'completion-percentage-calculator',
    category: 'workforce',
    title: 'Completion Percentage Calculator',
    subtitle: 'Track task or project completion progress',
    description: 'Calculate what percentage of work is complete: (Completed Tasks ÷ Total Tasks) × 100.',
    longDescription: 'Whether you\'re tracking project milestones, task lists, or KPIs, this tool quickly calculates your completion percentage so you can report progress accurately.',
    icon: 'check_circle',
    seoTitle: 'Free Completion Percentage Calculator — Project Progress Tool | BriskPeople',
    seoDescription: 'Calculate project or task completion percentage instantly. Formula: (Completed ÷ Total) × 100. Free progress tracking tool by BriskPeople.',
    keywords: 'completion percentage calculator, project progress calculator, task completion rate, percentage complete formula',
    relatedSlugs: ['schedule-variance-calculator', 'project-cost-calculator', 'utilization-rate-calculator', 'fte-calculator'],
    fields: [
      { key: 'completed',  label: 'Completed Tasks / Units',  type: 'number', placeholder: 'e.g. 75', defaultValue: 0, min: 0 },
      { key: 'total',      label: 'Total Tasks / Units',       type: 'number', placeholder: 'e.g. 100', defaultValue: 0, min: 1 }
    ]
  },
  {
    slug: 'schedule-variance-calculator',
    category: 'workforce',
    title: 'Schedule Variance Calculator',
    subtitle: 'Measure project schedule performance using Earned Value',
    description: 'Calculate Schedule Variance (SV) using Earned Value Management: SV = Earned Value (EV) − Planned Value (PV).',
    longDescription: 'Schedule Variance is a key Earned Value Management (EVM) metric. A positive SV means you\'re ahead of schedule; negative means you\'re behind. This tool also calculates the Schedule Performance Index (SPI = EV ÷ PV).',
    icon: 'event_note',
    seoTitle: 'Free Schedule Variance Calculator — Earned Value Management Tool | BriskPeople',
    seoDescription: 'Calculate Schedule Variance (SV) and Schedule Performance Index (SPI) using Earned Value Management. Free project management tool.',
    keywords: 'schedule variance calculator, earned value management, SV EVM calculator, project schedule performance index SPI',
    relatedSlugs: ['completion-percentage-calculator', 'project-cost-calculator', 'billable-hours-calculator', 'utilization-rate-calculator'],
    fields: [
      { key: 'earnedValue',    label: 'Earned Value — EV ($)',   type: 'number', placeholder: 'e.g. 45000', defaultValue: 0, min: 0, step: 0.01 },
      { key: 'plannedValue',   label: 'Planned Value — PV ($)',  type: 'number', placeholder: 'e.g. 50000', defaultValue: 0, min: 0, step: 0.01 }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// CATEGORY B — UTILITY & DEV TOOLS  (route: /free-tools/:slug)
// ─────────────────────────────────────────────────────────────────────────────
export const UTILITY_TOOLS: ToolConfig[] = [
  {
    slug: 'add-to-calendar-link-generator',
    category: 'utility',
    title: 'Add to Calendar Link Generator',
    subtitle: 'Generate calendar links for Google, Outlook, Yahoo & .ics',
    description: 'Generate "Add to Calendar" links for Google Calendar, Outlook, Yahoo Calendar, and download a standard .ics file.',
    longDescription: 'Paste your event details and instantly get shareable "Add to Calendar" links for all major calendar platforms, plus a downloadable .ics file for any calendar app.',
    icon: 'event',
    seoTitle: 'Free Add to Calendar Link Generator — Google, Outlook, Yahoo & ICS | BriskPeople',
    seoDescription: 'Generate Add to Calendar links for Google Calendar, Outlook, Yahoo, and .ics download in seconds. Free event tool by BriskPeople.',
    keywords: 'add to calendar link generator, google calendar link, ICS file generator, outlook calendar link, event link generator',
    relatedSlugs: ['event-qr-generator', 'time-zone-converter', 'time-difference-calculator', 'timetable-generator'],
    fields: [
      { key: 'title',       label: 'Event Title',         type: 'text',     placeholder: 'e.g. Team Meeting' },
      { key: 'startDate',   label: 'Start Date',          type: 'date' },
      { key: 'startTime',   label: 'Start Time',          type: 'time',     defaultValue: '09:00' },
      { key: 'endDate',     label: 'End Date',            type: 'date' },
      { key: 'endTime',     label: 'End Time',            type: 'time',     defaultValue: '10:00' },
      { key: 'location',    label: 'Location (optional)', type: 'text',     placeholder: 'e.g. Zoom / Office 3' },
      { key: 'description', label: 'Description',         type: 'text',     placeholder: 'Brief event notes...' }
    ]
  },
  {
    slug: 'event-qr-generator',
    category: 'utility',
    title: 'Event QR Code Generator',
    subtitle: 'Create QR codes that add events to any calendar',
    description: 'Generate a scannable QR code for your event that opens directly in Google Calendar, Apple Calendar, or any QR-reading app.',
    longDescription: 'Create a QR code encoded with your event details (vCard / iCal format) so attendees can add your event to their calendars just by scanning. Download as PNG.',
    icon: 'qr_code_2',
    seoTitle: 'Free Event QR Code Generator — Calendar QR Code | BriskPeople',
    seoDescription: 'Generate a QR code for your event that adds it to Google Calendar, Apple Calendar, and more. Free event QR code tool by BriskPeople.',
    keywords: 'event QR code generator, calendar QR code, Google Calendar QR code, event invite QR',
    relatedSlugs: ['add-to-calendar-link-generator', 'upi-qr-generator', 'mailto-link-generator', 'banner-generator'],
    fields: [
      { key: 'title',       label: 'Event Title',   type: 'text', placeholder: 'e.g. Annual HR Summit' },
      { key: 'startDate',   label: 'Start Date',    type: 'date' },
      { key: 'startTime',   label: 'Start Time',    type: 'time', defaultValue: '09:00' },
      { key: 'endDate',     label: 'End Date',      type: 'date' },
      { key: 'endTime',     label: 'End Time',      type: 'time', defaultValue: '10:00' },
      { key: 'location',    label: 'Location',      type: 'text', placeholder: 'e.g. Lahore, Pakistan' }
    ]
  },
  {
    slug: 'banner-generator',
    category: 'utility',
    title: 'Banner Generator',
    subtitle: 'Design and download web banners as PNG',
    description: 'Create custom text banners using HTML5 Canvas. Customize colors, fonts, and text, then download as PNG.',
    longDescription: 'Design simple promotional, announcement, or event banners directly in your browser using HTML5 Canvas. No design software needed — choose your background color, text, font size, and download the result as a PNG.',
    icon: 'image',
    seoTitle: 'Free Online Banner Generator — Create & Download Web Banners | BriskPeople',
    seoDescription: 'Create custom web banners online using HTML5 Canvas. Download as PNG. Free banner maker tool by BriskPeople — no design skills required.',
    keywords: 'banner generator, online banner maker, web banner creator, HTML5 canvas banner, PNG banner download',
    relatedSlugs: ['event-qr-generator', 'upi-qr-generator', 'mailto-link-generator', 'add-to-calendar-link-generator'],
    fields: [
      { key: 'text',        label: 'Banner Text',           type: 'text',   placeholder: 'e.g. Sale Ends Today!' },
      { key: 'subtext',     label: 'Sub-text (optional)',   type: 'text',   placeholder: 'e.g. Use code SAVE20' },
      { key: 'bgColor',     label: 'Background Color',      type: 'text',   defaultValue: '#0071e6' },
      { key: 'textColor',   label: 'Text Color',            type: 'text',   defaultValue: '#ffffff' },
      { key: 'fontSize',    label: 'Font Size (px)',         type: 'number', defaultValue: 42, min: 12, max: 120 },
      { key: 'width',       label: 'Width (px)',             type: 'number', defaultValue: 1200, min: 300 },
      { key: 'height',      label: 'Height (px)',            type: 'number', defaultValue: 628, min: 100 }
    ]
  },
  {
    slug: 'mailto-link-generator',
    category: 'utility',
    title: 'Mailto Link Generator',
    subtitle: 'Build perfectly encoded mailto: links',
    description: 'Generate a properly URL-encoded mailto: link with pre-filled To, CC, BCC, Subject, and Body.',
    longDescription: 'Manually building mailto links with special characters can break. This tool properly URL-encodes all fields so your mailto link works perfectly across all email clients and browsers.',
    icon: 'alternate_email',
    seoTitle: 'Free Mailto Link Generator — Encoded Email Link Builder | BriskPeople',
    seoDescription: 'Generate properly URL-encoded mailto links with pre-filled To, CC, BCC, Subject, and Body. Free email link builder tool by BriskPeople.',
    keywords: 'mailto link generator, email link builder, mailto URL encoder, mailto with subject body',
    relatedSlugs: ['add-to-calendar-link-generator', 'event-qr-generator', 'banner-generator', 'upi-qr-generator'],
    fields: [
      { key: 'to',       label: 'To',              type: 'text', placeholder: 'e.g. contact@company.com' },
      { key: 'cc',       label: 'CC (optional)',    type: 'text', placeholder: 'e.g. manager@company.com' },
      { key: 'bcc',      label: 'BCC (optional)',   type: 'text', placeholder: 'e.g. hr@company.com' },
      { key: 'subject',  label: 'Subject',          type: 'text', placeholder: 'e.g. Application for HR Manager' },
      { key: 'body',     label: 'Body',             type: 'text', placeholder: 'Dear Hiring Manager,...' }
    ]
  },
  {
    slug: 'time-zone-converter',
    category: 'utility',
    title: 'Time Zone Converter',
    subtitle: 'Convert time across multiple zones with a visual timeline',
    description: 'Convert a time between any two time zones with a visual 24-hour timeline using the native Intl API.',
    longDescription: 'Select a source time and timezone, then see the equivalent time in multiple target time zones displayed on an interactive 24-hour visual timeline — great for scheduling international meetings.',
    icon: 'public',
    seoTitle: 'Free Time Zone Converter — Visual Timeline Tool | BriskPeople',
    seoDescription: 'Convert time between any world time zones with a visual 24-hour timeline. Free timezone converter tool by BriskPeople.',
    keywords: 'time zone converter, world clock converter, timezone calculator, convert time zones, UTC converter',
    relatedSlugs: ['time-difference-calculator', 'unix-timestamp-converter', 'iso-time-formatter', 'gmt-timestamp'],
    fields: [
      { key: 'sourceTime',  label: 'Source Time', type: 'time', defaultValue: '09:00' },
      { key: 'sourceZone',  label: 'Source Time Zone', type: 'text', defaultValue: 'Asia/Karachi' },
      { key: 'targetZone1', label: 'Target Zone 1',    type: 'text', defaultValue: 'America/New_York' },
      { key: 'targetZone2', label: 'Target Zone 2',    type: 'text', defaultValue: 'Europe/London' },
      { key: 'targetZone3', label: 'Target Zone 3',    type: 'text', defaultValue: 'Asia/Tokyo' }
    ]
  },
  {
    slug: 'time-difference-calculator',
    category: 'utility',
    title: 'Time Difference Calculator',
    subtitle: 'Exact duration between two dates and times',
    description: 'Calculate the exact difference between two dates in years, months, days, hours, and minutes.',
    longDescription: 'Enter any two date-times to get the precise duration between them, broken down into years, months, days, hours, and minutes. Useful for calculating contract durations, employment tenure, or project timelines.',
    icon: 'timer',
    seoTitle: 'Free Time Difference Calculator — Exact Duration Between Two Dates | BriskPeople',
    seoDescription: 'Calculate the exact time difference between two dates in years, months, days, hours, and minutes. Free online date duration calculator.',
    keywords: 'time difference calculator, date duration calculator, days between dates, time elapsed calculator',
    relatedSlugs: ['age-calculator', 'age-difference-calculator', 'time-zone-converter', 'unix-timestamp-converter'],
    fields: [
      { key: 'startDate', label: 'Start Date', type: 'date' },
      { key: 'startTime', label: 'Start Time', type: 'time', defaultValue: '00:00' },
      { key: 'endDate',   label: 'End Date',   type: 'date' },
      { key: 'endTime',   label: 'End Time',   type: 'time', defaultValue: '00:00' }
    ]
  },
  {
    slug: 'timetable-generator',
    category: 'utility',
    title: 'Timetable Generator',
    subtitle: 'Build weekly schedules — save, export to CSV or PNG',
    description: 'Create a visual weekly timetable, save it locally, and export as CSV or PNG.',
    longDescription: 'Design a weekly schedule grid with custom time slots and activities. Your timetable is saved to localStorage so it persists between visits. Export to CSV for spreadsheets or PNG for sharing.',
    icon: 'table_chart',
    seoTitle: 'Free Timetable Generator — Weekly Schedule Maker | BriskPeople',
    seoDescription: 'Create a weekly timetable online and export it as CSV or PNG. Free schedule generator tool by BriskPeople. Auto-saves in your browser.',
    keywords: 'timetable generator, weekly schedule maker, class schedule creator, work schedule generator, timetable maker',
    relatedSlugs: ['time-tracker', 'time-card-calculator', 'add-to-calendar-link-generator', 'time-difference-calculator'],
    fields: [] // grid-based input — handled dynamically in the component
  },
  {
    slug: 'time-tracker',
    category: 'utility',
    title: 'Time Tracker',
    subtitle: 'Stopwatch timer with session logging',
    description: 'Start/stop a stopwatch timer, log multiple sessions with labels, and save them to your browser.',
    longDescription: 'A simple, distraction-free time tracker. Hit Start to begin timing, Stop to pause, and Log to save the session with a task label. All sessions persist in localStorage and can be exported.',
    icon: 'timer',
    seoTitle: 'Free Online Time Tracker — Stopwatch & Session Logger | BriskPeople',
    seoDescription: 'Track time with a browser-based stopwatch. Log task sessions and export. Free time tracker tool by BriskPeople.',
    keywords: 'time tracker, online stopwatch, task time tracker, browser time logger, free time tracking tool',
    relatedSlugs: ['timetable-generator', 'time-card-calculator', 'billable-hours-calculator', 'utilization-rate-calculator'],
    fields: [
      { key: 'taskLabel', label: 'Task / Project Label', type: 'text', placeholder: 'e.g. Feature Development' }
    ]
  },
  {
    slug: 'unix-timestamp-converter',
    category: 'utility',
    title: 'Unix Timestamp Converter',
    subtitle: 'Bidirectional Epoch ↔ human date conversion',
    description: 'Convert Unix epoch timestamps to human-readable dates and vice versa, in any timezone.',
    longDescription: 'Enter a Unix timestamp (seconds or milliseconds) to get the human-readable date, or enter a date to get its Unix timestamp. Supports both second-precision and millisecond-precision epoch values.',
    icon: 'data_object',
    seoTitle: 'Free Unix Timestamp Converter — Epoch to Date | BriskPeople',
    seoDescription: 'Convert Unix timestamps to human-readable dates and dates to Unix timestamps. Supports seconds and milliseconds. Free online epoch converter.',
    keywords: 'unix timestamp converter, epoch to date, date to unix timestamp, epoch converter, unix time calculator',
    relatedSlugs: ['iso-time-formatter', 'gmt-timestamp', 'time-zone-converter', 'time-difference-calculator'],
    fields: [
      { key: 'epoch',     label: 'Unix Timestamp (seconds)', type: 'number', placeholder: 'e.g. 1700000000' },
      { key: 'humanDate', label: 'Human Date',               type: 'date' },
      { key: 'humanTime', label: 'Human Time',               type: 'time', defaultValue: '00:00' }
    ]
  },
  {
    slug: 'iso-time-formatter',
    category: 'utility',
    title: 'ISO Time Formatter',
    subtitle: 'Generate all ISO 8601 date-time variations',
    description: 'Enter a date and time to generate all ISO 8601 format variations: UTC, local offset, week number, ordinal, and more.',
    longDescription: 'ISO 8601 has many representations. Enter your date and this tool outputs every standard variation — full datetime with offset, UTC "Z" notation, week date, ordinal date — ready to copy.',
    icon: 'format_list_bulleted',
    seoTitle: 'Free ISO 8601 Time Formatter — Date Format Generator | BriskPeople',
    seoDescription: 'Generate all ISO 8601 date format variations from a single date input. UTC, offset, week number, ordinal. Free date formatter tool.',
    keywords: 'ISO 8601 formatter, date format generator, ISO date converter, UTC ISO format, ISO week date',
    relatedSlugs: ['unix-timestamp-converter', 'gmt-timestamp', 'time-zone-converter', 'time-difference-calculator'],
    fields: [
      { key: 'inputDate', label: 'Date',      type: 'date' },
      { key: 'inputTime', label: 'Time',      type: 'time', defaultValue: '00:00' },
      { key: 'timezone',  label: 'Time Zone', type: 'text', defaultValue: 'Asia/Karachi' }
    ]
  },
  {
    slug: 'gmt-timestamp',
    category: 'utility',
    title: 'GMT Timestamp Tool',
    subtitle: 'Get current UTC/GMT time with all offsets and Unix ms',
    description: 'View the current UTC/GMT time, Unix timestamp in seconds and milliseconds, and offsets for common time zones.',
    longDescription: 'A live, auto-refreshing display of the current UTC/GMT time along with Unix timestamps (seconds and milliseconds), and a table of UTC offsets for the most common time zones worldwide.',
    icon: 'language',
    seoTitle: 'Free GMT Timestamp Tool — Current UTC Time & Unix Milliseconds | BriskPeople',
    seoDescription: 'Get the current GMT/UTC time, Unix timestamp in seconds and milliseconds, and UTC offsets for all major time zones. Free online tool.',
    keywords: 'GMT timestamp, UTC time now, current unix timestamp, UTC offset calculator, what is the current GMT time',
    relatedSlugs: ['unix-timestamp-converter', 'iso-time-formatter', 'time-zone-converter', 'time-difference-calculator'],
    fields: [] // live display — no form inputs needed
  },
  {
    slug: 'upi-qr-generator',
    category: 'utility',
    title: 'UPI QR Code Generator',
    subtitle: 'Generate UPI payment QR codes instantly',
    description: 'Generate a standardized UPI payment QR code from your UPI ID, amount, and payee name.',
    longDescription: 'Create a UPI QR code using the standard UPI URI format (`upi://pay?pa=...`). Paste your UPI ID, set the amount and currency, add your name — and download the QR code as PNG.',
    icon: 'qr_code',
    seoTitle: 'Free UPI QR Code Generator — Instant UPI Payment QR | BriskPeople',
    seoDescription: 'Generate a UPI QR code from your UPI ID, amount, and payee name. Standard UPI URI format. Free UPI QR generator tool by BriskPeople.',
    keywords: 'UPI QR code generator, UPI payment QR, UPI ID QR code, GPay QR code, PhonePe QR code, UPI URI generator',
    relatedSlugs: ['event-qr-generator', 'banner-generator', 'mailto-link-generator', 'add-to-calendar-link-generator'],
    fields: [
      { key: 'upiId',    label: 'UPI ID (VPA)',          type: 'text',   placeholder: 'e.g. yourname@okicici' },
      { key: 'name',     label: 'Payee Name',            type: 'text',   placeholder: 'e.g. BriskPeople Ltd.' },
      { key: 'amount',   label: 'Amount (₹)',            type: 'number', placeholder: 'e.g. 500', min: 0, step: 0.01 },
      { key: 'note',     label: 'Transaction Note',      type: 'text',   placeholder: 'e.g. Invoice #1045' }
    ]
  },
  {
    slug: 'age-calculator',
    category: 'utility',
    title: 'Age Calculator',
    subtitle: 'Calculate exact age and next birthday countdown',
    description: 'Calculate your exact age in years, months, days, hours, and minutes, plus a countdown to your next birthday.',
    longDescription: 'Enter a date of birth to get the precise age in years, months, and days — along with how many days remain until the next birthday. Also useful for HR to calculate employee tenure.',
    icon: 'cake',
    seoTitle: 'Free Age Calculator — Exact Age in Years, Months & Days | BriskPeople',
    seoDescription: 'Calculate your exact age and next birthday countdown. Free online age calculator by BriskPeople. Works for any date of birth.',
    keywords: 'age calculator, how old am I calculator, date of birth age calculator, birthday countdown calculator',
    relatedSlugs: ['age-difference-calculator', 'time-difference-calculator', 'time-card-calculator', 'unix-timestamp-converter'],
    fields: [
      { key: 'dob',       label: 'Date of Birth',     type: 'date' },
      { key: 'asOfDate',  label: 'Calculate Age As Of', type: 'date' }
    ]
  },
  {
    slug: 'age-difference-calculator',
    category: 'utility',
    title: 'Age Difference Calculator',
    subtitle: 'Calculate the exact gap between two dates of birth',
    description: 'Calculate the exact age difference between two people in years, months, and days.',
    longDescription: 'Enter two dates of birth to find the precise age gap between two people. The result is shown in years, months, and days — useful for HR, medical, or administrative purposes.',
    icon: 'compare_arrows',
    seoTitle: 'Free Age Difference Calculator — Gap Between Two Birthdates | BriskPeople',
    seoDescription: 'Calculate the exact age difference between two people in years, months, and days. Free online age gap calculator by BriskPeople.',
    keywords: 'age difference calculator, age gap calculator, birthday difference calculator, two dates age difference',
    relatedSlugs: ['age-calculator', 'time-difference-calculator', 'time-zone-converter', 'unix-timestamp-converter'],
    fields: [
      { key: 'dob1', label: 'First Date of Birth',  type: 'date' },
      { key: 'dob2', label: 'Second Date of Birth', type: 'date' }
    ]
  }
];

// ─────────────────────────────────────────────────────────────────────────────
// Combined lookup map (slug → config)
// ─────────────────────────────────────────────────────────────────────────────
export const ALL_TOOLS: ToolConfig[] = [...WORKFORCE_TOOLS, ...UTILITY_TOOLS];

export const TOOL_MAP: Record<string, ToolConfig> = ALL_TOOLS.reduce(
  (map, tool) => ({ ...map, [tool.slug]: tool }),
  {} as Record<string, ToolConfig>
);

/** Resolve a tool config by slug. Returns undefined if slug is not found. */
export function getToolBySlug(slug: string): ToolConfig | undefined {
  return TOOL_MAP[slug];
}

/** Get related tools for a given slug (resolves slugs to full configs). */
export function getRelatedTools(slug: string): ToolConfig[] {
  const tool = TOOL_MAP[slug];
  if (!tool) return [];
  return tool.relatedSlugs
    .map(s => TOOL_MAP[s])
    .filter((t): t is ToolConfig => !!t);
}

/** Alias used by ToolWrapperComponent */
export const getAllRelatedTools = getRelatedTools;
