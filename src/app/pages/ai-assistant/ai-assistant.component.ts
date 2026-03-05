import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-ai-assistant',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './ai-assistant.component.html',
  styleUrls: ['./ai-assistant.component.scss']
})
export class AiAssistantComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'AI Assistant for Self-Service Leave Management | BriskPeople',
    description: 'Simplify leave management with our AI Assistant. Self-service features let employees track, request, and manage leave anytime, anywhere.',
    focusKeyword: 'HRM AI Assistant',
    altTags: ['AI Assistant', 'ai assistant software', 'AI HR Assistant', 'Best ai assistant for hrms'] as const
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
      title: 'Instant Query Responses',
      description:
        'The AI Assistant answers employee queries regarding payroll, leave balances, and company policies instantly, ensuring smoother communication and quicker resolutions.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'AI Assistant'
    },
    {
      id: 2,
      title: 'Data-Driven Insights',
      description:
        'It provides valuable insights by analyzing employee data, allowing HR managers to make more informed decisions and improve workforce management.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'ai assistant software'
    },
    {
      id: 3,
      title: 'Automated Leave Management',
      description:
        'Employees can submit their leave requests, and the AI Assistant handles the entire process tracking leave balances and ensuring approval workflows run smoothly.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'AI HR Assistant'
    },
    {
      id: 4,
      title: '24/7 Availability',
      description:
        'The AI Assistant is always available to assist employees and HR teams, providing round-the-clock support and ensuring no HR tasks are delayed.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'Best ai assistant for hrms'
    },
    {
      id: 5,
      title: 'Seamless Integration',
      description:
        'It integrates effortlessly with your existing HR systems, improving data flow and reducing manual administrative tasks.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'AI Assistant'
    },
    {
      id: 6,
      title: 'My Asset',
      description:
        'Employees can view assigned assets including asset type, model, and serial number.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'ai assistant software'
    }
  ];
  intuitiveFeatures = [
    'Customizable AI Functions: Tailor the AI Assistant\'s functions to your company\'s specific leave policies and needs.',
    'Automatic Leave Monitoring: The AI Assistant automatically tracks employee leave balances and status updates.',
    'Smart Leave Rule Enforcement: Automatically adjusts leave requests to match company policies, such as long-service leave or study leave.'
  ];
  managersDecisionMaking = [
    'AI-Powered Insights for Managers: The AI Assistant presents insightful reports on employee attendance and leave trends, enabling swift and informed decision-making.',
    'Leave Conflict Resolution: Automatically detects potential conflicts in leave requests, helping managers avoid disruptions in operations.',
    'Leave Planning & Reports: The AI Assistant generates detailed leave reports, assisting managers in planning workforce availability.'
  ];
  employeesBenefits = [
    'Access to Leave Balance & History',
    'Apply for Leave with Ease',
    'Real-Time Leave Tracking',
    'Prevent Scheduling Conflicts'
  ];
  otherFeatures = [
    'AI-Powered Integration: The AI Assistant integrates with other tools like Outlook, Google Calendar, and other HR software, streamlining the leave management process.',
    'Public Holiday Integration: The AI Assistant takes public holidays into account and ensures they\'re reflected in leave balances and schedules.',
    'Comprehensive Reporting: AI-driven reporting tools export data to Excel or CSV, making it easy for managers to analyze and take action on leave trends.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Clock In & Clock Out',
      description:
        'Effortlessly manage your attendance with BriskPeople’s AI Assistant. Simply ask the AI if you’re clocked in or out, and it will update your status in real-time',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770210020/hxh4zelrzwtk4id5icp0.jpg',
      alt: 'AI HR Assistant'
    },
    {
      id: 2,
      title: 'Leave Balance',
      description:
        'The AI Assistant provides employees with real-time visibility into their leave balance, allowing them to easily track available days for various leave types (annual, sick, unpaid).',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770210026/ejt4x7mvznoklvajsb8u.jpg',
      alt: 'Best ai assistant for hrms'
    },
  ];
}
