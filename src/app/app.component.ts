import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './layout/header/header.component';
import { FooterComponent } from './layout/footer/footer.component';
import { ChatService } from './core/services/chat.service';

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
  title = 'CodifiedHRMS';

  constructor(private chatService: ChatService) {}

  ngOnInit(): void {
    // Load chat widget after a short delay to improve initial page load
    setTimeout(() => {
      this.chatService.loadTawkTo();
    }, 1000);
  }
}

