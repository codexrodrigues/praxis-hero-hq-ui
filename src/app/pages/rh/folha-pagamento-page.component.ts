import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import type { RichContentDocument } from '@praxisui/core';
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  FOLHA_PAGAMENTO_CRUD_METADATA,
  FOLHA_PAGAMENTO_KPI_DOCUMENT,
} from './folha-pagamento.config';

@Component({
  selector: 'app-folha-pagamento-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div class="header-intro">
          <div class="domain-tag tone-rh">
            <span class="material-symbols-outlined">account_balance_wallet</span>
            Compensação, Benefícios & Folha
          </div>
          <h1 class="title-gradient page-title">Folha de Pagamento & Retenções</h1>
          <p class="page-subtitle">
            Demonstrativos de remuneração de heróis, estipêndios táticos, encargos previdenciários e consolidação fiscal.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Scope Bar Canônico da Plataforma Praxis -->
      <praxis-scope-bar
        leadLabel="Exercício"
        leadIcon="tune"
        [items]="scopeBarItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-folha-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class FolhaPagamentoPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalCycles = signal<number>(3246);
  protected readonly activeCompetenceCount = signal<number>(101);
  protected readonly year2026Count = signal<number>(303);

  protected readonly scopeBarItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Ciclos',
      icon: 'receipt_long',
      filter: {},
      count: this.totalCycles(),
      isDefault: true,
    },
    {
      id: 'vigente',
      label: 'Competência Vigente (03/2026)',
      icon: 'today',
      filter: 'mes=3 and ano=2026',
      count: this.activeCompetenceCount(),
      tone: 'ready',
    },
    {
      id: 'ano2026',
      label: 'Ano 2026',
      icon: 'calendar_month',
      filter: 'ano=2026',
      count: this.year2026Count(),
      tone: 'info',
    },
  ]);
  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigente') {
      filterCriteria = { mes: 3, ano: 2026 };
    } else if (filterId === 'ano2026') {
      filterCriteria = { ano: 2026 };
    }

    return {
      ...FOLHA_PAGAMENTO_CRUD_METADATA,
      filterCriteria,
    };
  });

  protected readonly kpiDocument = signal<RichContentDocument>(FOLHA_PAGAMENTO_KPI_DOCUMENT);

  private readonly dashboardStats = inject(DashboardStatsService);
  private kpiSub: Subscription | null = null;

  ngOnInit(): void {
    this.loadKpis();
  }

  ngOnDestroy(): void {
    this.kpiSub?.unsubscribe();
  }

  protected setFilter(filterId: string): void {
    this.activeFilterId.set(filterId);
  }

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('volume') || text.includes('competência') || text.includes('mensal')) {
      this.setFilter('vigente');
    } else if (text.includes('consolidados') || text.includes('ciclos')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getPayrollTacticalKpis().subscribe((kpis) => {
      const volumeM = (kpis.monthlyGrossVolume / 1_000_000).toFixed(2);
      const retencoesK = (kpis.monthlyDeductions / 1_000).toFixed(1);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'folha-kpi-grid',
            items: [
              {
                id: 'volume',
                label: 'Volume Folha Mensal',
                value: `R$ ${volumeM}M`,
                caption: `Competência ${kpis.activeCompetence}`,
                icon: 'account_balance_wallet',
                tone: 'info',
              },
              {
                id: 'consolidados',
                label: 'Registros Consolidados',
                value: `${kpis.totalCycles} Ciclos`,
                caption: 'Histórico fiscal e operacional',
                icon: 'receipt_long',
                tone: 'success',
              },
              {
                id: 'retencoes',
                label: 'Retenções & Encargos',
                value: `R$ ${retencoesK}k`,
                caption: 'Previdência, saúde e encargos',
                icon: 'savings',
                tone: 'warning',
              },
              {
                id: 'liquidacao',
                label: 'Próxima Liquidação',
                value: kpis.nextPaymentDate,
                caption: 'Programada via tesouraria',
                icon: 'calendar_month',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
