import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Building2, Users, Landmark, Building, ArrowRight, ChevronDown, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { BtnVoltar, Loading } from '../components/ui';
import { formatarMoeda, formatarMoedaCompacta } from '../utils/formatters';
import { getSituacaoTrabalho } from '../utils/helpers';
import { fetchEnteCompleto } from '../services/api';

export default function PaginaParlamentar({ parl, anoInicial, areaInicial, somenteEfetivadas, onVoltar, onExec }) {
  const [ano, setAno] = useState(anoInicial || null);
  const [areaFiltro, setAreaFiltro] = useState(areaInicial || null);
  const [enteExp, setEnteExp] = useState(null);
  const [entesComExecutores, setEntesComExecutores] = useState({});
  const [loadingEnte, setLoadingEnte] = useState(null);
  const [mostrarEfetivadas, setMostrarEfetivadas] = useState(somenteEfetivadas);

  const anosD = Object.keys(parl.anos).sort();

  // Calcular total baseado no toggle e filtros
  const total = useMemo(() => {
    if (ano) {
      if (mostrarEfetivadas) {
        return parl.anosEfetivados?.[ano] || 0;
      }
      return parl.anos?.[ano] || 0;
    }
    if (mostrarEfetivadas) {
      return parl.totalEfetivado || 0;
    }
    return parl.total;
  }, [parl, ano, mostrarEfetivadas]);

  const maxAno = useMemo(() => {
    if (mostrarEfetivadas) {
      return Math.max(...Object.values(parl.anosEfetivados || {}), 1);
    }
    return Math.max(...Object.values(parl.anos), 1);
  }, [parl, mostrarEfetivadas]);

  // Calcular distribuição por área
  const dadosArea = useMemo(() => {
    const areaMap = {};
    parl.planos.forEach(p => {
      if (ano && p.ano !== parseInt(ano)) return;
      const area = p.area_politica || 'Outros';
      const valor = mostrarEfetivadas ? (p.valor_efetivado || 0) : p.valor_total;
      areaMap[area] = (areaMap[area] || 0) + valor;
    });
    return Object.entries(areaMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [parl, ano, mostrarEfetivadas]);

  const tFins = dadosArea.reduce((a, [, v]) => a + v, 0);

  const cores = [
    { f: '#6366f1', bg: 'bg-indigo-500' },
    { f: '#8b5cf6', bg: 'bg-violet-500' },
    { f: '#0d9488', bg: 'bg-teal-600' },
    { f: '#f59e0b', bg: 'bg-amber-500' },
    { f: '#06b6d4', bg: 'bg-cyan-500' }
  ];

  let ac = 0;
  const segs = dadosArea.map(([, v], i) => {
    const p = tFins > 0 ? (v / tFins) * 100 : 0;
    const ini = ac;
    ac += p;
    return { ini, fim: ac, cor: cores[i]?.f || '#94a3b8' };
  });

  // Agregar entes e seus planos
  const entesAgregados = useMemo(() => {
    const map = {};
    parl.planos.forEach(plano => {
      const key = plano.cnpj_beneficiario;
      if (!key) return;

      // Aplicar filtros
      if (ano && plano.ano !== parseInt(ano)) return;
      if (areaFiltro && plano.area_politica !== areaFiltro) return;

      // Quando mostrarEfetivadas, só incluir planos com valor efetivado > 0
      const valorEfetivado = plano.valor_efetivado || 0;
      if (mostrarEfetivadas && valorEfetivado <= 0) return;

      if (!map[key]) {
        map[key] = {
          cnpj: key,
          nome: plano.nome_beneficiario || 'Não informado',
          tipo: (plano.tipo_beneficiario || 'MUNICIPIO').toLowerCase() === 'estado' ? 'estado' : 'municipio',
          planos: [],
          total: 0
        };
      }
      map[key].planos.push(plano);
      map[key].total += mostrarEfetivadas ? valorEfetivado : (plano.valor_total || 0);
    });
    return Object.values(map).filter(e => e.planos.length > 0).sort((a, b) => b.total - a.total);
  }, [parl, ano, areaFiltro, mostrarEfetivadas]);

  // Carregar executores quando expandir um ente
  useEffect(() => {
    async function carregarExecutores() {
      if (!enteExp) return;
      const ente = entesAgregados.find(e => e.cnpj === enteExp);
      if (!ente || entesComExecutores[enteExp]) return;

      setLoadingEnte(enteExp);
      try {
        const enteCompleto = await fetchEnteCompleto(ente);
        setEntesComExecutores(prev => ({
          ...prev,
          [enteExp]: enteCompleto.planos
        }));
      } catch (error) {
        console.error('Erro ao carregar executores:', error);
      }
      setLoadingEnte(null);
    }
    carregarExecutores();
  }, [enteExp, entesAgregados, entesComExecutores]);

  return (
    <div className="space-y-5">
      <Card className="p-5">
        <BtnVoltar onClick={onVoltar} texto="Voltar à visão geral" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-sm">
              <Users className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">{parl.nome}</h2>
              <p className="text-slate-500 text-sm">{parl.planos.length} plano(s) de ação - {parl.entes.size || parl.entes?.length || 0} ente(s) beneficiados</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">{formatarMoeda(total)}</p>
            <p className="text-slate-500 mb-2">Total {mostrarEfetivadas ? 'Liberado' : 'Planejado'}</p>
            <button
              onClick={() => setMostrarEfetivadas(!mostrarEfetivadas)}
              className="flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors ml-auto"
            >
              {mostrarEfetivadas ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{mostrarEfetivadas ? 'Ver Planejado' : 'Ver Liberado'}</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Gráficos lado a lado */}
      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        {/* Gráfico por ano com filtro */}
        <div style={{ flex: '1 1 58%', minWidth: '340px' }}>
          <Card className="p-6 h-full">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-800">Repasses por Ano</h3>
                <TrendingUp className="w-5 h-5 text-indigo-500" />
              </div>
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setAno(null)}
                  className={'px-3 py-1.5 text-sm rounded-lg font-medium transition-all ' + (!ano ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                >
                  Todos
                </button>
                {anosD.map(a => (
                  <button
                    key={a}
                    onClick={() => setAno(a)}
                    className={'px-3 py-1.5 text-sm rounded-lg font-medium transition-all ' + (ano === a ? 'bg-indigo-500 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200')}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              {anosD.map(a => {
                const v = mostrarEfetivadas ? (parl.anosEfetivados?.[a] || 0) : parl.anos[a];
                const p = maxAno > 0 ? (v / maxAno) * 100 : 0;
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
                              background: sel ? 'linear-gradient(90deg, #6366f1, #8b5cf6)' : '#94a3b8'
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
                  className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
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
                          isSelected ? 'bg-indigo-50 ring-2 ring-indigo-500' : 'hover:bg-slate-50'
                        }`}
                      >
                        <div className={'w-2.5 h-2.5 rounded-full flex-shrink-0 ' + (cores[i]?.bg || 'bg-slate-400')} />
                        <span className={`text-xs flex-1 truncate ${isSelected ? 'text-indigo-700 font-medium' : 'text-slate-600'}`}>
                          {f}
                        </span>
                        <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700' : 'text-slate-800'}`}>
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

      {/* Lista de Entes beneficiados - expansível para executores */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Entes Beneficiados</h3>
              <p className="text-sm text-slate-500">
                {entesAgregados.length} ente(s) encontrado(s)
                {areaFiltro && ` em ${areaFiltro}`}
              </p>
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-100">
          {entesAgregados.map((ente) => (
            <div key={ente.cnpj}>
              <div
                onClick={() => setEnteExp(enteExp === ente.cnpj ? null : ente.cnpj)}
                className="p-4 hover:bg-indigo-50/30 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className={'p-2.5 rounded-xl shadow-sm ' + (ente.tipo === 'estado' ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-teal-500 to-cyan-600')}>
                    {ente.tipo === 'estado'
                      ? <Landmark className="w-4 h-4 text-teal-400" />
                      : <Building className="w-4 h-4 text-white" />
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-800 text-sm">{ente.nome}</p>
                    <p className="text-xs text-slate-500">{ente.planos.length} plano(s)</p>
                  </div>
                  <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(ente.total)}</p>
                  <ChevronDown className={'w-5 h-5 text-slate-400 transition-transform ' + (enteExp === ente.cnpj ? 'rotate-180' : '')} />
                </div>
              </div>
              {/* Lista de executores expandida */}
              {enteExp === ente.cnpj && (
                <div className="bg-slate-50 border-t border-slate-100">
                  {loadingEnte === ente.cnpj ? (
                    <div className="p-4">
                      <Loading />
                    </div>
                  ) : (
                    (() => {
                      let execsList = (entesComExecutores[ente.cnpj] || ente.planos).flatMap(p =>
                        (p.executores || []).map(e => {
                          const valorPlanejado = (e.valor_custeio || 0) + (e.valor_investimento || 0);
                          const valorEfetivado = e.valor_efetivado || 0;
                          return {
                            ...e,
                            plano: p,
                            vT: mostrarEfetivadas ? valorEfetivado : valorPlanejado,
                            valorPlanejado,
                            valorEfetivado
                          };
                        })
                      );
                      // Quando mostrarEfetivadas, filtrar apenas executores com valor > 0
                      if (mostrarEfetivadas) {
                        execsList = execsList.filter(e => e.vT > 0);
                      }
                      return execsList.sort((a, b) => b.vT - a.vT).map((ex, i) => {
                        const sit = getSituacaoTrabalho(ex.situacao_plano_trabalho);
                        return (
                          <div
                            key={ex.id + '-' + i}
                            onClick={() => onExec(ex)}
                            className="p-4 hover:bg-indigo-100/50 cursor-pointer border-b border-slate-100 last:border-0 ml-8 group"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 bg-white rounded-lg shadow-sm">
                                <Building2 className="w-4 h-4 text-teal-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-slate-800 text-sm">{ex.nome}</p>
                                <p className="text-xs text-slate-600 line-clamp-1">{ex.objeto}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                  <span className={'text-xs px-2 py-0.5 rounded-full ' + sit.bg + ' ' + sit.cor}>{sit.label}</span>
                                  {ex.plano.area_politica && (
                                    <span className="text-xs text-indigo-600">{ex.plano.area_politica}</span>
                                  )}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(ex.vT)}</p>
                                <p className="text-xs text-slate-500">{mostrarEfetivadas ? 'Liberado' : 'Planejado'}</p>
                              </div>
                              <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1" />
                            </div>
                          </div>
                        );
                      });
                    })()
                  )}
                  {!loadingEnte && (!entesComExecutores[ente.cnpj] || entesComExecutores[ente.cnpj].every(p => !p.executores?.length)) && (
                    <div className="p-4 ml-8 text-sm text-slate-500">
                      Carregando executores...
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
