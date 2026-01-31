/**
 * Script para gerar cache dos dados do TransfereGov ES
 * Executado via GitHub Actions diariamente às 3h da manhã
 *
 * Versão otimizada com bulk fetching para performance
 * Inclui valores efetivados (OBs emitidas) vs empenhados
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

// Fetch com paginação automática
async function fetchAllPaginated(baseUrl, pageSize = 5000) {
  let allData = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const url = `${baseUrl}&limit=${pageSize}&offset=${offset}`;
    const data = await fetchJSON(url);

    if (Array.isArray(data)) {
      allData = allData.concat(data);
      hasMore = data.length === pageSize;
      offset += pageSize;
    } else {
      hasMore = false;
    }
  }

  return allData;
}

function extrairAreaPrincipal(texto) {
  if (!texto) return 'Outros';
  const primeiraArea = texto.split(',')[0].trim();
  const match = primeiraArea.match(/^\d+-([^/]+)/);
  return match ? match[1].trim() : 'Outros';
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

async function gerarCache() {
  console.log('Iniciando geração de cache...');
  console.log(`Data/hora: ${new Date().toISOString()}`);

  // ========================================
  // FASE 1: Buscar todos os dados em bulk
  // ========================================
  console.log('\n=== FASE 1: Bulk Fetching ===\n');

  // 1.1 Buscar todos os planos de ação do ES
  console.log('1.1 Buscando planos de ação...');
  const todosPlanos = [];
  for (const ano of ANOS) {
    try {
      const url = `${BASE_URL}/plano_acao_especial?uf_beneficiario_plano_acao=eq.ES&ano_plano_acao=eq.${ano}`;
      const planos = await fetchJSON(url);
      console.log(`    ${ano}: ${planos.length} planos`);
      todosPlanos.push(...planos);
    } catch (err) {
      console.error(`    ${ano}: ERRO - ${err.message}`);
    }
  }
  console.log(`    Total: ${todosPlanos.length} planos\n`);

  // 1.2 Buscar todos os empenhos do ES
  console.log('1.2 Buscando empenhos...');
  const todosEmpenhos = await fetchAllPaginated(
    `${BASE_URL}/empenho_especial?uf_beneficiario_empenho=eq.ES&select=id_empenho,id_plano_acao,valor_empenho`
  );
  console.log(`    Total: ${todosEmpenhos.length} empenhos\n`);

  // Criar mapa de empenhos por plano
  const empenhosPorPlano = {};
  todosEmpenhos.forEach(e => {
    if (!empenhosPorPlano[e.id_plano_acao]) {
      empenhosPorPlano[e.id_plano_acao] = [];
    }
    empenhosPorPlano[e.id_plano_acao].push(e);
  });

  // 1.3 Buscar documentos hábeis APENAS para empenhos do ES (mais eficiente)
  console.log('1.3 Buscando documentos hábeis dos empenhos ES...');
  const empenhoIds = todosEmpenhos.map(e => e.id_empenho).filter(Boolean);
  const todosDocumentos = [];

  // Buscar em batches para evitar URLs muito longas
  const dhBatchSize = 100;
  for (let i = 0; i < empenhoIds.length; i += dhBatchSize) {
    const batch = empenhoIds.slice(i, i + dhBatchSize);
    const idsParam = batch.join(',');

    try {
      const docs = await fetchJSON(
        `${BASE_URL}/documento_habil_especial?id_empenho=in.(${idsParam})&select=id_dh,id_empenho,valor_dh`
      );
      todosDocumentos.push(...docs);
    } catch (err) {
      console.error(`    Erro no batch de documentos ${i}-${i + dhBatchSize}: ${err.message}`);
    }

    process.stdout.write(`    Processando batch ${Math.min(i + dhBatchSize, empenhoIds.length)}/${empenhoIds.length}\r`);
  }
  console.log(`\n    Total: ${todosDocumentos.length} documentos hábeis\n`);

  // Criar mapa de documentos por empenho
  const documentosPorEmpenho = {};
  todosDocumentos.forEach(d => {
    if (!documentosPorEmpenho[d.id_empenho]) {
      documentosPorEmpenho[d.id_empenho] = [];
    }
    documentosPorEmpenho[d.id_empenho].push(d);
  });

  // 1.4 Buscar OBs APENAS para documentos hábeis encontrados
  console.log('1.4 Buscando ordens bancárias (OBs) dos documentos ES...');
  const dhIds = todosDocumentos.map(d => d.id_dh).filter(Boolean);
  const todasOBs = [];

  for (let i = 0; i < dhIds.length; i += dhBatchSize) {
    const batch = dhIds.slice(i, i + dhBatchSize);
    const idsParam = batch.join(',');

    try {
      const obs = await fetchJSON(
        `${BASE_URL}/ordem_pagamento_ordem_bancaria_especial?id_dh=in.(${idsParam})&numero_ordem_bancaria=not.is.null&select=id_dh,numero_ordem_bancaria`
      );
      todasOBs.push(...obs);
    } catch (err) {
      console.error(`    Erro no batch de OBs ${i}-${i + dhBatchSize}: ${err.message}`);
    }

    process.stdout.write(`    Processando batch ${Math.min(i + dhBatchSize, dhIds.length)}/${dhIds.length}\r`);
  }
  console.log(`\n    Total: ${todasOBs.length} OBs emitidas\n`);

  // Criar set de documentos que têm OB emitida
  const dhsComOB = new Set(todasOBs.map(ob => ob.id_dh));

  // 1.5 Buscar todos os executores e planos de trabalho
  console.log('1.5 Buscando executores...');
  const planoIds = todosPlanos.map(p => p.id_plano_acao).filter(Boolean);
  const todosExecutores = [];
  const todosPlanosTrabalho = [];

  // Buscar em batches para evitar URLs muito longas
  const batchSize = 100;
  for (let i = 0; i < planoIds.length; i += batchSize) {
    const batch = planoIds.slice(i, i + batchSize);
    const idsParam = batch.join(',');

    try {
      const [execs, pts] = await Promise.all([
        fetchJSON(`${BASE_URL}/executor_especial?id_plano_acao=in.(${idsParam})`),
        fetchJSON(`${BASE_URL}/plano_trabalho_especial?id_plano_acao=in.(${idsParam})`)
      ]);
      todosExecutores.push(...execs);
      todosPlanosTrabalho.push(...pts);
    } catch (err) {
      console.error(`    Erro no batch ${i}-${i + batchSize}: ${err.message}`);
    }

    process.stdout.write(`    Processando batch ${Math.min(i + batchSize, planoIds.length)}/${planoIds.length}\r`);
  }
  console.log(`\n    Total: ${todosExecutores.length} executores, ${todosPlanosTrabalho.length} planos de trabalho\n`);

  // Criar mapas
  const executoresPorPlano = {};
  todosExecutores.forEach(e => {
    if (!executoresPorPlano[e.id_plano_acao]) {
      executoresPorPlano[e.id_plano_acao] = [];
    }
    executoresPorPlano[e.id_plano_acao].push(e);
  });

  const planoTrabalhoPorPlano = {};
  todosPlanosTrabalho.forEach(pt => {
    planoTrabalhoPorPlano[pt.id_plano_acao] = pt;
  });

  // 1.6 Buscar metas
  console.log('1.6 Buscando metas...');
  const executorIds = todosExecutores.map(e => e.id_executor).filter(Boolean);
  const todasMetas = [];

  for (let i = 0; i < executorIds.length; i += batchSize) {
    const batch = executorIds.slice(i, i + batchSize);
    const idsParam = batch.join(',');

    try {
      const metas = await fetchJSON(`${BASE_URL}/meta_especial?id_executor=in.(${idsParam})`);
      todasMetas.push(...metas);
    } catch (err) {
      // Ignorar erros de metas
    }

    process.stdout.write(`    Processando batch ${Math.min(i + batchSize, executorIds.length)}/${executorIds.length}\r`);
  }
  console.log(`\n    Total: ${todasMetas.length} metas\n`);

  const metasPorExecutor = {};
  todasMetas.forEach(m => {
    if (!metasPorExecutor[m.id_executor]) {
      metasPorExecutor[m.id_executor] = [];
    }
    metasPorExecutor[m.id_executor].push(m);
  });

  // ========================================
  // FASE 2: Calcular valores efetivados
  // ========================================
  console.log('\n=== FASE 2: Calculando valores efetivados ===\n');

  // Estatísticas para diagnóstico
  console.log(`Documentos hábeis encontrados: ${todosDocumentos.length}`);
  console.log(`OBs emitidas encontradas: ${todasOBs.length}`);
  console.log(`DHs com OB (set size): ${dhsComOB.size}`);

  // Para cada plano, calcular o valor efetivado (soma dos documentos hábeis com OB emitida)
  const valorEfetivadoPorPlano = {};
  let totalPlanosComOB = 0;
  let totalDocumentosProcessados = 0;
  let totalDocumentosComOB = 0;

  todosPlanos.forEach(plano => {
    const idPlano = plano.id_plano_acao;
    let valorEfetivado = 0;

    // Buscar empenhos do plano
    const empenhos = empenhosPorPlano[idPlano] || [];

    empenhos.forEach(empenho => {
      // Buscar documentos do empenho
      const docs = documentosPorEmpenho[empenho.id_empenho] || [];
      totalDocumentosProcessados += docs.length;

      docs.forEach(doc => {
        // Verificar se este documento tem OB emitida
        if (dhsComOB.has(doc.id_dh)) {
          valorEfetivado += parseFloat(doc.valor_dh || 0);
          totalDocumentosComOB++;
        }
      });
    });

    if (valorEfetivado > 0) {
      totalPlanosComOB++;
    }

    valorEfetivadoPorPlano[idPlano] = valorEfetivado;
  });

  console.log(`Documentos processados: ${totalDocumentosProcessados}`);
  console.log(`Documentos com OB: ${totalDocumentosComOB}`);
  console.log(`Planos com OB emitida: ${totalPlanosComOB}/${todosPlanos.length}`);

  // ========================================
  // FASE 3: Processar e agregar dados
  // ========================================
  console.log('\n=== FASE 3: Processando dados ===\n');

  const porEnte = {};
  const porParlamentar = {};
  const porAno = {};
  const porAnoEstado = {};
  const porAnoMunicipios = {};
  const porAnoEfetivado = {};
  const porAnoEstadoEfetivado = {};
  const porAnoMunicipiosEfetivado = {};
  const porArea = {};
  const porAreaPorAno = {};
  const porAreaEfetivado = {};
  const porAreaPorAnoEfetivado = {};

  const planosProcessados = todosPlanos.map(planoRaw => {
    const plano = processarPlano(planoRaw);
    plano.valor_efetivado = valorEfetivadoPorPlano[planoRaw.id_plano_acao] || 0;

    // Adicionar executores
    const execsRaw = executoresPorPlano[planoRaw.id_plano_acao] || [];
    const pt = planoTrabalhoPorPlano[planoRaw.id_plano_acao];
    const situacaoPlanoTrabalho = pt?.situacao_plano_trabalho || null;

    plano.situacao_plano_trabalho = situacaoPlanoTrabalho;

    plano.executores = execsRaw.map(execRaw => {
      const exec = processarExecutor(execRaw, {
        id: plano.id,
        codigo: plano.codigo,
        situacao: plano.situacao,
        parlamentar: plano.parlamentar,
        numero_emenda: plano.numero_emenda,
        area_politica: plano.area_politica,
        recurso_recebido: plano.recurso_recebido
      }, situacaoPlanoTrabalho);

      // Adicionar metas
      const metasRaw = metasPorExecutor[execRaw.id_executor] || [];
      exec.metas = metasRaw.map(processarMeta);

      return exec;
    });

    return plano;
  });

  // Agregar dados
  planosProcessados.forEach(plano => {
    const cnpj = plano.cnpj_beneficiario;
    const parlamentar = plano.parlamentar;
    const ano = plano.ano;
    const area = plano.area_politica || 'Outros';
    const valor = plano.valor_total;
    const valorEfetivado = plano.valor_efetivado;

    if (!cnpj) return;

    // Identificar se é estado ou município
    const nome = plano.nome_beneficiario || 'Não informado';
    const isEstado = nome.toUpperCase().includes('ESTADO') || nome.toUpperCase().includes('GOVERNO DO ESTADO');

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
    porEnte[cnpj].anosEfetivados[ano] = (porEnte[cnpj].anosEfetivados[ano] || 0) + valorEfetivado;
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
      porParlamentar[parlamentar].totalEfetivado += valorEfetivado;
      porParlamentar[parlamentar].planos.push(plano);
      if (!porParlamentar[parlamentar].entes.includes(plano.nome_beneficiario)) {
        porParlamentar[parlamentar].entes.push(plano.nome_beneficiario);
      }
      porParlamentar[parlamentar].anos[ano] = (porParlamentar[parlamentar].anos[ano] || 0) + valor;
      porParlamentar[parlamentar].anosEfetivados[ano] = (porParlamentar[parlamentar].anosEfetivados[ano] || 0) + valorEfetivado;
    }

    // Por ano (total empenhado)
    porAno[ano] = (porAno[ano] || 0) + valor;
    porAnoEfetivado[ano] = (porAnoEfetivado[ano] || 0) + valorEfetivado;

    // Por ano (estado vs municípios)
    if (isEstado) {
      porAnoEstado[ano] = (porAnoEstado[ano] || 0) + valor;
      porAnoEstadoEfetivado[ano] = (porAnoEstadoEfetivado[ano] || 0) + valorEfetivado;
    } else {
      porAnoMunicipios[ano] = (porAnoMunicipios[ano] || 0) + valor;
      porAnoMunicipiosEfetivado[ano] = (porAnoMunicipiosEfetivado[ano] || 0) + valorEfetivado;
    }

    // Por área (total empenhado)
    porArea[area] = (porArea[area] || 0) + valor;

    // Por área efetivado (total)
    porAreaEfetivado[area] = (porAreaEfetivado[area] || 0) + valorEfetivado;

    // Por área por ano (empenhado)
    if (!porAreaPorAno[ano]) {
      porAreaPorAno[ano] = {};
    }
    porAreaPorAno[ano][area] = (porAreaPorAno[ano][area] || 0) + valor;

    // Por área por ano efetivado
    if (!porAreaPorAnoEfetivado[ano]) {
      porAreaPorAnoEfetivado[ano] = {};
    }
    porAreaPorAnoEfetivado[ano][area] = (porAreaPorAnoEfetivado[ano][area] || 0) + valorEfetivado;
  });

  // Montar estrutura final
  console.log('Montando estrutura final...');

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
    porAreaEfetivado,
    porAreaPorAnoEfetivado,
    totalEstado,
    totalMunicipios,
    totalGeral: totalEstado + totalMunicipios,
    totalEstadoEfetivado,
    totalMunicipiosEfetivado,
    totalGeralEfetivado: totalEstadoEfetivado + totalMunicipiosEfetivado
  };

  // Salvar arquivo
  const fs = await import('fs');
  const path = await import('path');

  const outputPath = path.join(process.cwd(), 'public', 'dados-es.json');
  fs.writeFileSync(outputPath, JSON.stringify(dadosCache, null, 2));

  console.log(`\nCache salvo em: ${outputPath}`);
  console.log(`Tamanho: ${(fs.statSync(outputPath).size / 1024 / 1024).toFixed(2)} MB`);

  // Estatísticas
  console.log('\n=== ESTATÍSTICAS FINAIS ===');
  console.log(`Total de entes: ${entes.length}`);
  console.log(`  - Estado: ${estado ? 1 : 0}`);
  console.log(`  - Municípios: ${municipios.length}`);
  console.log(`Total de parlamentares: ${Object.keys(porParlamentar).length}`);
  console.log(`Total de planos: ${planosProcessados.length}`);
  console.log(`  - Com OB emitida: ${totalPlanosComOB}`);
  console.log(`Total de executores: ${todosExecutores.length}`);
  console.log(`Total de metas: ${todasMetas.length}`);
  console.log(`\nValores:`);
  console.log(`  - Empenhado: R$ ${(dadosCache.totalGeral / 1e6).toFixed(1)} milhões`);
  console.log(`  - Efetivado (OB): R$ ${(dadosCache.totalGeralEfetivado / 1e6).toFixed(1)} milhões`);
  console.log(`  - % Efetivado: ${((dadosCache.totalGeralEfetivado / dadosCache.totalGeral) * 100).toFixed(1)}%`);
  console.log('\nCache gerado com sucesso!');
}

gerarCache().catch(err => {
  console.error('Erro ao gerar cache:', err);
  process.exit(1);
});
