import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Building2, Landmark, Building, ArrowRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { BtnVoltar, Loading } from '../components/ui';
import { formatarMoeda, formatarMoedaCompacta } from '../utils/formatters';
import { getSituacaoTrabalho } from '../utils/helpers';
import { fetchEnteCompleto } from '../services/api';

export default function PaginaEnte({ ente, anoInicial, areaInicial, somenteEfetivadas, onVoltar, onExec }) {
  const [ano, setAno] = useState(anoInicial || null);
  const [areaFiltro, setAreaFiltro] = useState(areaInicial || null);
  const [enteCompleto, setEnteCompleto] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarExecutores() {
      setLoading(true);
      try {
        const completo = await fetchEnteCompleto(ente);
        setEnteCompleto(completo);
      } catch (error) {
        console.error('Erro ao carregar executores:', error);
        setEnteCompleto(ente);
      }
      setLoading(false);
    }
    carregarExecutores();
  }, [ente]);

  const anosD = Object.keys(ente.anos).sort();
  const total = somenteEfetivadas
    ? Object.values(ente.anosEfetivados || {}).reduce((a, b) => a + b, 0)
    : Object.values(ente.anos).reduce((a, b) => a + b, 0);
  const maxAno = Math.max(...Object.values(ente.anos));

  // Calcular distribuição por área
  const dadosArea = useMemo(() => {
    const planos = enteCompleto?.planos || ente.planos || [];
    const areaMap = {};
    planos.forEach(p => {
      if (ano && p.ano !== parseInt(ano)) return;
      const area = p.area_politica || 'Outros';
      const valor = somenteEfetivadas ? (p.valor_efetivado || 0) : p.valor_total;
      areaMap[area] = (areaMap[area] || 0) + valor;
    });
    return Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [ente, enteCompleto, ano, somenteEfetivadas]);

  const tFins = dadosArea.reduce((a, [, v]) => a + v, 0);

  const cores = [
    { f: '#0d9488', bg: 'bg-teal-600' },
    { f: '#f59e0b', bg: 'bg-amber-500' },
    { f: '#06b6d4', bg: 'bg-cyan-500' },
    { f: '#6366f1', bg: 'bg-indigo-500' },
    { f: '#8b5cf6', bg: 'bg-violet-500' }
  ];

  let ac = 0;
  const segs = dadosArea.map(([, v], i) => {
    const p = tFins > 0 ? (v / tFins) * 100 : 0;
    const ini = ac;
    ac += p;
    return { ini, fim: ac, cor: cores[i]?.f || '#94a3b8' };
  });

  const planosF = useMemo(() => {
    let lista = enteCompleto?.planos || ente.planos;
    if (ano) {
      lista = lista.filter(p => p.ano === parseInt(ano));
    }
    if (areaFiltro) {
      lista = lista.filter(p => p.area_politica === areaFiltro);
    }
    return lista;
  }, [ente, enteCompleto, ano, areaFiltro]);

  const execs = planosF.flatMap(p =>
    (p.executores || []).map(e => ({
      ...e,
      plano: p,
      vT: (e.valor_custeio || 0) + (e.valor_investimento || 0)
    }))
  ).sort((a, b) => b.vT - a.vT);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <BtnVoltar onClick={onVoltar} texto="Voltar à visão geral" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className={'p-4 rounded-2xl shadow-sm ' + (ente.tipo === 'estado' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-teal-500 to-cyan-600')}>
              {ente.tipo === 'estado'
                ? <Landmark className="w-8 h-8 text-teal-400" />
                : <Building className="w-8 h-8 text-white" />
              }
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{ente.nome}</h2>
              <p className="text-slate-500 text-sm">CNPJ: {ente.cnpj}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">{formatarMoeda(total)}</p>
            <p className="text-slate-500">Total {somenteEfetivadas ? 'efetivado' : 'recebido'}</p>
          </div>
        </div>
      </Card>

      {/* Gráficos lado a lado */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Gráfico por ano */}
        <div style={{ flex: '1 1 58%', minWidth: '340px' }}>
          <Card className="p-6 h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">Transferências por Ano</h3>
                <TrendingUp className="w-5 h-5 text-teal-500" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setAno(null)}
                  className={'px-3 py-1.5 text-sm rounded-lg font-medium transition-all ' + (!ano ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                >
                  Todos
                </button>
                {anosD.map(a => (
                  <button
                    key={a}
                    onClick={() => setAno(a)}
                    className={'px-3 py-1.5 text-sm rounded-lg font-medium transition-all ' + (ano === a ? 'bg-teal-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {anosD.map(a => {
                const v = ente.anos[a];
                const p = (v / maxAno) * 100;
                const sel = !ano || ano === a;
                return (
                  <div key={a} className="group">
                    <div className="flex items-center gap-4">
                      <span className={'text-sm font-semibold w-12 ' + (sel ? 'text-slate-700' : 'text-slate-400')}>{a}</span>
                      <div className="flex-1 relative">
                        <div className="h-9 bg-slate-100 rounded-lg overflow-hidden">
                          <div
                            className={'h-full rounded-lg relative overflow-hidden transition-all duration-300 ' + (sel ? '' : 'opacity-30')}
                            style={{
                              width: Math.max(p, 12) + '%',
                              background: sel ? 'linear-gradient(90deg, #0d9488, #06b6d4)' : '#94a3b8'
                            }}
                          >
                            <div className="absolute inset-0 flex items-center justify-end pr-3">
                              <span className="text-sm font-bold text-white drop-shadow-sm">{formatarMoedaCompacta(v)}</span>
                            </div>
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

        {/* Gráfico por área */}
        <div style={{ flex: '1 1 38%', minWidth: '280px' }}>
          <Card className="p-6 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800">Por Área</h3>
              {areaFiltro && (
                <button
                  onClick={() => setAreaFiltro(null)}
                  className="text-xs text-teal-600 hover:text-teal-700 font-medium"
                >
                  Limpar filtro
                </button>
              )}
            </div>
            {dadosArea.length > 0 ? (
              <>
                <div className="relative w-32 h-32 mx-auto mb-4">
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
                <div className="space-y-1.5">
                  {dadosArea.map(([f, v], i) => {
                    const isSelected = areaFiltro === f;
                    return (
                      <div
                        key={f}
                        onClick={() => setAreaFiltro(areaFiltro === f ? null : f)}
                        className={`flex items-center gap-2 cursor-pointer p-1.5 -mx-1.5 rounded-lg transition-all ${
                          isSelected ? 'bg-teal-50 ring-2 ring-teal-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (cores[i]?.bg || 'bg-slate-400')} />
                        <span className={`text-xs flex-1 truncate ${isSelected ? 'text-teal-700 font-medium' : 'text-slate-600'}`}>
                          {f}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-teal-700' : 'text-slate-800'}`}>
                          {tFins > 0 ? ((v / tFins) * 100).toFixed(0) : 0}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center text-slate-500 py-8 text-sm">
                Nenhum dado de área disponível
              </div>
            )}
          </Card>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-100 rounded-lg">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Projetos por Executor</h3>
              <p className="text-sm text-slate-500">
                {execs.length} projeto(s) encontrado(s)
                {areaFiltro && ` em ${areaFiltro}`}
              </p>
            </div>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : execs.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Nenhum executor encontrado para este filtro.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {execs.map((ex, i) => {
              const sit = getSituacaoTrabalho(ex.situacao_plano_trabalho);
              return (
                <div
                  key={ex.id + '-' + i}
                  onClick={() => onExec(ex)}
                  className="p-5 hover:bg-teal-50/30 cursor-pointer group"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl shadow-sm flex-shrink-0">
                      <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-800 mb-1">{ex.nome}</p>
                      <p className="text-sm text-slate-600 line-clamp-2 mb-2">{ex.detalhamento_objeto || ex.objeto}</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={'text-xs px-2 py-1 rounded-full font-medium ' + sit.bg + ' ' + sit.cor}>{sit.label}</span>
                        <span className="text-xs text-slate-400">-</span>
                        <span className="text-xs text-slate-500">{ex.plano.ano}</span>
                        <span className="text-xs text-slate-400">-</span>
                        <span className="text-xs text-slate-500">{ex.plano.parlamentar}</span>
                        {ex.plano.area_politica && (
                          <>
                            <span className="text-xs text-slate-400">-</span>
                            <span className="text-xs text-teal-600">{ex.plano.area_politica}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-lg font-bold text-slate-800">{formatarMoedaCompacta(ex.vT)}</p>
                      <p className="text-xs text-slate-500">Valor do projeto</p>
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-300 group-hover:text-teal-500 group-hover:translate-x-1 transition-all mt-2 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
