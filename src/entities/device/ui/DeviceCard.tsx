import { ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Device } from "../model/types";

interface DeviceCardProps {
  device: Device;
  onClick?: (id: string) => void;
}

export default function DeviceCard({ device, onClick }: DeviceCardProps) {
  const { t } = useTranslation("device");

  const colorEstado =
    device.estado === "DISPONIBLE"
      ? "bg-emerald-500"
      : device.estado === "ASIGNADO"
      ? "bg-amber-500"
      : "bg-slate-400";

  return (
    <ITCard
      className="border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 active:scale-[0.99] transition-all overflow-hidden"
      onClick={() => onClick?.(device.id)}
    >
      <ITFlex align="stretch">
        <ITFlex
          direction="column"
          align="center"
          justify="center"
          className="bg-slate-50 px-3 py-3 min-w-[88px] border-r border-slate-100"
        >
          <ITText className="text-[8px] font-black uppercase tracking-widest text-slate-500">
            {device.type?.code || "?"}
          </ITText>
          <ITText className="text-[11px] font-black tracking-tight text-slate-800">
            {device.controlActivos}
          </ITText>
        </ITFlex>

        <ITFlex
          align="center"
          justify="between"
          gap={3}
          className="flex-1 min-w-0 px-4 py-3"
        >
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="text-[13px] font-black text-slate-800 truncate">
              {device.descripcion}
            </ITText>
            <ITText className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              {device.marca} {device.modelo}
            </ITText>
            <ITFlex align="center" gap={1} className="mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${colorEstado}`} />
              <ITText className="text-[9px] font-black uppercase tracking-widest text-slate-500">
                {t(`status.${device.estado}`)}
              </ITText>
              {!!device.loteSize && device.loteSize > 1 && (
                <ITText className="text-[9px] font-black uppercase tracking-widest text-emerald-600">
                  · {t("status.loteBadge", { count: device.loteSize })}
                </ITText>
              )}
            </ITFlex>
          </ITFlex>
          <FaArrowRight size={14} className="text-slate-300 flex-shrink-0" />
        </ITFlex>
      </ITFlex>
    </ITCard>
  );
}
