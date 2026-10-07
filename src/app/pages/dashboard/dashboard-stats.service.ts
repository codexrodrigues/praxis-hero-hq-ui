import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { forkJoin, map, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { PRAXIS_API_BASE_URL } from '../../core/platform.config';

export interface DashboardTacticalKpis {
  activeHeroes: number;
  totalHeroes: number;
  inactiveHeroes: number;
  readinessRate: number;
  averageReputationScore: number;
  plannedMissions: number;
  inProgressMissions: number;
  totalMissions: number;
  latestPayrollMonth: string;
  latestPayrollNetMillion: string;
  latestPayrollEmployees: number;
  criticalIncidents: number;
  highIncidents: number;
  totalIncidents: number;
}

export interface MissionTacticalKpis {
  activeMissions: number;
  plannedMissions: number;
  pausedMissions: number;
  completedMissions: number;
  failedMissions: number;
  totalMissions: number;
  successRate: number;
  criticalPriorityMissions: number;
  highPriorityMissions: number;
}

@Injectable({ providedIn: 'root' })
export class DashboardStatsService {
  private readonly http = inject(HttpClient);

  getTacticalKpis(): Observable<DashboardTacticalKpis> {
    const activeHeroes$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/human-resources/funcionarios/filter?page=0&size=1`, { ativo: true })
      .pipe(
        map((res) => res?.data?.totalElements ?? 53),
        catchError(() => of(53)),
      );

    const totalHeroes$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/human-resources/funcionarios/filter?page=0&size=1`, {})
      .pipe(
        map((res) => res?.data?.totalElements ?? 101),
        catchError(() => of(101)),
      );

    const missionsStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/operations/vw-resumo-missoes/stats/group-by`, {
        filter: {},
        field: 'status',
        metrics: [{ operation: 'COUNT', alias: 'total' }],
      })
      .pipe(
        map((res) => {
          const buckets: any[] = res?.data?.buckets ?? [];
          let planned = 0;
          let inProgress = 0;
          let total = 0;
          for (const b of buckets) {
            const count = Number(b.count ?? b.value ?? 0);
            total += count;
            if (b.key === 'PLANEJADA') planned = count;
            if (b.key === 'EM_ANDAMENTO') inProgress = count;
          }
          return { planned, inProgress, total };
        }),
        catchError(() => of({ planned: 10, inProgress: 6, total: 26 })),
      );

    const payrollStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/human-resources/vw-analytics-folha-pagamento/stats/timeseries`, {
        filter: {},
        field: 'competencia',
        granularity: 'MONTH',
        metrics: [{ operation: 'SUM', field: 'salarioLiquido', alias: 'salarioLiquido' }],
      })
      .pipe(
        map((res) => {
          const points: any[] = res?.data?.points ?? [];
          const lastPoint = points.length ? points[points.length - 1] : null;
          const val = lastPoint?.value ?? 3089073.18;
          const netMillion = (val / 1_000_000).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          const count = lastPoint?.count ?? 98;
          let monthLabel = 'Março / 2026';
          if (lastPoint?.start) {
            const parts = String(lastPoint.start).split('-');
            if (parts.length >= 2) {
              const months = [
                'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
              ];
              const mIdx = parseInt(parts[1], 10) - 1;
              monthLabel = `${months[mIdx] || 'Mês'} / ${parts[0]}`;
            }
          }
          return { netMillion, count, monthLabel };
        }),
        catchError(() => of({ netMillion: '3,09', count: 98, monthLabel: 'Março / 2026' })),
      );

    const incidentsStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/risk-intelligence/vw-indicadores-incidentes/stats/group-by`, {
        filter: {},
        field: 'severidade',
        metrics: [{ operation: 'COUNT', alias: 'total' }],
      })
      .pipe(
        map((res) => {
          const buckets: any[] = res?.data?.buckets ?? [];
          let critical = 0;
          let high = 0;
          let total = 0;
          for (const b of buckets) {
            const count = Number(b.count ?? b.value ?? 0);
            total += count;
            if (b.key === 'CRITICA') critical = count;
            if (b.key === 'ALTA') high = count;
          }
          return { critical, high, total };
        }),
        catchError(() => of({ critical: 18, high: 19, total: 74 })),
      );

    const reputationStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/human-resources/vw-ranking-reputacao/stats/group-by`, {
        filter: { equipe: '%' },
        field: 'equipe',
        metrics: [
          { operation: 'AVG', field: 'scorePublico', alias: 'scorePublico' },
          { operation: 'AVG', field: 'scoreGovernamental', alias: 'scoreGovernamental' },
        ],
      })
      .pipe(
        map((res) => {
          const buckets: any[] = res?.data?.buckets ?? [];
          let totalScore = 0;
          let totalCount = 0;
          for (const b of buckets) {
            const count = Number(b.count ?? 1);
            const pub = Number(b.values?.scorePublico ?? b.value ?? 80);
            const gov = Number(b.values?.scoreGovernamental ?? b.value ?? 80);
            const combined = (pub + gov) / 2;
            totalScore += combined * count;
            totalCount += count;
          }
          const avg = totalCount > 0 ? totalScore / totalCount : 79.5;
          return Math.round(avg * 10) / 10;
        }),
        catchError(() => of(79.5)),
      );

    return forkJoin({
      active: activeHeroes$,
      totalHeroes: totalHeroes$,
      missions: missionsStats$,
      payroll: payrollStats$,
      incidents: incidentsStats$,
      reputation: reputationStats$,
    }).pipe(
      map(({ active, totalHeroes, missions, payroll, incidents, reputation }) => {
        const inativos = Math.max(0, totalHeroes - active);
        const rate = totalHeroes > 0 ? Math.round((active / totalHeroes) * 1000) / 10 : 52.5;
        return {
          activeHeroes: active,
          totalHeroes: totalHeroes,
          inactiveHeroes: inativos,
          readinessRate: rate,
          averageReputationScore: reputation,
          plannedMissions: missions.planned,
          inProgressMissions: missions.inProgress,
          totalMissions: missions.total,
          latestPayrollMonth: payroll.monthLabel,
          latestPayrollNetMillion: payroll.netMillion,
          latestPayrollEmployees: payroll.count,
          criticalIncidents: incidents.critical,
          highIncidents: incidents.high,
          totalIncidents: incidents.total,
        };
      }),
    );
  }

  getMissionTacticalKpis(): Observable<MissionTacticalKpis> {
    const statusStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/operations/vw-resumo-missoes/stats/group-by`, {
        filter: {},
        field: 'status',
        metrics: [{ operation: 'COUNT', alias: 'total' }],
      })
      .pipe(
        map((res) => {
          const buckets: any[] = res?.data?.buckets ?? [];
          let active = 0;
          let planned = 0;
          let paused = 0;
          let completed = 0;
          let failed = 0;
          let total = 0;
          for (const b of buckets) {
            const count = Number(b.count ?? b.value ?? 0);
            total += count;
            if (b.key === 'EM_ANDAMENTO') active = count;
            if (b.key === 'PLANEJADA') planned = count;
            if (b.key === 'PAUSADA') paused = count;
            if (b.key === 'CONCLUIDA') completed = count;
            if (b.key === 'FALHOU') failed = count;
          }
          const finished = completed + failed;
          const successRate = finished > 0 ? Math.round((completed / finished) * 1000) / 10 : 85.0;
          return { active, planned, paused, completed, failed, total, successRate };
        }),
        catchError(() =>
          of({ active: 6, planned: 10, paused: 4, completed: 4, failed: 2, total: 26, successRate: 66.7 }),
        ),
      );

    const priorityStats$ = this.http
      .post<any>(`${PRAXIS_API_BASE_URL}/operations/vw-resumo-missoes/stats/group-by`, {
        filter: {},
        field: 'prioridade',
        metrics: [{ operation: 'COUNT', alias: 'total' }],
      })
      .pipe(
        map((res) => {
          const buckets: any[] = res?.data?.buckets ?? [];
          let critical = 0;
          let high = 0;
          for (const b of buckets) {
            const count = Number(b.count ?? b.value ?? 0);
            if (b.key === 'CRITICA') critical = count;
            if (b.key === 'ALTA') high = count;
          }
          return { critical, high };
        }),
        catchError(() => of({ critical: 10, high: 10 })),
      );

    return forkJoin({
      status: statusStats$,
      priority: priorityStats$,
    }).pipe(
      map(({ status, priority }) => ({
        activeMissions: status.active,
        plannedMissions: status.planned,
        pausedMissions: status.paused,
        completedMissions: status.completed,
        failedMissions: status.failed,
        totalMissions: status.total,
        successRate: status.successRate,
        criticalPriorityMissions: priority.critical,
        highPriorityMissions: priority.high,
      })),
    );
  }
}
