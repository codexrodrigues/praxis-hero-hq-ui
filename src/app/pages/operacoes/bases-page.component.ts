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
import { BASES_CRUD_METADATA, BASES_KPI_DOCUMENT } from './bases.config';

@Component({
  selector: 'app-bases-page',
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
        <div class="header-intro">
          <div class="domain-tag tone-operations">
            <span class="material-symbols-outlined">hub</span>
            Instalações & Infraestrutura Tática
          </div>
          <h1 class="title-gradient page-title">Bases & Níveis de Acesso</h1>
          <p class="page-subtitle">
            Gerenciamento de complexos militares, hangares, silos subterrâneos e postos avançados de apoio logístico.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Tático:"
        leadIcon="tune"
        [items]="scopeItems()"
        [activeId]="activeFilterId()"
        [showClearButton]="activeFilterId() !== 'all'"
        [showOmnibox]="false"
        (scopeChange)="setFilter($event.id)"
        (clear)="setFilter('all')"
      />

      <!-- Tabela CRUD Governança Canônica -->
      <section class="glass-panel crud-surface">
        <praxis-crud
          crudId="heroes-hq-bases-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class BasesPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalCount = signal<number>(7);
  protected readonly classifiedCount = signal<number>(4);
  protected readonly earthCount = signal<number>(5);
  protected readonly orbitalCount = signal<number>(2);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todas as Instalações',
      count: this.totalCount(),
      icon: 'hub',
      tone: 'default',
      isDefault: true,
    },
    {
      id: 'sigilo',
      label: 'Segurança Máxima',
      count: this.classifiedCount(),
      icon: 'security',
      tone: 'danger',
    },
    {
      id: 'terra',
      label: 'Bases Terrestres',
      count: this.earthCount(),
      icon: 'public',
      tone: 'info',
    },
    {
      id: 'espaco',
      label: 'Complexos Orbitais',
      count: this.orbitalCount(),
      icon: 'satellite_alt',
      tone: 'warning',
    },
  ]);

  protected readonly kpiDocument = signal(BASES_KPI_DOCUMENT);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'sigilo') {
      filterCriteria = { sigilo: 'ULTRA_SECRETO' };
    } else if (filterId === 'terra') {
      filterCriteria = { planeta: 'Terra' };
    } else if (filterId === 'espaco') {
      filterCriteria = { tipo: 'ORBITAL' };
    }

    return {
      ...BASES_CRUD_METADATA,
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
    if (text.includes('máxima') || text.includes('sigilosas') || text.includes('segurança')) {
      this.setFilter('sigilo');
    } else if (text.includes('mundos') || text.includes('planetários')) {
      this.setFilter('terra');
    } else if (text.includes('complexos') || text.includes('instalações')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getBasesTacticalKpis().subscribe((kpis) => {
      this.totalCount.set(kpis.totalBases);
      this.classifiedCount.set(kpis.highSecurityBases);
      this.earthCount.set(kpis.totalBases > 1 ? kpis.totalBases - 1 : 1);
      this.orbitalCount.set(kpis.theaters > 1 ? 1 : 0);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'bases-kpi-grid',
            items: [
              {
                id: 'bases',
                label: 'Complexos Operacionais',
                value: `${kpis.totalBases} Instalações`,
                caption: 'Quartéis-generais, torres e hangares',
                icon: 'hub',
                tone: 'info',
              },
              {
                id: 'sigilo',
                label: 'Segurança Máxima',
                value: `${kpis.highSecurityBases} Bases Sigilosas`,
                caption: 'Classificação Secreta ou Ultra-Secreta',
                icon: 'security',
                tone: 'danger',
              },
              {
                id: 'mundos',
                label: 'Teatros Planetários',
                value: `${kpis.theaters} Mundos`,
                caption: 'Operações terrestres e no espaço profundo',
                icon: 'public',
                tone: 'neutral',
              },
              {
                id: 'prontidao',
                label: 'Prontidão Logística',
                value: `${kpis.readinessRate}% Operacional`,
                caption: 'Suporte imediato a todas as equipes',
                icon: 'verified_user',
                tone: 'success',
              },
            ],
          },
        ],
      });
    });
  }
}
