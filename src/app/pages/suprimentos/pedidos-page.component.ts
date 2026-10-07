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

export const PEDIDOS_CRUD_METADATA: CrudMetadata = {
  component: 'praxis-crud',
  resource: {
    path: 'procurement/purchase-orders',
    idField: 'id',
  },
  table: {
    columnProjection: {
      source: 'schema',
      include: ['id', 'orderDate', 'quantity', 'currency', 'status', 'approvedAt', 'receivedAt', 'disabledReason'],
      order: ['id', 'orderDate', 'quantity', 'currency', 'status', 'approvedAt', 'receivedAt', 'disabledReason'],
      overrides: {
        id: { width: '80px', align: 'center' },
        orderDate: { width: '140px', align: 'center', format: 'dd/MM/yyyy' },
        quantity: { width: '120px', align: 'center' },
        currency: { width: '100px', align: 'center' },
        status: { width: '150px', align: 'center' },
        approvedAt: { width: '140px', align: 'center', format: 'dd/MM/yyyy' },
        receivedAt: { width: '140px', align: 'center', format: 'dd/MM/yyyy' },
        disabledReason: { width: '220px' },
      },
    },
    columns: [],
    toolbar: {
      search: {
        enabled: true,
        placeholder: 'Buscar pedidos de compra por status ou observações...',
      },
      filters: {
        enabled: true,
        quickFilters: [
          { id: 'all', label: 'Todas as Ordens', filter: '', icon: 'local_shipping' },
          { id: 'aprovadas', label: 'Aprovadas / Entregues', filter: "status='APPROVED' or status='RECEIVED'", icon: 'inventory' },
          { id: 'analise', label: 'Aguardando Aprovação', filter: "status='PENDING' or status='DRAFT'", icon: 'pending_actions' },
          { id: 'canceladas', label: 'Canceladas / Revogadas', filter: "status='CANCELLED'", icon: 'cancel' },
        ],
        showAdvancedButton: true,
      },
    },
    behavior: {
      filtering: {
        columnFilters: {
          enabled: true,
        },
        advancedFilters: {
          schemaUrl: '/schemas/filtered?path=/api/procurement/purchase-orders/filter&operation=post&schemaType=request',
          settings: {
            inline: true,
            alwaysVisibleFields: ['status', 'orderDate', 'quantity'],
            useInlineSearchableSelectVariant: true,
          },
        },
      },
    },
  } as unknown as CrudMetadata['table'],
  defaults: {
    openMode: 'drawer',
  },
};

export const PEDIDOS_KPI_DOCUMENT: RichContentDocument = {
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
          value: '10 Pedidos',
          caption: 'Ciclo de suprimento em andamento',
          icon: 'local_shipping',
          tone: 'info',
          action: { actionId: 'scope.filter', payload: 'all' },
        },
        {
          id: 'aprovadas',
          label: 'Aprovadas / Entregues',
          value: '5 Ordens',
          caption: 'Itens em expedição ou já recebidos',
          icon: 'inventory',
          tone: 'success',
          action: { actionId: 'scope.filter', payload: 'aprovadas' },
        },
        {
          id: 'analise',
          label: 'Aguardando Aprovação',
          value: '3 em Análise',
          caption: 'Compliance de compras e finanças',
          icon: 'pending_actions',
          tone: 'warning',
          action: { actionId: 'scope.filter', payload: 'analise' },
        },
        {
          id: 'canceladas',
          label: 'Canceladas / Revogadas',
          value: '2 Pedidos',
          caption: 'Ordens reavaliadas pelo comando',
          icon: 'cancel',
          tone: 'neutral',
          action: { actionId: 'scope.filter', payload: 'canceladas' },
        },
      ],
    },
  ],
};

