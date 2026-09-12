import { ITBadget, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaLayerGroup } from "react-icons/fa";
import { Link } from "react-router-dom";
import type { Device } from "@entities/device";

interface Props {
  device: Device;
  loteDevices: Device[];
  loteLoading: boolean;
}

export default function DeviceLoteSection({ device, loteDevices, loteLoading }: Props) {
  return (
    <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
      <ITStack direction="column" spacing={4} className="w-full">
        <ITFlex align="center" justify="between" gap={2} wrap="wrap">
          <ITFlex align="center" gap={2}>
            <FaLayerGroup size={14} className="text-emerald-600" />
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              Lote — {loteDevices.length} unidades
            </ITText>
          </ITFlex>
          <Link
            to={`/dispositivos/${device.id}/editar`}
            className="inline-flex items-center gap-1 text-[11px] font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg px-3 py-1.5 transition-colors"
            title="Editar todo el lote"
          >
            Editar lote completo
          </Link>
        </ITFlex>

        {loteLoading ? (
          <ITText className="text-[12px] text-slate-400 italic">
            Cargando unidades del lote…
          </ITText>
        ) : loteDevices.length === 0 ? (
          <ITText className="text-[12px] text-slate-400 italic">
            Sin unidades por mostrar
          </ITText>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {loteDevices.map((ld) => (
              <Link
                key={ld.id}
                to={`/dispositivos/${ld.id}`}
                className={`rounded-xl border p-3 transition-colors ${
                  ld.id === device.id
                    ? "border-emerald-300 bg-emerald-50/50"
                    : "border-slate-100 bg-slate-50/60 hover:border-slate-200 hover:bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-black text-slate-800">
                    {ld.controlActivos}
                  </span>
                  <ITBadget
                    color={
                      ld.estado === "DISPONIBLE"
                        ? "success"
                        : ld.estado === "ASIGNADO"
                        ? "warning"
                        : "gray"
                    }
                    size="small"
                  >
                    {ld.estado}
                  </ITBadget>
                </div>
                {ld.nombreEquipo && (
                  <div className="text-[10px] font-bold text-slate-500">
                    {ld.nombreEquipo}
                  </div>
                )}
                {ld.numeroSerie && (
                  <div className="text-[9px] text-slate-400">
                    Serie: {ld.numeroSerie}
                  </div>
                )}
                {ld.id === device.id && (
                  <div className="text-[9px] font-black text-emerald-700 mt-1">
                    Este equipo
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </ITStack>
    </ITFlex>
  );
}