import {
  ITBadget,
  ITCard,
  ITFlex,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { DeviceStatusBadge, type DeviceAvailabilityGroup } from "@entities/device";
import { formatFecha } from "@shared/utils/dates";

interface Props {
  groups: DeviceAvailabilityGroup[];
}

/**
 * Kardex de disponibilidad: equipos agrupados por tipo, cada uno con estado y,
 * si está prestado, la carta vigente (a quién y desde cuándo).
 */
export default function DeviceAvailabilityView({ groups }: Props) {
  const { t } = useTranslation("device");

  if (groups.length === 0) {
    return (
      <ITText className="text-[12px] font-bold text-slate-400">
        {t("availability.empty")}
      </ITText>
    );
  }

  return (
    <ITStack direction="column" spacing={3}>
      {groups.map((group) => (
        <ITCard
          key={group.typeId}
          className="border border-slate-200 overflow-hidden shadow-sm"
        >
          <ITFlex
            justify="between"
            align="center"
            gap={2}
            className="px-4 py-2.5 bg-slate-50 border-b border-slate-200"
          >
            <ITFlex align="center" gap={2}>
              <ITText className="font-black text-slate-800 text-[13px] uppercase tracking-tight">
                {group.name}
              </ITText>
              {group.code ? (
                <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {group.code}
                </ITText>
              ) : null}
            </ITFlex>
            <ITFlex gap={1} wrap="wrap">
              <ITBadget color="gray" size="sm">
                {t("availability.total", { count: group.total })}
              </ITBadget>
              <ITBadget color="success" size="sm">
                {t("availability.available", { count: group.disponible })}
              </ITBadget>
              <ITBadget color="warning" size="sm">
                {t("availability.assigned", { count: group.asignado })}
              </ITBadget>
            </ITFlex>
          </ITFlex>

          <ITStack direction="column" spacing={0}>
            {group.devices.map((dev) => {
              const carta = dev.carta;
              const asignadoA =
                carta?.responsable || carta?.lugar || carta?.departamento || "—";
              return (
                <ITFlex
                  key={dev.id}
                  justify="between"
                  align="center"
                  gap={2}
                  className="px-4 py-2 border-b border-slate-100 last:border-0 hover:bg-slate-50/70"
                >
                  <ITFlex direction="column" gap={0.5} className="min-w-0 flex-1">
                    <ITFlex align="center" gap={2} className="min-w-0">
                      <ITText className="font-black text-emerald-700 text-[12px] whitespace-nowrap">
                        {dev.controlActivos}
                      </ITText>
                      <ITText className="text-[11px] font-semibold text-slate-600 truncate">
                        {dev.descripcion}{" "}
                        <span className="text-[10px] font-bold text-slate-400">
                          {dev.marca} {dev.modelo}
                        </span>
                      </ITText>
                    </ITFlex>
                    {dev.estado === "ASIGNADO" && carta ? (
                      <ITText className="text-[10px] font-bold text-amber-700 uppercase tracking-wide">
                        {t("availability.loanedTo", {
                          folio: carta.consecutive,
                          who: asignadoA,
                          date: formatFecha(carta.fecha),
                        })}
                      </ITText>
                    ) : dev.ubicacion ? (
                      <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                        {t("availability.locatedAt", { place: dev.ubicacion })}
                      </ITText>
                    ) : null}
                  </ITFlex>
                  <DeviceStatusBadge estado={dev.estado} />
                </ITFlex>
              );
            })}
          </ITStack>
        </ITCard>
      ))}
    </ITStack>
  );
}