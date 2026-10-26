import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CorporateNavigationService } from '../../core/corporate-navigation.service';

@Component({
  selector: 'app-corporate-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Navegação corporativa" class="corporate-navigation" data-testid="corporate-navigation">
      <div class="corporate-navigation__bar">
        <div class="corporate-navigation__brand">
          <span class="corporate-navigation__badge"><mat-icon aria-hidden="true">verified_user</mat-icon>Governança Corporativa</span>
        </div>
        <div class="navigation-actions">
          <a mat-button routerLink="/workspace-corporativo" routerLinkActive="is-active" [routerLinkActiveOptions]="{ exact: true }">Sessão corporativa</a>
          <a mat-button routerLink="/workspace-corporativo/paginas" routerLinkActive="is-active">Páginas corporativas</a>
          <a mat-button routerLink="/workspace-corporativo/grupos" routerLinkActive="is-active">Grupos do menu</a>
          <button mat-stroked-button (click)="menu.refresh()" [disabled]="menu.busy()">Atualizar menu</button>
        </div>
      </div>
      @if (menu.busy()) { <p role="status" class="corporate-navigation__status">Consultando navegação…</p> }
      @if (menu.message()) { <p role="status" class="corporate-navigation__status is-warning">{{ menu.message() }}</p> }
      @if (menu.ready() && !menu.busy()) {
        <div class="corporate-navigation__tree">
          <span class="corporate-navigation__tree-label"><mat-icon aria-hidden="true">account_tree</mat-icon>Menu Publicado Ativo:</span>
          <ul class="corporate-navigation__groups">
            @for (group of menu.groups(); track group.id) {
              <li class="corporate-navigation__group-item" [class.is-expanded]="menu.expanded() === group.id">
                <button mat-button (click)="menu.open(group.id)" [disabled]="menu.busy()" [attr.aria-expanded]="menu.expanded() === group.id">
                  <mat-icon aria-hidden="true">{{ group.icon }}</mat-icon>{{ group.label }}
                </button>
                @if (menu.expanded() === group.id) {
                  <ul class="corporate-navigation__pages">
                    @for (page of menu.children()[group.id] || []; track page.id) {
                      <li>
                        <a mat-button [routerLink]="page.route"><mat-icon aria-hidden="true">{{ page.icon }}</mat-icon>{{ page.label }}</a>
                      </li>
                    } @empty {
                      @if (!menu.busy()) { <li class="corporate-navigation__empty">Nenhuma página visível neste grupo.</li> }
                    }
                  </ul>
                  @if (menu.cursors()[group.id]) {
                    <button mat-button (click)="menu.moreChildren(group.id)" [disabled]="menu.busy()">Mais páginas deste grupo</button>
                  }
                }
              </li>
            } @empty {
              <li class="corporate-navigation__empty">Nenhum grupo publicado visível neste contexto.</li>
            }
          </ul>
          @if (menu.rootCursor()) { <button mat-button (click)="menu.moreGroups()" [disabled]="menu.busy()">Mais grupos</button> }
        </div>
      }
    </nav>
    <router-outlet />`,
  styles: [`
    :host { display: block; min-width: 0; }
    .corporate-navigation {
      max-width: 1200px;
      margin: 16px auto 0;
      padding: 12px 18px;
      background: var(--header-surface-gradient, var(--card, var(--mat-sys-surface-container)));
      border: 1px solid var(--border, var(--mat-sys-outline-variant));
      border-radius: 16px;
      box-shadow: var(--node-shadow, 0 4px 16px rgba(15, 23, 42, 0.05));
    }
    .corporate-navigation__bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
    }
    .corporate-navigation__badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: var(--primary, var(--mat-sys-primary));
      background: color-mix(in oklab, var(--primary, #2563eb) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--primary, #2563eb) 28%, transparent);
    }
    .corporate-navigation__badge mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }
    .navigation-actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .navigation-actions a.is-active {
      background: color-mix(in oklab, var(--primary, #2563eb) 14%, transparent);
      color: var(--primary, var(--mat-sys-primary));
      font-weight: 600;
      border-radius: 999px;
    }
    .corporate-navigation__status {
      margin: 10px 0 0;
      padding: 8px 12px;
      border-radius: 10px;
      font-size: 13px;
      background: var(--muted, var(--mat-sys-surface-container-high));
    }
    .corporate-navigation__tree {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border, var(--mat-sys-outline-variant));
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 10px 14px;
    }
    .corporate-navigation__tree-label {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--muted-foreground, var(--mat-sys-on-surface-variant));
      padding-top: 6px;
    }
    .corporate-navigation__tree-label mat-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: var(--primary, var(--mat-sys-primary));
    }
    .corporate-navigation__groups {
      list-style: none;
      margin: 0;
      padding: 0;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      flex: 1;
      min-width: 0;
    }
    .corporate-navigation__group-item {
      background: var(--card, var(--mat-sys-surface));
      border: 1px solid var(--border, var(--mat-sys-outline-variant));
      border-radius: 12px;
      padding: 2px 6px;
      overflow-wrap: anywhere;
    }
    .corporate-navigation__group-item.is-expanded {
      border-color: color-mix(in oklab, var(--primary, #2563eb) 45%, var(--border, #cbd5e1));
      box-shadow: 0 4px 12px rgba(15, 23, 42, 0.06);
    }
    .corporate-navigation__pages {
      list-style: none;
      margin: 4px 0 6px;
      padding: 6px 8px;
      border-top: 1px dashed var(--border, var(--mat-sys-outline-variant));
      background: color-mix(in oklab, var(--primary, #2563eb) 5%, var(--card, #fff));
      border-radius: 8px;
    }
    .corporate-navigation__empty {
      font-size: 12.5px;
      color: var(--muted-foreground, var(--mat-sys-on-surface-variant));
      padding: 6px 8px;
    }
    @media (max-width: 600px) {
      .corporate-navigation { margin: 8px 8px 0; padding: 10px 12px; border-radius: 12px; }
      .navigation-actions { width: 100%; }
    }
  `],
})
export class CorporateLayoutComponent { readonly menu = inject(CorporateNavigationService); }
