import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './employee-management.component.html',
  styleUrls: ['./employee-management.component.scss']
})
export class EmployeeManagementComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Employee Management Software | Centralized HR Employee Records | BriskPeople',
    description: 'Centralize employee data, departments, and positions with BriskPeople Employee Management. Streamline onboarding, employee records, and workforce visibility for HR and managers.',
    focusKeyword: 'Employee Management',
    altTags: ['Employee Management', 'employee management software', 'HR employee management', 'employee records management'] as const
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
      title: 'Employee Directory',
      description:
        'A single source of truth for all employee information. Search and view contact details, departments, positions, and reporting structure in one place.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'Employee Management'
    },
    {
      id: 2,
      title: 'Departments & Positions',
      description:
        'Define departments and positions to structure your workforce. Assign employees to roles and maintain clear reporting lines.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'employee management software'
    },
    {
      id: 3,
      title: 'Employee Records',
      description:
        'Store and manage comprehensive employee records including personal details, employment history, documents, and role changes.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'HR employee management'
    },
    {
      id: 4,
      title: 'Onboarding',
      description:
        'Streamline new hire onboarding with structured checklists, document collection, and role-based setup from a central module.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'employee records management'
    },
    {
      id: 5,
      title: 'Workflow & Approvals',
      description:
        'Manage employee-related workflows such as transfers, promotions, and updates with configurable approval chains.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'Employee Management'
    },
    {
      id: 6,
      title: 'My Asset',
      description:
        'Employees can view assigned assets including asset type, model, and serial number.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'employee management software'
    }
  ];
  intuitiveFeatures = [
    'Centralized employee data: One place for all employee information, departments, and positions.',
    'Configurable structure: Set up departments and positions to match your organization.',
    'Role-based access: Control who can view and edit employee records by role.',
    'Document storage: Attach and manage employee documents securely.',
    'Employment history: Track join date, role changes, and tenure in one timeline.',
    'Compliance-ready: Maintain records that align with employment and data regulations.',
    'Access from anywhere: Use the system on PC, smartphone, or tablet.'
  ];
  managersDecisionMaking = [
    'Visibility into team structure and headcount by department.',
    'Quick approval of employee-related requests (transfers, updates).',
    'Employee data stays in sync with payroll and other HR modules.',
    'Managers can access relevant employee reports via self-service.'
  ];
  employeesBenefits = [
    'View your own profile, department, and position details.',
    'Update personal information and documents through self-service where allowed.'
  ];
  otherFeatures = [
    'Automatic sync with payroll and attendance for accurate records.',
    'Integration with calendar and HR tools for a unified experience.',
    'Department-level approvers and workflows for scalable governance.',
    'Reporting and exports to Excel or CSV for audits and planning.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Employee Directory',
      description:
        'Browse and search all employees in one place. View department, position, and contact details for easier collaboration.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770039877/Self_Service_All_Employees_View_auyp7f.png',
      alt: 'HR employee management'
    },
    {
      id: 2,
      title: 'Department & Position Setup',
      description:
        'Create and maintain departments and positions. Assign employees during onboarding or when roles change.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770050945/PositionDep_Collage_fvqp2e.png',
      alt: 'employee records management'
    },
    {
      id: 3,
      title: 'Approval Workflow',
      description:
        'Submit and track employee-related requests. Managers receive notifications and can approve or decline with a few clicks.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770049386/Add_Employee_aanaij.png',
      alt: 'Employee Management'
    },
    {
      id: 4,
      title: 'Employee Records & History',
      description:
        'Keep employee records up to date. Track changes over time and ensure accuracy for payroll and compliance.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770049230/All_employee_ubhbax.png',
      alt: 'employee management software'
    }
  ];
}
