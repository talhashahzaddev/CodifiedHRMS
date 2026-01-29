import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Title, Meta } from '@angular/platform-browser';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent implements OnInit, OnDestroy {
  private readonly defaultTitle = 'Human Resource Management System | Affordable HRMS Software';
  private readonly defaultDescription = 'Human Resource Management System (HRMS) designed to manage employees, payroll, onboarding, and performance from one simple platform.';
  private readonly defaultKeywords = 'Human Resource Management System, HRIS software, People management software, attendance management system';

  readonly seo = {
    title: 'About BriskPeople | HRMS & Human Resource Management System',
    description: 'Learn about BriskPeople, an HRMS platform built to simplify employee management, attendance, payroll, and performance through a reliable Human Resource Management System.',
    focusKeyword: 'Human Resource Management System',
    altTags: ['human resource management system platform'] as const
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

  values = [
    {
      icon: 'verified_user',
      title: 'Integrity',
      description: 'We believe trust is built through honesty and transparency. Our HRMS is developed with clear processes and responsible data handling, helping businesses rely on a system they can trust.'
    },
    {
      icon: 'lightbulb',
      title: 'Innovation',
      description: 'We improve our Human Resource Management System by listening to real HR challenges. Each update is focused on making daily HR tasks more practical and easier to manage.'
    },
    {
      icon: 'groups',
      title: 'Customer-Focused',
      description: 'Our customers guide our decisions. We design our HRMS to support real business needs, helping HR teams manage employees, attendance, payroll, and performance more effectively.'
    }
  ];
}

