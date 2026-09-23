import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ContactFabService } from '../../../core/services/contactfab.service';
import { CdkDrag } from '@angular/cdk/drag-drop';

@Component({
  selector: 'app-floating-actions',
  standalone: true,
  imports: [CommonModule, CdkDrag],
  template: `
    <!-- ── Left Contact FAB ──────────────────────────────────── -->
    <div class="contact-fab" [class.open]="isOpen" cdkDrag>

      <!-- Action Buttons — appear ABOVE the toggle -->
      <div class="fab-actions">

        <div class="fab-action-item" (mouseenter)="hovered='whatsapp'" (mouseleave)="hovered=''">
          <span class="fab-label" [class.show]="hovered==='whatsapp'">WhatsApp</span>
          <button class="fab-btn fab-whatsapp" (click)="onWhatsApp()" aria-label="WhatsApp us">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </button>
        </div>

        <div class="fab-action-item" (mouseenter)="hovered='phone'" (mouseleave)="hovered=''">
          <span class="fab-label" [class.show]="hovered==='phone'">Phone</span>
          <button class="fab-btn fab-phone" (click)="onPhone()" aria-label="Call us">
            <svg viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
              <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
            </svg>
          </button>
        </div>

      </div>

      <!-- Toggle Button (always at the bottom) -->
      <button
        class="fab-toggle"
        (click)="toggleFab($event)"
        [attr.aria-label]="isOpen ? 'Close contact options' : 'Open contact options'">
        <svg *ngIf="!isOpen" viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
        </svg>
        <svg *ngIf="isOpen" viewBox="0 0 24 24" fill="currentColor" width="22" height="22">
          <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
        </svg>
      </button>

    </div>

    <!-- ── Scroll To Top ──────────────────────────────────────── -->
    <button
      class="scroll-top-btn"
      [class.visible]="showScrollTop"
      (click)="scrollToTop()"
      aria-label="Scroll to top">
      <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
        <path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6z"/>
      </svg>
    </button>
  `,
  styles: [`
    /* ── Left Contact FAB ──────────────────────────────────── */
    .contact-fab {
      position: fixed;
      bottom: 24px;
      left: 20px;
      z-index: 9000;
      display: flex;
      flex-direction: column;   /* toggle at bottom, actions stack above */
      align-items: flex-start;  /* left-align everything */
      gap: 12px;
    }

    /* Actions: hidden, stacked above toggle */
    .fab-actions {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 12px;
      opacity: 0;
      pointer-events: none;
      transform: translateY(10px);
      transition: opacity 0.22s ease, transform 0.22s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .contact-fab.open .fab-actions {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }

    /* Each action: button on LEFT, label floats to the RIGHT of button */
    .fab-action-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      position: relative;
    }

    /* Label floats to the right of its button, absolutely positioned */
    .fab-label {
      position: absolute;
      left: calc(100% + 10px);   /* right of the 48px button */
      top: 50%;
      transform: translateY(-50%) translateX(-4px);
      background: #ffffff;
      color: #1e293b;
      font-size: 12px;
      font-weight: 600;
      padding: 5px 11px;
      border-radius: 6px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.12);
      white-space: nowrap;
      font-family: 'Segoe UI', sans-serif;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.15s ease, transform 0.15s ease;
    }

    .fab-label.show {
      opacity: 1;
      transform: translateY(-50%) translateX(0);
    }

    .fab-btn {
      width: 48px;
      height: 48px;
      margin-left: 2px;   /* centers 48px button under 52px toggle */
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.2);
      transition: transform 0.18s ease, box-shadow 0.18s ease;
      flex-shrink: 0;
    }

    .fab-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.28);
    }

    .fab-whatsapp { background: linear-gradient(135deg, #25d366, #128c7e); }
    .fab-phone    { background: linear-gradient(135deg, #22c55e, #16a34a); }

    /* Toggle — same width as fab-btn so left edges align */
    .fab-toggle {
      width: 52px;
      height: 52px;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      background: linear-gradient(135deg, #0071e6, #0ea5e9);
      box-shadow: 0 4px 16px rgba(0, 113, 230, 0.4);
      transition: background 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease;
      flex-shrink: 0;
    }

    .contact-fab.open .fab-toggle {
      background: linear-gradient(135deg, #64748b, #475569);
      box-shadow: 0 4px 14px rgba(0, 0, 0, 0.22);
    }

    .fab-toggle:hover { transform: scale(1.08); }

    /* ── Scroll To Top ──────────────────────────────────────── */
    .scroll-top-btn {
      position: fixed;
      bottom: 28px;
      right: 110px;
      z-index: 9000;
      width: 40px;
      height: 40px;
      border-radius: 8px;
      background: #475569;
      color: white;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.18);
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.22s ease, transform 0.22s ease, background 0.15s ease;
    }

    .scroll-top-btn.visible {
      opacity: 1;
      pointer-events: all;
      transform: translateY(0);
    }

    .scroll-top-btn:hover {
      background: #334155;
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    }
  `]
})
export class FloatingActionsComponent {
  isOpen = false;
  showScrollTop = false;
  hovered = '';

  constructor(private contactFabService: ContactFabService) {}

  @HostListener('window:scroll', [])
  onScroll(): void {
    this.showScrollTop = window.scrollY > 300;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const fab = (event.target as Element).closest('.contact-fab');
    if (!fab && this.isOpen) {
      this.isOpen = false;
    }
  }

  toggleFab(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  onPhone(): void {
    this.contactFabService.openPhone();
    this.isOpen = false;
  }

  onWhatsApp(): void {
    this.contactFabService.openWhatsApp();
    this.isOpen = false;
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}