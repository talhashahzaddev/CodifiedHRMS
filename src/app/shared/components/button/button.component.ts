import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [class]="getButtonClasses()"
      [disabled]="disabled"
      [type]="type"
      (click)="onClick.emit($event)">
      <ng-content></ng-content>
    </button>
  `,
  styles: [`
    button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--spacing-xs);
      font-weight: 600;
      border-radius: var(--border-radius-md);
      transition: all var(--transition-base);
      cursor: pointer;
      white-space: nowrap;
      
      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-primary {
      background: var(--primary-600);
      color: var(--text-inverse);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);

      &:hover:not(:disabled) {
        background: var(--primary-700);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    .btn-secondary {
      background: var(--accent-500);
      color: var(--text-inverse);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);

      &:hover:not(:disabled) {
        background: var(--accent-600);
        transform: translateY(-1px);
        box-shadow: var(--shadow-md);
      }
    }

    .btn-outline {
      background: transparent;
      color: var(--primary-600);
      border: 2px solid var(--primary-600);
      padding: calc(var(--spacing-sm) - 2px) var(--spacing-lg);

      &:hover:not(:disabled) {
        background: var(--primary-50);
        border-color: var(--primary-700);
      }
    }

    .btn-ghost {
      background: transparent;
      color: var(--text-secondary);
      border: none;
      padding: var(--spacing-sm) var(--spacing-lg);

      &:hover:not(:disabled) {
        background: var(--bg-secondary);
        color: var(--text-primary);
      }
    }

    .btn-sm {
      font-size: var(--font-size-sm);
      padding: var(--spacing-xs) var(--spacing-md);
    }

    .btn-md {
      font-size: var(--font-size-base);
      padding: var(--spacing-sm) var(--spacing-lg);
    }

    .btn-lg {
      font-size: var(--font-size-lg);
      padding: var(--spacing-md) var(--spacing-xl);
    }
  `]
})
export class ButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Output() onClick = new EventEmitter<MouseEvent>();

  getButtonClasses(): string {
    return `btn-${this.variant} btn-${this.size}`;
  }
}
