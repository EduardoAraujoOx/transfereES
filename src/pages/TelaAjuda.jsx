import { BookOpen, X, Info, Banknote, MapPin, Target, TrendingUp, Scale, HelpCircle } from 'lucide-react';

export default function TelaAjuda({ onClose }) {
  const gradTeal = "bg-gradient-to-br from-teal-500 to-cyan-600";
  
  const fluxoEtapas = [
    { n: 1, t: "Indicação da Emenda", d: "Parlamentar indica recursos do orçamento federal para um ente público específico." },
    { n: 2, t: "Plano de Ação", d: "A indicação se torna um Plano de Ação no sistema TransfereGov. O ente beneficiário deve dar ciência (aceite formal)." },
    { n: 3, t: "Plano de Trabalho", d: "O ente cadastra os Planos de Trabalho, detalhando executores, objetos, metas, valores e cronograma." },
    { n: 4, t: "Análise e Aprovação", d: "Os Ministérios setoriais analisam os planos. Após aprovação, o recurso é liberado." },
    { n: 5, t: "Execução", d: "O dinheiro é depositado em conta específica e o executor contrata e realiza as ações previstas." },
    { n: 6, t: "Prestação de Contas", d: "O executor registra os Relatórios de Gestão no TransfereGov, comprovando a aplicação dos recursos." },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-slate-800 to-cyan-900 p-5 rounded-t-2xl flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-lg font-bold text-white">Como funcionam as Transferências Especiais?</h2>
              <p className="text-xs text-slate-300">Guia completo para o cidadão</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {/* O que são */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Info className="w-5 h-5 text-teal-600" />O que são as Transferências Especiais?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              As Transferências Especiais foram criadas pela <strong>Emenda Constitucional nº 105/2019</strong> e regulamentadas pela <strong>Lei nº 14.943/2024</strong>. Elas permitem que parlamentares federais (deputados e senadores) indiquem recursos do orçamento da União diretamente para estados e municípios executarem políticas públicas, <strong>sem necessidade de convênio ou contrato de repasse</strong>.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              Os recursos pertencem ao ente beneficiário (estado ou município) desde a publicação da programação orçamentária, devendo ser aplicados em programações finalísticas das áreas de competência constitucional.
            </p>
          </div>

          {/* De onde vem o dinheiro */}
          <div className="bg-teal-50 rounded-xl p-4 border border-teal-100">
            <h3 className="text-base font-bold text-teal-800 mb-2 flex items-center gap-2">
              <Banknote className="w-5 h-5" />De onde vem esse dinheiro?
            </h3>
            <p className="text-sm text-teal-700">
              Os recursos vêm do <strong>Orçamento Geral da União</strong>, através das chamadas <strong>emendas parlamentares individuais e de bancada</strong>. Cada parlamentar pode indicar uma parcela do orçamento para projetos de seu interesse, que serão executados por estados e municípios.
            </p>
          </div>

          {/* Quem pode receber */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-teal-600" />Quem pode receber esses recursos?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-700">Estados e DF</p>
                <p className="text-xs text-slate-500">Governos estaduais e suas secretarias</p>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <p className="text-sm font-semibold text-slate-700">Municípios</p>
                <p className="text-xs text-slate-500">Prefeituras e órgãos municipais</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              Dentro de cada ente, os <strong>Executores</strong> são os órgãos ou entidades responsáveis pela aplicação efetiva dos recursos (secretarias, autarquias, fundações públicas).
            </p>
          </div>

          {/* Como pode ser usado */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-600" />Como o dinheiro pode ser usado?
            </h3>
            <p className="text-sm text-slate-600 mb-3">
              Os recursos devem ser aplicados em <strong>programações finalísticas</strong>, ou seja, ações que entregam bens ou serviços diretamente à população, divididos em:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-100">
                <p className="text-sm font-semibold text-emerald-700">Investimento</p>
                <p className="text-xs text-emerald-600">Obras, aquisição de equipamentos, veículos, construções (bens permanentes)</p>
              </div>
              <div className="bg-amber-50 rounded-lg p-3 border border-amber-100">
                <p className="text-sm font-semibold text-amber-700">Custeio</p>
                <p className="text-xs text-amber-600">Manutenção, materiais de consumo, serviços, folha temporária</p>
              </div>
            </div>
            <p className="text-sm text-slate-600 mt-3">
              <strong>Áreas comuns:</strong> Saúde, Educação, Assistência Social, Infraestrutura Urbana, Agricultura, Esporte, Cultura, Segurança, entre outras.
            </p>
          </div>

          {/* Fluxo */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-teal-600" />Fluxo das Transferências
            </h3>
            <div className="space-y-3">
              {fluxoEtapas.map((e, i) => (
                <div key={e.n} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 ${gradTeal} rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0`}>
                      {e.n}
                    </div>
                    {i < 5 && <div className="w-0.5 flex-1 bg-teal-200 my-1" />}
                  </div>
                  <div className="flex-1 pb-1">
                    <p className="font-semibold text-slate-800 text-sm">{e.t}</p>
                    <p className="text-xs text-slate-600">{e.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparência */}
          <div className="bg-slate-800 rounded-xl p-4 text-white">
            <h3 className="text-base font-bold mb-2 flex items-center gap-2">
              <Scale className="w-5 h-5 text-teal-400" />Obrigações de Transparência
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Conforme a <strong>Lei nº 14.943/2024</strong>, os entes beneficiários devem:
            </p>
            <ul className="text-sm text-slate-300 mt-2 space-y-1 list-disc list-inside">
              <li>Manter os dados atualizados no sistema TransfereGov</li>
              <li>Publicar relatórios de gestão com a aplicação dos recursos</li>
              <li>Disponibilizar informações em seus portais de transparência</li>
              <li>Prestar contas aos órgãos de controle (TCU, CGU, TCE)</li>
            </ul>
          </div>

          {/* Sobre o Portal */}
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-teal-600" />Sobre este Portal
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              O <strong>TransfereES</strong> é um portal desenvolvido pela SEFAZ-ES para facilitar o acesso do cidadão às informações sobre as transferências especiais recebidas pelo Estado do Espírito Santo e seus municípios.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed mt-2">
              <strong>Informações disponíveis:</strong> valores transferidos, parlamentares autores das emendas, entes e executores beneficiados, objetos de execução, metas físicas e financeiras, situação dos planos e dados bancários.
            </p>
          </div>

          {/* Como navegar */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <h3 className="text-base font-bold text-slate-800 mb-3">Como navegar neste portal?</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-semibold text-teal-700 mb-1">Por Ente Beneficiário</p>
                <p className="text-xs text-slate-600">Escolha um estado ou município - veja os projetos por executor - acesse os detalhes completos de cada projeto.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-indigo-700 mb-1">Por Parlamentar</p>
                <p className="text-xs text-slate-600">Escolha um parlamentar - veja os entes beneficiados - selecione um executor - acesse os detalhes do projeto.</p>
              </div>
            </div>
          </div>

          {/* Mais informações */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2">Onde buscar mais informações?</h3>
            <div className="flex flex-wrap gap-2">
              <a href="https://www.transferegov.sistema.gov.br" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-teal-100 text-teal-700 rounded-full hover:bg-teal-200 transition-colors">TransfereGov (Portal Federal)</a>
              <a href="https://www.planalto.gov.br/ccivil_03/constituicao/emendas/emc/emc105.htm" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors">EC 105/2019</a>
              <a href="https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/lei/L14943.htm" target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full hover:bg-slate-200 transition-colors">Lei 14.943/2024</a>
            </div>
          </div>

          <button onClick={onClose} className={`w-full py-3 ${gradTeal} text-white font-medium rounded-xl mt-2`}>
            Entendi, começar a navegar
          </button>
        </div>
      </div>
    </div>
  );
}
