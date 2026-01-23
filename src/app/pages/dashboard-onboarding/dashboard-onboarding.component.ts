import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-onboarding',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './dashboard-onboarding.component.html',
  styleUrls: ['./dashboard-onboarding.component.scss']
})

export class DashboardOnboardingComponent {
  features = [
    {
      id: 1,
      title: 'Leave Request',
      description:
        'A technology that enables managers or supervisors to oversee and accept or deny requests for leave made electronically by employees',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
    },
    {
      id: 2,
      title: 'My Comp Off',
      description:
        'Minimises administrative work and offers real-time visibility into comp off status and usage.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
    },
    {
      id: 3,
      title: 'My Leaves',
      description:
        'Provides real-time visibility into leave status and helps employees plan their time off wisely.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
    },
    {
      id: 4,
      title: 'Leave History',
      description:
        'Gives employees a complete and accurate record of their previous leave history.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
    },
    {
      id: 5,
      title: 'Missed Punch Request',
      description:
        'Allows employees to request corrections when attendance punch-in or punch-out is missed.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
    },
    {
      id: 6,
      title: 'My Asset',
      description:
        'Employees can view assigned assets including asset type, model, and serial number.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
    }
  ];
  intuitiveFeatures = [
    'Customise the leave function to match company policies.',
    'Manage advanced leave requirements.',
    'Automatically monitor the sick leave rule.',
    'Automatically track leave balances.',
    'Set up advanced rules, e.g., long-service leave policies.',
    'Include all leave types that comply with employment laws.',
    'Set up additional leave types, such as study leave.',
    'Access system anywhere, anytime, from the PC, smartphone, or tablet.'
  ];
  managersDecisionMaking = [
    'Plan to avoid staff shortages.',
    'Immediate approval or decline of leave.',
    'The updated leave is synced with payroll.',
    'Line managers can access all leave management reports via ESS.'
  ];
  employeesBenefits = [
    'Employee access to leave balance and history.',
    'Apply for leave online or from the smartphone app.'
  ];
  otherFeatures = [
    'ImageAutomatically take public holidays into account.',
    'Star Icon ImageIntegrate your leave calendar with Outlook, Google or other calendars.',
    'Star Icon ImageSet-up departments with different approvers.',
    'Star Icon ImageComprehensive reporting with exports to Excel or CSV.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Leave Calendar',
      description:
        'Visualise all leaves in a single calendar view. Managers and employees can easily identify upcoming leaves and plan accordingly.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769171079/leave-calander_xbxzb8.jpg',
    },
    {
      id: 2,
      title: 'Leave Request',
      description:
        'Simplify the leave application process with an intuitive interface. Employees can submit leave requests, view their leave balance, and track the status of their applications.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/pending-leave-request_mswhgd.jpg',
    },
    {
      id: 3,
      title: 'Approval Workflow',
      description:
        'Enable managers to efficiently review and approve leave requests. The system notifies managers of pending requests and allows them to approve or decline with just a few clicks.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/recieved-leave-request_l7iivv.jpg',
    },
    {
      id: 4,
      title: 'Leave Balance Tracking',
      description:
        'Keep employees informed about their available leave balance. The system automatically updates leave balances based on approved requests, ensuring accuracy and transparency.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769174261/leave-balance_hchqzn.png',
    }
  ]
}
