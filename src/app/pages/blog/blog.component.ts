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
      image: 'onboarding'
    },
    {
      id: '2',
      title: 'The Future of Remote Work: Trends for 2024',
      excerpt: 'Explore the key trends shaping remote and hybrid work environments in the coming year.',
      category: 'culture',
      date: 'May 18, 2024',
      type: 'ARTICLE',
      image: 'remote'
    },
    {
      id: '3',
      title: 'Navigating HR Compliance with Confidence',
      excerpt: 'Stay up-to-date with the latest regulations and avoid costly legal pitfalls.',
      category: 'compliance',
      date: 'May 15, 2024',
      type: 'WHITEPAPER',
      image: 'compliance'
    },
    {
      id: '4',
      title: 'How to Build a Thriving Company Culture',
      excerpt: 'Learn actionable steps to foster a positive and productive workplace for everyone.',
      category: 'culture',
      date: 'May 12, 2024',
      type: 'BLOG',
      image: 'culture'
    },
    {
      id: '5',
      title: 'Simplifying Your Payroll Processes',
      excerpt: 'Discover tools and techniques to make your payroll more efficient and accurate.',
      category: 'payroll',
      date: 'May 9, 2024',
      type: 'GUIDE',
      image: 'payroll'
    },
    {
      id: '6',
      title: 'Top 5 Recruitment Strategies That Actually Work',
      excerpt: 'Attract top talent with these proven methods for modern recruitment.',
      category: 'recruiting',
      date: 'May 6, 2024',
      type: 'BLOG',
      image: 'recruiting'
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

