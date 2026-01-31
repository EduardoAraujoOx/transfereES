import { useState, useEffect } from 'react';
import { Building2, Target, Landmark, CreditCard, BadgeCheck, Hourglass, ToggleLeft, ToggleRight } from 'lucide-react';
import Card from '../components/ui/Card';
import { BtnVoltar, Linha, Secao, LinkTransfereGov, Loading } from '../components/ui';
import { formatarMoeda, formatarMoedaCompacta, formatarNumero } from '../utils/formatters';
import { getSituacaoPlano, getSituacaoTrabalho, getStatusRecurso, getSituacaoConta } from '../utils/helpers';
import { fetchMetasExecutor } from '../services/api';

export default function PaginaExecutor({ exec, ente, somenteEfetivadas, onVoltar }) {
  const [metas, setMetas] = useState(exec.metas || []);
  const [loadingMetas, setLoadingMetas] = useState(false);
  const [mostrarEfetivadas, setMostrarEfetivadas] = useState(somenteEfetivadas);

  useEffect(() => {
    async function carregarMetas() {
      if (exec.metas && exec.metas.length > 0) return;
      setLoadingMetas(true);
      try {
        const metasCarregadas = await fetchMetasExecutor(exec.plano.id, exec.id);
        setMetas(metasCarregadas);
      } catch (error) {
        console.error('Erro ao carregar metas:', error);
      }
      setLoadingMetas(false);
    }
    carregarMetas();
  }, [exec]);

  const sitT = getSituacaoTrabalho(exec.situacao_plano_trabalho);
  const sitP = getSituacaoPlano(exec.plano.situacao);
  const rec = getStatusRecurso(exec.plano.recurso_recebido);
  const RecIc = rec.icone === 'BadgeCheck' ? BadgeCheck : Hourglass;
  const valorPlanejado = (exec.valor_custeio || 0) + (exec.valor_investimento || 0);
  const valorLiberado = exec.valor_efetivado || 0;
  const vT = mostrarEfetivadas ? valorLiberado : valorPlanejado;

  return (
    <div className="space-y-5">
      <BtnVoltar onClick={onVoltar} texto={'Voltar para ' + (ente?.nome || 'ente')} />
      
      {/* BLOCO 1: QUEM RECEBE - Header verde do executor */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-teal-500 to-cyan-600 p-5">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl">
              <Building2 className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-teal-100 text-xs mb-1">EXECUTOR</p>
              <h1 className="text-xl font-bold text-white mb-1">{exec.nome}</h1>
              <p className="text-teal-100 text-sm font-mono">{exec.cnpj}</p>
            </div>
          </div>
        </div>
        
        {/* BLOCO 2: QUEM ENVIA E SITUACAO */}
        <div className="p-5 border-b border-slate-100">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">EMENDA E SITUACAO</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Linha label="Emenda" valor={exec.plano.numero_emenda + ' - ' + exec.plano.parlamentar} />
              <Linha label="No Plano de Acao" valor={exec.plano.codigo} mono />
              <Linha label="No Plano de Trabalho" valor={exec.numero_plano_trabalho} mono />
            </div>
            <div>
              <Linha 
                label="Situacao Plano de Acao" 
                valor={<span className={'text-xs px-2 py-1 rounded-full ' + sitP.bg + ' ' + sitP.cor}>{sitP.label}</span>} 
              />
              <Linha 
                label="Situacao Plano de Trabalho" 
                valor={<span className={'text-xs px-2 py-1 rounded-full ' + sitT.bg + ' ' + sitT.cor}>{sitT.label}</span>} 
              />
              <Linha 
                label="Recurso" 
                valor={
                  <span className={'text-xs px-2 py-1 rounded-full flex items-center gap-1 inline-flex ' + rec.bg + ' ' + rec.cor}>
                    <RecIc className="w-3 h-3" />{rec.label}
                  </span>
                } 
              />
            </div>
          </div>
        </div>

        {/* BLOCO 3: COMO SERA APLICADO - Objeto e Detalhamento */}
        <div className="p-5">
          <h3 className="text-sm font-semibold text-slate-500 mb-3">APLICACAO DO RECURSO</h3>
          <div className="bg-slate-50 rounded-xl p-4 mb-4">
            <p className="text-xs text-slate-500 mb-1">OBJETO DE EXECUCAO</p>
            <p className="text-lg font-semibold text-slate-800">{exec.objeto}</p>
            {exec.detalhamento_objeto && exec.detalhamento_objeto !== exec.objeto && (
              <p className="text-sm text-slate-600 mt-2">{exec.detalhamento_objeto}</p>
            )}
          </div>
          
          {/* Toggle Liberado/Planejado */}
          <div className="flex items-center justify-end mb-3">
            <button
              onClick={() => setMostrarEfetivadas(!mostrarEfetivadas)}
              className="flex items-center gap-1.5 text-xs text-teal-600 hover:text-teal-700 font-medium transition-colors"
            >
              {mostrarEfetivadas ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
              <span>{mostrarEfetivadas ? 'Ver Planejado' : 'Ver Liberado'}</span>
            </button>
          </div>

          {/* Valores discriminados */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
              <p className="text-xs text-emerald-600">Valor Planejado</p>
              <p className={'text-xl font-bold ' + (!mostrarEfetivadas ? 'text-emerald-700' : 'text-emerald-600/60')}>{formatarMoedaCompacta(valorPlanejado)}</p>
            </div>
            <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
              <p className="text-xs text-teal-600">Valor Liberado</p>
              <p className={'text-xl font-bold ' + (mostrarEfetivadas ? 'text-teal-700' : 'text-teal-600/60')}>{formatarMoedaCompacta(valorLiberado)}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Custeio</p>
              <p className="text-xl font-bold text-slate-700">{formatarMoedaCompacta(exec.valor_custeio)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs text-slate-500">Investimento</p>
              <p className="text-xl font-bold text-slate-700">{formatarMoedaCompacta(exec.valor_investimento)}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* BLOCO 4: METAS */}
      {loadingMetas ? (
        <Card className="p-5">
          <Loading />
        </Card>
      ) : metas.length > 0 && (
        <Card className="overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-amber-50 to-white">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Target className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800">Metas do Projeto</h3>
                <p className="text-sm text-slate-500">{metas.length} meta(s) cadastrada(s)</p>
              </div>
            </div>
          </div>
          <div className="divide-y divide-slate-100">
            {metas.map((meta) => (
              <div key={meta.id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-bold text-amber-700">{meta.sequencial}</span>
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-slate-800 text-sm">{meta.nome}</p>
                    <p className="text-xs text-slate-600 mt-1">{meta.descricao}</p>
                    <div className="flex flex-wrap gap-3 mt-3">
                      <div className="bg-slate-100 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-slate-500">Quantidade</p>
                        <p className="text-sm font-semibold text-slate-800">{formatarNumero(meta.quantidade)} {meta.unidade_medida}</p>
                      </div>
                      <div className="bg-emerald-50 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-emerald-600">Valor Emenda</p>
                        <p className="text-sm font-semibold text-emerald-700">
                          {formatarMoedaCompacta((meta.valor_custeio_emenda || 0) + (meta.valor_investimento_emenda || 0))}
                        </p>
                      </div>
                      <div className="bg-slate-50 rounded-lg px-3 py-1.5">
                        <p className="text-xs text-slate-500">Prazo</p>
                        <p className="text-sm font-semibold text-slate-700">{meta.prazo_meses} meses</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Secoes colapsaveis */}
      <Secao titulo="Ente Beneficiario" icone={Landmark}>
        <div className="pt-3">
          <Linha label="Nome" valor={ente?.nome} />
          <Linha label="CNPJ" valor={ente?.cnpj} mono />
          <Linha label="Area da Politica" valor={exec.plano.area_politica} />
        </div>
      </Secao>
      
      {exec.banco && (
        <Secao titulo="Dados Bancarios do Executor" icone={CreditCard}>
          <div className="pt-3">
            <Linha label="Banco" valor={exec.banco} />
            <Linha label="Agencia" valor={exec.agencia} mono />
            <Linha label="Conta" valor={exec.conta} mono />
            <Linha 
              label="Status" 
              valor={
                <span className={'text-xs px-2 py-1 rounded ' + getSituacaoConta(exec.situacao_conta).bg + ' ' + getSituacaoConta(exec.situacao_conta).cor}>
                  {exec.situacao_conta}
                </span>
              } 
            />
          </div>
        </Secao>
      )}

      <LinkTransfereGov codigo={exec.plano.codigo} />
    </div>
  );
}
