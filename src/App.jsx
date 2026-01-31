import { useState } from 'react';
import { Header, Footer } from './components/layout';
import { Loading, Erro } from './components/ui';
import { PaginaInicial, PaginaEnte, PaginaParlamentar, PaginaExecutor, TelaAjuda } from './pages';
import { useApi } from './hooks/useApi';
import { fetchDadosAgregados } from './services/api';

export default function App() {
  const [pag, setPag] = useState('inicial');
  const [ente, setEnte] = useState(null);
  const [parl, setParl] = useState(null);
  const [exec, setExec] = useState(null);
  const [ajuda, setAjuda] = useState(false);
  const [origem, setOrigem] = useState(null);
  const [anoFiltro, setAnoFiltro] = useState(null); // null = Todos
  const [areaFiltro, setAreaFiltro] = useState(null); // null = Todas
  const [somenteEfetivadas, setSomenteEfetivadas] = useState(true); // Inicia mostrando valores liberados

  const { data, loading, error, refetch } = useApi(fetchDadosAgregados, []);

  const irEnte = (e) => {
    setEnte(e);
    setOrigem('inicial');
    setPag('ente');
    window.scrollTo(0, 0);
  };

  const irParl = (p) => {
    setParl(p);
    setOrigem('inicial');
    setPag('parl');
    window.scrollTo(0, 0);
  };

  const irExec = (e) => {
    setExec(e);
    setPag('exec');
    window.scrollTo(0, 0);
  };

  const voltarIni = () => {
    setPag('inicial');
    setEnte(null);
    setParl(null);
    setExec(null);
    setOrigem(null);
    window.scrollTo(0, 0);
  };

  const voltarEnte = () => {
    setPag('ente');
    setExec(null);
    window.scrollTo(0, 0);
  };

  const voltarParl = () => {
    setPag('parl');
    setExec(null);
    window.scrollTo(0, 0);
  };

  const voltarExec = () => {
    if (origem === 'parl' || parl) {
      voltarParl();
    } else {
      voltarEnte();
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <Header onAjuda={() => setAjuda(true)} />
      {ajuda && <TelaAjuda onClose={() => setAjuda(false)} />}
      <main className="flex-1 max-w-5xl mx-auto px-4 py-6 w-full">
        {loading && <Loading />}
        {error && <Erro mensagem={error} onRetry={refetch} />}
        {!loading && !error && data && (
          <>
            {pag === 'inicial' && (
              <PaginaInicial
                dados={data}
                anoFiltro={anoFiltro}
                onAnoChange={setAnoFiltro}
                areaFiltro={areaFiltro}
                onAreaChange={setAreaFiltro}
                somenteEfetivadas={somenteEfetivadas}
                onEfetivadosChange={setSomenteEfetivadas}
                onEnte={irEnte}
                onParlamentar={irParl}
              />
            )}
            {pag === 'ente' && ente && (
              <PaginaEnte
                ente={ente}
                dados={data}
                anoInicial={anoFiltro}
                areaInicial={areaFiltro}
                somenteEfetivadas={somenteEfetivadas}
                onVoltar={voltarIni}
                onExec={irExec}
              />
            )}
            {pag === 'parl' && parl && (
              <PaginaParlamentar
                parl={parl}
                dados={data}
                anoInicial={anoFiltro}
                areaInicial={areaFiltro}
                somenteEfetivadas={somenteEfetivadas}
                onVoltar={voltarIni}
                onExec={(e) => { setOrigem('parl'); irExec(e); }}
              />
            )}
            {pag === 'exec' && exec && (
              <PaginaExecutor
                exec={exec}
                ente={ente || (data.municipios.find(m => m.cnpj === exec.plano?.cnpj_beneficiario) || data.estado)}
                somenteEfetivadas={somenteEfetivadas}
                onVoltar={voltarExec}
              />
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
