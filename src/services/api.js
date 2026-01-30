const BASE_URL = 'https://api.transferegov.sistema.gov.br/transferencia-especial';
const UF = 'ES';

// Cache simples para evitar requisições repetidas
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async function fetchWithCache(url, options = {}) {
  const cacheKey = url;
  const cached = cache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      'Accept': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  cache.set(cacheKey, { data, timestamp: Date.now() });
  return data;
}

// Buscar todos os planos de ação do ES
export async function fetchPlanosAcao(ano = null, pagina = 1, tamanhoPagina = 500) {
  let url = `${BASE_URL}/plano-acao?uf=${UF}&pagina=${pagina}&tamanhoPagina=${tamanhoPagina}`;
  if (ano) url += `&ano=${ano}`;
  return fetchWithCache(url);
}

// Buscar detalhe de um plano
export async function fetchPlanoDetalhe(idPlano) {
  return fetchWithCache(`${BASE_URL}/plano-acao/${idPlano}`);
}

// Buscar executores de um plano
export async function fetchExecutores(idPlano) {
  return fetchWithCache(`${BASE_URL}/plano-acao/${idPlano}/executor`);
}

// Buscar metas de um executor
export async function fetchMetas(idPlano, idExecutor) {
  return fetchWithCache(`${BASE_URL}/plano-acao/${idPlano}/executor/${idExecutor}/meta`);
}

// Mapear situação do plano de trabalho
function mapearSituacaoPlanoTrabalho(codigo) {
  const mapa = {
    1: 'Em Elaboração',
    2: 'Em Análise',
    3: 'Aprovado',
    4: 'Em Execução',
    5: 'Concluído',
    6: 'Impedido',
    7: 'Cancelado'
  };
  return mapa[codigo] || 'Em Análise';
}

// Processar dados de um plano de ação da API para o formato do frontend
function processarPlano(plano) {
  return {
    id: plano.id_plano_acao?.toString() || plano.id?.toString(),
    codigo: plano.nr_plano_acao || '',
    ano: plano.ano_plano_acao || plano.ano_emenda,
    situacao: plano.situacao_plano_acao || 'AGUARDANDO_CIENCIA',
    parlamentar: plano.nome_parlamentar || 'Não informado',
    numero_emenda: plano.nr_emenda || '',
    area_politica: plano.ds_funcao || 'Outros',
    valor_custeio: plano.vl_custeio_emenda_especial || 0,
    valor_investimento: plano.vl_investimento_emenda_especial || 0,
    valor_total: (plano.vl_custeio_emenda_especial || 0) + (plano.vl_investimento_emenda_especial || 0),
    recurso_recebido: plano.situacao_plano_acao === 'CIENTE',
    banco: plano.nm_banco_beneficiario ? `${plano.cd_banco_beneficiario} - ${plano.nm_banco_beneficiario}` : null,
    agencia: plano.nr_agencia_beneficiario,
    conta: plano.nr_conta_beneficiario,
    situacao_conta: plano.situacao_conta_beneficiario || 'Conta Ativa',
    motivo_impedimento: plano.motivo_impedimento,
    orgao_analise: plano.orgao_analise,
    cnpj_beneficiario: plano.cnpj_beneficiario,
    nome_beneficiario: plano.nome_beneficiario,
    tipo_beneficiario: plano.tipo_beneficiario,
    executores: []
  };
}

// Processar executor da API para o formato do frontend
function processarExecutor(executor, plano) {
  return {
    id: executor.id_executor?.toString() || executor.id?.toString(),
    cnpj: executor.cnpj_executor || '',
    nome: executor.nome_executor || 'Executor não informado',
    objeto: executor.ds_objeto_executor || '',
    detalhamento_objeto: executor.ds_detalhamento_objeto || executor.ds_objeto_executor || '',
    situacao_plano_trabalho: mapearSituacaoPlanoTrabalho(executor.cd_situacao_plano_trabalho) || 'Em Análise',
    numero_plano_trabalho: executor.nr_plano_trabalho || '',
    valor_custeio: executor.vl_custeio_executor || 0,
    valor_investimento: executor.vl_investimento_executor || 0,
    banco: executor.nm_banco_executor ? `${executor.cd_banco_executor} - ${executor.nm_banco_executor}` : null,
    agencia: executor.nr_agencia_executor,
    conta: executor.nr_conta_executor,
    situacao_conta: executor.situacao_conta_executor || 'Conta Ativa',
    plano: plano,
    metas: []
  };
}

// Processar meta da API para o formato do frontend
function processarMeta(meta) {
  return {
    id: meta.id_meta || meta.sequencial_meta,
    sequencial: meta.sequencial_meta || 1,
    nome: meta.nome_meta || '',
    descricao: meta.desc_meta || '',
    unidade_medida: meta.un_medida_meta || 'Unidade',
    quantidade: meta.qt_unidade_meta || 0,
    valor_custeio_emenda: meta.vl_custeio_emenda_especial_meta || 0,
    valor_investimento_emenda: meta.vl_investimento_emenda_especial_meta || 0,
    valor_custeio_proprio: meta.vl_custeio_recursos_proprios_meta || 0,
    valor_investimento_proprio: meta.vl_investimento_recursos_proprios_meta || 0,
    prazo_meses: meta.qt_meses_meta || 12
  };
}

// Buscar todos os dados agregados (para página inicial)
export async function fetchDadosAgregados() {
  const resultado = await fetchPlanosAcao(null, 1, 1000);
  const planos = resultado.content || resultado.data || resultado || [];
  return processarDadosAgregados(planos);
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
      porEnte[cnpj] = {
        id: cnpj,
        cnpj,
        nome: plano.nome_beneficiario || 'Não informado',
        tipo: (plano.tipo_beneficiario || 'MUNICIPIO').toLowerCase() === 'estado' ? 'estado' : 'municipio',
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

// Buscar detalhes completos de um ente (incluindo executores)
export async function fetchEnteCompleto(ente) {
  const planosComExecutores = await Promise.all(
    ente.planos.map(async (plano) => {
      try {
        const executoresRaw = await fetchExecutores(plano.id);
        const executores = (executoresRaw.content || executoresRaw.data || executoresRaw || [])
          .map(exec => processarExecutor(exec, plano));
        return { ...plano, executores };
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
    const metasRaw = await fetchMetas(idPlano, idExecutor);
    const metas = (metasRaw.content || metasRaw.data || metasRaw || [])
      .map(processarMeta);
    return metas;
  } catch (error) {
    console.error(`Erro ao buscar metas do executor ${idExecutor}:`, error);
    return [];
  }
}

export default {
  fetchPlanosAcao,
  fetchPlanoDetalhe,
  fetchExecutores,
  fetchMetas,
  fetchDadosAgregados,
  fetchEnteCompleto,
  fetchMetasExecutor
};
