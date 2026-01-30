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
      title: 'Mastering the Art of Employee Onboarding',
      excerpt: 'A comprehensive guide to creating a seamless and effective onboarding experience for new hires.',
      category: 'culture',
      date: 'May 21, 2024',
      type: 'BLOG',
      image: 'onboarding',
      route: '/switch-to-hrms'
    },
    {
      id: '2',
      title: 'The Future of Remote Work: Trends for 2024',
      excerpt: 'Explore the key trends shaping remote and hybrid work environments in the coming year.',
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

