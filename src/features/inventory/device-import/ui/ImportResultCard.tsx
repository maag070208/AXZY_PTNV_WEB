import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBoxOpen, FaCheckCircle, FaLayerGroup, FaRedo, FaTruckLoading } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseDeviceImport } from "../model/useDeviceImport";

interface Props {
  fx: UseDeviceImport;
  onGoToDevices: () => void;
  onGoToMovements: () => void;
}

/**
 * Paso 3: qué quedó registrado.
 *
 * Si la petición ya se había registrado (doble clic, reintento de red) la API
 * devuelve el mismo movimiento y aquí se dice explícitamente que no se duplicó
 * nada: es la confirmación de que el inventario no se movió dos veces.
 */
export default function ImportResultCard({ fx, onGoToDevices, onGoToMovements }: Props) {
  const { t } = useTranslation("inventory");
  const result = fx.result;
  if (!result) return null;

  return (
    <PanelCard
      title={t("import.resultTitle")}
      description={t("import.resultSubtitle", { id: result.movementId.slice(0, 8) })}
      actions={
        <>
          <ITButton variant="outlined" color="secondary" onClick={fx.reset}>
            <ITFlex align="center" gap={1}>
              <FaRedo size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.uploadAnother")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" color="primary" onClick={onGoToDevices}>
            <ITFlex align="center" gap={1}>
              <FaBoxOpen size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.goDevices")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={onGoToMovements}>
            <ITFlex align="center" gap={1}>
              <FaTruckLoading size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.goMovements")}</ITText>
              <FaArrowRight size={9} />
            </ITFlex>
          </ITButton>
        </>
      }
    >
      {result.repeated && (
        <ITAlert variant="info">{t("import.resultRepeated")}</ITAlert>
      )}

      <div className="mt-1 grid gap-3 sm:!grid-cols-3">
        <KpiTile
          label={t("import.statNew")}
          value={result.devicesCreated}
          icon={<FaCheckCircle size={16} />}
          tone="emerald"
          hint={t("import.resultCreated", { count: result.devicesCreated })}
        />
        <KpiTile
          label={t("import.statExisting")}
          value={result.devicesReused}
          icon={<FaBoxOpen size={16} />}
          tone="sky"
          hint={t("import.resultReused", { count: result.devicesReused })}
        />
        <KpiTile
          label={t("import.statUnits")}
          value={result.unitsCreated}
          icon={<FaLayerGroup size={16} />}
          tone="orange"
          hint={t("import.resultUnits", { count: result.unitsCreated })}
        />
      </div>

      <ITText className="mt-4 block !text-[11px] text-slate-500">{t("import.resultHint")}</ITText>
    </PanelCard>
  );
}
