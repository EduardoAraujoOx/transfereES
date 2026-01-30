// Helpers para status e situações

export const getSituacaoPlano = (situacao) => {
  const mapa = {
    CIENTE: {
      label: 'Ciente',
      cor: 'text-emerald-700',
      bg: 'bg-emerald-50',
      icone: 'CheckCircle2'
    },
    AGUARDANDO_CIENCIA: {
      label: 'Aguardando Ciência',
      cor: 'text-amber-700',
      bg: 'bg-amber-50',
      icone: 'Clock'
    },
    IMPEDIDO: {
      label: 'Impedido',
      cor: 'text-red-700',
      bg: 'bg-red-50',
      icone: 'AlertCircle'
    }
  };
  return mapa[situacao] || { label: situacao, cor: 'text-slate-600', bg: 'bg-slate-100', icone: 'Clock' };
};

export const getSituacaoTrabalho = (situacao) => {
  const mapa = {
    'Aprovado': { label: 'Aprovado', cor: 'text-emerald-700', bg: 'bg-emerald-50' },
    'Em Análise': { label: 'Em Análise', cor: 'text-amber-700', bg: 'bg-amber-50' },
    'Impedido': { label: 'Impedido', cor: 'text-red-700', bg: 'bg-red-50' }
  };
  return mapa[situacao] || { label: situacao, cor: 'text-slate-600', bg: 'bg-slate-100' };
};

export const getStatusRecurso = (recebido) => {
  if (recebido) {
    return { label: 'Recebido', cor: 'text-emerald-700', bg: 'bg-emerald-100', icone: 'BadgeCheck' };
  }
  return { label: 'Aguardando', cor: 'text-slate-600', bg: 'bg-slate-100', icone: 'Hourglass' };
};

export const getSituacaoConta = (situacao) => {
  const mapa = {
    'Conta Ativa': { cor: 'text-emerald-700', bg: 'bg-emerald-50' },
    'Bloqueada': { cor: 'text-red-700', bg: 'bg-red-50' }
  };
  return mapa[situacao] || { cor: 'text-amber-700', bg: 'bg-amber-50' };
};

export const buildUrlTransfereGov = (codigo) => {
  if (codigo) {
    const id = codigo.split('-')[1];
    return `https://especiais.transferegov.sistema.gov.br/transferencia-especial/plano-acao/detalhe/${id}/dados-basicos`;
  }
  return 'https://especiais.transferegov.sistema.gov.br/transferencia-especial/plano-acao/consulta';
};
