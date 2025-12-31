import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div [class]="'card ' + (hoverable ? 'card-hoverable' : '')" [class.card-elevated]="elevated">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`
    .card {
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(185, 223, 255, 0.3);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-xl);
      transition: all var(--transition-base);
    }

    .card-elevated {
      box-shadow: var(--shadow-md);
      border: 1px solid rgba(185, 223, 255, 0.4);
      background: rgba(255, 255, 255, 0.9);
    }

    .card-hoverable {
      // cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        border-color: var(--primary-300);
        background: rgba(255, 255, 255, 0.95);
      }
    }
  `]
})
export class CardComponent {
  @Input() hoverable: boolean = false;
  @Input() elevated: boolean = false;
}

