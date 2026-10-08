import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { map } from 'rxjs/operators';

function formatCurrencyBrl(value?: number | null): string {
  if (value === undefined || value === null || isNaN(Number(value))) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 2,
  }).format(Number(value));
}

function formatTacticalDateTime(isoStr?: string | null): string {
  if (!isoStr) return 'Data não catalogada';
  try {
    const d = new Date(isoStr);
    if (isNaN(d.getTime())) return isoStr;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoStr;
  }
}

function enrichIncident(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const danos = Number(item.danosCivis ?? 0);
  const feridos = Number(item.feridos ?? 0);
  const mortos = Number(item.mortos ?? 0);
  const sev = String(item.severidade || 'MEDIA').toUpperCase();

  const severidadeBadge =
    sev === 'CRITICA'
      ? 'Crítica Máxima'
      : sev === 'ALTA'
        ? 'Alta Gravidade'
        : sev === 'MEDIA'
          ? 'Moderada'
          : 'Baixa Gravidade';

  const sinistroTone =
    sev === 'CRITICA'
      ? 'danger'
      : sev === 'ALTA'
        ? 'warning'
        : 'info';

  let indiceDanoCalculado = 50;
  if (sev === 'CRITICA') {
    indiceDanoCalculado = Math.min(98, Math.max(78, Math.round(78 + (danos > 100000 ? 16 : 8))));
  } else if (sev === 'ALTA') {
    indiceDanoCalculado = Math.min(74, Math.max(48, Math.round(50 + (danos > 50000 ? 14 : 6))));
  } else {
    indiceDanoCalculado = Math.min(45, Math.max(18, Math.round(20 + (danos > 20000 ? 12 : 5))));
  }

  return {
    ...item,
    id: item.incidenteId ?? item.id,
    indiceSinistro: indiceDanoCalculado,
    indiceDanoCalculado,
    danosCivisFormatado: formatCurrencyBrl(danos),
    ocorridoEmFormatado: formatTacticalDateTime(item.ocorridoEm),
    severidadeBadge,
    sinistroTone,
    indiceDanoPercentual: `${indiceDanoCalculado}%`,
    feridosFormatado: feridos > 0 ? `${feridos} civil(is) sob socorro` : 'Zero feridos civis',
    mortosFormatado: mortos > 0 ? `${mortos} baixa(s) confirmada(s)` : 'Zero baixas fatais',
    statusEvacuacao:
      sev === 'CRITICA'
        ? 'Perímetro isolado com blindagem Nível IV'
        : 'Área estabilizada pela Defesa Civil',
    equipeMobilizada:
      sev === 'CRITICA'
        ? 'Esquadrão Omega + Tropa Sentinela'
        : sev === 'ALTA'
          ? 'Esquadrão Tático Alpha'
          : 'Patrulha Urbana Local',
  };
}

function enrichMission(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const progresso = Number(item.progresso ?? Math.min(95, Math.max(25, Math.round(35 + (idNum % 6) * 11))));
  const missaoTone =
    String(item.status || '').toLowerCase() === 'concluída'
      ? 'success'
      : String(item.prioridade || '').toLowerCase() === 'crítica'
        ? 'danger'
        : progresso >= 70
          ? 'info'
          : 'warning';

  return {
    ...item,
    progresso,
    progressoCalculado: progresso,
    progressoPercentual: `${progresso}%`,
    orcamentoFormatado: formatCurrencyBrl(item.orcamento),
    dataInicioFormatada: formatTacticalDateTime(item.dataInicio),
    prazoLimiteFormatado: formatTacticalDateTime(item.prazoLimite),
    missaoTone,
    prioridadeBadge: String(item.prioridade || 'Média').toUpperCase(),
    statusBadge: String(item.status || 'Ativa').toUpperCase(),
    liderancaTatica: 'Comando Central Hero HQ',
    janelaOperacional: '48h para conclusão primária',
  };
}

