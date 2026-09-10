import {
  Component, Input, ChangeDetectionStrategy, OnChanges, SimpleChanges
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToolResult } from '../../models/tool-result.model';

@Component({
  selector: 'app-result-box',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  templateUrl: './result-box.component.html',
  styleUrls: ['./result-box.component.scss']
})
export class ResultBoxComponent implements OnChanges {
  @Input() results: ToolResult[] = [];
  @Input() isCalculated = false;
  @Input() toolTitle = '';
  @Input() isCustomUi = false; // true for complex tools needing custom components

  /** True if the only result is an "awaiting input" placeholder. */
  get hasRealResults(): boolean {
    return this.results.length > 0 && this.results[0].label !== 'Awaiting Input';
  }

  get primaryResult(): ToolResult | undefined {
    return this.results.find(r => r.highlight);
  }

  get secondaryResults(): ToolResult[] {
    return this.results.filter(r => !r.highlight);
  }

  ngOnChanges(changes: SimpleChanges): void {}

  copyResults(): void {
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;
    const text = this.results
      .map(r => `${r.label}: ${r.value}${r.unit ? ' ' + r.unit : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text).catch(() => {});
  }
}
