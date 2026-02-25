import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ContactFabService {
  readonly phone = '+923094085085';
  readonly whatsappUrl = `https://wa.me/923295757737`;
  readonly phoneUrl = `tel:+923094085085`;

  openWhatsApp(): void {
    window.open(this.whatsappUrl, '_blank', 'noopener,noreferrer');
  }

  openPhone(): void {
    window.location.href = this.phoneUrl;
  }
}