import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Crumb {
  label: string;
  route: string | null; // null = current page (no link)
}

@Component({
  selector: 'app-tool-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="tool-breadcrumb" aria-label="Breadcrumb">
      <div class="container">
        <ol class="breadcrumb-list">
          @for (crumb of crumbs; track crumb.label; let last = $last) {
            <li [attr.aria-current]="last ? 'page' : null">
              @if (!last && crumb.route) {
                <a [routerLink]="crumb.route">{{ crumb.label }}</a>
              } @else {
                {{ crumb.label }}
              }
            </li>
            @if (!last) {
              <li aria-hidden="true">
                <span class="breadcrumb-sep material-symbols-outlined">chevron_right</span>
              </li>
            }
          }
        </ol>
      </div>
    </nav>
  `,
  styles: [`
    .tool-breadcrumb {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--border-color);
      padding: var(--spacing-sm) 0;
    }
    .breadcrumb-list {
      display: flex;
      align-items: center;
      gap: 2px;
      list-style: none;
      margin: 0; padding: 0;
      flex-wrap: wrap;

      li {
        display: flex;
        align-items: center;
        font-size: var(--font-size-sm);
        color: var(--text-tertiary);
        font-weight: 500;

        a {
          color: var(--primary-600);
          text-decoration: none;
          transition: color var(--transition-fast);
          &:hover { color: var(--primary-700); }
        }

        &[aria-current='page'] { color: var(--text-secondary); font-weight: 600; }
      }
    }
    .breadcrumb-sep {
      font-size: 16px;
      color: var(--gray-400);
      margin: 0 2px;
    }
  `]
})
export class ToolBreadcrumbComponent {
  @Input({ required: true }) crumbs: Crumb[] = [];
}
