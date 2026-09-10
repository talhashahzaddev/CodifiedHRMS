import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ToolConfig } from '../../config/tools.config';

@Component({
  selector: 'app-tool-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule],
  templateUrl: './tool-card.component.html',
  styleUrls: ['./tool-card.component.scss']
})
export class ToolCardComponent {
  @Input({ required: true }) tool!: ToolConfig;

  get hubRoute(): string {
    return this.tool.category === 'workforce' ? '/free-workforce-tools' : '/free-tools';
  }

  get toolRoute(): string {
    return `${this.hubRoute}/${this.tool.slug}`;
  }
}
