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

// Buscar metas de um executor (via plano de trabalho)
export async function fetchMetas(idPlano) {
  const url = `${BASE_URL}/meta_especial?id_plano_acao=eq.${idPlano}`;
  return fetchWithAutoProxy(url);
}

// Processar dados de um plano
function processarPlano(plano) {
  const valorCusteio = parseFloat(plano.valor_custeio_plano_acao || 0);
  const valorInvestimento = parseFloat(plano.valor_investimento_plano_acao || 0);

  return {
    id: plano.id_plano_acao?.toString(),
    codigo: plano.codigo_plano_acao || '',
    ano: plano.ano_plano_acao,
    situacao: plano.situacao_plano_acao || 'AGUARDANDO_CIENCIA',
    parlamentar: plano.nome_parlamentar_emenda_plano_acao || 'Não informado',
    numero_emenda: plano.numero_emenda_parlamentar_plano_acao || '',
    area_politica: plano.descricao_funcao_plano_acao || 'Outros',
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
function processarExecutor(executor, plano) {
  return {
    id: executor.id_executor?.toString(),
    cnpj: executor.cnpj_executor || '',
    nome: executor.nome_executor || 'Executor não informado',
    objeto: executor.objeto_executor || '',
    detalhamento_objeto: executor.objeto_executor || '',
    situacao_plano_trabalho: 'Em Análise',
    numero_plano_trabalho: '',
    valor_custeio: parseFloat(executor.vl_custeio_executor || 0),
    valor_investimento: parseFloat(executor.vl_investimento_executor || 0),
    banco: executor.nome_banco_executor || null,
    agencia: executor.numero_agencia_executor ?
      `${executor.numero_agencia_executor}${executor.dv_agencia_executor ? '-' + executor.dv_agencia_executor : ''}` : null,
    conta: executor.numero_conta_executor ?
      `${executor.numero_conta_executor}${executor.dv_conta_executor ? '-' + executor.dv_conta_executor : ''}` : null,
    situacao_conta: 'Conta Ativa',
    plano: plano,
    metas: []
  };
}

// Buscar todos os dados agregados (para página inicial)
export async function fetchDadosAgregados() {
  // Buscar planos de todos os anos relevantes
  const anos = [2022, 2023, 2024, 2025];
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
      const tipo = (plano.tipo_beneficiario || '').toUpperCase();
      porEnte[cnpj] = {
        id: cnpj,
        cnpj,
        nome: plano.nome_beneficiario || 'Não informado',
        tipo: tipo === 'ESTADO' || tipo.includes('ESTADO') ? 'estado' : 'municipio',
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
    ente.planos.slice(0, 20).map(async (plano) => { // Limitar a 20 para performance
      try {
        const executoresRaw = await fetchExecutores(plano.id);
        const executores = (Array.isArray(executoresRaw) ? executoresRaw : [])
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
    const metasRaw = await fetchMetas(idPlano);
    const metas = (Array.isArray(metasRaw) ? metasRaw : [])
      .filter(m => m.id_executor === parseInt(idExecutor))
      .map(meta => ({
        id: meta.id_meta,
        sequencial: meta.sequencial_meta || 1,
        nome: meta.nome_meta || '',
        descricao: meta.descricao_meta || '',
        unidade_medida: meta.unidade_medida_meta || 'Unidade',
        quantidade: meta.quantidade_meta || 0,
        valor_custeio_emenda: parseFloat(meta.vl_custeio_meta || 0),
        valor_investimento_emenda: parseFloat(meta.vl_investimento_meta || 0),
        valor_custeio_proprio: 0,
        valor_investimento_proprio: 0,
        prazo_meses: meta.prazo_meta || 12
      }));
    return metas;
  } catch (error) {
    console.error(`Erro ao buscar metas:`, error);
    return [];
  }
}

export default {
  fetchPlanosAcaoES,
  fetchExecutores,
  fetchMetas,
  fetchDadosAgregados,
  fetchEnteCompleto,
  fetchMetasExecutor
};
