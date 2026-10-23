import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PraxisI18nService, type WidgetPageDefinition } from '@praxisui/core';
import { AuthSimulationService } from '../../core/auth-simulation.service';
import { PraxisPageCopyActionComponent } from '@praxisui/page-builder';
import { provideVisitorLabI18n } from './visitor-lab.i18n';

/** Transient navigation information; saving remains owned by the laboratory. */
export interface VisitorLabDraft {
  definition: WidgetPageDefinition;
  owner: string;
  revision: number;
}

@Component({
  selector: 'app-visitor-lab-copy-action',
  imports: [RouterLink, MatButtonModule, MatIconModule, PraxisPageCopyActionComponent],
  providers: [provideVisitorLabI18n()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="copy-action">
      <div><strong>{{ text('copyTitle') }}</strong>
        <p>{{ text('copyIntro') }}</p></div>
      <praxis-page-copy-action [page]="page()" [canCopy]="enabled()" (copyRequested)="copy($event)" />
      <a mat-button routerLink="/laboratorio">{{ text('copyLibrary') }}</a>
    </div>
  `,
  styles: [`
    .copy-action { display: flex; flex-wrap: wrap; gap: 16px; align-items: center; margin-bottom: 24px;
      padding: 20px; border: 1px solid var(--md-sys-color-outline-variant); border-radius: 16px; }
    .copy-action > div { flex: 1; min-width: 220px; }
    p { margin: 6px 0 0; color: var(--md-sys-color-on-surface-variant); font-size: 13px; }
  `],
})
export class VisitorLabCopyActionComponent {
  readonly page = input<WidgetPageDefinition>();
  readonly enabled = input(false);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthSimulationService);
  private readonly i18n = inject(PraxisI18nService);
  text(key: string): string { return this.i18n.t(`visitorLab.${key}`); }

  copy(definition: WidgetPageDefinition): void {
    if (!this.enabled()) return;
    const persona = this.auth.currentPersona();
    const draft: VisitorLabDraft = { definition,
      owner: JSON.stringify([persona.tenant, persona.id]), revision: this.auth.identityRevision() };
    // Router info is transient: no remote write, browser history document or new storage channel.
    void this.router.navigate(['/laboratorio'], { info: { visitorLabDraft: draft } });
  }
}
