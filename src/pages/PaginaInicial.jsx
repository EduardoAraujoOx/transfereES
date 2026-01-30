import { useState, useMemo } from 'react';
import { Search, TrendingUp, Building2, Users, FileText, Wallet, Landmark, Building, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { formatarMoeda, formatarMoedaCompacta, formatarNumero } from '../utils/formatters';

export default function PaginaInicial({ dados, onEnte, onParlamentar }) {
  const [buscaE, setBuscaE] = useState('');
  const [buscaP, setBuscaP] = useState('');
  const cores = [
    { f: '#0d9488', bg: 'bg-teal-600' },
    { f: '#f59e0b', bg: 'bg-amber-500' },
    { f: '#06b6d4', bg: 'bg-cyan-500' },
    { f: '#6366f1', bg: 'bg-indigo-500' },
    { f: '#8b5cf6', bg: 'bg-violet-500' }
  ];

  const { estado, municipios, parlamentares, porAno, porArea, totalEstado, totalMunicipios, totalGeral } = dados;
  
  const anos = Object.keys(porAno).sort();
  const exercicio = new Date().getFullYear();
  
  // Dados para gráficos
  const dFins = Object.entries(porArea).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const tFins = dFins.reduce((a, [, v]) => a + v, 0);
  
  let ac = 0;
  const segs = dFins.map(([, v], i) => {
    const p = (v / tFins) * 100;
    const ini = ac;
    ac += p;
    return { ini, fim: ac, cor: cores[i].f };
  });
  
  const maxAno = Math.max(...anos.map(a => porAno[a] || 0));
  
  // Filtros
  const muniF = municipios.filter(m => m.nome.toLowerCase().includes(buscaE.toLowerCase()));
  const parlF = parlamentares.filter(p => p.nome.toLowerCase().includes(buscaP.toLowerCase()));

  return (
    <div className="space-y-6">
      {/* LINHA 1: 3 KPIs */}
      <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 40%', minWidth: '280px' }}>
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-cyan-900 p-5 shadow-xl h-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-2xl -translate-y-1/2 translate-x-1/4" />
            <div className="relative">
              <div className="flex items-start justify-between mb-1">
                <p className="text-slate-400 text-sm">Total Transferido ({anos[0]}-{anos[anos.length-1]})</p>
                <div className="p-2 bg-white/10 rounded-xl">
                  <Wallet className="w-4 h-4 text-teal-400" />
                </div>
              </div>
              <p className="text-3xl font-bold text-white tracking-tight mb-2">{formatarMoeda(totalGeral)}</p>
              <div className="flex gap-4 pt-3 border-t border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Estado</p>
                    <p className="text-white text-sm font-semibold">{formatarMoedaCompacta(totalEstado)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-teal-400" />
                  <div>
                    <p className="text-slate-500 text-xs">Municípios</p>
                    <p className="text-white text-sm font-semibold">{formatarMoedaCompacta(totalMunicipios)}</p>
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
                <p className="text-3xl font-bold text-slate-800 mt-1">{municipios.length + (estado ? 1 : 0)}</p>
                <p className="text-slate-400 text-sm mt-1">{estado ? '1 Estado + ' : ''}{municipios.length} municípios</p>
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
                <p className="text-slate-500 text-sm">Valor em {exercicio}</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">{formatarMoedaCompacta(porAno[exercicio] || 0)}</p>
                <p className="text-slate-400 text-sm mt-1">Exercício corrente</p>
              </div>
              <div className="p-2.5 bg-slate-100 rounded-xl">
                <FileText className="w-5 h-5 text-slate-500" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* LINHA 2: 2 Gráficos */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 58%', minWidth: '340px' }}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">Evolução Anual das Transferências</h3>
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
            </div>
            <div className="space-y-4">
              {anos.map(ano => {
                const v = porAno[ano] || 0;
                const p = (v / maxAno) * 100;
                return (
                  <div key={ano}>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-semibold text-slate-600 w-12">{ano}</span>
                      <div className="flex-1 relative">
                        <div className="h-9 bg-slate-100 rounded-lg overflow-hidden">
                          <div 
                            className="h-full rounded-lg"
                            style={{ 
                              width: Math.max(p, 15) + '%',
                              background: 'linear-gradient(90deg, #0d9488, #06b6d4)'
                            }}
                          />
                        </div>
                        <div 
                          className="absolute top-0 h-9 flex items-center pl-2" 
                          style={{ left: Math.max(p, 15) + '%' }}
                        >
                          <span className="text-sm font-bold text-slate-700">{formatarMoedaCompacta(v)}</span>
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
            {estado && (
              <div
                onClick={() => onEnte(estado)}
                className="p-4 cursor-pointer hover:bg-slate-50 border-b border-slate-100 flex items-center gap-3 group"
              >
                <div className="p-2.5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-sm">
                  <Landmark className="w-4 h-4 text-teal-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800 text-sm">Governo do Estado</p>
                  <p className="text-xs text-slate-500">{estado.planos.length} planos</p>
                </div>
                <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(totalEstado)}</p>
                <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all" />
              </div>
            )}
            <div className="flex-1 overflow-y-auto max-h-64">
              {muniF.map((m, i) => {
                const t = Object.values(m.anos).reduce((a, b) => a + b, 0);
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
                      <p className="text-xs text-slate-500">{m.planos.length} planos</p>
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
              {parlF.map((p, i) => (
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
                    <p className="text-xs text-slate-500">{p.planos.length} plano(s) - {p.entes.size} ente(s)</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(p.total)}</p>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
