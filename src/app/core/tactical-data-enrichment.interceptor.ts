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

function formatDatePtBr(dateStr?: string | null): string {
  if (!dateStr) return '—';
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateStr)) return dateStr;
  const match = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (match) {
    const [, y, m, d] = match;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
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

function enrichEquipment(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const rawRes = Number(item.resistencia ?? 8);
  const score = rawRes <= 10 ? rawRes * 10 : rawRes;
  const tone = score >= 80 ? 'success' : score >= 60 ? 'info' : score >= 40 ? 'warning' : 'danger';
  const tipo = String(item.tipo || 'OUTRO').toUpperCase();
  const status = String(item.status || 'DISPONIVEL').toUpperCase();

  const statusBadge =
    status === 'EM_USO'
      ? 'Em Custódia Ativa'
      : status === 'MANUTENCAO'
        ? 'Em Manutenção'
        : 'Disponível em Arsenal';

  const fonteEnergia =
    tipo.includes('ARMADURA')
      ? 'Micro-Reator Arc Mark VI'
      : tipo.includes('ARTEFATO') || tipo.includes('GADGET')
        ? 'Matriz de Vibranium Estabilizada'
        : tipo.includes('ARMA')
          ? 'Célula de Plasma Iônico'
          : 'Bateria Quântica de Alto Rendimento';

  const tecnologiaOrigem =
    tipo.includes('ARMADURA')
      ? 'Stark Industries R&D'
      : tipo.includes('ARTEFATO')
        ? 'Wakanda Design Group'
        : 'Divisão Científica S.H.I.E.L.D.';

  const localizacaoArmaria =
    status === 'EM_USO'
      ? 'Em Campo com Operador'
      : status === 'MANUTENCAO'
        ? 'Hangar Tático - Bancada 3'
        : 'Cofre Central Subterrâneo - Nível 4';

  const autorizacaoAcesso =
    score >= 80 ? 'Nível Ômega (Vingadores)' : 'Nível Alfa (Comando Superior)';

  return {
    ...item,
    resistenciaScore: score,
    resistenciaPercentual: `${score}%`,
    resistenciaTone: tone,
    statusBadge,
    fonteEnergia,
    tecnologiaOrigem,
    localizacaoArmaria,
    autorizacaoAcesso,
    ultimaRevisaoFormatada: 'Há 3 dias (Homologado)',
  };
}

function enrichVehicle(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const status = String(item.status || 'OPERACIONAL').toUpperCase();
  const tipo = String(item.tipo || 'AEREO').toUpperCase();
  const idNum = Number(item.id ?? 1);
  const prontidao = status === 'OPERACIONAL' ? Math.min(100, Math.max(88, 85 + (idNum % 3) * 5)) : 42;
  const prontidaoTone = prontidao >= 80 ? 'success' : 'warning';

  const sistemaPropulsao =
    tipo.includes('ESPACIAL')
      ? 'Propulsor Hiperespacial Quântico'
      : tipo.includes('AEREO')
        ? 'Turbinas Repulsoras Stark VTOL'
        : 'Motor Híbrido Turbinado Nível V';

  const velocidadeMax =
    tipo.includes('ESPACIAL')
      ? 'Dobra 2 (Suborbital)'
      : tipo.includes('AEREO')
        ? 'Mach 4.5'
        : '380 km/h com Blindagem Reativa';

  const hangarAlocacao =
    tipo.includes('ESPACIAL')
      ? 'Plataforma Orbital S.H.I.E.L.D.'
      : tipo.includes('AEREO')
        ? 'Hangar Central - Helicarrier'
        : 'Batmower / Garagem Subterrânea';

  const nivelCombustivel =
    status === 'OPERACIONAL' ? '98% Carga Total' : '35% Em Recarga';

  return {
    ...item,
    prontidaoScore: prontidao,
    prontidaoPercentual: `${prontidao}%`,
    prontidaoTone,
    sistemaPropulsao,
    velocidadeMax,
    hangarAlocacao,
    nivelCombustivel,
    autonomiaVoo: '12.000 km sem reabastecimento',
    blindagemCasco: 'Liga de Titânio-Vibranium',
  };
}

function enrichContract(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const status = String(item.status || 'ACTIVE').toUpperCase();
  const complianceScore =
    status === 'ACTIVE' || status === 'SIGNED'
      ? Math.min(99, Math.max(85, 88 + (idNum % 4) * 3))
      : status === 'DRAFT'
        ? 65
        : 38;
  const slaTone = complianceScore >= 80 ? 'success' : complianceScore >= 60 ? 'info' : 'warning';

  return {
    ...item,
    complianceScore,
    compliancePercentual: `${complianceScore}%`,
    slaTone,
    indiceSla: complianceScore,
    gestorContrato: 'Diretoria de Suprimentos & Armaria',
    renovacaoAutomatica: 'Cláusula de Renovação Bianual',
    penalidadeDescricao: 'Multa de 15% por atraso de entrega de insumos',
  };
}

function enrichPurchaseOrder(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const status = String(item.status || 'APPROVED').toUpperCase();
  const idNum = Number(item.id ?? 1);
  const progresso =
    status === 'RECEIVED'
      ? 100
      : status === 'APPROVED'
        ? 75
        : status === 'PENDING' || status === 'DRAFT'
          ? 35
          : 10;
  const orderTone = progresso >= 90 ? 'success' : progresso >= 60 ? 'info' : progresso >= 30 ? 'warning' : 'neutral';

  return {
    ...item,
    progressoEntrega: progresso,
    progressoPercentual: `${progresso}%`,
    orderTone,
    especificacaoCarga: 'Lotes de Ligas Especiais e Microcomponentes',
    centroCusto: 'Divisão Tática Operacional - CC-408',
    prazoEstimado: status === 'RECEIVED' ? 'Entregue no Armazém' : '7 dias úteis',
  };
}

function enrichReputation(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const media = Number(item.media ?? 80);
  const mediaScore = Math.round(media);
  const mediaTone = mediaScore >= 90 ? 'success' : mediaScore >= 80 ? 'info' : 'warning';
  const pub = Number(item.scorePublico ?? 80);
  const gov = Number(item.scoreGovernamental ?? 80);

  return {
    ...item,
    id: item.funcionarioId ?? item.id,
    mediaScore,
    mediaPercentual: `${mediaScore}%`,
    mediaTone,
    scorePublicoPercentual: `${pub}%`,
    scoreGovernamentalPercentual: `${gov}%`,
    tendenciaMidia: 'Alta Positiva (99.2% de satisfação civil)',
    statusImagem: mediaScore >= 90 ? 'Herói Classe S / Embaixador Global' : 'Operador de Alto Impacto',
  };
}

function enrichAfastamento(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const progressoRecuperacao = Math.min(100, Math.max(30, 40 + (idNum % 5) * 14));
  const leaveTone = progressoRecuperacao >= 80 ? 'success' : progressoRecuperacao >= 50 ? 'info' : 'warning';
  const dataInicioFormatada = formatDatePtBr(item.dataInicio);
  const dataFimFormatada = formatDatePtBr(item.dataFim);

  return {
    ...item,
    dataInicioFormatada,
    dataFimFormatada,
    progressoRecuperacao,
    progressoRecuperacaoPercentual: `${progressoRecuperacao}%`,
    leaveTone,
    laudoMedico: 'Em recuperação tecidual acelerada (Câmara de Cura S.H.I.E.L.D.)',
    substitutoDesignado: 'Sentinela de Apoio Tático Alpha',
    previsaoRetorno: dataFimFormatada,
  };
}

function enrichDepartamento(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const ocupacaoScore = Math.min(100, Math.max(65, 75 + (idNum % 5) * 5));
  const ocupacaoTone = ocupacaoScore >= 85 ? 'success' : 'info';

  return {
    ...item,
    ocupacaoScore,
    ocupacaoPercentual: `${ocupacaoScore}%`,
    ocupacaoTone,
    contingenteTotal: `${Math.round(ocupacaoScore * 0.4)} Especialistas`,
    nivelSigilo: 'Nível Alfa (Conselho de Segurança)',
    salaComando: `Complexo S.H.I.E.L.D. - Setor ${item.codigo || 'HQ'}`,
  };
}

function enrichEquipe(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const prontidaoScore =
    item.status === 'ATIVA' ? Math.min(100, 85 + (idNum % 4) * 4) : item.status === 'EM_MISSAO' ? 95 : 60;
  const prontidaoTone = prontidaoScore >= 85 ? 'success' : prontidaoScore >= 70 ? 'info' : 'warning';

  return {
    ...item,
    prontidaoScore,
    prontidaoPercentual: `${prontidaoScore}%`,
    prontidaoTone,
    liderTatico:
      idNum % 3 === 0
        ? 'Capitão América (Steve Rogers)'
        : idNum % 3 === 1
          ? 'Iron Man (Tony Stark)'
          : 'Thor Odinson',
    efetivoOperacional: `${12 + (idNum % 6) * 4} Operadores Táticos`,
    historicoMissoes: `${40 + (idNum % 15) * 8} Operações Concluídas`,
    nivelAcessoEquipe: 'Credencial Classe Vingadores',
  };
}

function enrichFuncionario(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const idNum = Number(item.id ?? 1);
  const prontidaoScore = item.ativo !== false ? Math.min(100, 80 + (idNum % 5) * 4) : 40;
  const prontidaoTone = prontidaoScore >= 85 ? 'success' : prontidaoScore >= 70 ? 'info' : 'warning';

  return {
    ...item,
    prontidaoScore,
    prontidaoPercentual: `${prontidaoScore}%`,
    prontidaoTone,
  };
}

function enrichFolha(item: any): any {
  if (!item || typeof item !== 'object') return item;
  const bruto = Number(item.salarioBruto ?? 10000);
  const descontos = Number(item.totalDescontos ?? 2000);
  // Integridade de Folha Corporativa: Salário Líquido = Bruto - Retenções
  const liquidoReal = Math.max(0, bruto - descontos);
  const ratio = bruto > 0 ? Math.min(100, Math.max(0, Math.round((liquidoReal / bruto) * 100))) : 80;
  const margemTone = ratio >= 80 ? 'success' : ratio >= 60 ? 'info' : 'warning';

  return {
    ...item,
    salarioLiquido: liquidoReal,
    margemLiquida: ratio,
    margemLiquidaPercentual: `${ratio}%`,
    margemTone,
    salarioBrutoFormatado: formatCurrencyBrl(bruto),
    salarioLiquidoFormatado: formatCurrencyBrl(liquidoReal),
    totalDescontosFormatado: formatCurrencyBrl(descontos),
    dataPagamentoFormatada: formatDatePtBr(item.dataPagamento),
    statusTransferencia: 'Liquidado via Banco Central S.H.I.E.L.D.',
  };
}

function enrichDataPayload(body: any, url: string): any {
  if (!body) return body;

  const isIncidentes = url.includes('incidentes');
  const isMissoes = url.includes('missoes');
  const isBases = url.includes('bases');
  const isAmeacas = url.includes('ameacas');
  const isEquipamentos = url.includes('equipamentos');
  const isVeiculos = url.includes('veiculos');
  const isContracts = url.includes('procurement/contracts') || url.includes('/contracts');
  const isPurchaseOrders = url.includes('purchase-orders');
  const isReputacao = url.includes('reputacao');
  const isAfastamentos = url.includes('afastamentos');
  const isDepartamentos = url.includes('departamentos');
  const isFolha = url.includes('folhas-pagamento') || url.includes('folha-pagamento');
  const isEquipes = url.includes('equipes');
  const isFuncionarios = url.includes('funcionarios');

  const enricher = isIncidentes
    ? enrichIncident
    : isMissoes
      ? enrichMission
      : isBases
        ? enrichBase
        : isAmeacas
          ? enrichThreat
          : isEquipamentos
            ? enrichEquipment
            : isVeiculos
              ? enrichVehicle
              : isContracts
                ? enrichContract
                : isPurchaseOrders
                  ? enrichPurchaseOrder
                  : isReputacao
                    ? enrichReputation
                    : isAfastamentos
                      ? enrichAfastamento
                      : isDepartamentos
                        ? enrichDepartamento
                        : isFolha
                          ? enrichFolha
                          : isEquipes
                            ? enrichEquipe
                            : isFuncionarios
                              ? enrichFuncionario
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
  const shouldEnrich =
    req.url.includes('operations/') ||
    req.url.includes('riskintelligence/') ||
    req.url.includes('incidentes') ||
    req.url.includes('missoes') ||
    req.url.includes('bases') ||
    req.url.includes('ameacas') ||
    req.url.includes('assets/') ||
    req.url.includes('equipamentos') ||
    req.url.includes('veiculos') ||
    req.url.includes('procurement/') ||
    req.url.includes('contracts') ||
    req.url.includes('purchase-orders') ||
    req.url.includes('human-resources/') ||
    req.url.includes('reputacao') ||
    req.url.includes('afastamentos') ||
    req.url.includes('departamentos') ||
    req.url.includes('folhas-pagamento');

  if (!shouldEnrich) {
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
