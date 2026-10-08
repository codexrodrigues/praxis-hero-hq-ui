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
import { PraxisScopeBarComponent, type PraxisScopeBarItem } from '@praxisui/table';
import { CONTRATOS_CRUD_METADATA, CONTRATOS_KPI_DOCUMENT } from './contratos.config';

@Component({
  selector: 'app-contratos-page',
  standalone: true,
  imports: [CommonModule, PraxisCrudComponent, PraxisRichContent, PraxisScopeBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-container">
      <header class="section-header">
        <div>
          <div class="domain-tag tone-supplies">
            <span class="material-symbols-outlined">contract</span>
            Suprimentos & Aquisições Estratégicas
          </div>
          <h1 class="title-gradient page-title">Fornecedores & Contratos</h1>
          <p class="page-subtitle">
            Gestão de parceiros industriais, acordos de nível de serviço, peças de reposição e contratos corporativos.
          </p>
        </div>
      </header>

      <!-- Metadata-Driven KPI Bento Grid via Praxis Rich Content -->
      <section class="kpi-surface" (click)="onKpiCardClick($event)">
        <praxis-rich-content [document]="kpiDocument()" />
      </section>

      <!-- Barra Canônica de Escopo Tático -->
      <praxis-scope-bar
        leadLabel="Escopo Contratual:"
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
          crudId="heroes-hq-contratos-crud"
          [metadata]="activeCrudMetadata()"
        />
      </section>
    </div>
  `,
})
export class ContratosPageComponent implements OnInit, OnDestroy {
  protected readonly activeFilterId = signal<string>('all');
  protected readonly totalContratos = signal<number>(17);
  protected readonly activeAndSigned = signal<number>(11);
  protected readonly expired = signal<number>(3);
  protected readonly draft = signal<number>(1);

  protected readonly kpiDocument = signal<RichContentDocument>(CONTRATOS_KPI_DOCUMENT);

  protected readonly scopeItems = computed<PraxisScopeBarItem[]>(() => [
    {
      id: 'all',
      label: 'Todos os Acordos',
      icon: 'description',
      count: this.totalContratos(),
    },
    {
      id: 'vigentes',
      label: 'Vigentes & Assinados',
      icon: 'verified',
      tone: 'ready',
      count: this.activeAndSigned(),
    },
    {
      id: 'expirados',
      label: 'Expirados',
      icon: 'event_busy',
      tone: 'warning',
      count: this.expired(),
    },
    {
      id: 'draft',
      label: 'Em Minuta / Draft',
      icon: 'edit_note',
      tone: 'info',
      count: this.draft(),
    },
  ]);

  protected readonly activeCrudMetadata = computed<CrudMetadata>(() => {
    const filterId = this.activeFilterId();
    let filterCriteria: Record<string, unknown> = {};

    if (filterId === 'vigentes') {
      filterCriteria = { status: 'ACTIVE' };
    } else if (filterId === 'expirados') {
      filterCriteria = { status: 'EXPIRED' };
    } else if (filterId === 'draft') {
      filterCriteria = { status: 'DRAFT' };
    }

    return {
      ...CONTRATOS_CRUD_METADATA,
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
    if (text.includes('vigentes') || text.includes('ativos')) {
      this.setFilter('vigentes');
    } else if (text.includes('expirados') || text.includes('requerem ação')) {
      this.setFilter('expirados');
    } else if (text.includes('minuta') || text.includes('draft') || text.includes('aprovação')) {
      this.setFilter('draft');
    } else if (text.includes('total') || text.includes('cadastrados')) {
      this.setFilter('all');
    }
  }

  private loadKpis(): void {
    this.kpiSub?.unsubscribe();
    this.kpiSub = this.dashboardStats.getContratosTacticalKpis().subscribe((kpis) => {
      this.totalContratos.set(kpis.totalContratos);
      this.activeAndSigned.set(kpis.activeAndSigned);
      this.expired.set(kpis.expired);
      this.draft.set(kpis.draft);

      this.kpiDocument.set({
        kind: 'praxis.rich-content',
        version: '1.0.0',
        nodes: [
          {
            type: 'statGroup',
            layout: 'grid',
            tileLayout: 'tile',
            headerSpacing: 'normal',
            className: 'contratos-kpi-grid',
            items: [
              {
                id: 'vigentes',
                label: 'Contratos Vigentes',
                value: `${kpis.activeAndSigned} Ativos`,
                caption: 'Acordos ativos e assinados com a base',
                icon: 'description',
                tone: 'info',
              },
              {
                id: 'total',
                label: 'Total de Contratos',
                value: `${kpis.totalContratos} Cadastrados`,
                caption: 'Volume total de acordos catalogados',
                icon: 'verified',
                tone: 'success',
              },
              {
                id: 'expirados',
                label: 'Contratos Expirados',
                value: `${kpis.expired} Requerem Ação`,
                caption: 'Demandam aditivo ou substituição',
                icon: 'event_busy',
                tone: 'warning',
              },
              {
                id: 'draft',
                label: 'Em Minuta / Draft',
                value: `${kpis.draft} em Aprovação`,
                caption: 'Aguardando validação jurídica e financeira',
                icon: 'edit_note',
                tone: 'neutral',
              },
            ],
          },
        ],
      });
    });
  }
}
