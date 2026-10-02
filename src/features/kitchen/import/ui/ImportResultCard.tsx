import { ITAlert, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaBoxOpen, FaCheckCircle, FaEquals, FaLayerGroup, FaPlus, FaRedo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseKitchenImport } from "../model/useKitchenImport";

interface Props {
  fx: UseKitchenImport;
  onGoToItems: () => void;
  onGoToMovements: () => void;
}

/** Cantidad con hasta 3 decimales, sin ceros de relleno. */
const quantity = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * Paso 3: qué quedó registrado.
 *
 * Si la petición ya se había registrado (doble clic, reintento de red) la API
 * devuelve el mismo movimiento y aquí se dice explícitamente que no se cargó dos
 * veces: es la confirmación de que la bodega no se movió dos veces.
 */
export default function ImportResultCard({ fx, onGoToItems, onGoToMovements }: Props) {
  const { t } = useTranslation("kitchen");
  const result = fx.result;
  if (!result) return null;

  return (
    <PanelCard
      title={t("import.resultTitle")}
      description={
        result.movementId
          ? t("import.resultSubtitle", { id: result.movementId.slice(0, 8) })
          : t("import.resultSubtitleNoMovement")
      }
      actions={
        <>
          <ITButton variant="outlined" color="secondary" onClick={fx.reset}>
            <ITFlex align="center" gap={1}>
              <FaRedo size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.uploadAnother")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="outlined" color="primary" onClick={onGoToItems}>
            <ITFlex align="center" gap={1}>
              <FaBoxOpen size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.goItems")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={onGoToMovements}>
            <ITFlex align="center" gap={1}>
              <FaLayerGroup size={11} />
              <ITText className="!text-[11px] font-bold">{t("import.goMovements")}</ITText>
              <FaArrowRight size={9} />
            </ITFlex>
          </ITButton>
        </>
      }
    >
      {result.repeated && <ITAlert variant="info">{t("import.resultRepeated")}</ITAlert>}

      <div className="mt-1 grid gap-3 sm:!grid-cols-2 lg:!grid-cols-4">
        <KpiTile
          label={t("import.statNew")}
          value={result.itemsCreated}
          icon={<FaCheckCircle size={16} />}
          tone="emerald"
          hint={t("import.resultCreated", { count: result.itemsCreated })}
        />
        <KpiTile
          label={t("import.statExisting")}
          value={result.itemsReused}
          icon={<FaBoxOpen size={16} />}
          tone="sky"
          hint={t("import.resultReused", { count: result.itemsReused })}
        />
        <KpiTile
          label={t("import.statIn")}
          value={quantity(result.quantityIn)}
          icon={<FaPlus size={16} />}
          tone="orange"
          hint={t("import.resultLots", { count: result.lotsCreated })}
        />
        <KpiTile
          label={t("import.statOut")}
          value={quantity(result.quantityOut)}
          icon={<FaEquals size={16} />}
          tone={result.quantityOut > 0 ? "amber" : "neutral"}
          hint={t("import.resultAdjusted", { count: result.quantityOut })}
        />
      </div>

      <ITText className="mt-4 block !text-[11px] text-slate-500">
        {t("import.resultHint", {
          categories: result.categoriesCreated,
          units: result.unitsCreated,
        })}
      </ITText>
    </PanelCard>
  );
}
