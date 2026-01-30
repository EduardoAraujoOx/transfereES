// API TransfereGov - URL CORRETA
const BASE_URL = 'https://api.transferegov.gestao.gov.br/transferenciasespeciais';

// Proxies CORS para fallback automático
const corsProxies = [
  { name: 'corsproxy', url: 'https://corsproxy.io/?' },
  { name: 'allorigins', url: 'https://api.allorigins.win/raw?url=' },
  { name: 'direct', url: '' }
];

// Cache simples
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Fetch com fallback automático entre proxies
async function fetchWithAutoProxy(url) {
  const cacheKey = url;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  let lastError = null;

  for (const proxy of corsProxies) {
    try {
      const fullUrl = proxy.url ? proxy.url + encodeURIComponent(url) : url;

      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (err) {
      console.log(`Proxy ${proxy.name} falhou, tentando próximo...`);
      lastError = err;
    }
  }

  throw lastError || new Error('Todos os proxies falharam');
}

// Buscar todos os planos de ação do ES
export async function fetchPlanosAcaoES(ano = null) {
  let url = `${BASE_URL}/plano_acao_especial?uf_beneficiario_plano_acao=eq.ES`;
  if (ano) url += `&ano_plano_acao=eq.${ano}`;
  return fetchWithAutoProxy(url);
}

// Buscar executores de um plano
export async function fetchExecutores(idPlano) {
  const url = `${BASE_URL}/executor_especial?id_plano_acao=eq.${idPlano}`;
  return fetchWithAutoProxy(url);
}

// Buscar plano de trabalho de um plano de ação
export async function fetchPlanoTrabalho(idPlano) {
  const url = `${BASE_URL}/plano_trabalho_especial?id_plano_acao=eq.${idPlano}`;
  return fetchWithAutoProxy(url);
}

// Buscar metas de um executor
export async function fetchMetasPorExecutor(idExecutor) {
  const url = `${BASE_URL}/meta_especial?id_executor=eq.${idExecutor}`;
  return fetchWithAutoProxy(url);
}

// Extrair área principal do campo codigo_descricao_areas_politicas_publicas_plano_acao
// Ex: "15-Urbanismo / 451-Infraestrutura Urbana" -> "Urbanismo"
function extrairAreaPrincipal(texto) {
  if (!texto) return 'Outros';
  // Pega a primeira área (antes da primeira vírgula se houver múltiplas)
  const primeiraArea = texto.split(',')[0].trim();
  // Extrai o nome da área (ex: "15-Urbanismo / 451-..." -> "Urbanismo")
  const match = primeiraArea.match(/^\d+-([^/]+)/);
  if (match) {
    return match[1].trim();
  }
  return 'Outros';
}

// Mapear situação do plano de trabalho para texto amigável
function mapearSituacaoPlanoTrabalho(situacao) {
  if (!situacao) return 'Não Cadastrado';
  const mapa = {
    'APROVADO': 'Aprovado',
    'EM_ELABORACAO': 'Em Elaboração',
    'ENVIADO_ANALISE': 'Enviado para Análise',
    'EM_ANALISE': 'Em Análise',
    'CONCLUIDO_NT_TCU': 'Legado ADPF 854 STF / NT-TCU',
    'LEGADO_ADPF': 'Legado ADPF 854 STF / NT-TCU',
    'NAO_CADASTRADO': 'Não Cadastrado',
    'IMPEDIDO': 'Impedido',
    'CANCELADO': 'Cancelado'
  };
  return mapa[situacao.toUpperCase()] || situacao.replace(/_/g, ' ');
}

// Processar dados de um plano
function processarPlano(plano) {
  const valorCusteio = parseFloat(plano.valor_custeio_plano_acao || 0);
  const valorInvestimento = parseFloat(plano.valor_investimento_plano_acao || 0);
  const areaPolitica = extrairAreaPrincipal(plano.codigo_descricao_areas_politicas_publicas_plano_acao);

  return {
    id: plano.id_plano_acao?.toString(),
    codigo: plano.codigo_plano_acao || '',
    ano: plano.ano_plano_acao,
    situacao: plano.situacao_plano_acao || 'AGUARDANDO_CIENCIA',
    parlamentar: plano.nome_parlamentar_emenda_plano_acao || 'Não informado',
    numero_emenda: plano.numero_emenda_parlamentar_plano_acao || '',
    area_politica: areaPolitica,
    valor_custeio: valorCusteio,
    valor_investimento: valorInvestimento,
    valor_total: valorCusteio + valorInvestimento,
    recurso_recebido: (plano.situacao_plano_acao || '').toUpperCase().includes('CIENTE'),
    banco: plano.nome_banco_plano_acao || null,
    agencia: plano.numero_agencia_plano_acao ?
      `${plano.numero_agencia_plano_acao}${plano.dv_agencia_plano_acao ? '-' + plano.dv_agencia_plano_acao : ''}` : null,
    conta: plano.numero_conta_plano_acao ?
      `${plano.numero_conta_plano_acao}${plano.dv_conta_plano_acao ? '-' + plano.dv_conta_plano_acao : ''}` : null,
    situacao_conta: 'Conta Ativa',
    cnpj_beneficiario: plano.cnpj_beneficiario_plano_acao,
    nome_beneficiario: plano.nome_beneficiario_plano_acao || 'Não informado',
    tipo_beneficiario: plano.tipo_beneficiario_plano_acao,
    executores: []
  };
}

// Processar executor
function processarExecutor(executor, plano, situacaoPlanoTrabalho = null) {
  return {
    id: executor.id_executor?.toString(),
    cnpj: executor.cnpj_executor || '',
    nome: executor.nome_executor || 'Executor não informado',
    objeto: executor.objeto_executor || '',
    detalhamento_objeto: executor.objeto_executor || '',
    situacao_plano_trabalho: mapearSituacaoPlanoTrabalho(situacaoPlanoTrabalho),
    numero_plano_trabalho: '',
    valor_custeio: parseFloat(executor.vl_custeio_executor || 0),
    valor_investimento: parseFloat(executor.vl_investimento_executor || 0),
    banco: executor.nome_banco_executor || null,
    agencia: executor.numero_agencia_executor ?
      `${executor.numero_agencia_executor}${executor.dv_agencia_executor ? '-' + executor.dv_agencia_executor : ''}` : null,
    conta: executor.numero_conta_executor ?
      `${executor.numero_conta_executor}${executor.dv_conta_executor ? '-' + executor.dv_conta_executor : ''}` : null,
    situacao_conta: executor.descricao_situacao_dado_bancario_executor || 'Conta Ativa',
    plano: plano,
    metas: []
  };
}

// Processar meta
function processarMeta(meta) {
  return {
    id: meta.id_meta,
    sequencial: meta.sequencial_meta || 1,
    nome: meta.nome_meta || '',
    descricao: meta.desc_meta || '',
    unidade_medida: meta.un_medida_meta || 'Unidade',
    quantidade: parseFloat(meta.qt_uniade_meta || 0),
    valor_custeio_emenda: parseFloat(meta.vl_custeio_emenda_especial_meta || 0),
    valor_investimento_emenda: parseFloat(meta.vl_investimento_emenda_especial_meta || 0),
    valor_custeio_proprio: parseFloat(meta.vl_custeio_recursos_proprios_meta || 0),
    valor_investimento_proprio: parseFloat(meta.vl_investimento_recursos_proprios_meta || 0),
    prazo_meses: meta.qt_meses_meta || 12
  };
}

// Buscar todos os dados agregados (para página inicial)
export async function fetchDadosAgregados() {
  // Buscar planos de todos os anos relevantes (incluindo 2021)
  const anos = [2021, 2022, 2023, 2024, 2025];
  const todosPlanos = [];

  for (const ano of anos) {
    try {
      const planos = await fetchPlanosAcaoES(ano);
      if (Array.isArray(planos)) {
        todosPlanos.push(...planos);
      }
    } catch (err) {
      console.error(`Erro ao buscar planos de ${ano}:`, err);
    }
  }

  return processarDadosAgregados(todosPlanos);
}

// Processar dados para formato do frontend
function processarDadosAgregados(planosRaw) {
  const porEnte = {};
  const porParlamentar = {};
  const porAno = {};
  const porArea = {};

  const planos = planosRaw.map(processarPlano);

  planos.forEach(plano => {
    const cnpj = plano.cnpj_beneficiario;
    const parlamentar = plano.parlamentar;
    const ano = plano.ano;
    const area = plano.area_politica || 'Outros';
    const valor = plano.valor_total;

    if (!cnpj) return;

    // Por ente
    if (!porEnte[cnpj]) {
      const nome = plano.nome_beneficiario || 'Não informado';
      const isEstado = nome.toUpperCase().includes('ESTADO') ||
                       nome.toUpperCase().includes('GOVERNO DO ESTADO');
      porEnte[cnpj] = {
        id: cnpj,
        cnpj,
        nome: nome,
        tipo: isEstado ? 'estado' : 'municipio',
        anos: {},
        planos: []
      };
    }
    porEnte[cnpj].anos[ano] = (porEnte[cnpj].anos[ano] || 0) + valor;
    porEnte[cnpj].planos.push(plano);

    // Por parlamentar
    if (parlamentar && parlamentar !== 'Não informado') {
      if (!porParlamentar[parlamentar]) {
        porParlamentar[parlamentar] = {
          nome: parlamentar,
          total: 0,
          planos: [],
          entes: new Set(),
          anos: {}
        };
      }
      porParlamentar[parlamentar].total += valor;
      porParlamentar[parlamentar].planos.push(plano);
      porParlamentar[parlamentar].entes.add(plano.nome_beneficiario);
      porParlamentar[parlamentar].anos[ano] = (porParlamentar[parlamentar].anos[ano] || 0) + valor;
    }

    // Por ano
    porAno[ano] = (porAno[ano] || 0) + valor;

    // Por área
    porArea[area] = (porArea[area] || 0) + valor;
  });

  // Separar estado dos municípios
  const entes = Object.values(porEnte);
  const estado = entes.find(e => e.tipo === 'estado');
  const municipios = entes
    .filter(e => e.tipo === 'municipio')
    .sort((a, b) => {
      const totalA = Object.values(a.anos).reduce((x, y) => x + y, 0);
      const totalB = Object.values(b.anos).reduce((x, y) => x + y, 0);
      return totalB - totalA;
    });

  // Calcular totais
  const totalEstado = estado ? Object.values(estado.anos).reduce((a, b) => a + b, 0) : 0;
  const totalMunicipios = municipios.reduce((acc, m) => acc + Object.values(m.anos).reduce((a, b) => a + b, 0), 0);

  return {
    estado,
    municipios,
    parlamentares: Object.values(porParlamentar)
      .map(p => ({ ...p, entes: p.entes }))
      .sort((a, b) => b.total - a.total),
    porAno,
    porArea,
    totalEstado,
    totalMunicipios,
    totalGeral: totalEstado + totalMunicipios
  };
}

// Buscar detalhes completos de um ente (incluindo executores e situação do plano de trabalho)
export async function fetchEnteCompleto(ente) {
  const planosComExecutores = await Promise.all(
    ente.planos.map(async (plano) => {
      try {
        // Buscar executores e plano de trabalho em paralelo
        const [executoresRaw, planosTrabalhoRaw] = await Promise.all([
          fetchExecutores(plano.id),
          fetchPlanoTrabalho(plano.id).catch(() => [])
        ]);

        // Pegar a situação do plano de trabalho (pode haver múltiplos, pegamos o primeiro)
        const planoTrabalho = Array.isArray(planosTrabalhoRaw) && planosTrabalhoRaw.length > 0
          ? planosTrabalhoRaw[0]
          : null;
        const situacaoPlanoTrabalho = planoTrabalho?.situacao_plano_trabalho || null;

        const executores = (Array.isArray(executoresRaw) ? executoresRaw : [])
          .map(exec => processarExecutor(exec, plano, situacaoPlanoTrabalho));

        return { ...plano, executores, situacao_plano_trabalho: situacaoPlanoTrabalho };
      } catch (error) {
        console.error(`Erro ao buscar executores do plano ${plano.id}:`, error);
        return { ...plano, executores: [] };
      }
    })
  );

  return { ...ente, planos: planosComExecutores };
}

// Buscar metas de um executor
export async function fetchMetasExecutor(idPlano, idExecutor) {
  try {
    const metasRaw = await fetchMetasPorExecutor(idExecutor);
    const metas = (Array.isArray(metasRaw) ? metasRaw : [])
      .map(processarMeta);
    return metas;
  } catch (error) {
    console.error(`Erro ao buscar metas do executor ${idExecutor}:`, error);
    return [];
  }
}

export default {
  fetchPlanosAcaoES,
  fetchExecutores,
  fetchPlanoTrabalho,
  fetchMetasPorExecutor,
  fetchDadosAgregados,
  fetchEnteCompleto,
  fetchMetasExecutor
};
