import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './timesheet.component.html',
  styleUrls: ['./timesheet.component.scss']
})
export class TimesheetComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Timesheet Management Software | Streamline Employee Time Tracking | BriskPeople',
    description: 'Simplify employee time tracking and payroll with our Timesheet Management Software. Automate timesheet approvals, manage attendance, and reduce errors.',
    focusKeyword: 'Timesheet Management Software',
    altTags: ['employee timesheet management system', 'timesheet management systems', 'Employee Time Tracking', 'Time Tracking Software', 'Automated Timesheets'] as const
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
      title: 'Employee Time Tracking',
      description:
        'Automatically capture and track employee work hours with an intuitive, user-friendly interface. Ensure accurate time data for better payroll management.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'employee timesheet management system'
    },
    {
      id: 2,
      title: 'Automated Time Entries',
      description:
        'Minimize errors and reduce manual work with automated time entries based on employee schedules or clock-ins, providing real-time updates.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'timesheet management systems'
    },
    {
      id: 3,
      title: 'Customizable Timesheet Templates',
      description:
        'Tailor the timesheet to your company\'s needs whether you require daily, weekly, or project-based time reporting, it\'s all possible with our flexible system.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'Employee Time Tracking'
    },
    {
      id: 4,
      title: 'Advanced Reporting',
      description:
        'Generate detailed reports on employee time worked, overtime, absences, and more. Use data-driven insights to manage labor costs efficiently.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'Time Tracking Software'
    },
    {
      id: 5,
      title: 'Seamless Integration',
      description:
        'Our software integrates with payroll, HR systems, and project management tools to streamline your operations and save valuable time.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'Automated Timesheets'
    },
    {
      id: 6,
      title: 'Mobile Time Tracking',
      description:
        'Allow employees to clock in and out via a mobile app, ensuring accurate time tracking whether they\'re in the office or working remotely.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'employee timesheet management system'
    }
  ];
  intuitiveFeatures = [
    'Simple Time Tracking: Easily track employee hours from any device, whether they\'re working in-office, remotely, or on the go.',
    'Real-Time Monitoring: Get up-to-the-minute visibility into work hours, missed punch-ins, and overtime; manage discrepancies instantly.',
    'Custom Alerts & Notifications: Set up automated reminders for employees to submit their timesheets, or notify managers when discrepancies arise.',
    'Detailed Analytics: Use built-in analytics to monitor attendance trends, identify patterns, and make informed decisions to improve workforce management.'
  ];
  managersDecisionMaking = [
    'Plan Work Hours & Scheduling.',
    'Approval Workflow.',
    'Payroll Integration.'
  ];
  employeesBenefits = [
    'Employee Access to Leave Balance and History.',
    'Apply for Leave Online or via Smartphone.'
  ];
  otherFeatures = [
    'Leave Management Integration: Track employee leave balances and integrate leave requests directly into the timesheet system.',
    'Mobile Time Tracking: Allow employees to clock in and out via a mobile app, ensuring accurate time tracking whether they\'re in the office or working remotely.',
    'Custom Work Rules: Set specific rules for different departments, projects, or employees to comply with organizational or legal requirements.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Timesheet Calendar View',
      description:
        'Managers and employees can view all time entries in a visual calendar layout for easy planning and reporting.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770205814/wrgxdskg7qybh4hq8l2j.png',
      alt: 'timesheet management systems'
    },
    {
      id: 2,
      title: 'Approval & Editing Workflow',
      description:
        'Streamline approval processes with an easy-to-use interface for managers to quickly approve or adjust employee timesheets.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/pending-leave-request_mswhgd.jpg',
      alt: 'Time Tracking Software'
    },
    {
      id: 3,
      title: 'Comprehensive Reporting',
      description:
        'Generate in-depth reports for payroll, budgeting, and compliance purposes, ensuring all data is easily accessible and actionable.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770205476/f5byefgysx1auknkinfu.png',
      alt: 'Automated Timesheets'
    }
  ];
}
