import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-employee-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
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
      title: 'Employee Management',
      description:
        'Browse, search, and filter employee records by department, position, and status. Add new employees quickly and manage their details in a single system for streamlined HR operations.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770206963/no9mpsictyspz1pizwvi.png',
      alt: 'HR employee management'
    },
    {
      id: 2,
      title: 'Manage Departments',
      description:
        'Quickly set up and manage departments with the ability to assign managers. Streamline the onboarding process by organizing roles and departments, ensuring a seamless workflow.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770206863/egxmpgp6nbqikyxzdg1x.png',
      alt: 'employee records management'
    },
    {
      id: 3,
      title: 'Seamless Employee Onboarding',
      description:
        'Easily add new employees to the system by entering their basic information, such as name, contact details, and other personal data. Simplify the onboarding process and ensure accurate records from day one.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770207486/gna8bn9xzidfteoduyp2.png',
      alt: 'Employee Management'
    },
    {
      id: 4,
      title: 'Manage Employee Data Efficiently',
      description:
        'Easily search and filter employee records by department, position, and status. View key details such as hire date, department, and position, and take actions with just a few clicks for streamlined workforce management.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770207564/n2flmfri67gcrovvryy3.png',
      alt: 'employee management software'
    }
  ];
}
