import { useState, useMemo } from 'react';
import { Search, TrendingUp, Building2, Users, FileText, Wallet, Landmark, Building, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { formatarMoeda, formatarMoedaCompacta, formatarNumero } from '../utils/formatters';

export default function PaginaInicial({ dados, anoFiltro, onAnoChange, onEnte, onParlamentar }) {
  const [buscaE, setBuscaE] = useState('');
  const [buscaP, setBuscaP] = useState('');

  const { estado, municipios, parlamentares, porAno, porAnoEstado, porAnoMunicipios, porArea, totalEstado, totalMunicipios, totalGeral } = dados;

  const anos = Object.keys(porAno).sort();

  // Calcular valores baseados no filtro de ano
  const dadosFiltrados = useMemo(() => {
    if (!anoFiltro) {
      return {
        total: totalGeral,
        totalEst: totalEstado,
        totalMun: totalMunicipios,
        labelPeriodo: `${anos[0]}-${anos[anos.length - 1]}`
      };
    }
    const anoNum = parseInt(anoFiltro);
    return {
      total: porAno[anoNum] || 0,
      totalEst: (porAnoEstado?.[anoNum] || 0),
      totalMun: (porAnoMunicipios?.[anoNum] || 0),
      labelPeriodo: anoFiltro.toString()
    };
  }, [anoFiltro, porAno, porAnoEstado, porAnoMunicipios, totalGeral, totalEstado, totalMunicipios, anos]);

  // Filtrar entes por ano selecionado
  const muniF = useMemo(() => {
    let lista = municipios;
    if (anoFiltro) {
      const anoNum = parseInt(anoFiltro);
      lista = municipios.filter(m => m.anos[anoNum] && m.anos[anoNum] > 0);
    }
    if (buscaE) {
      lista = lista.filter(m => m.nome.toLowerCase().includes(buscaE.toLowerCase()));
    }
    return lista;
  }, [municipios, anoFiltro, buscaE]);

  // Filtrar parlamentares por ano selecionado
  const parlF = useMemo(() => {
    let lista = parlamentares;
    if (anoFiltro) {
      const anoNum = parseInt(anoFiltro);
      lista = parlamentares.filter(p => p.anos[anoNum] && p.anos[anoNum] > 0);
    }
    if (buscaP) {
      lista = lista.filter(p => p.nome.toLowerCase().includes(buscaP.toLowerCase()));
    }
    return lista;
  }, [parlamentares, anoFiltro, buscaP]);

  // Verificar se estado tem dados no ano filtrado
  const estadoVisivel = useMemo(() => {
    if (!estado) return false;
    if (!anoFiltro) return true;
    const anoNum = parseInt(anoFiltro);
    return estado.anos[anoNum] && estado.anos[anoNum] > 0;
  }, [estado, anoFiltro]);

  // Dados para gráficos
  const cores = [
    { f: '#0d9488', bg: 'bg-teal-600' },
    { f: '#f59e0b', bg: 'bg-amber-500' },
    { f: '#06b6d4', bg: 'bg-cyan-500' },
    { f: '#6366f1', bg: 'bg-indigo-500' },
    { f: '#8b5cf6', bg: 'bg-violet-500' }
  ];

  const dFins = Object.entries(porArea).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tFins = dFins.reduce((a, [, v]) => a + v, 0);

  let ac = 0;
  const segs = dFins.map(([, v], i) => {
    const p = (v / tFins) * 100;
    const ini = ac;
    ac += p;
    return { ini, fim: ac, cor: cores[i].f };
  });

  // Calcular max para o gráfico de barras (usa porAno total para escala consistente)
  const maxAno = Math.max(...anos.map(a => porAno[a] || 0));

  return (
    <div className="space-y-6">
      {/* LINHA 1: 3 KPIs */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 40%', minWidth: '280px' }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-900 p-5 shadow-xl h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative">
              <div className="flex items-start justify-between mb-1">
                <p className="text-slate-400 text-sm">Total Transferido ({dadosFiltrados.labelPeriodo})</p>
                <div className="p-2 bg-white/10 rounded-xl">
                  <Wallet className="w-4 h-4 text-teal-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-2">{formatarMoeda(dadosFiltrados.total)}</p>
              <div className="flex gap-4 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Estado</p>
                    <p className="text-white text-sm font-semibold">{formatarMoedaCompacta(dadosFiltrados.totalEst)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Municípios</p>
                    <p className="text-white text-sm font-semibold">{formatarMoedaCompacta(dadosFiltrados.totalMun)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{ flex: '1 1 28%', minWidth: '180px' }}>
          <Card className="p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">Entes Beneficiados</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {muniF.length + (estadoVisivel ? 1 : 0)}
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  {estadoVisivel ? '1 Estado + ' : ''}{muniF.length} municípios
                </p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-xl">
                <Building2 className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </Card>
        </div>
        <div style={{ flex: '1 1 28%', minWidth: '180px' }}>
          <Card className="p-5 h-full">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-500 text-sm">Parlamentares</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{parlF.length}</p>
                <p className="text-slate-400 text-sm mt-1">
                  {anoFiltro ? `Em ${anoFiltro}` : 'Total acumulado'}
                </p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-xl">
                <Users className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* LINHA 2: 2 Gráficos */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 58%', minWidth: '340px' }}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">Por Ano</h3>
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
              {/* Filtro de Anos */}
              <div className="flex gap-1.5 flex-wrap">
                <button
                  onClick={() => onAnoChange(null)}
                  className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                    !anoFiltro
                      ? 'bg-teal-500 text-white shadow-md'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Todos
                </button>
                {anos.map(a => (
                  <button
                    key={a}
                    onClick={() => onAnoChange(a)}
                    className={`px-3 py-1.5 text-sm rounded-lg font-medium transition-all ${
                      anoFiltro === a
                        ? 'bg-teal-500 text-white shadow-md'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            {/* Legenda */}
            <div className="flex gap-4 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-slate-400" />
                <span className="text-xs text-slate-600">Estado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-teal-500" />
                <span className="text-xs text-slate-600">Municípios</span>
              </div>
            </div>

            {/* Gráfico de Barras Empilhadas */}
            <div className="space-y-3">
              {anos.map(ano => {
                const vEstado = porAnoEstado?.[ano] || 0;
                const vMunicipios = porAnoMunicipios?.[ano] || 0;
                const vTotal = vEstado + vMunicipios;
                const pTotal = (vTotal / maxAno) * 100;
                const pEstado = vTotal > 0 ? (vEstado / vTotal) * 100 : 0;
                const pMunicipios = vTotal > 0 ? (vMunicipios / vTotal) * 100 : 0;
                const isSelected = anoFiltro === ano;

                return (
                  <div
                    key={ano}
                    onClick={() => onAnoChange(anoFiltro === ano ? null : ano)}
                    className={`cursor-pointer transition-all rounded-lg p-2 -mx-2 ${
                      isSelected ? 'bg-teal-50 ring-2 ring-teal-500' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-semibold w-12 ${isSelected ? 'text-teal-700' : 'text-slate-600'}`}>
                        {ano}
                      </span>
                      <div className="flex-1 relative">
                        <div className="h-9 bg-slate-100 rounded-lg overflow-hidden">
                          <div
                            className="h-full rounded-lg flex"
                            style={{ width: Math.max(pTotal, 18) + '%' }}
                          >
                            {/* Barra do Estado (cinza) */}
                            {pEstado > 0 && (
                              <div
                                className="h-full bg-slate-400"
                                style={{ width: pEstado + '%' }}
                              />
                            )}
                            {/* Barra dos Municípios (verde) */}
                            {pMunicipios > 0 && (
                              <div
                                className="h-full"
                                style={{
                                  width: pMunicipios + '%',
                                  background: 'linear-gradient(90deg, #0d9488, #06b6d4)'
                                }}
                              />
                            )}
                          </div>
                          {/* Valor dentro da barra */}
                          <div
                            className="absolute inset-y-0 flex items-center justify-end pr-3"
                            style={{ width: Math.max(pTotal, 18) + '%' }}
                          >
                            <span className="text-sm font-bold text-white drop-shadow-sm">
                              {formatarMoedaCompacta(vTotal)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div style={{ flex: '1 1 38%', minWidth: '280px' }}>
          <Card className="p-6 h-full">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Distribuição por Área</h3>
            <div className="relative w-36 h-36 mx-auto mb-4">
              <svg viewBox="0 0 100 100" className="w-full h-full" style={{ transform: 'rotate(-90deg)' }}>
                {segs.map((s, i) => {
                  const r = 38;
                  const c = 2 * Math.PI * r;
                  return (
                    <circle
                      key={i}
                      cx="50"
                      cy="50"
                      r={r}
                      fill="none"
                      stroke={s.cor}
                      strokeWidth="18"
                      strokeDasharray={((s.fim - s.ini) / 100) * c + ' ' + c}
                      strokeDashoffset={-(s.ini / 100) * c}
                    />
                  );
                })}
              </svg>
            </div>
            <div className="space-y-2">
              {dFins.map(([f, v], i) => (
                <div key={f} className="flex items-center gap-2">
                  <div className={'w-3 h-3 rounded-full flex-shrink-0 ' + cores[i].bg} />
                  <span className="text-sm text-slate-600 flex-1 truncate">{f}</span>
                  <span className="text-sm font-bold text-slate-800">{((v / tFins) * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* LINHA 3: 2 Boxes de Consulta */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 48%', minWidth: '320px' }}>
          <Card className="overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-800">Por Ente Beneficiário</h3>
                <Building2 className="w-5 h-5 text-slate-400" />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar ente..."
                  value={buscaE}
                  onChange={e => setBuscaE(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            {estadoVisivel && estado && (
              <div
                onClick={() => onEnte(estado)}
                className="p-4 cursor-pointer hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm">
                  <Landmark className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">Governo do Estado</p>
                  <p className="text-xs text-slate-500">
                    {anoFiltro
                      ? `${estado.planos.filter(p => p.ano === parseInt(anoFiltro)).length} planos em ${anoFiltro}`
                      : `${estado.planos.length} planos`
                    }
                  </p>
                </div>
                <p className="font-bold text-slate-800 text-sm">
                  {formatarMoedaCompacta(anoFiltro ? (estado.anos[parseInt(anoFiltro)] || 0) : totalEstado)}
                </p>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto max-h-64">
              {muniF.map((m, i) => {
                const t = anoFiltro
                  ? (m.anos[parseInt(anoFiltro)] || 0)
                  : Object.values(m.anos).reduce((a, b) => a + b, 0);
                const numPlanos = anoFiltro
                  ? m.planos.filter(p => p.ano === parseInt(anoFiltro)).length
                  : m.planos.length;
                return (
                  <div
                    key={m.id}
                    onClick={() => onEnte(m)}
                    className={'p-4 cursor-pointer hover:bg-teal-50/50 flex items-center gap-3 group ' + (i < muniF.length - 1 ? 'border-b border-slate-50' : '')}
                  >
                    <div className="p-2.5 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-sm">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{m.nome}</p>
                      <p className="text-xs text-slate-500">{numPlanos} planos</p>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(t)}</p>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
        <div style={{ flex: '1 1 48%', minWidth: '320px' }}>
          <Card className="overflow-hidden h-full flex flex-col">
            <div className="p-5 border-b border-slate-100">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-semibold text-slate-800">Por Parlamentar</h3>
                <Users className="w-5 h-5 text-slate-400" />
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar parlamentar..."
                  value={buscaP}
                  onChange={e => setBuscaP(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto max-h-80">
              {parlF.map((p, i) => {
                const valorParl = anoFiltro
                  ? (p.anos[parseInt(anoFiltro)] || 0)
                  : p.total;
                const numEntes = anoFiltro
                  ? new Set(p.planos.filter(pl => pl.ano === parseInt(anoFiltro)).map(pl => pl.nome_beneficiario)).size
                  : (p.entes?.size || p.entes?.length || 0);
                const numPlanos = anoFiltro
                  ? p.planos.filter(pl => pl.ano === parseInt(anoFiltro)).length
                  : p.planos.length;
                return (
                  <div
                    key={p.nome}
                    onClick={() => onParlamentar(p)}
                    className={'p-4 cursor-pointer hover:bg-indigo-50/50 flex items-center gap-3 group ' + (i < parlF.length - 1 ? 'border-b border-slate-50' : '')}
                  >
                    <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-sm">
                      <Users className="w-4 h-4 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 text-sm">{p.nome}</p>
                      <p className="text-xs text-slate-500">{numPlanos} plano(s) - {numEntes} ente(s)</p>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(valorParl)}</p>
                    <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
