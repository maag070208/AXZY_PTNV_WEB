import { ITBadget, ITFlex, ITGrid, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaLayerGroup } from "react-icons/fa";
import { Link } from "react-router-dom";
import { formatFechaHora } from "@shared/utils/dates";
import { dyn } from "@shared/i18n";
import type { Device } from "@entities/device";
import { formatLocation } from "@entities/location";
import type { DeviceFieldKey } from "@entities/device-type";
import { ESTADO_BADGE, FIELD_LABELS } from "../model/constants";
import { useTranslation } from "react-i18next";

interface Props {
  device: Device;
}

export default function DeviceInfoCard({ device }: Props) {
  const { t: tt } = useTranslation(["device"]);
  const configuredFields = (
    Object.keys(FIELD_LABELS) as DeviceFieldKey[]
  ).filter(
    (field) =>
      device.type?.fieldConfig?.[field]?.enabled &&
      field !== "numeroSerie" &&
      field !== "nombreEquipo"
  );

  return (
    <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8">
      <ITStack direction="column" spacing={5} className="w-full">
        <ITFlex gap={2} wrap="wrap">
          <ITBadget
            color={ESTADO_BADGE[device.estado]?.color as any ?? "default"}
            size="small"
          >
            {dyn(tt)(`status.labels.${device.estado}`)}
          </ITBadget>
          {device.type && (
            <ITBadget color="primary" size="small">
              {device.type.name}
            </ITBadget>
          )}
          {!!device.loteSize && device.loteSize > 1 && device.loteId && (
            <Link
              to={`/dispositivos/lotes/${device.loteId}/editar`}
              className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-700 hover:underline"
              title={tt("device:actions.editLote")}
            >
              <FaLayerGroup size={11} />
              Lote ×{device.loteSize}
            </Link>
          )}
        </ITFlex>

        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={3}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("form.controlActivos")}
              </ITText>
              <ITText className="text-[13px] font-black text-slate-800">
                {device.controlActivos}
              </ITText>
            </ITStack>
          </ITGrid>
          {device.type?.fieldConfig?.numeroSerie?.enabled && (
            <ITGrid item xs={12} md={3}>
              <ITStack direction="column" spacing={1}>
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {tt("form.brandModel")}
                </ITText>
                <ITText className="text-[13px] font-bold text-slate-700">
                  {device.marca} {device.modelo}
                </ITText>
              </ITStack>
            </ITGrid>
          )}
          <ITGrid item xs={12} md={3}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("form.serialNo")}
              </ITText>
              <ITText className="text-[13px] font-bold text-slate-700">
                {device.numeroSerie ?? "—"}
              </ITText>
            </ITStack>
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("form.area")}
              </ITText>
              <ITText className="text-[13px] font-bold text-slate-700">
                {device.area}
              </ITText>
            </ITStack>
          </ITGrid>
          {device.location && (
            <ITGrid item xs={12} md={3}>
              <ITStack direction="column" spacing={1}>
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {tt("form.location")}
                </ITText>
                <ITText className="text-[13px] font-bold text-slate-700">
                  {formatLocation(device.location)}
                </ITText>
              </ITStack>
            </ITGrid>
          )}
        </ITGrid>

        {configuredFields.length > 0 && (
          <ITGrid container columns={12} spacing={4} className="mt-2">
            {configuredFields.map((field) => (
              <ITGrid item xs={12} md={3} key={field}>
                <ITStack direction="column" spacing={1}>
                  {FIELD_LABELS[field] && (
                  <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                    {dyn(tt)(FIELD_LABELS[field])}
                  </ITText>
                )}
                  <ITText className="text-[12px] font-bold text-slate-700">
                    {device[field] ?? "—"}
                  </ITText>
                </ITStack>
              </ITGrid>
            ))}
          </ITGrid>
        )}

        {device.type?.fieldConfig?.nombreEquipo?.enabled &&
          device.nombreEquipo && (
            <ITStack direction="column" spacing={1}>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {tt("form.equipmentName")}
              </ITText>
              <ITText className="text-[12px] font-bold text-slate-700">
                {device.nombreEquipo}
              </ITText>
            </ITStack>
          )}

        <ITStack direction="column" spacing={1}>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {tt("form.registered")}
          </ITText>
          <ITText className="text-[11px] text-slate-500">
            {formatFechaHora(device.createdAt)}
          </ITText>
        </ITStack>
      </ITStack>
    </ITFlex>
  );
}