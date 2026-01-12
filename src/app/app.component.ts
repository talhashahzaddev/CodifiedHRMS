import { Component, OnInit } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ChatService } from './core/services/chat.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="app-container">
      <app-header></app-header>
      <main class="main-content">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    .app-container {
      display: flex;
      flex-direction: column;
      min-height: 100vh;
      background: linear-gradient(135deg, var(--primary-50) 0%, var(--accent-50) 100%);
      background-attachment: fixed;
    }

    .main-content {
      flex: 1;
      width: 100%;
    }
  `]
})
export class AppComponent implements OnInit {
  title = 'BriskPeople';

  constructor(
    private chatService: ChatService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // Set page title
    document.title = 'BriskPeople';
    
    // Set favicon
    this.setFavicon();
    
    // Ensure favicon persists on navigation
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.setFavicon();
      });
    
    // Load chat widget after a short delay to improve initial page load
    setTimeout(() => {
      this.chatService.loadTawkTo();
    }, 1000);
  }

  private setFavicon(): void {
    // Remove ALL existing favicon links
    const existingLinks = document.querySelectorAll('link[rel*="icon"], link[rel*="shortcut"]');
    existingLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href.includes('favicon.ico') || !href.includes('hub.png'))) {
        link.remove();
      }
    });

    // Get base href to construct correct path
    const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
    const faviconPath = `${baseHref}hub.png`;

    // Ensure favicon is set
    let faviconLink = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
    if (!faviconLink) {
      faviconLink = document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.type = 'image/png';
      document.head.appendChild(faviconLink);
    }
    faviconLink.href = faviconPath;

    // Also set shortcut icon
    let shortcutLink = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement;
    if (!shortcutLink) {
      shortcutLink = document.createElement('link');
      shortcutLink.rel = 'shortcut icon';
      shortcutLink.type = 'image/png';
      document.head.appendChild(shortcutLink);
    }
    shortcutLink.href = faviconPath;
  }
}

