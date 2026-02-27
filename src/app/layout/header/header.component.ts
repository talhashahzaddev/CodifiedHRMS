import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss']
})
export class HeaderComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isScrolled = false;
  isDropdownOpen = false;        // desktop mega dropdown
  isMobileDropdownOpen = false;  // mobile accordion

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isScrolled = window.scrollY > 10;
  }

  // Close desktop dropdown on outside click
  @HostListener('document:click', ['$event'])
  onDocClick(e: MouseEvent): void {
    const target = e.target as HTMLElement;
    if (!target.closest('.features-trigger') && !target.closest('.mega-overlay')) {
      this.isDropdownOpen = false;
    }
  }

  ngOnInit(): void {}
  ngOnDestroy(): void {}

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
    // Reset mobile accordion when closing menu
    if (!this.isMenuOpen) this.isMobileDropdownOpen = false;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
    this.isMobileDropdownOpen = false;
  }

  openDropdown(): void  { this.isDropdownOpen = true; }
  closeDropdown(): void { this.isDropdownOpen = false; }
  toggleDropdown(): void { this.isDropdownOpen = !this.isDropdownOpen; }

  features = [
    {
      id: '1',
      title: 'Employee Management',
      description: 'Manage employees, managers, and HR roles with department positions in one centralized system.',
      icon: 'groups',
      route: '/employee-management'
    },
    {
      id: '2',
      title: 'Attendance',
      description: 'Accurately track employee work hours, leaves, and overtime with our integrated system.',
      icon: 'schedule',
      route: '/attendance-management'
    },
    {
      id: '3',
      title: 'Leave Management',
      description: 'Streamline employee leave requests, approvals, and balance tracking easily.',
      icon: 'event_available',
      route: '/leave-management'
    },
    {
      id: '4',
      title: 'Timesheets',
      description: 'Log time against projects and tasks for better resource management and billing.',
      icon: 'hourglass_top',
      route: '/timesheet-management-software'
    },
    {
      id: '5',
      title: 'Performance',
      description: 'Manage employee reviews, set goals, and foster a culture of continuous improvement.',
      icon: 'trending_up',
      route: '/performance-management'
    },
    {
      id: '6',
      title: 'Automated Payroll',
      description: 'Simplify payroll processing with automated calculations and approvals.',
      icon: 'payments',
      route: '/payroll-management'
    },
    {
      id: '7',
      title: 'AI Assistant',
      description: 'Track goals and reviews with intelligent AI support for smarter employee growth.',
      icon: 'smart_toy',
      route: '/ai-assistant'
    },
    {
      id: '8',
      title: 'Seamless Onboarding',
      description: 'Create a positive first-day experience. Keep onboarding simple and stress-free.',
      icon: 'rocket_launch',
      route: '/onboarding-software'
    }
  ];
}