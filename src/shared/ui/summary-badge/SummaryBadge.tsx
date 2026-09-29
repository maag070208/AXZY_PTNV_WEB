/** Etiqueta compacta con valor ("Productos: 3") para encabezados y resúmenes. */
export default function SummaryBadge({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5">
      <span className="text-[11px] font-medium text-slate-500">{label}:</span>
      <span className="text-xs font-bold text-slate-800">{value}</span>
    </div>
  );
}
