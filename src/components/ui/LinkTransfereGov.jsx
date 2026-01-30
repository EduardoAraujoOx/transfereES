import { ExternalLink } from 'lucide-react';
import { buildUrlTransfereGov } from '../../utils/helpers';

export default function LinkTransfereGov({ codigo }) {
  return (
    <a
      href={buildUrlTransfereGov(codigo)}
      target="_blank"
      rel="noopener noreferrer"
      className="block w-full"
    >
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 hover:opacity-90 transition-all rounded-2xl p-5 text-center">
        <div className="flex items-center justify-center gap-2 text-white">
          <ExternalLink className="w-5 h-5" />
          <span className="font-semibold">Consultar no TransfereGov</span>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Relatórios de gestão, documentos e histórico completo
        </p>
      </div>
    </a>
  );
}
