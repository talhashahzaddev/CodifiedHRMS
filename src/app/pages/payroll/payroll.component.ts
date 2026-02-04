import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-payroll',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './payroll.component.html',
  styleUrls: ['./payroll.component.scss']
})
export class PayrollComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Payroll Management Software for Accurate Salary Processing | BriskPeople',
    description: 'Automate payroll processing with accurate salary calculations, payslips, deductions, and employee self-service. Simple, secure payroll management with BriskPeople.',
    focusKeyword: 'payroll management software',
    altTags: ['Payroll Management', 'payroll management system', 'payroll management software', 'managed payroll services', 'payroll management services', 'payroll in human resource management'] as const
  };

  constructor(
    private titleService: Title,
    private meta: Meta
  ) {}

  ngOnInit(): void {
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
  }

  features = [
    {
      id: 1,
      title: 'Payroll Processing',
      description:
        'Automate salary calculations using attendance, leave, and approved data. Run payroll software accurately each cycle with minimal manual effort.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'Payroll Management'
    },
    {
      id: 2,
      title: 'Payslips',
      description:
        'Generate and share digital payslips that clearly show earnings and deductions. Employees can access and download them anytime.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'payroll management system'
    },
    {
      id: 3,
      title: 'Tax & Compliance',
      description:
        'Manage payroll taxes and statutory requirements in line with company policies. Keep payroll records consistent and organised.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'payroll management software'
    },
    {
      id: 4,
      title: 'Deductions',
      description:
        'Handle salary deductions such as loans, advances, or benefits accurately. All deductions are reflected clearly in payroll and payslips.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'managed payroll services'
    },
    {
      id: 5,
      title: 'Overtime',
      description:
        'Calculate overtime pay based on approved extra working hours. Ensure overtime is included correctly in salary processing.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'payroll management services'
    },
    {
      id: 6,
      title: 'Salary History',
      description:
        'Maintain a complete record of past payroll cycles for reference. Employees and HR can review salary history whenever needed.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'payroll in human resource management'
    }
  ];
  intuitiveFeatures = [
    'Configure payroll rules based on company policies and pay cycles',
    'Automate salary calculations using attendance, leave, and overtime data',
    'Define and manage different salary structures across teams or locations',
    'Support multiple payroll policies for different countries or regions',
    'Apply deductions, bonuses, and adjustments with clear approval controls',
    'Control payroll access levels for HR, finance, and managers',
    'Access payroll data securely from desktop, tablet, or mobile devices'
  ];
  managersDecisionMaking = [
    'Review and approve payroll inputs with clear records and accountability',
    'Reduce payroll errors through accurate, system-driven data',
    'Save time by managing approvals and updates from a single, organised view'
  ];
  employeesBenefits = [
    'View and download payslips with clear and accurate salary breakdowns',
    'Understand deductions, taxes, and net pay in a simple, easy-to-follow format',
    'Access complete payroll and salary history from previous pay cycles',
    'Check payroll details securely from any device at any time',
    'Use a straightforward self-service portal on desktop or mobile'
  ];
  otherFeatures = [
    'Calendar Integration',
    'Payroll Reports Export',
    'Custom Payroll Rules',
    'Multi-Approver Setup'
  ];
  employeeService = [
    {
      id: 1,
      title: 'View Payslips',
      description:
        'Employees can view and download payslips with clear and accurate salary breakdowns, understanding deductions, taxes, and net pay in a simple format.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770053015/salary_slips_slccwg.png',
      alt: 'Payroll Management'
    },
    {
      id: 2,
      title: 'Salary History',
      description:
        'Access complete payroll and salary history from previous pay cycles. Employees and HR can review records whenever needed.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770052925/salary_reports_spqt1q.png',
      alt: 'payroll management system'
    },
    {
      id: 3,
      title: 'Payroll Approvals',
      description:
        'Managers can review and approve payroll inputs with clear records and accountability, reducing errors through accurate, system-driven data.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770117918/process_payroll_zujfpl.png',
      alt: 'payroll management software'
    },
    {
      id: 4,
      title: 'Deductions & Tax',
      description:
        'Handle salary deductions such as loans, advances, or benefits accurately. All deductions and tax details are reflected clearly in payroll and payslips.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770117765/salary_component_v6heph.png',
      alt: 'managed payroll services'
    }
  ];
}
