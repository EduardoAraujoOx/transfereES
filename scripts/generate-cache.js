/**
 * Script para gerar cache dos dados do TransfereGov ES
 * Executado via GitHub Actions diariamente às 3h da manhã
 *
 * Inclui integração com dados de Ordem Bancária (OB) para mostrar
 * valores efetivamente transferidos vs valores empenhados
 */

const BASE_URL = 'https://api.transferegov.gestao.gov.br/transferenciasespeciais';
const ANOS = [2020, 2021, 2022, 2023, 2024, 2025];

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' }
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function extrairAreaPrincipal(texto) {
  if (!texto) return 'Outros';
  const primeiraArea = texto.split(',')[0].trim();
  const match = primeiraArea.match(/^\d+-([^/]+)/);
  return match ? match[1].trim() : 'Outros';
}

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
    valor_efetivado: 0, // Será preenchido com valor das OBs
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

async function fetchPlanosDoAno(ano) {
  const url = `${BASE_URL}/plano_acao_especial?uf_beneficiario_plano_acao=eq.ES&ano_plano_acao=eq.${ano}`;
  return fetchJSON(url);
}

async function fetchExecutores(idPlano) {
  const url = `${BASE_URL}/executor_especial?id_plano_acao=eq.${idPlano}`;
  return fetchJSON(url);
}

async function fetchPlanoTrabalho(idPlano) {
  const url = `${BASE_URL}/plano_trabalho_especial?id_plano_acao=eq.${idPlano}`;
  return fetchJSON(url);
}

async function fetchMetas(idExecutor) {
  const url = `${BASE_URL}/meta_especial?id_executor=eq.${idExecutor}`;
  return fetchJSON(url);
}

// Buscar empenhos de um plano de ação
async function fetchEmpenhos(idPlano) {
  const url = `${BASE_URL}/empenho_especial?id_plano_acao=eq.${idPlano}`;
  return fetchJSON(url);
}

// Buscar documentos hábeis de um empenho
async function fetchDocumentosHabeis(idEmpenho) {
  const url = `${BASE_URL}/documento_habil_especial?id_empenho=eq.${idEmpenho}`;
  return fetchJSON(url);
}

// Buscar ordens de pagamento/bancárias de um documento hábil
async function fetchOrdensPagamento(idDh) {
  const url = `${BASE_URL}/ordem_pagamento_ordem_bancaria_especial?id_dh=eq.${idDh}`;
  return fetchJSON(url);
}

// Buscar valor efetivado (OBs emitidas) para um plano
async function buscarValorEfetivado(idPlano) {
  try {
    // 1. Buscar empenhos do plano
    const empenhos = await fetchEmpenhos(idPlano);
    if (!Array.isArray(empenhos) || empenhos.length === 0) return 0;

    let valorTotalOB = 0;

    // 2. Para cada empenho, buscar documentos hábeis
    for (const empenho of empenhos) {
      try {
        const docs = await fetchDocumentosHabeis(empenho.id_empenho);
        if (!Array.isArray(docs) || docs.length === 0) continue;

        // 3. Para cada documento hábil, buscar ordens de pagamento
        for (const doc of docs) {
          try {
            const ordens = await fetchOrdensPagamento(doc.id_dh);
            if (!Array.isArray(ordens) || ordens.length === 0) continue;

            // 4. Somar valores das OBs emitidas (com número de OB preenchido)
            for (const ordem of ordens) {
              if (ordem.numero_ordem_bancaria) {
                // Usar valor do documento hábil como referência
                valorTotalOB += parseFloat(doc.valor_dh || 0);
                break; // Cada doc.valor_dh só deve ser somado uma vez
              }
            }
          } catch (err) {
            // Ignorar erros de ordem de pagamento individual
          }
        }
      } catch (err) {
        // Ignorar erros de documento hábil individual
      }
    }

    return valorTotalOB;
  } catch (err) {
    return 0;
  }
}

