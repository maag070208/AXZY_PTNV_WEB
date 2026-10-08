import type { ReactNode } from "react";

export interface TabBarItem<T extends string> {
  id: T;
  label: string;
  icon?: ReactNode;
  count?: number;
  /** Punto ámbar: hay cambios sin guardar en esa pestaña. */
  dot?: boolean;
}

interface Props<T extends string> {
  items: readonly TabBarItem<T>[];
  value: T;
  onChange: (id: T) => void;
  /** `sm` para pestañas internas (detalle de un rol, visor). */
  size?: "md" | "sm";
}

/** Pestañas compactas con subrayado, en la línea de las tablas del sistema. */
export default function TabBar<T extends string>({ items, value, onChange, size = "md" }: Props<T>) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map((item) => {
        const active = item.id === value;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onChange(item.id)}
            className={`-mb-px flex shrink-0 items-center gap-1.5 border-b-2 !bg-transparent font-bold transition ${
              size === "sm" ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-[12px]"
            } ${
              active
                ? "border-[#0D5777] text-[#0D5777]"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700"
            }`}
          >
            {item.icon}
            {item.label}
            {item.count !== undefined && (
              <span
                className={`rounded-full px-1.5 text-[10px] tabular-nums ${
                  active ? "bg-[#0D5777]/10 text-[#0D5777]" : "bg-slate-100 text-slate-500"
                }`}
              >
                {item.count}
              </span>
            )}
            {item.dot && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
          </button>
        );
      })}
    </div>
  );
}
