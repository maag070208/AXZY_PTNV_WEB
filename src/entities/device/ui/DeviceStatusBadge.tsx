import { ITBadget, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { Device } from "../model/types";

interface DeviceStatusBadgeProps {
  estado: Device["estado"];
  loteCount?: { disponible: number; asignado: number; baja: number };
  size?: "small" | "medium";
}

/**
 * Única fuente de verdad de cómo se pinta el estado de un dispositivo
 * (badge simple o desglose por lote). Antes esta lógica estaba duplicada
 * inline dentro de la columna "ESTADO" de DevicesListPage.
 */
export default function DeviceStatusBadge({ estado, loteCount, size = "small" }: DeviceStatusBadgeProps) {
  const { t } = useTranslation("device");

  if (loteCount) {
    return (
      <ITFlex gap={1} wrap="wrap">
        {loteCount.disponible > 0 && (
          <ITBadget color="success" size={size}>
            {t("status.loteAvailable", { count: loteCount.disponible })}
          </ITBadget>
        )}
        {loteCount.asignado > 0 && (
          <ITBadget color="warning" size={size}>
            {t("status.loteAssigned", { count: loteCount.asignado })}
          </ITBadget>
        )}
        {loteCount.baja > 0 && (
          <ITBadget color="gray" size={size}>
            {t("status.loteDecommissioned", { count: loteCount.baja })}
          </ITBadget>
        )}
      </ITFlex>
    );
  }

  const color = estado === "DISPONIBLE" ? "success" : estado === "ASIGNADO" ? "warning" : "gray";
  return (
    <ITBadget color={color} size={size}>
      {t(`status.${estado}`)}
    </ITBadget>
  );
}
