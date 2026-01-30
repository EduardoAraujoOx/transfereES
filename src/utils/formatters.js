// Formatadores de valores

export const formatarMoeda = (valor) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor || 0);
};

export const formatarMoedaCompacta = (valor) => {
  if (valor >= 1e9) {
    return 'R$ ' + (valor / 1e9).toFixed(1) + 'B';
  }
  if (valor >= 1e6) {
    return 'R$ ' + (valor / 1e6).toFixed(1) + 'M';
  }
  if (valor >= 1e3) {
    return 'R$ ' + (valor / 1e3).toFixed(0) + 'K';
  }
  return formatarMoeda(valor);
};

export const formatarNumero = (valor) => {
  return new Intl.NumberFormat('pt-BR').format(valor || 0);
};
