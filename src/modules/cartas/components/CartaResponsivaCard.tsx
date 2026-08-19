import { ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaTrash } from "react-icons/fa";
import type { CartaResponsiva } from "@core/store/cartas/types";
import { formatFecha } from "@core/store/cartas/types";

interface Props {
  row: CartaResponsiva;
  onView: (id: string) => void;
  onDelete: (id: string) => void;
}

interface RowProps {
  label: string;
  value: string;
  highlight?: boolean;
  uppercase?: boolean;
}

function DocRow({ label, value, highlight, uppercase }: RowProps) {
  return (
    <ITFlex align="baseline" gap={2} className="py-1.5 border-b border-dashed border-slate-200 last:border-0">
      <ITText className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-[88px] flex-shrink-0">
        {label}
      </ITText>
      <ITText
        className={`text-[12px] flex-1 min-w-0 truncate ${
          highlight ? "font-black text-slate-900" : "font-semibold text-slate-700"
        } ${uppercase ? "uppercase" : ""}`}
      >
        {value}
      </ITText>
    </ITFlex>
  );
}

export default function CartaResponsivaCard({ row, onView, onDelete }: Props) {
  const item = row.items[0];
  const num = row.consecutivo.replace("F-MMTO-", "");
  const empresa = row.empresa?.trim() || "Puerto Nuevo Hotel y Villas";

  return (
    <ITCard className="border border-slate-200 shadow-sm hover:shadow-lg hover:border-emerald-300 transition-all overflow-hidden">
      <ITFlex
        justify="between"
        align="center"
        gap={2}
        className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
      >
        <ITFlex align="center" gap={2}>
          <ITText className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80">
            Folio
          </ITText>
          <ITText className="text-[14px] font-black tracking-tight">
            F-MMTO-{num}
          </ITText>
        </ITFlex>
        <ITText className="text-[9px] font-bold uppercase tracking-widest opacity-90 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-sm">
          {row.departamento.replace(/^Departamento de /i, "")}
        </ITText>
      </ITFlex>

      <ITFlex
        direction="column"
        className="px-4 py-3 cursor-pointer active:scale-[0.995] transition-transform"
        onClick={() => onView(row.id)}
      >
        <DocRow label="Fecha" value={formatFecha(row.fecha)} />
        <DocRow label="No. empleado" value={row.numeroEmpleado || "—"} highlight />
        <DocRow label="Empresa" value={empresa} uppercase />

        <ITFlex direction="column" className="mt-3 pt-3 border-t-2 border-slate-200">
          <ITFlex justify="between" align="center" className="mb-2">
            <ITText className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
              Recurso TIC
            </ITText>
            <FaArrowRight
              size={12}
              className="text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all"
            />
          </ITFlex>
          <DocRow label="Descripción" value={item?.descripcion || "—"} highlight uppercase />
          <DocRow label="Marca" value={item?.marca || "—"} uppercase />
          <DocRow label="Modelo" value={item?.modelo || "—"} uppercase />
          <DocRow label="No. serie" value={item?.numeroSerie || "—"} />
          <DocRow label="Equipo" value={item?.nombreEquipo || "—"} />
          <DocRow label="Activo" value={item?.controlActivos || "—"} highlight />
          <DocRow label="Área" value={item?.area || "—"} uppercase />
        </ITFlex>
      </ITFlex>

      <ITFlex
        justify="between"
        align="center"
        gap={2}
        className="px-3 py-2 border-t border-slate-200 bg-slate-50/70"
      >
        <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
          Carta responsiva
        </ITText>
        <ITButton
          variant="outlined"
          size="small"
          color="danger"
          onClick={() => onDelete(row.id)}
          title="Eliminar"
        >
          <ITFlex align="center" gap={1}>
            <FaTrash size={11} />
            <ITText className="font-bold text-[11px]">Eliminar</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
    </ITCard>
  );
}