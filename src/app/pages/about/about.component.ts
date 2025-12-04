import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CardComponent } from '../../shared/components/card/card.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, RouterModule, CardComponent],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.scss']
})
export class AboutComponent {
  values = [
    {
      icon: 'verified_user',
      title: 'Integrity',
      description: 'We operate with transparency and honesty in everything we do, building trust with our clients and partners.'
    },
    {
      icon: 'lightbulb',
      title: 'Innovation',
      description: 'We are constantly pushing the boundaries of technology to deliver cutting-edge HR solutions.'
    },
    {
      icon: 'groups',
      title: 'Customer-Centric',
      description: 'Our customers are at the heart of our business. We succeed when they succeed.'
    }
  ];
}

