import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription, take } from 'rxjs';
import {
  ASYNC_CONFIG_STORAGE,
  type RichBlockHostCapabilities,
  type RichContentDocument,
  type TableConfig,
} from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import { AuthSimulationService } from '../../core/auth-simulation.service';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { PEDIDOS_CRUD_METADATA, PEDIDOS_KPI_DOCUMENT } from './pedidos.config';

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">shopping_cart_checkout</span>
            Suprimentos & Logística Tática
          </div>
          <h1 class="title-gradient page-title">Pedidos de Compra & Reposição</h1>
          <p class="page-subtitle">
            Ordens de fornecimento de ligas de vibranium, propulsores quânticos, tecidos balísticos e insumos de laboratório.
          </p>
        </div>

        <div class="header-actions">
          @if (isTableCustomized()) {
            <div
              class="table-persistence-badge customized"
              data-testid="pedidos-table-status"
              title="Configuração de tabela customizada persistida para esta persona"
            >
              <span class="pulse-indicator-amber"></span>
              <span>Tabela Customizada (Persistida)</span>
              @if (lastSavedAt(); as saved) {
                <span class="saved-time">· salvo às {{ saved }}</span>
              }
            </div>
          } @else {
            <div
              class="table-persistence-badge governed"
              data-testid="pedidos-table-status"
              title="Configuração padrão governada de fábrica"
            >
              <span class="pulse-indicator-cyan"></span>
              <span>Tabela de Fábrica (Governança)</span>
            </div>
          }

          @if (isCustomizing() && isTableCustomized()) {
            <button
              type="button"
              class="reset-layout-btn"
              data-testid="reset-table-btn"
              (click)="resetToFactoryTableConfig()"
              title="Reverter para configuração de fábrica e descartar customizações desta persona"
            >
              <span class="material-symbols-outlined">restart_alt</span>
              <span>Restaurar Fábrica</span>
            </button>
          }

          <button
            type="button"
            class="customize-toggle-btn"
            data-testid="toggle-table-customization-btn"
            [class.active]="isCustomizing()"
            (click)="toggleCustomization()"
            title="Alternar modo de customização de colunas e tabela"
          >
            <span class="material-symbols-outlined">
              {{ isCustomizing() ? 'visibility' : 'tune' }}
            </span>
            <span>{{ isCustomizing() ? 'Concluir Edição' : 'Customizar Tabela' }}</span>
          </button>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content com Barramento Declarativo -->
      <section class="kpi-surface">
        <praxis-rich-content [document]="kpiDocument()" [hostCapabilities]="kpiHostCapabilities" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Status da Ordem:"
        leadIcon="tune"
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        @if (crudRenderKey() >= 0) {
          <praxis-crud
            crudId="heroes-hq-pedidos-crud"
            [metadata]="activeCrudMetadata()"
            [enableCustomization]="isCustomizing()"
            (tableRuntimeConfigChange)="onTableConfigChange($event)"
          />
        }
      </section>
    </div>
  `,
})
export class PedidosPageComponent implements OnInit, OnDestroy {
  private readonly storageKey = 'table-config:heroes-hq-pedidos-crud';

  protected readonly isCustomizing = signal<boolean>(false);
  protected readonly isTableCustomized = signal<boolean>(false);
  protected readonly lastSavedAt = signal<string | null>(null);
  protected readonly crudRenderKey = signal<number>(0);

  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalPedidos = signal<number>(10);
  protected readonly approvedOrReceived = signal<number>(5);
  protected readonly draft = signal<number>(3);
  protected readonly cancelled = signal<number>(2);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Ordens',
      icon: 'local_shipping',
      count: this.totalPedidos(),
    },
    {
      id: 'aprovadas',
      label: 'Aprovadas / Entregues',
      icon: 'inventory',
      tone: 'ready',
      count: this.approvedOrReceived(),
    },
    {
      id: 'analise',
      label: 'Em Análise',
      icon: 'pending_actions',
      tone: 'warning',
      count: this.draft(),
    },
    {
      id: 'canceladas',
      label: 'Canceladas',
      icon: 'cancel',
      count: this.cancelled(),
    },
  ]);

  private readonly dashboardStats = inject(DashboardStatsService);
  protected readonly authService = inject(AuthSimulationService);
  private readonly asyncConfigStorage = inject(ASYNC_CONFIG_STORAGE, { optional: true });
  private readonly cdr = inject(ChangeDetectorRef);
  private kpiSub: Subscription | null = null;

  protected toggleCustomization(): void {
    this.isCustomizing.update((v) => !v);
  }

  protected readonly kpiDocument = signal<RichContentDocument>(PEDIDOS_KPI_DOCUMENT);

  protected readonly persistedTableConfig = signal<TableConfig | null>(null);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'aprovadas') {
      filterCriteria = { status: 'APPROVED' };
    } else if (filterId === 'analise') {
      filterCriteria = { status: 'DRAFT' };
    } else if (filterId === 'canceladas') {
      filterCriteria = { status: 'CANCELLED' };
    }

    const customTable = this.persistedTableConfig();
    const effectiveTable = customTable
      ? ({
          ...PEDIDOS_CRUD_METADATA.table,
          ...customTable,
          columnProjection: customTable.columnProjection || (PEDIDOS_CRUD_METADATA.table as any)?.columnProjection,
        } as unknown as CrudMetadata['table'])
      : PEDIDOS_CRUD_METADATA.table;

    return {
      ...PEDIDOS_CRUD_METADATA,
      filterCriteria,
      table: effectiveTable,
    };
  });

  ngOnInit(): void {
    this.loadKpis();
    this.loadEffectiveTableConfig();

    if (typeof window !== 'undefined') {
      window.addEventListener('praxis:identity-switch', this.onIdentitySwitch);
      (window as any).PAX_SAVE_PEDIDOS_TABLE_CONFIG = (cfg: TableConfig) => this.saveTableConfig(cfg);
      (window as any).PAX_RELOAD_PEDIDOS_TABLE_CONFIG = () => this.loadEffectiveTableConfig();
      (window as any).PAX_RESET_PEDIDOS_TABLE_CONFIG = () => this.resetToFactoryTableConfig();
    }
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
    if (typeof window !== 'undefined') {
      window.removeEventListener('praxis:identity-switch', this.onIdentitySwitch);
      delete (window as any).PAX_SAVE_PEDIDOS_TABLE_CONFIG;
      delete (window as any).PAX_RELOAD_PEDIDOS_TABLE_CONFIG;
      delete (window as any).PAX_RESET_PEDIDOS_TABLE_CONFIG;
    }
  }

  private readonly onIdentitySwitch = (): void => {
    this.persistedTableConfig.set(null);
    this.isTableCustomized.set(false);
    this.lastSavedAt.set(null);
    this.crudRenderKey.update((k) => k + 1);
    this.loadEffectiveTableConfig();
  };

  private loadEffectiveTableConfig(): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(localScopedKey);
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          this.persistedTableConfig.set(parsed);
          this.isTableCustomized.set(true);
        } catch {
          this.persistedTableConfig.set(null);
          this.isTableCustomized.set(false);
          this.lastSavedAt.set(null);
        }
      } else {
        this.persistedTableConfig.set(null);
        this.isTableCustomized.set(false);
        this.lastSavedAt.set(null);
      }
    } else {
      this.persistedTableConfig.set(null);
      this.isTableCustomized.set(false);
      this.lastSavedAt.set(null);
    }

    if (this.asyncConfigStorage) {
      this.asyncConfigStorage
        .loadConfig<TableConfig>(this.storageKey)
        .pipe(take(1))
        .subscribe({
          next: (remote) => {
            if (this.authService.currentPersona().id !== currentUserId) {
              return;
            }
            if (remote && ((remote.columns && remote.columns.length > 0) || remote.columnProjection)) {
              this.persistedTableConfig.set(remote);
              this.isTableCustomized.set(true);
              if (typeof localStorage !== 'undefined') {
                try {
                  localStorage.setItem(localScopedKey, JSON.stringify(remote));
                } catch {}
              }
            } else {
              this.persistedTableConfig.set(null);
              this.isTableCustomized.set(false);
              this.lastSavedAt.set(null);
              if (typeof localStorage !== 'undefined') {
                try {
                  localStorage.removeItem(localScopedKey);
                } catch {}
              }
            }
            this.cdr.markForCheck();
          },
          error: () => {
            this.persistedTableConfig.set(null);
            this.isTableCustomized.set(false);
            this.lastSavedAt.set(null);
            this.cdr.markForCheck();
          },
        });
    }
    this.cdr.markForCheck();
  }

  protected saveTableConfig(config: TableConfig): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem(localScopedKey, JSON.stringify(config));
      } catch {}
    }

    if (this.asyncConfigStorage) {
      this.asyncConfigStorage.saveConfig(this.storageKey, config).pipe(take(1)).subscribe();
    }
    this.persistedTableConfig.set(config);
    this.isTableCustomized.set(true);
    this.lastSavedAt.set(new Date().toLocaleTimeString('pt-BR'));
    this.crudRenderKey.update((k) => k + 1);
    this.cdr.markForCheck();
  }

  protected resetToFactoryTableConfig(): void {
    const currentUserId = this.authService.currentPersona().id;
    const localScopedKey = `${this.storageKey}:${currentUserId}`;

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.removeItem(localScopedKey);
      } catch {}
    }

    if (this.asyncConfigStorage) {
      this.asyncConfigStorage.clearConfig(this.storageKey).pipe(take(1)).subscribe();
    }
    this.persistedTableConfig.set(null);
    this.isTableCustomized.set(false);
    this.lastSavedAt.set(null);
    this.crudRenderKey.update((k) => k + 1);
    this.cdr.markForCheck();
  }

  protected onTableConfigChange(config: TableConfig): void {
    // Snapshot de runtime em memória
  }

  protected readonly kpiHostCapabilities: RichBlockHostCapabilities = {
    dispatchAction: (actionId: string, payload: unknown) => {
      if (actionId === 'scope.filter' && typeof payload === 'string') {
        this.setFilter(payload);
      }
    },
    isActionAvailable: () => true,
  };

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.dashboardStats.getPedidosTacticalKpis().subscribe((kpis) => {
      this.totalPedidos.set(kpis.totalPedidos);
      this.approvedOrReceived.set(kpis.approvedOrReceived);
      this.draft.set(kpis.draft);
      this.cancelled.set(kpis.cancelled);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'pedidos-kpi-grid',
            items: [
              {
                id: 'ordens',
                label: 'Ordens de Compra',
                value: `${kpis.totalPedidos} Pedidos`,
                caption: 'Ciclo de suprimento em andamento',
                icon: 'local_shipping',
                tone: 'info',
                action: { actionId: 'scope.filter', payload: 'all' },
              },
              {
                id: 'aprovadas',
                label: 'Aprovadas / Entregues',
                value: `${kpis.approvedOrReceived} Ordens`,
                caption: 'Itens em expedição ou já recebidos',
                icon: 'inventory',
                tone: 'success',
                action: { actionId: 'scope.filter', payload: 'aprovadas' },
              },
              {
                id: 'analise',
                label: 'Aguardando Aprovação',
                value: `${kpis.draft} em Análise`,
                caption: 'Compliance de compras e finanças',
                icon: 'pending_actions',
                tone: 'warning',
                action: { actionId: 'scope.filter', payload: 'analise' },
              },
              {
                id: 'canceladas',
                label: 'Canceladas / Revogadas',
                value: `${kpis.cancelled} Pedidos`,
                caption: 'Ordens reavaliadas pelo comando',
                icon: 'cancel',
                tone: 'neutral',
                action: { actionId: 'scope.filter', payload: 'canceladas' },
              },
            ],
          },
        ],
      });
    });
  }
}
