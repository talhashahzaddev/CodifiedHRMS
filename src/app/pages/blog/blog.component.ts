import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-blog',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './blog.component.html',
  styleUrls: ['./blog.component.scss']
})
export class BlogComponent {
  selectedCategory = 'all';
  
  categories = [
    { id: 'all', label: 'All' },
    { id: 'compliance', label: 'Compliance' },
    { id: 'recruiting', label: 'Recruiting' },
    { id: 'culture', label: 'Culture' },
    { id: 'payroll', label: 'Payroll' },
    { id: 'benefits', label: 'Benefits' }
  ];

  blogPosts = [
    {
      id: '1',
      title: 'Why Switch to HRMS from Old Spreadsheets?',
      excerpt: 'Learn why growing businesses switch from Excel to HRMS for accurate payroll, attendance tracking, compliance control, and smoother daily HR operations.',
      category: 'culture',
      date: 'May 21, 2024',
      type: 'BLOG',
      image: 'onboarding',
      route: '/switch-to-hrms'
    },
    {
      id: '2',
      title: 'How HRMS Payroll Simplifies Salary, Attendance, and Compliance Together',
      excerpt: 'Discover how HRMS payroll brings salary, attendance, and compliance into one streamlined system, reducing errors, manual work, and payroll stress for HR teams.',
      category: 'culture',
      date: 'May 18, 2024',
      type: 'ARTICLE',
      image: 'remote',
      route: '/simplify-features'
    }
  ];

  get filteredPosts() {
    if (this.selectedCategory === 'all') {
      return this.blogPosts;
    }
    return this.blogPosts.filter(post => post.category === this.selectedCategory);
  }

  selectCategory(categoryId: string): void {
    this.selectedCategory = categoryId;
  }
}

