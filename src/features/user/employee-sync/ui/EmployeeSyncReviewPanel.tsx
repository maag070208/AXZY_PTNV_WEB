import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaFileExcel } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { TabBar, type TabBarItem } from "@shared/ui/tab-bar";
import type { EmployeeSyncTab, UseEmployeeSync } from "../model/useEmployeeSync";
import AltasTab from "./AltasTab";
import BajasTab from "./BajasTab";
import CambiosTab from "./CambiosTab";
import PendingTab from "./PendingTab";

/**
 * Paso 2: revisar exactamente lo que va a pasar, sin escribir nada todavía.
 *
 * La barra de acciones queda PEGADA ARRIBA (regla del dueño): archivo, hoja,
 * número de empleados y resumen de lo seleccionado a la izquierda; subir otro
 * archivo y confirmar a la derecha. Debajo, los conteos, los avisos y la tabla
 * de la pestaña vigente con sus filtros y orden.
 */
export default function EmployeeSyncReviewPanel({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  const preview = fx.preview;
  if (!preview) return null;

  const { counts, selection } = fx;

  const tabs: TabBarItem<EmployeeSyncTab>[] = [
    { id: "altas", label: t("sync.tabs.altas"), count: fx.altas.length },
    { id: "bajas", label: t("sync.tabs.bajas"), count: preview.bajas.length },
    { id: "cambios", label: t("sync.tabs.cambios"), count: preview.cambios.length },
    { id: "porResolver", label: t("sync.tabs.porResolver"), count: fx.pendingRows.length },
  ];

  const summary =
    selection.updated > 0
      ? t("sync.confirm.summaryChanges", {
          created: selection.created,
          deactivated: selection.deactivated,
          updated: selection.updated,
        })
      : t("sync.confirm.summary", {
          created: selection.created,
          deactivated: selection.deactivated,
        });

  const submit = () => void fx.confirm();

  return (
    <ITFlex direction="column" gap={4}>
      {/* Barra de acciones pegada arriba: archivo, resumen y confirmar. */}
      <ITCard className="bento-rise sticky top-2 z-20" contentClassName="!px-4 !py-3">
        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITFlex align="center" gap={2} className="min-w-0">
            <ITText
              as="span"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-success-soft)] text-[color:color-mix(in_srgb,var(--color-success)_70%,black)]"
            >
              <FaFileExcel size={13} />
            </ITText>
            <ITFlex direction="column" gap={0.5} className="min-w-0">
              <ITFlex align="center" gap={2} wrap="wrap">
                <ITText className="truncate !text-[13px] font-black text-slate-800">
                  {fx.file?.name ?? "—"}
                </ITText>
                <ITText muted className="!text-[11px]">
                  {t("sync.review.employees", { count: preview.file.employees })}
                </ITText>
                <ITBadget color="gray" size="sm">
                  {t("sync.review.sheet", { sheet: preview.file.sheet })}
                </ITBadget>
              </ITFlex>
              <ITText
                className={`!text-[11.5px] ${
                  selection.total === 0 ? "text-amber-600" : "text-slate-600"
                }`}
              >
                {selection.total === 0 ? t("sync.confirm.nothing") : summary}
              </ITText>
            </ITFlex>
          </ITFlex>

          <ITFlex align="center" gap={2} wrap="wrap" className="shrink-0">
            <ITButton variant="outlined" color="secondary" disabled={fx.confirming} onClick={fx.reset}>
              <ITText className="!text-[11px] font-bold">{t("sync.confirm.uploadAnother")}</ITText>
            </ITButton>
            {fx.canEdit && (
              <ITButton variant="filled" color="primary" disabled={!fx.canConfirm} onClick={submit}>
                <ITFlex align="center" gap={1}>
                  <FaCheck size={11} />
                  <ITText className="!text-[11px] font-bold">
                    {fx.confirming ? t("sync.confirm.confirming") : t("sync.confirm.button")}
                  </ITText>
                </ITFlex>
              </ITButton>
            )}
          </ITFlex>
        </ITFlex>
      </ITCard>

      {/* Conteos del archivo. */}
      <ITGrid container columns={10} spacing={3}>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.stats.altas")}
            value={counts?.altas ?? 0}
            tone={counts?.altas ? "emerald" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.stats.bajas")}
            value={counts?.bajas ?? 0}
            tone={counts?.bajas ? "amber" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.stats.coinciden")}
            value={counts?.coinciden ?? 0}
            tone={counts?.coinciden ? "sky" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.stats.cambios")}
            value={counts?.cambios ?? 0}
            tone={counts?.cambios ? "violet" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.stats.porResolver")}
            value={counts?.porResolver ?? 0}
            tone={counts?.porResolver ? "rose" : "neutral"}
          />
        </ITGrid>
      </ITGrid>

      {/* Avisos, separados del contenido. */}
      {(fx.pendingRows.length > 0 || fx.altasIncomplete || fx.rowErrors.length > 0) && (
        <ITFlex direction="column" gap={2}>
          {fx.pendingRows.length > 0 && (
            <ITAlert variant="warning">
              {t("sync.pending.banner", { count: fx.pendingRows.length })}
            </ITAlert>
          )}
          {fx.altasIncomplete && <ITAlert variant="warning">{t("sync.altas.incomplete")}</ITAlert>}
          {fx.rowErrors.length > 0 && (
            <ITAlert variant="error" dismissible onDismiss={fx.clearRowErrors}>
              {t("sync.confirm.invalidRows", { count: fx.rowErrors.length })}
            </ITAlert>
          )}
        </ITFlex>
      )}

      {/* Contenido: pestañas con conteos y tabla de revisión. */}
      <PanelCard title={t("sync.review.title")} description={t("sync.review.description")}>
        <ITFlex direction="column" gap={4}>
          <TabBar items={tabs} value={fx.step2Tab} onChange={fx.setStep2Tab} />
          {fx.step2Tab === "altas" && <AltasTab fx={fx} />}
          {fx.step2Tab === "bajas" && <BajasTab fx={fx} />}
          {fx.step2Tab === "cambios" && <CambiosTab fx={fx} />}
          {fx.step2Tab === "porResolver" && <PendingTab fx={fx} />}
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
