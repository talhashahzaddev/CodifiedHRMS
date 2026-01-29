import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './leave-management.component.html',
  styleUrls: ['./leave-management.component.scss']
})
export class LeaveManagementComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Leave Management System | Efficient Leave Tracking & Requests',
    description: 'Streamline leave requests, track balances, and manage approvals with our Leave Management System for smooth and efficient HR operations.',
    focusKeyword: 'Leave Management System',
    altTags: ['employee leave management system', 'leave and attendance management system', 'hr leave management system', 'automated leave management system', 'leave management system software'] as const
  };

  constructor(
    private titleService: Title,
    private meta: Meta
  ) { }

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
      title: 'Leave Request',
      description:
        'Easily manage leave applications with a user-friendly interface. Employees can submit their leave requests directly, check their leave balance, and monitor the status of their applications.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'employee leave management system'
    },
    {
      id: 2,
      title: 'My Comp Off',
      description:
        'Provides real-time visibility into comp-off status for employees, minimizing administrative tasks.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'leave and attendance management system'
    },
    {
      id: 3,
      title: 'My Leaves',
      description:
        'Employees can view their leave history, current leave balance, and manage their time off with ease.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'hr leave management system'
    },
    {
      id: 4,
      title: 'Leave History',
      description:
        'Maintain a complete record of all leave requests for each employee, ensuring a transparent and organized history.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'automated leave management system'
    },
    {
      id: 5,
      title: 'Missed Punch Request',
      description:
        'Allows employees to request corrections for missed clock-in or clock-out times, ensuring accurate time records.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'leave management system software'
    },
    {
      id: 6,
      title: 'My Asset',
      description:
        'Managers can assign company assets to employees and track these resources effectively.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'employee leave management system'
    }
  ];
  intuitiveFeatures = [
    'Customizable Leave Policies: Adjust leave policies to match company-specific requirements, including long-term leave rules and additional leave types (e.g., study leave).',
    'Automatic Leave Tracking: Ensure employees\' leave balances are automatically updated as requests are approved.',
    'Leave Management from Any Device: Employees and managers can access leave requests and reports from their PCs, smartphones, or tablets anytime, anywhere.'
  ];
  managersDecisionMaking = [
    'Plan for Leave Shortages: Managers can view employee leave status and plan for any potential shortages of staff.',
    'Immediate Approval or Denial: Approve or deny leave requests with a few clicks, streamlining the decision-making process.',
    'Integrated Payroll Syncing: Leave approvals automatically sync with payroll, ensuring seamless integration.',
    'Comprehensive Reports: Managers have access to detailed leave reports, helping with analysis and decision-making.'
  ];
  employeesBenefits = [
    'Access to Leave Information: Employees can view their leave balance and history, ensuring transparency in their time-off records.',
    'Apply for Leave Online: Employees can submit leave applications directly from the platform, making the process efficient and hassle-free.'
  ];
  otherFeatures = [
    'Public Holiday Integration: Automatically account for public holidays when calculating leave balances.',
    'Calendar Syncing: Easily integrate with external calendars (e.g., Outlook, Google) to track leave dates.',
    'Department-Specific Approval Workflows: Tailor leave approval workflows for different departments, ensuring flexibility in the leave approval process.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Leave Calendar',
      description:
        'Visualize all leave requests in a calendar format, helping managers and employees plan effectively.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769171079/leave-calander_xbxzb8.jpg',
      alt: 'employee leave management system'
    },
    {
      id: 2,
      title: 'Approval Workflow',
      description:
        'Streamline the approval process with automated notifications, allowing managers to approve or deny leave with just a few clicks.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/pending-leave-request_mswhgd.jpg',
      alt: 'leave and attendance management system'
    },
    {
      id: 3,
      title: 'Leave Balance Tracking',
      description:
        'Keep employees informed about their available leave balance. The system automatically updates leave balances based on approved requests.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/recieved-leave-request_l7iivv.jpg',
      alt: 'hr leave management system'
    }
  ];
}
