import { ITBadget, ITCard, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaMapMarkerAlt } from "react-icons/fa";
import { formatFechaHora } from "@shared/utils/dates";
import { formatLocation } from "@entities/location";
import { CONDICION_COLORS, TIPO_COLORS, TIPO_ICONS } from "@entities/inventory-movement";
import type { UseInventoryMovements } from "../model/useInventoryMovements";

export default function MovementsTimeline({ fx }: { fx: UseInventoryMovements }) {
  const { movements, t } = fx;

  if (movements.length === 0) {
    return (
      <ITCard className="p-8 text-center">
        <FaMapMarkerAlt size={40} className="mx-auto text-slate-300 mb-3" />
        <ITText className="text-slate-500 text-sm">
          {t("movements.noMovements")}
        </ITText>
      </ITCard>
    );
  }

  return (
    <div className="space-y-0">
      {movements.map((m, idx) => {
        const isLast = idx === movements.length - 1;
        return (
          <div key={m.id} className="flex gap-3 relative">
            <div className="flex flex-col items-center w-8 shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center ${TIPO_COLORS[m.tipo]} text-white z-10 ring-2 ring-white`}
              >
                {TIPO_ICONS[m.tipo]}
              </div>
              {!isLast && <div className="w-px flex-1 bg-slate-200" />}
            </div>

            <div className={`pb-6 flex-1 min-w-0 ${isLast ? "pb-0" : ""}`}>
              <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                <ITFlex align="center" justify="between" className="mb-2">
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITBadget
                      color={
                        m.tipo === "ENTRADA"
                          ? "success"
                          : m.tipo === "SALIDA"
                          ? "warning"
                          : m.tipo === "BAJA"
                          ? "danger"
                          : "info"
                      }
                      size="sm"
                    >
                      {t(`typeLabels.${m.tipo}`)}
                    </ITBadget>
                    {m.condicion && (
                      <ITBadget
                        color={CONDICION_COLORS[m.condicion]}
                        size="sm"
                      >
                        {t("movements.condition", {
                          label: t(`conditionLabels.${m.condicion}`),
                        })}
                      </ITBadget>
                    )}
                    {m.motivoBaja && (
                      <ITText className="text-[10px] text-red-500">
                        {m.motivoBaja}
                      </ITText>
                    )}
                    <ITText className="text-[11px] font-bold text-slate-700">
                      {m.device?.controlActivos ?? "—"}
                    </ITText>
                    <ITText className="text-[10px] text-slate-400">
                      {m.device?.descripcion}
                    </ITText>
                  </ITFlex>
                  <ITText className="text-[9px] text-slate-400">
                    {formatFechaHora(m.createdAt)}
                  </ITText>
                </ITFlex>

                <ITStack direction="row" spacing={4}>
                  <ITFlex align="center" gap={1}>
                    <FaMapMarkerAlt size={10} className="text-slate-400" />
                    <ITText className="text-[10px] text-slate-500">
                      {m.location ? formatLocation(m.location) : "—"}
                    </ITText>
                  </ITFlex>
                  <ITText className="text-[9px] text-slate-400">
                    {t("movements.by", { name: m.user?.name ?? "—" })}
                  </ITText>
                </ITStack>

                {m.notas && (
                  <ITText className="text-[10px] text-slate-500 italic mt-2 block">
                    "{m.notas}"
                  </ITText>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}