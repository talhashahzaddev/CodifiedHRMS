import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * BlobDownloadService
 * ─────────────────────────────────────────────────────────────────────────────
 * SSR-safe utility for generating and downloading arbitrary Blob files
 * (PNG, ICS, TXT, etc.) in the browser.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable({ providedIn: 'root' })
export class BlobDownloadService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Trigger a Blob download.
   * No-ops in SSR context.
   *
   * @param filename  The output filename (e.g. 'event.ics', 'banner.png')
   * @param blob      The Blob to download
   */
  download(filename: string, blob: Blob): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const win = this.document.defaultView as (Window & typeof globalThis);
    const url = win.URL.createObjectURL(blob);

    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);

    // Revoke after a tick so the download has time to start
    setTimeout(() => win.URL.revokeObjectURL(url), 150);
  }

  /**
   * Trigger a text-content download (convenience wrapper).
   *
   * @param filename  The output filename (e.g. 'event.ics')
   * @param content   Text content to write to the file
   * @param mimeType  MIME type (defaults to 'text/plain;charset=utf-8')
   */
  downloadText(filename: string, content: string, mimeType = 'text/plain;charset=utf-8'): void {
    const blob = new Blob([content], { type: mimeType });
    this.download(filename, blob);
  }

  /**
   * Trigger a Canvas element download as PNG.
   * No-ops in SSR context.
   *
   * @param canvas    The HTMLCanvasElement to export
   * @param filename  The output filename (e.g. 'qr-code.png')
   */
  downloadCanvas(canvas: HTMLCanvasElement, filename: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    canvas.toBlob(blob => {
      if (blob) this.download(filename, blob);
    }, 'image/png');
  }
}
