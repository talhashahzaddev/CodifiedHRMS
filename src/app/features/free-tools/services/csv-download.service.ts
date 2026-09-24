import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

/**
 * CsvDownloadService
 * SSR-safe utility for generating and downloading CSV files in the browser.
 */
@Injectable({ providedIn: 'root' })
export class CsvDownloadService {
  constructor(
    @Inject(DOCUMENT) private document: Document,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  /**
   * Trigger a CSV download in the browser.
   * No-ops in SSR context.
   *
   * @param filename  Output filename (e.g. 'absence-report.csv')
   * @param headers   Array of column header strings
   * @param rows      2D array of cell values
   */
  download(
    filename: string,
    headers: string[],
    rows: (string | number | null | undefined)[][]
  ): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const escape = (cell: string | number | null | undefined): string => {
      const s = (cell === null || cell === undefined) ? '' : String(cell);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const csvLines = [
      headers.map(escape).join(','),
      ...rows.map(row => row.map(escape).join(','))
    ];
    const csvContent = csvLines.join('\r\n');

    // BOM (\ufeff) ensures Excel opens non-ASCII characters correctly
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const win = this.document.defaultView as (Window & typeof globalThis);
    const url = win.URL.createObjectURL(blob);

    const link = this.document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    this.document.body.appendChild(link);
    link.click();
    this.document.body.removeChild(link);
    win.URL.revokeObjectURL(url);
  }
}
