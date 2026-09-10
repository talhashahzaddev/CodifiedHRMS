import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * ClipboardService
 * ─────────────────────────────────────────────────────────────────────────────
 * SSR-safe wrapper around navigator.clipboard.writeText().
 * Falls back to the legacy document.execCommand('copy') for non-HTTPS contexts.
 * ─────────────────────────────────────────────────────────────────────────────
 */
@Injectable({ providedIn: 'root' })
export class ClipboardService {
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Copy text to clipboard.
   * Returns a Promise<boolean> — resolves to true on success, false on failure.
   * No-ops (returns false) in SSR context.
   */
  async copy(text: string): Promise<boolean> {
    if (!isPlatformBrowser(this.platformId)) return false;

    // Modern Clipboard API (requires HTTPS or localhost)
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fall through to legacy approach
      }
    }

    // Legacy fallback: textarea + execCommand
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0';
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}