@Component({
  selector: 'app-pedidos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent],
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

      <!-- Barra Tática de Escopo e Filtros Rápidos -->
      <div class="tactical-filter-bar glass-panel">
        <div class="scope-label">
          <span class="material-symbols-outlined">tune</span>
          <span>Status da Ordem:</span>
        </div>

        <div class="scope-chips">
          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'all'"
            (click)="setFilter('all')"
          >
            <span class="material-symbols-outlined">local_shipping</span>
            <span>Todas as Ordens</span>
            <span class="chip-count">{{ totalPedidos() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-ready"
            [class.is-active]="activeFilterId() === 'aprovadas'"
            (click)="setFilter('aprovadas')"
          >
            <span class="material-symbols-outlined">inventory</span>
            <span>Aprovadas / Entregues</span>
            <span class="chip-count">{{ approvedOrReceived() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip chip-warning"
            [class.is-active]="activeFilterId() === 'analise'"
            (click)="setFilter('analise')"
          >
            <span class="material-symbols-outlined">pending_actions</span>
            <span>Em Análise</span>
            <span class="chip-count">{{ draft() }}</span>
          </button>

          <button
            type="button"
            class="scope-chip"
            [class.is-active]="activeFilterId() === 'canceladas'"
            (click)="setFilter('canceladas')"
          >
            <span class="material-symbols-outlined">cancel</span>
            <span>Canceladas</span>
            <span class="chip-count">{{ cancelled() }}</span>
          </button>
        </div>

        @if (activeFilterId() !== 'all') {
          <button type="button" class="clear-scope-btn" (click)="setFilter('all')">
            <span class="material-symbols-outlined">restart_alt</span>
            <span>Limpar Filtro</span>
          </button>
        }
      </div>

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
  styles: [`
    .page-container {
      display: flex;
      flex-direction: column;
      gap: 24px;
      max-width: 1540px;
      margin: 0 auto;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .domain-tag {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      span { font-size: 14px; }
    }

    .tone-supplies {
      background: color-mix(in oklab, var(--supplies) 12%, transparent);
      border: 1px solid color-mix(in oklab, var(--supplies) 30%, transparent);
      color: var(--supplies);
    }

    .page-title {
      margin: 10px 0 0;
      font-family: var(--font-display);
      font-size: 2.2rem;
      font-weight: 700;
    }

    .page-subtitle {
      margin: 8px 0 0;
      font-size: 0.88rem;
      color: var(--muted-foreground);
      max-width: 720px;
    }

    .kpi-surface {
      cursor: pointer;
    }

    /* Tactical Filter Bar */
    .tactical-filter-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 12px 18px;
      border-radius: 14px;
      flex-wrap: wrap;
      border: 1px solid rgba(255, 255, 255, 0.08);
      background: rgba(18, 26, 43, 0.6);
      backdrop-filter: blur(12px);
    }

    .scope-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted-foreground);
      span.material-symbols-outlined { font-size: 18px; color: var(--primary); }
    }

    .scope-chips {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .scope-chip {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid rgba(255, 255, 255, 0.12);
      background: rgba(255, 255, 255, 0.03);
      color: var(--foreground);
      transition: all 0.2s ease;

      span.material-symbols-outlined { font-size: 16px; }

      .chip-count {
        padding: 2px 7px;
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.08);
        font-size: 0.75rem;
        font-weight: 700;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.22);
      }

      &.is-active {
        background: color-mix(in oklab, var(--primary) 22%, transparent);
        border-color: var(--primary);
        color: #fff;
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 30%, transparent);

        .chip-count {
          background: var(--primary);
          color: #fff;
        }
      }

      &.chip-danger.is-active {
        background: color-mix(in oklab, var(--risk) 22%, transparent);
        border-color: var(--risk);
        .chip-count { background: var(--risk); }
      }

      &.chip-warning.is-active {
        background: color-mix(in oklab, var(--warning) 22%, transparent);
        border-color: var(--warning);
        .chip-count { background: var(--warning); }
      }

      &.chip-ready.is-active {
        background: color-mix(in oklab, var(--ready) 22%, transparent);
        border-color: var(--ready);
        .chip-count { background: var(--ready); }
      }
    }

    .clear-scope-btn {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--muted-foreground);
      background: transparent;
      border: 1px dashed rgba(255, 255, 255, 0.15);
      cursor: pointer;
      transition: all 0.15s ease;

      span { font-size: 16px; }

      &:hover {
        color: var(--foreground);
        border-color: rgba(255, 255, 255, 0.35);
        background: rgba(255, 255, 255, 0.04);
      }
    }

    .crud-surface {
      border-radius: 18px;
      padding: 20px;
      overflow: hidden;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }

    .table-persistence-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.04em;

      &.customized {
        background: color-mix(in oklab, var(--warning) 15%, transparent);
        border: 1px solid color-mix(in oklab, var(--warning) 35%, transparent);
        color: var(--warning);
      }

      &.governed {
        background: color-mix(in oklab, var(--cobalt) 12%, transparent);
        border: 1px solid color-mix(in oklab, var(--cobalt) 30%, transparent);
        color: var(--cobalt);
      }

      .saved-time {
        font-size: 0.65rem;
        opacity: 0.8;
      }
    }

    .pulse-indicator-amber {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--warning);
      box-shadow: 0 0 6px var(--warning);
    }

    .pulse-indicator-cyan {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background-color: var(--cobalt);
      box-shadow: 0 0 6px var(--cobalt);
    }

    .reset-layout-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 36px;
      padding: 0 14px;
      border-radius: 10px;
      font-size: 0.78rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid color-mix(in oklab, var(--destructive) 35%, transparent);
      background: color-mix(in oklab, var(--destructive) 10%, transparent);
      color: var(--destructive);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        background: var(--destructive);
        color: #fff;
        border-color: var(--destructive);
        transform: translateY(-1px);
      }

      span { font-size: 16px; }
    }

    .customize-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      height: 36px;
      padding: 0 16px;
      border-radius: 10px;
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      border: 1px solid var(--border);
      background: color-mix(in oklab, var(--card) 80%, transparent);
      color: var(--foreground);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);

      &:hover {
        border-color: var(--primary);
        color: var(--primary);
        transform: translateY(-1px);
      }

      &.active {
        background: var(--primary);
        color: var(--primary-foreground);
        border-color: var(--primary);
        box-shadow: 0 0 16px color-mix(in oklab, var(--primary) 40%, transparent);
      }

      span { font-size: 18px; }
    }
  `],
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
