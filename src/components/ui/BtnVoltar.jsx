import { ArrowLeft } from 'lucide-react';

export default function BtnVoltar({ onClick, texto }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors mb-4"
    >
      <ArrowLeft className="w-4 h-4" />
      <span className="text-sm font-medium">{texto}</span>
    </button>
  );
}
