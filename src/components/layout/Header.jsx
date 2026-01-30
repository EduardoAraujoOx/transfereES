import { HelpCircle } from 'lucide-react';

export default function Header({ onAjuda }) {
  return (
    <header className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-900 to-cyan-900" />
      <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-teal-500/20 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/4" />
      <div className="relative max-w-5xl mx-auto px-4 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">ES</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">TransfereES</h1>
              <p className="text-sm text-slate-400">Portal de Transferências Especiais</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={onAjuda}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl border border-white/10 text-white text-sm"
            >
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Como funciona?</span>
            </button>
            <div className="text-right hidden sm:block">
              <p className="text-xs text-slate-400">Fonte: TransfereGov</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
