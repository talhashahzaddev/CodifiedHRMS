import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private tawkId: string = '6932b04bed164b197fdfd812'; // Your Property ID
  private tawkKey: string = '1jbn01a75'; // Your Widget Key
  private isLoaded: boolean = false;

  loadTawkTo(): void {
    if (this.isLoaded) return;

    // Initialize Tawk_API
    (window as any).Tawk_API = (window as any).Tawk_API || {};
    (window as any).Tawk_LoadStart = new Date();

    const s1 = document.createElement('script');
    const s0 = document.getElementsByTagName('script')[0];
    
    s1.async = true;
    s1.src = `https://embed.tawk.to/${this.tawkId}/${this.tawkKey}`;
    s1.charset = 'UTF-8';
    s1.setAttribute('crossorigin', '*');
    
    s0.parentNode?.insertBefore(s1, s0);
    
    this.isLoaded = true;
  }

  // Optional: Methods to show/hide widget programmatically
  showWidget(): void {
    if ((window as any).Tawk_API) {
      (window as any).Tawk_API.showWidget();
    }
  }

  hideWidget(): void {
    if ((window as any).Tawk_API) {
      (window as any).Tawk_API.hideWidget();
    }
  }
}



