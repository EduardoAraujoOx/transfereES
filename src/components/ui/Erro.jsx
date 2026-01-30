import { AlertCircle } from 'lucide-react';

export default function Erro({ mensagem, onRetry }) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
      <h3 className="font-semibold text-red-800 mb-2">Ops! Algo deu errado</h3>
      <p className="text-sm text-red-600 mb-4">{mensagem}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Tentar novamente
        </button>
      )}
    </div>
  );
}
