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
import { PraxisCrudComponent, type CrudMetadata } from '@praxisui/crud';
import { PraxisRichContent } from '@praxisui/rich-content';
import { DashboardStatsService } from '../dashboard/dashboard-stats.service';
import {
  PraxisScopeBarComponent,
  type PraxisScopeBarItem,
} from '@praxisui/table';
import { INCIDENTES_CRUD_METADATA, INCIDENTES_KPI_DOCUMENT } from './incidentes.config';

@Component({
  selector: 'app-incidentes-page',
  standalone: true,
  imports: [
    CommonModule,
    PraxisCrudComponent,
    PraxisRichContent,
    PraxisScopeBarComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">crisis_alert</span>
            Operações & Gestão de Crise
          </div>
          <h1 class="title-gradient page-title">Incidentes Táticos & Danos Civis</h1>
          <p class="page-subtitle">
            Relatórios de impacto colateral, controle de contenção e compensações estruturais em teatro de confronto.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Tática de Escopo e Filtros Rápidos (Canonical PraxisScopeBar) -->
      <praxis-scope-bar
        [items]="scopeItems"
        [activeId]="activeFilterId()"
        leadLabel="Severidade:"
        leadIcon="crisis_alert"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="onScopeChange($event)"
        (clear)="setFilter('all')"
      />

      <!-- Metadata-Driven CRUD Runtime -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-incidentes-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class IncidentesPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalIncidentes = signal<number>(74);
  protected readonly criticalIncidentes = signal<number>(18);
  protected readonly totalCivilDamages = signal<number>(154426000);
  protected readonly mitigationRate = signal<number>(96.2);

  protected readonly scopeItems: PraxisScopeBarItem[] = [
    { id: 'all', label: 'Todas as Ocorrências', count: 74, icon: 'report', tone: 'default', isDefault: true },
    { id: 'critico', label: 'Severidade Crítica', count: 18, icon: 'warning', tone: 'danger', filter: { severidade: 'CRITICA' } },
    { id: 'alta', label: 'Alta Severidade', count: 14, icon: 'crisis_alert', tone: 'warning', filter: { severidade: 'ALTA' } },
    { id: 'media', label: 'Moderados', count: 42, icon: 'info', tone: 'info', filter: { severidade: 'MEDIA' } },
  ];

  protected readonly kpiDocument = signal(INCIDENTES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'critico') {
      filterCriteria = { severidade: 'CRITICA' };
    } else if (filterId === 'alta') {
      filterCriteria = { severidade: 'ALTA' };
    } else if (filterId === 'media') {
      filterCriteria = { severidade: 'MEDIA' };
    }

    return {
      ...INCIDENTES_CRUD_METADATA,
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

  protected onScopeChange(item: PraxisScopeBarItem): void {
    this.setFilter(item.id);
  }

  protected onKpiCardClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    const cardEl = target?.closest('.prx-stat-group__item, [data-stat-id], .prx-rich-card');
    if (!cardEl) return;

    const text = cardEl.textContent?.toLowerCase() ?? '';
    if (text.includes('severidade crítica') || text.includes('casos críticos')) {
      this.setFilter('critico');
    } else if (text.includes('mitigação') || text.includes('contido')) {
      this.setFilter('media');
    } else if (text.includes('total') || text.includes('ocorrências')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getIncidentesTacticalKpis().subscribe((kpis) => {
      this.totalIncidentes.set(kpis.totalIncidentes);
      this.criticalIncidentes.set(kpis.criticalIncidentes);
      this.totalCivilDamages.set(kpis.totalCivilDamages);
      this.mitigationRate.set(kpis.mitigationRate);

      const damagesMillion = (kpis.totalCivilDamages / 1_000_000).toFixed(1);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'incidentes-kpi-grid',
            items: [
              {
                id: 'incidentes',
                label: 'Total de Ocorrências',
                value: `${kpis.totalIncidentes} Registros`,
                caption: 'Sinistros pós-combate catalogados',
                icon: 'report',
                tone: 'neutral',
              },
              {
                id: 'criticos',
                label: 'Severidade Crítica',
                value: `${kpis.criticalIncidentes} Casos Críticos`,
                caption: 'Alto impacto civil e estrutural',
                icon: 'warning',
                tone: 'danger',
              },
              {
                id: 'danos',
                label: 'Danos Materiais Totais',
                value: `R$ ${damagesMillion} M`,
                caption: 'Cobertura via Fundo Tático de Indenizações',
                icon: 'account_balance',
                tone: 'warning',
              },
              {
                id: 'mitigacao',
                label: 'Taxa de Mitigação',
                value: `${kpis.mitigationRate.toFixed(1).replace('.', ',')}% Contido`,
                caption: 'Evacuação prévia e blindagem energética',
                icon: 'shield_with_heart',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
