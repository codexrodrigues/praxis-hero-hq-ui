import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CorporateNavigationService } from '../../core/corporate-navigation.service';

@Component({
  selector: 'app-corporate-layout', imports: [RouterLink, RouterOutlet, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Navegação corporativa" class="corporate-navigation" data-testid="corporate-navigation">
      <div class="navigation-actions">
        <a mat-button routerLink="/workspace-corporativo">Sessão corporativa</a>
        <a mat-button routerLink="/workspace-corporativo/paginas">Páginas corporativas</a>
        <a mat-button routerLink="/workspace-corporativo/grupos">Grupos do menu</a>
        <button mat-stroked-button (click)="menu.refresh()" [disabled]="menu.busy()">Atualizar menu</button>
      </div>
      @if (menu.busy()) { <p role="status">Consultando navegação…</p> }
      @if (menu.message()) { <p role="status">{{ menu.message() }}</p> }
      @if (menu.ready() && !menu.busy()) {
        <ul>
          @for (group of menu.groups(); track group.id) {
            <li><button mat-button (click)="menu.open(group.id)" [disabled]="menu.busy()" [attr.aria-expanded]="menu.expanded() === group.id"><mat-icon aria-hidden="true">{{ group.icon }}</mat-icon>{{ group.label }}</button>
              @if (menu.expanded() === group.id) {
                <ul>@for (page of menu.children()[group.id] || []; track page.id) {
                  <li><a mat-button [routerLink]="page.route"><mat-icon aria-hidden="true">{{ page.icon }}</mat-icon>{{ page.label }}</a></li>
                } @empty { @if (!menu.busy()) { <li>Nenhuma página visível neste grupo.</li> } }</ul>
                @if (menu.cursors()[group.id]) { <button mat-button (click)="menu.moreChildren(group.id)" [disabled]="menu.busy()">Mais páginas deste grupo</button> }
              }
            </li>
          } @empty { <li>Nenhum grupo publicado visível neste contexto.</li> }
        </ul>
        @if (menu.rootCursor()) { <button mat-button (click)="menu.moreGroups()" [disabled]="menu.busy()">Mais grupos</button> }
      }
    </nav>
    <router-outlet />`,
  styles: [`:host{display:block;min-width:0}.corporate-navigation{padding:16px;border-bottom:1px solid var(--mat-sys-outline-variant)}.navigation-actions{display:flex;flex-wrap:wrap;gap:8px}ul{list-style:none;padding-inline-start:16px}li{overflow-wrap:anywhere}p{line-height:1.5}`],
})
export class CorporateLayoutComponent { readonly menu = inject(CorporateNavigationService); }
