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
      // background: rgba(255, 255, 255, 0.8);
      background: linear-gradient(135deg, var(--primary-200) 0%, var(--accent-200) 100%);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(185, 223, 255, 0.3);
      border-radius: var(--border-radius-lg);
      padding: var(--spacing-xl);
      transition: all var(--transition-base);
      width: 100%;
      height: 100%;
    }

    .card-elevated {
      box-shadow: var(--shadow-md);
      border: 1px solid rgba(185, 223, 255, 0.4);
      // background: rgba(255, 255, 255, 0.9);
      background: linear-gradient(135deg, var(--primary-200) 0%, var(--accent-200) 100%);
          // box-shadow: 0 5px 20px rgba(0, 0, 0, 0.15), 0 2px 8px rgba(0, 0, 0, 0.1);

    }

    .card-hoverable {
      // cursor: pointer;

      &:hover {
        transform: translateY(-4px);
        box-shadow: var(--shadow-lg);
        // border-color: var(--primary-300);
        background: linear-gradient(360deg, var(--primary-200) 0%, var(--accent-200) 100%);
      }
    }
  `]
})
export class CardComponent {
  @Input() hoverable: boolean = false;
  @Input() elevated: boolean = false;
}

