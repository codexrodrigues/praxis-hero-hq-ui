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
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  PraxisAnalyticalDrawerComponent,
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { THREAT_ANALYTICAL_DRAWER_CONFIG } from './threat-drawer.config';
import { AMEACAS_CRUD_METADATA, AMEACAS_KPI_DOCUMENT } from './ameacas.config';

@Component({
  selector: 'app-ameacas-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    PraxisAnalyticalDrawerComponent,
    PraxisScopeBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-risk">
            <span class="material-symbols-outlined">radar</span>
            Risco & Inteligência Tática
          </div>
          <h1 class="title-gradient page-title">Ameaças Táticas & Alvos Globais</h1>
          <p class="page-subtitle">
            Catalogação de vilões, supervilões e dissidentes intergalácticos com índices de perigo e status de contenção.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Radar Tático:"
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
        <praxis-crud
          crudId="heroes-hq-ameacas-crud"
          [metadata]="activeCrudMetadata()"
          (rowClick)="onThreatRowClicked($event)"
        />
      </section>

      <!-- Threat Intelligence Drawer Governed via Canonical Schema -->
      <praxis-analytical-drawer
        [isOpen]="!!selectedThreat()"
        [row]="selectedThreat()"
        [drawerConfig]="threatDrawerConfig"
        (closeDrawer)="selectedThreat.set(null)"
      />
    </div>
  `,
})
export class AmeacasPageComponent implements OnInit, OnDestroy {
  protected readonly threatDrawerConfig = THREAT_ANALYTICAL_DRAWER_CONFIG;
  protected readonly selectedThreat = signal<Record<string, unknown> | null>(null);
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalAmeacas = signal<number>(16);
  protected readonly confrontation = signal<number>(6);
  protected readonly observation = signal<number>(3);
  protected readonly contained = signal<number>(3);
  protected readonly totalBountyMillion = signal<number>(12.1);

  protected readonly kpiDocument = signal<RichContentDocument>(AMEACAS_KPI_DOCUMENT);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Alvos',
      icon: 'radar',
      count: this.totalAmeacas(),
    },
    {
      id: 'confronto',
      label: 'Em Confronto',
      icon: 'crisis_alert',
      tone: 'warning',
      count: this.confrontation(),
    },
    {
      id: 'observacao',
      label: 'Em Observação',
      icon: 'visibility',
      count: this.observation(),
    },
    {
      id: 'contidos',
      label: 'Contidos / Raft',
      icon: 'lock',
      tone: 'ready',
      count: this.contained(),
    },
  ]);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'confronto') {
      filterCriteria = { status: 'CONFRONTO' };
    } else if (filterId === 'contidos') {
      filterCriteria = { status: 'CONTIDO' };
    } else if (filterId === 'critico') {
      filterCriteria = { nivel: 5 };
    }

    return {
      ...AMEACAS_CRUD_METADATA,
      filterCriteria,
    };
  });

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
    if (text.includes('confronto') || text.includes('combate')) {
      this.setFilter('confronto');
    } else if (text.includes('contidos') || text.includes('neutralizados') || text.includes('raft')) {
      this.setFilter('contidos');
    } else if (text.includes('fundo') || text.includes('recompensas')) {
      this.setFilter('critico');
    } else if (text.includes('monitoradas') || text.includes('alvos')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getAmeacasTacticalKpis().subscribe((kpis) => {
      this.totalAmeacas.set(kpis.totalAmeacas);
      this.confrontation.set(kpis.confrontation);
      this.observation.set(kpis.observation);
      this.contained.set(kpis.contained);
      this.totalBountyMillion.set(kpis.totalBountyMillion);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'ameacas-kpi-grid',
            items: [
              {
                id: 'ameacas',
                label: 'Ameaças Monitoradas',
                value: `${kpis.totalAmeacas} Alvos`,
                caption: 'Radar contínuo em frequência quântica',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'confronto',
                label: 'Em Confronto Ativo',
                value: `${kpis.confrontation} em Combate`,
                caption: 'Esquadrões mobilizados em solo',
                icon: 'crisis_alert',
                tone: 'warning',
              },
              {
                id: 'contidos',
                label: 'Contidos / Prisão Raft',
                value: `${kpis.contained} Neutralizados`,
                caption: 'Custodiados em estase de força',
                icon: 'lock',
                tone: 'success',
              },
              {
                id: 'recompensas',
                label: 'Fundo Total de Recompensas',
                value: `R$ ${kpis.totalBountyMillion} M`,
                caption: 'Garantido pelo Acordo de Sokovia',
                icon: 'payments',
                tone: 'info',
              },
            ],
          },
        ],
      });
    });
  }

  protected onThreatRowClicked(event: unknown): void {
    const raw = (event as any)?.row ?? (event as any)?.data ?? event;
    if (raw && typeof raw === 'object' && 'id' in raw) {
      this.selectedThreat.set(raw as Record<string, unknown>);
    }
  }
}
