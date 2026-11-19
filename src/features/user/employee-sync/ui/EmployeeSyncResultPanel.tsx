import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITTable,
  ITText,
  type Column,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaRedo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import type { EmployeeSyncResultRow, UseEmployeeSync } from "../model/useEmployeeSync";

/**
 * Paso 3: reporte final. Una fila por persona con lo que quedó en el sistema y
 * en los relojes. Las personas cuya alta/baja no entró en algún reloj pueden
 * reintentarse una por una; el reporte completo se descarga en Excel.
 */
export default function EmployeeSyncResultPanel({ fx }: { fx: UseEmployeeSync }) {
  const { t } = useTranslation("employees");
  const result = fx.result;
  if (!result) return null;

  const stateLabel = (row: EmployeeSyncResultRow) => {
    const state = fx.clockStateOf(row);
    if (state === null) {
      return (
        <ITText muted className="!text-[11px]">
          {t("sync.result.notApplicable")}
        </ITText>
      );
    }
    if (state === "ok") {
      return (
        <ITBadget color="success" size="sm">
          {t("sync.result.clockOk")}
        </ITBadget>
      );
    }
    if (state === "pending") {
      // El pendiente puede traer su motivo por reloj (p. ej. alta sin número:
      // `EMPLOYEE_NUMBER_REQUIRED`) para que RH sepa qué falta capturar.
      const pendingClocks = row.clock?.clocks.filter((clock) => !clock.ok) ?? [];
      return (
        <ITFlex direction="column" gap={0.5}>
          <ITBadget color="warning" size="sm">
            {t("sync.result.clockPending")}
          </ITBadget>
          {pendingClocks.map((clock) => (
            <ITText key={clock.serial} className="!text-[10px] leading-tight text-amber-600">
              {clock.name}: {clock.code ? fx.clockCodeLabel(clock.code) : t("sync.result.clockPending")}
            </ITText>
          ))}
        </ITFlex>
      );
    }
    const failedClocks = row.clock?.clocks.filter((clock) => !clock.ok) ?? [];
    return (
      <ITFlex direction="column" gap={0.5}>
        <ITBadget color="danger" size="sm">
          {t("sync.result.clockFailed")}
        </ITBadget>
        {failedClocks.map((clock) => (
          <ITText key={clock.serial} className="!text-[10px] leading-tight text-rose-600">
            {clock.name}: {clock.code ? fx.clockCodeLabel(clock.code) : t("sync.result.clockFailed")}
          </ITText>
        ))}
      </ITFlex>
    );
  };

  const scheduleNote = (row: EmployeeSyncResultRow) =>
    row.clock?.schedule && !row.clock.schedule.ok ? (
      <ITText className="!text-[10px] leading-tight text-amber-600">
        {t("sync.result.scheduleError", { error: row.clock.schedule.error ?? "" })}
      </ITText>
    ) : null;

  const columns: Column<EmployeeSyncResultRow>[] = [
    {
      type: "string",
      key: "name",
      label: t("sync.result.thPerson"),
      width: 280,
      render: (row) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="!text-[11.5px] font-semibold text-slate-800">{row.name}</ITText>
          <ITText muted className="!text-[10px]">
            {row.employeeNumber ? `#${row.employeeNumber} · ` : ""}
            {row.kind === "created"
              ? t("sync.result.excelCreated")
              : row.kind === "deactivated"
                ? t("sync.result.excelDeactivated")
                : t("sync.result.excelUpdated")}
          </ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "system",
      label: t("sync.result.thSystem"),
      width: 140,
      render: () => (
        <ITBadget color="success" size="sm">
          {t("sync.result.systemOk")}
        </ITBadget>
      ),
    },
    {
      type: "string",
      key: "clock",
      label: t("sync.result.thClock"),
      width: 280,
      render: (row) => (
        <ITFlex direction="column" gap={1}>
          {stateLabel(row)}
          {scheduleNote(row)}
        </ITFlex>
      ),
    },
    {
      type: "actions",
      key: "actions",
      label: t("sync.result.thActions"),
      width: 170,
      render: (row) => {
        const state = fx.clockStateOf(row);
        const canRetry = row.clockApplies && state !== "ok" && fx.canWriteClock;
        if (!canRetry) {
          return (
            <ITText muted className="!text-[11px]">
              —
            </ITText>
          );
        }
        const retrying = fx.retrying === row.userId;
        return (
          <ITButton
            variant="outlined"
            color="secondary"
            size="sm"
            disabled={retrying}
            onClick={() => void fx.retryClock(row.userId)}
          >
            <ITFlex align="center" gap={1}>
              <FaRedo size={10} />
              <ITText className="!text-[10.5px] font-bold">
                {retrying ? t("sync.result.retrying") : t("sync.result.retry")}
              </ITText>
            </ITFlex>
          </ITButton>
        );
      },
    },
  ];

  return (
    <ITFlex direction="column" gap={4}>
      {/* Barra de acciones pegada arriba: resumen y salidas del reporte. */}
      <ITCard className="bento-rise sticky top-2 z-20" contentClassName="!px-4 !py-3">
        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
          <ITFlex direction="column" gap={0.5} className="min-w-0">
            <ITText className="!text-[12.5px] font-semibold text-slate-800">
              {t("sync.result.summary", {
                created: result.system.created.length,
                deactivated: result.system.deactivated.length,
                updated: result.system.updated.length,
              })}
            </ITText>
            <ITText muted className="truncate !text-[11px]">
              {t("sync.review.file", { name: fx.file?.name ?? "—" })}
            </ITText>
          </ITFlex>
          <ITFlex align="center" gap={2} wrap="wrap" className="shrink-0">
            <ITButton variant="outlined" color="secondary" onClick={fx.reset}>
              <ITText className="!text-[11px] font-bold">{t("sync.result.uploadAnother")}</ITText>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              disabled={fx.exporting || fx.resultRows.length === 0}
              onClick={() => void fx.downloadReport()}
            >
              <ITFlex align="center" gap={1}>
                <FaDownload size={11} />
                <ITText className="!text-[11px] font-bold">
                  {fx.exporting ? t("sync.result.downloading") : t("sync.result.download")}
                </ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITCard>

      <ITGrid container columns={10} spacing={3}>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.result.created")}
            value={result.system.created.length}
            tone={result.system.created.length > 0 ? "emerald" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.result.deactivated")}
            value={result.system.deactivated.length}
            tone={result.system.deactivated.length > 0 ? "amber" : "neutral"}
          />
        </ITGrid>
        <ITGrid item xs={10} sm={5} lg={2}>
          <KpiTile
            size="sm"
            label={t("sync.result.updated")}
            value={result.system.updated.length}
            tone={result.system.updated.length > 0 ? "sky" : "neutral"}
          />
        </ITGrid>
      </ITGrid>

      {!result.clock.enabled && (
        <ITAlert variant="warning">{t("sync.result.clockDisabled")}</ITAlert>
      )}

      <PanelCard title={t("sync.result.title")} description={t("sync.result.description")}>
        {fx.resultRows.length === 0 ? (
          <ITText muted className="!text-[12px]">
            {t("sync.result.empty")}
          </ITText>
        ) : (
          <ITTable
            data={fx.resultRows as unknown as Record<string, unknown>[]}
            columns={columns as unknown as Column<Record<string, unknown>>[]}
            showViewToggle={false}
            size="sm"
            density="compact"
            layout="fixed"
            defaultItemsPerPage={25}
            itemsPerPageOptions={[25, 50, 100]}
          />
        )}
      </PanelCard>
    </ITFlex>
  );
}
