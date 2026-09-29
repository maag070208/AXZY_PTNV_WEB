/**
 * Barra de existencia contra mínimo y máximo: el relleno es lo disponible y la
 * línea vertical marca el mínimo (ámbar si está por debajo, verde si no).
 */
export default function StockBar({ available, min, max }: { available: number; min: number; max: number | null }) {
  const top = Math.max(max ?? min * 2, available, 1);
  const low = available < min;
  return (
    <div className="relative h-2 w-full rounded-full bg-slate-100">
      <div className={`h-2 rounded-full ${low ? "bg-amber-400" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (available / top) * 100)}%` }} />
      <div className="absolute top-[-2px] h-3 w-[2px] rounded bg-slate-500" style={{ left: `${Math.min(100, (min / top) * 100)}%` }} />
    </div>
  );
}
