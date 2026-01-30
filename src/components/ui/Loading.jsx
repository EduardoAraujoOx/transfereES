export default function Loading() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500" />
        <p className="text-slate-500 text-sm">Carregando dados...</p>
      </div>
    </div>
  );
}
