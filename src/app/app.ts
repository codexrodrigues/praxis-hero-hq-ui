import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeroAppShellComponent } from './shell/hero-app-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HeroAppShellComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero-shell />
  `,
})
export class App {}
