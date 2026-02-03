import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, CardComponent, RouterModule],
  templateUrl: './attendance.component.html',
  styleUrls: ['./attendance.component.scss']
})
export class AttendanceComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Attendance Management System for Accurate Employee Tracking',
    description: 'Track, manage, and approve employee attendance with ease. Streamline operations and ensure compliance with our powerful Attendance Management system.',
    focusKeyword: 'Attendance Management',
    altTags: ['attendance management software', 'time attendance management software', 'Employees attendance management', 'employee attendance management system', 'leave and attendance management system'] as const
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
      title: 'Time Tracker',
      description:
        'Track employee clock-in and clock-out times in real time. Employees can quickly start and end their shifts with just a click, automatically syncing with payroll.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'attendance management software'
    },
    {
      id: 2,
      title: 'Calendar View',
      description:
        'View employee attendance, shifts, and time-off requests in one calendar. Managers can easily spot scheduling conflicts or approve leave directly from the calendar.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'time attendance management software'
    },
    {
      id: 3,
      title: 'List View',
      description:
        'Review employee attendance data in a simple, list-style format. Easily filter records by day, week, or month for quick attendance tracking.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'Employees attendance management'
    },
    {
      id: 4,
      title: 'Shift Management',
      description:
        'Assign and manage shifts for employees. The system ensures all shifts are covered and allows easy adjustments to meet staffing needs.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'employee attendance management system'
    },
    {
      id: 5,
      title: 'Attendance Summary',
      description:
        'Generate summary reports for each employee, including total hours worked, overtime, and leave taken. This simplifies payroll processing and provides insights into attendance patterns.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'leave and attendance management system'
    },
    {
      id: 6,
      title: 'Employee Self-Service',
      description:
        'Employees can view their attendance records and request time off from any device. This promotes transparency and reduces HR workload.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'attendance management software'
    }
  ];
  intuitiveFeatures = [
    'Customizable Attendance Function: Adjust the system to match your company\'s specific attendance policies.',
    'Automatic Leave Balances: Track and manage employee leave balances without manual tracking.',
    'Access Anywhere, Anytime: Whether you\'re in the office or working remotely, you can easily access the system from any device.',
    'Advanced Reporting: Generate real-time attendance reports to monitor patterns and improve decision-making.',
    'Holiday & Leave Management: Easily integrate holiday schedules into attendance tracking for a seamless experience.'
  ];
  managersDecisionMaking = [
    'Avoid Staff Shortages: Plan ahead by identifying upcoming leaves and approving or denying requests based on staffing needs.',
    'Instant Updates: Ensure attendance updates are automatically reflected across the system and synced with payroll.',
    'Access Reports Anytime: Managers can view detailed reports and access attendance data directly from the system, ensuring efficiency in workforce management.'
  ];
  employeesBenefits = [
    'Employees Track Attendance: Employees can easily access their attendance history and leave balance.',
    'Submit Leave Requests: Employees can apply for leave directly from the portal, with automated approval processes.',
    'View Leave History: Maintain full visibility of past and upcoming leaves, ensuring transparency and clarity.'
  ];
  otherFeatures = [
    'Seamless Integration: Integrate with your existing calendar systems (Outlook, Google Calendar) to keep all your scheduling in sync.',
    'Data Exporting: Export attendance data to Excel or CSV for easy reporting and analysis.',
    'Multiple Department Support: Manage attendance for multiple departments separately while having an overview in a single dashboard.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Track Your Attendance in Real-Time',
      description:
        'Employees can easily track their own attendance, including clock-ins, clock-outs, and breaks, in real-time. This feature provides instant access to attendance history, making it simple for employees to review their own records and ensure accuracy.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770046696/Time_Tracker_rrxsdz.png',
      alt: 'attendance management software'
    },
    {
      id: 2,
      title: 'Request and Manage Leave Easily',
      description:
        'Employees can request leave directly through the self-service portal, whether for vacation, sick days, or personal time off. The system automatically checks for any conflicts and notifies both the employee and manager once the request is approved or declined, streamlining the entire process.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770039802/Self_Service_Employee_Attendance_View_Shift_pl9rfj.png',
      alt: 'time attendance management software'
    },
    {
      id: 3,
      title: 'View Attendance History and Balances',
      description:
        'Employees can view their full attendance history, including total hours worked, leave balances, and upcoming scheduled time off. This transparency helps employees stay informed about their work schedule and avoid scheduling conflicts.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770039792/Self_Service_Employee_Attendance_Summary-2_z0osqq.png',
      alt: 'employee attendance management system'
    },
    {
      id: 4,
      title: 'Manager Approval and Monitoring',
      description:
        'Managers can effortlessly monitor and approve attendance records, including leave requests, clock-in times, and overtime. The manager\'s self-service portal ensures they can access the most up-to-date attendance data and make informed decisions quickly, all within a single interface.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770039817/Self_Service_Manager_Team_Attendance_zjkl5j.png',
      alt: 'leave and attendance management system'
    }
  ];
}
