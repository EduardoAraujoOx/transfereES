import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Card from './Card';

export default function Secao({ titulo, icone: Icone, children, aberto = false }) {
  const [expandido, setExpandido] = useState(aberto);

  return (
    <Card className="overflow-hidden mb-3">
      <button
        onClick={() => setExpandido(!expandido)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-slate-100 rounded-lg">
            <Icone className="w-4 h-4 text-slate-500" />
          </div>
          <span className="text-sm font-medium text-slate-700">{titulo}</span>
        </div>
        {expandido ? (
          <ChevronUp className="w-4 h-4 text-slate-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400" />
        )}
      </button>
      {expandido && (
        <div className="px-4 pb-4 border-t border-slate-100">
          {children}
        </div>
      )}
    </Card>
  );
}
