import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-dashboard-onboarding',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard-onboarding.component.html',
  styleUrls: ['./dashboard-onboarding.component.scss']
})
export class DashboardOnboardingComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'Employee Onboarding Software for Seamless New Hire Integration | BriskPeople',
    description: 'Streamline your employee onboarding process with our intuitive software, designed to enhance efficiency, automate tasks, and simplify document management.',
    focusKeyword: 'employee onboarding software',
    altTags: ['employee onboarding software', 'hr onboarding software', 'customer onboarding software', 'best onboarding software', 'best employee onboarding software'] as const
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
      title: 'New Hire Setup',
      description:
        'Easily set up new hires in the system with minimal effort. Automatically add them to the necessary teams, roles, and workflows. BriskPeople ensures all necessary information is gathered before the first day.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/leave-request_gsphcw.png',
      alt: 'employee onboarding software'
    },
    {
      id: 2,
      title: 'Employee Document Management',
      description:
        'Collect, store, and manage new hire documents in a secure, cloud-based system. Whether it\'s contracts, tax forms, or company policies, everything is easily accessible and signed digitally.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-comp-off_mazhar.png',
      alt: 'hr onboarding software'
    },
    {
      id: 3,
      title: 'Welcome Dashboard',
      description:
        'Give new employees a warm welcome with a personalized dashboard that shows tasks, introductions, and training resources to help them settle in on Day 1.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097850/my-leaves_cdjvng.png',
      alt: 'customer onboarding software'
    },
    {
      id: 4,
      title: 'Training & Development',
      description:
        'Automatically assign training modules and learning paths to help new hires get up to speed quickly. Monitor their progress and provide feedback directly through the platform.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/leave-history_b1l34h.png',
      alt: 'best onboarding software'
    },
    {
      id: 5,
      title: 'Employee Directory',
      description:
        'Introduce new hires to the team with an employee directory that includes bios, roles, and contact information. They can see who they\'ll be working with and where to turn for help.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/missed-punch-request_dqzzm5.png',
      alt: 'best employee onboarding software'
    },
    {
      id: 6,
      title: 'E-Signature & Compliance',
      description:
        'Easily collect signed documents with our secure e-signature feature. Employees can sign necessary documents from anywhere, speeding up the process and ensuring compliance.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769097849/my-asset_cjsz8x.png',
      alt: 'employee onboarding software'
    }
  ];
  intuitiveFeatures = [
    'Customizable Onboarding Flows: Tailor your onboarding processes to match your company\'s specific requirements. Whether you need role-specific training or legal documentation, you can customize workflows to make onboarding seamless.',
    'Track Onboarding Progress: Monitor each new hire\'s progress with built-in tracking tools. You can see which tasks have been completed, who needs additional support, and where adjustments might be needed.',
    'Automated Reminders: Set automatic reminders for both new hires and managers to ensure nothing falls through the cracks. Whether it\'s a form to fill out or a task to complete, everyone stays on track.',
    'Document Signing: Easily collect signed documents with our secure e-signature feature. Employees can sign necessary documents from anywhere, speeding up the process and ensuring compliance.'
  ];
  managersDecisionMaking = [
    'Plan for upcoming training needs.',
    'Ensure new hires are integrated into the team efficiently.',
    'Track document signing and compliance at a glance.'
  ];
  employeesBenefits = [
    'Access onboarding tasks and training modules.',
    'Sign documents electronically.',
    'Communicate with their team directly through the platform.'
  ];
  otherFeatures = [
    'Multi-language Support: Customize onboarding materials to be available in multiple languages for a global workforce.',
    'Custom Role Assignments: Automatically assign new hires to specific teams and departments.',
    'Integrated Calendar: Sync onboarding tasks with your Outlook or Google Calendar to ensure everything is organized.'
  ];
  employeeService = [
    {
      id: 1,
      title: 'Onboarding Checklist',
      description:
        'Employees can easily track their onboarding progress with a checklist that shows completed tasks and upcoming actions.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770207564/n2flmfri67gcrovvryy3.png',
      alt: 'hr onboarding software'
    },
    {
      id: 2,
      title: 'Employee Feedback',
      description:
        'Managers can request feedback from new hires on their onboarding experience to continuously improve the process.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1769173706/pending-leave-request_mswhgd.jpg',
      alt: 'best onboarding software'
    },
    {
      id: 3,
      title: 'Automated Workflow',
      description:
        'Simplify the process with automated workflows that guide employees through all the necessary steps from document signing to team introductions.',
      image: 'https://res.cloudinary.com/dn7o89asj/image/upload/v1770207486/gna8bn9xzidfteoduyp2.png',
      alt: 'best employee onboarding software'
    }
  ];
}
