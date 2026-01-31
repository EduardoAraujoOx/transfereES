import { useState, useMemo, useEffect } from 'react';
import { TrendingUp, Building2, Users, Landmark, Building, ArrowRight, ChevronDown } from 'lucide-react';
import Card from '../components/ui/Card';
import { BtnVoltar, Loading } from '../components/ui';
import { formatarMoeda, formatarMoedaCompacta } from '../utils/formatters';
import { getSituacaoTrabalho } from '../utils/helpers';
import { fetchEnteCompleto } from '../services/api';

export default function PaginaParlamentar({ parl, anoInicial, onVoltar, onExec }) {
  const [ano, setAno] = useState(anoInicial || null);
  const [enteExp, setEnteExp] = useState(null);
  const [entesComExecutores, setEntesComExecutores] = useState({});
  const [loadingEnte, setLoadingEnte] = useState(null);

  const anosD = Object.keys(parl.anos).sort();
  const maxAno = Math.max(...Object.values(parl.anos));
  const total = parl.total;

  // Agregar entes e seus planos
  const entesAgregados = useMemo(() => {
    const map = {};
    parl.planos.forEach(plano => {
      const key = plano.cnpj_beneficiario;
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          cnpj: key,
          nome: plano.nome_beneficiario || 'Não informado',
          tipo: (plano.tipo_beneficiario || 'MUNICIPIO').toLowerCase() === 'estado' ? 'estado' : 'municipio',
          planos: [],
          total: 0
        };
      }
      if (!ano || plano.ano === parseInt(ano)) {
        map[key].planos.push(plano);
        map[key].total += plano.valor_total || 0;
      }
    });
    return Object.values(map).filter(e => e.planos.length > 0).sort((a, b) => b.total - a.total);
  }, [parl, ano]);

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
              <p className="text-slate-500 text-sm">{parl.planos.length} plano(s) de ação - {parl.entes.size} ente(s) beneficiados</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-slate-800">{formatarMoeda(total)}</p>
            <p className="text-slate-500">Total indicado</p>
          </div>
        </div>
      </Card>

      {/* Gráfico por ano com filtro */}
      <Card className="p-6">
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
            const v = parl.anos[a];
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

      {/* Lista de Entes beneficiados - expansível para executores */}
      <Card className="overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Building2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">Entes Beneficiados</h3>
              <p className="text-sm text-slate-500">Clique para ver os executores</p>
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
                    (entesComExecutores[ente.cnpj] || ente.planos).flatMap(p =>
                      (p.executores || []).map(e => ({
                        ...e,
                        plano: p,
                        vT: (e.valor_custeio || 0) + (e.valor_investimento || 0)
                      }))
                    ).map((ex, i) => {
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
                              <span className={'text-xs px-2 py-0.5 rounded-full mt-1 inline-block ' + sit.bg + ' ' + sit.cor}>{sit.label}</span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-slate-800 text-sm">{formatarMoedaCompacta(ex.vT)}</p>
                            </div>
                            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all mt-1" />
                          </div>
                        </div>
                      );
                    })
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