function enrichBase(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const prontidao = Math.min(100, Math.max(45, Math.round(60 + (idNum % 5) * 8)));
  const contingenteAtual = Number(item.contingenteAtual ?? Math.round(idNum * 3 + 12));
  const contingenteMaximo = 30;
  const baseTone = prontidao >= 80 ? 'success' : prontidao >= 65 ? 'info' : 'warning';

  return {
    ...item,
    prontidao,
    defesaCalculada: prontidao,
    defesaPercentual: `${prontidao}%`,
    baseTone,
    contingenteDesc: `${contingenteAtual} / ${contingenteMaximo} Esquadrões Ativos`,
    statusEnergia: 'Reator de Fusão operando a 99.4%',
    protocoloSeguranca: 'Nível Ômega Ativado',
    capacidadeHangar: '8 naves interceptoras disponíveis',
  };
}

function enrichThreat(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const nivel = Number(item.nivel ?? 5);
  const letalidade = Math.min(100, Math.max(20, Math.round(nivel * 10)));
  const ameacaTone = nivel >= 8 ? 'danger' : nivel >= 5 ? 'warning' : 'info';

  return {
    ...item,
    indicePerigo: letalidade,
    letalidadeCalculada: letalidade,
    letalidadePercentual: `${letalidade}%`,
    ameacaTone,
    riscoGravidade:
      nivel >= 8 ? 'Ameaça de Nível Extremo' : nivel >= 5 ? 'Ameaça Significativa' : 'Risco Controlado',
    confinamentoStatus: item.confinado
      ? 'Confinado em Câmara Magnética'
      : 'Ativo e em Monitoramento Satelital',
    contraMedidaSugerida:
      nivel >= 8
        ? 'Acionar Defensores Primários'
        : 'Contenção via Drones Táticos',
  };
}

function enrichDataPayload(body: any, url: string): any {
  if (!body) return body;

  const isIncidentes = url.includes('incidentes');
  const isMissoes = url.includes('missoes');
  const isBases = url.includes('bases');
  const isAmeacas = url.includes('ameacas');

  const enricher = isIncidentes
    ? enrichIncident
    : isMissoes
      ? enrichMission
      : isBases
        ? enrichBase
        : isAmeacas
          ? enrichThreat
          : (x: any) => x;

  // Case 1: body.data.content (Spring Page wrapped in ApiResponse)
  if (body.data && Array.isArray(body.data.content)) {
    return {
      ...body,
      data: {
        ...body.data,
        content: body.data.content.map(enricher),
      },
    };
  }

  // Case 2: body.data is an array
  if (body.data && Array.isArray(body.data)) {
    return {
      ...body,
      data: body.data.map(enricher),
    };
  }

  // Case 3: body.data is a single entity
  if (body.data && typeof body.data === 'object' && body.data.id !== undefined) {
    return {
      ...body,
      data: enricher(body.data),
    };
  }

  // Case 4: body.content (standard Spring Page)
  if (Array.isArray(body.content)) {
    return {
      ...body,
      content: body.content.map(enricher),
    };
  }

  // Case 5: body is an array
  if (Array.isArray(body)) {
    return body.map(enricher);
  }

  // Case 6: body is a single entity
  if (typeof body === 'object' && body.id !== undefined) {
    return enricher(body);
  }

  return body;
}

export const tacticalDataEnrichmentInterceptor: HttpInterceptorFn = (req, next) => {
  const isOperationsOrRisk =
    req.url.includes('operations/') ||
    req.url.includes('riskintelligence/') ||
    req.url.includes('incidentes') ||
    req.url.includes('missoes') ||
    req.url.includes('bases') ||
    req.url.includes('ameacas');

  if (!isOperationsOrRisk) {
    return next(req);
  }

  return next(req).pipe(
    map((event) => {
      if (event instanceof HttpResponse && event.body) {
        const enriched = enrichDataPayload(event.body, req.url);
        return event.clone({ body: enriched });
      }
      return event;
    }),
  );
};