async function gerarCache() {
  console.log('Iniciando geração de cache...');
  console.log(`Data/hora: ${new Date().toISOString()}`);

  // 1. Buscar todos os planos de todos os anos
  console.log('\n1. Buscando planos de ação...');
  const todosPlanos = [];

  for (const ano of ANOS) {
    try {
      const planos = await fetchPlanosDoAno(ano);
      console.log(`   ${ano}: ${planos.length} planos encontrados`);
      todosPlanos.push(...planos);
    } catch (err) {
      console.error(`   ${ano}: ERRO - ${err.message}`);
    }
  }

  console.log(`   Total: ${todosPlanos.length} planos`);

  // 2. Processar planos e criar estrutura por ente
  console.log('\n2. Processando planos...');
  const porEnte = {};
  const porParlamentar = {};
  const porAno = {};
  const porAnoEstado = {};
  const porAnoMunicipios = {};
  const porArea = {};
  const porAreaPorAno = {}; // { ano: { area: valor } }

  // Estruturas para valores efetivados
  const porAnoEfetivado = {};
  const porAnoEstadoEfetivado = {};
  const porAnoMunicipiosEfetivado = {};

  const planosProcessados = todosPlanos.map(processarPlano);

  // Primeira passagem: estruturar dados básicos
  planosProcessados.forEach(plano => {
    const cnpj = plano.cnpj_beneficiario;
    const parlamentar = plano.parlamentar;
    const ano = plano.ano;
    const area = plano.area_politica || 'Outros';
    const valor = plano.valor_total;

    if (!cnpj) return;

    // Identificar se é estado ou município
    const nome = plano.nome_beneficiario || 'Não informado';
    const isEstado = nome.toUpperCase().includes('ESTADO') || nome.toUpperCase().includes('GOVERNO DO ESTADO');
    plano._isEstado = isEstado;

    // Por ente
    if (!porEnte[cnpj]) {
      porEnte[cnpj] = {
        id: cnpj,
        cnpj,
        nome: nome,
        tipo: isEstado ? 'estado' : 'municipio',
        anos: {},
        anosEfetivados: {},
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
          totalEfetivado: 0,
          planos: [],
          entes: [],
          anos: {},
          anosEfetivados: {}
        };
      }
      porParlamentar[parlamentar].total += valor;
      porParlamentar[parlamentar].planos.push(plano);
      if (!porParlamentar[parlamentar].entes.includes(plano.nome_beneficiario)) {
        porParlamentar[parlamentar].entes.push(plano.nome_beneficiario);
      }
      porParlamentar[parlamentar].anos[ano] = (porParlamentar[parlamentar].anos[ano] || 0) + valor;
    }

    // Por ano (total)
    porAno[ano] = (porAno[ano] || 0) + valor;

    // Por ano (estado vs municípios)
    if (isEstado) {
      porAnoEstado[ano] = (porAnoEstado[ano] || 0) + valor;
    } else {
      porAnoMunicipios[ano] = (porAnoMunicipios[ano] || 0) + valor;
    }

    // Por área (total)
    porArea[area] = (porArea[area] || 0) + valor;

    // Por área por ano
    if (!porAreaPorAno[ano]) {
      porAreaPorAno[ano] = {};
    }
    porAreaPorAno[ano][area] = (porAreaPorAno[ano][area] || 0) + valor;
  });

  // 3. Buscar valores efetivados (OBs) para cada plano
  console.log('\n3. Buscando valores efetivados (OBs)...');
  let planosComOB = 0;
  let totalEfetivado = 0;

  for (let i = 0; i < planosProcessados.length; i++) {
    const plano = planosProcessados[i];

    try {
      const valorEfetivado = await buscarValorEfetivado(plano.id);
      plano.valor_efetivado = valorEfetivado;

      if (valorEfetivado > 0) {
        planosComOB++;
        totalEfetivado += valorEfetivado;

        const ano = plano.ano;
        const parlamentar = plano.parlamentar;
        const cnpj = plano.cnpj_beneficiario;

        // Atualizar totais efetivados por ano
        porAnoEfetivado[ano] = (porAnoEfetivado[ano] || 0) + valorEfetivado;

        if (plano._isEstado) {
          porAnoEstadoEfetivado[ano] = (porAnoEstadoEfetivado[ano] || 0) + valorEfetivado;
        } else {
          porAnoMunicipiosEfetivado[ano] = (porAnoMunicipiosEfetivado[ano] || 0) + valorEfetivado;
        }

        // Atualizar ente
        if (cnpj && porEnte[cnpj]) {
          porEnte[cnpj].anosEfetivados[ano] = (porEnte[cnpj].anosEfetivados[ano] || 0) + valorEfetivado;
        }

        // Atualizar parlamentar
        if (parlamentar && porParlamentar[parlamentar]) {
          porParlamentar[parlamentar].totalEfetivado += valorEfetivado;
          porParlamentar[parlamentar].anosEfetivados[ano] =
            (porParlamentar[parlamentar].anosEfetivados[ano] || 0) + valorEfetivado;
        }
      }
    } catch (err) {
      plano.valor_efetivado = 0;
    }

    // Log de progresso
    if ((i + 1) % 10 === 0 || i === planosProcessados.length - 1) {
      process.stdout.write(`   Processando OBs: ${i + 1}/${planosProcessados.length} planos (${planosComOB} com OB)\r`);
    }
  }

  console.log(`\n   Total com OB: ${planosComOB} planos, R$ ${(totalEfetivado / 1e6).toFixed(1)} Mi efetivados`);

  // 4. Buscar executores e metas para cada plano
  console.log('\n4. Buscando executores e metas...');
  let totalExecutores = 0;
  let totalMetas = 0;

  for (const cnpj of Object.keys(porEnte)) {
    const ente = porEnte[cnpj];

    for (let i = 0; i < ente.planos.length; i++) {
      const plano = ente.planos[i];

      try {
        // Buscar executores e plano de trabalho
        const [executoresRaw, planosTrabalhoRaw] = await Promise.all([
          fetchExecutores(plano.id).catch(() => []),
          fetchPlanoTrabalho(plano.id).catch(() => [])
        ]);

        const planoTrabalho = Array.isArray(planosTrabalhoRaw) && planosTrabalhoRaw.length > 0
          ? planosTrabalhoRaw[0] : null;
        const situacaoPlanoTrabalho = planoTrabalho?.situacao_plano_trabalho || null;

        plano.situacao_plano_trabalho = situacaoPlanoTrabalho;

        const executores = (Array.isArray(executoresRaw) ? executoresRaw : [])
          .map(exec => processarExecutor(exec, {
            id: plano.id,
            codigo: plano.codigo,
            situacao: plano.situacao,
            parlamentar: plano.parlamentar,
            numero_emenda: plano.numero_emenda,
            area_politica: plano.area_politica,
            recurso_recebido: plano.recurso_recebido
          }, situacaoPlanoTrabalho));

        // Buscar metas para cada executor
        for (const exec of executores) {
          try {
            const metasRaw = await fetchMetas(exec.id);
            exec.metas = (Array.isArray(metasRaw) ? metasRaw : []).map(processarMeta);
            totalMetas += exec.metas.length;
          } catch (err) {
            exec.metas = [];
          }
        }

        plano.executores = executores;
        totalExecutores += executores.length;

        // Limpar propriedade temporária
        delete plano._isEstado;

      } catch (err) {
        plano.executores = [];
        delete plano._isEstado;
      }
    }

    process.stdout.write(`   ${ente.nome.substring(0, 30).padEnd(30)} - ${ente.planos.length} planos\r`);
  }

  console.log(`\n   Total: ${totalExecutores} executores, ${totalMetas} metas`);

  // 5. Montar estrutura final
  console.log('\n5. Montando estrutura final...');

  const entes = Object.values(porEnte);
  const estado = entes.find(e => e.tipo === 'estado');
  const municipios = entes
    .filter(e => e.tipo === 'municipio')
    .sort((a, b) => {
      const totalA = Object.values(a.anos).reduce((x, y) => x + y, 0);
      const totalB = Object.values(b.anos).reduce((x, y) => x + y, 0);
      return totalB - totalA;
    });

  const totalEstado = estado ? Object.values(estado.anos).reduce((a, b) => a + b, 0) : 0;
  const totalMunicipios = municipios.reduce((acc, m) => acc + Object.values(m.anos).reduce((a, b) => a + b, 0), 0);

  const totalEstadoEfetivado = estado ? Object.values(estado.anosEfetivados || {}).reduce((a, b) => a + b, 0) : 0;
  const totalMunicipiosEfetivado = municipios.reduce((acc, m) => acc + Object.values(m.anosEfetivados || {}).reduce((a, b) => a + b, 0), 0);

  const dadosCache = {
    atualizadoEm: new Date().toISOString(),
    estado,
    municipios,
    parlamentares: Object.values(porParlamentar).sort((a, b) => b.total - a.total),
    porAno,
    porAnoEstado,
    porAnoMunicipios,
    porAnoEfetivado,
    porAnoEstadoEfetivado,
    porAnoMunicipiosEfetivado,
    porArea,
    porAreaPorAno,
    totalEstado,
    totalMunicipios,
    totalGeral: totalEstado + totalMunicipios,
    totalEstadoEfetivado,
    totalMunicipiosEfetivado,
    totalGeralEfetivado: totalEstadoEfetivado + totalMunicipiosEfetivado
  };

  // 6. Salvar arquivo
  const fs = await import('fs');
  const path = await import('path');

  const outputPath = path.join(process.cwd(), 'public', 'dados-es.json');
  fs.writeFileSync(outputPath, JSON.stringify(dadosCache, null, 2));

  console.log(`\n6. Cache salvo em: ${outputPath}`);
  console.log(`   Tamanho: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);
  console.log('\nCache gerado com sucesso!');

  // Estatísticas
  console.log('\n=== ESTATÍSTICAS ===');
  console.log(`Total de entes: ${entes.length}`);
  console.log(`  - Estado: ${estado ? 1 : 0}`);
  console.log(`  - Municípios: ${municipios.length}`);
  console.log(`Total de parlamentares: ${Object.keys(porParlamentar).length}`);
  console.log(`Total de planos: ${planosProcessados.length}`);
  console.log(`  - Com OB emitida: ${planosComOB}`);
  console.log(`Total de executores: ${totalExecutores}`);
  console.log(`Total de metas: ${totalMetas}`);
  console.log(`\nValores:`);
  console.log(`  - Empenhado: R$ ${(dadosCache.totalGeral / 1e6).toFixed(1)} milhões`);
  console.log(`  - Efetivado (OB): R$ ${(dadosCache.totalGeralEfetivado / 1e6).toFixed(1)} milhões`);
  console.log(`  - % Efetivado: ${((dadosCache.totalGeralEfetivado / dadosCache.totalGeral) * 100).toFixed(1)}%`);
}

gerarCache().catch(err => {
  console.error('Erro ao gerar cache:', err);
  process.exit(1);
});
