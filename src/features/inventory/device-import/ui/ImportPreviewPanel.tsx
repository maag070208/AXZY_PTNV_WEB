import { useMemo } from "react";
import { ITAlert, ITBadget, ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaLayerGroup, FaListOl, FaPlus, FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type {
  DeviceImportPreviewRow,
  DeviceImportRowError,
  DeviceImportRowWarning,
} from "@entities/inventory";
import type { UseDeviceImport } from "../model/useDeviceImport";

/** Color del UI kit para cada estado de la fila. */
type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

/**
 * Estado de un renglón, como texto ordenable: el prefijo numérico hace que el
 * orden del filtro sea el útil (primero las que se pueden cargar, luego las que
 * hay que revisar y al final las que no entran).
 */
const statusOf = (row: DeviceImportPreviewRow): string =>
  row.errors.length > 0 ? "3" : row.warnings.length > 0 ? "2" : "1";

/**
 * Paso 2: exactamente lo que va a pasar, fila por fila.
 *
 * Es el paso que protege al inventario: la tabla dice si cada renglón crea un
 * dispositivo o le suma unidades a uno existente, con qué tipo y qué folios de
 * activo fijo va a consumir. Mientras haya filas con error, confirmar está
 * bloqueado (la API tampoco cargaría nada).
 */
export default function ImportPreviewPanel({ fx }: { fx: UseDeviceImport }) {
  const { t } = useTranslation("inventory");
  const preview = fx.preview;
  const summary = preview?.summary;

  const request = useMemo(() => {
    const rows = preview?.rows ?? [];
    return makeClientTableFetch<DeviceImportPreviewRow>(async () => rows, {
      row: { value: (r) => r.row },
      resolvedTypeName: { value: (r) => r.resolvedTypeName },
      name: { value: (r) => [r.name, r.brand, r.model] },
      quantity: { value: (r) => r.quantity },
      action: { value: (r) => t(`import.action${r.action === "CREATE" ? "Create" : "Add"}`) },
      assetTagFrom: { value: (r) => (r.assetTagTo ? `${r.assetTagFrom} — ${r.assetTagTo}` : "") },
      status: { value: (r) => statusOf(r) },
    });
  }, [preview, t]);

  /** "1: Lista", "2: Revisar" o "3: Error" — el orden lo da el texto. */
  const badge = (text: string, color: BadgeColor) => (
    <ITBadget color={color} size="sm">
      {text}
    </ITBadget>
  );

  const columns: any[] = [
    {
      type: "number",
      key: "row",
      label: t("import.thRow"),
      width: 70,
      filter: true,
      render: (row: DeviceImportPreviewRow) => (
        <ITText className="!text-[11px] font-bold tabular-nums text-slate-500">{row.row}</ITText>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("import.thDevice"),
      width: 280,
      filter: true,
      render: (row: DeviceImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="!text-[11px] font-bold text-slate-800">
            {row.name || t("devices.empty")}
          </ITText>
          <ITText className="!text-[10px] text-slate-400">
            {row.brand} · {row.model}
          </ITText>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "resolvedTypeName",
      label: t("import.thType"),
      width: 220,
      filter: true,
      render: (row: DeviceImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          <ITFlex align="center" gap={1} wrap="wrap">
            {badge(row.resolvedTypeName, row.typeUnknown ? "warning" : "gray")}
            {row.typeUnknown && (
              <ITText className="!text-[10px] text-amber-600">
                {t("import.unknownType", { type: row.typeName })}
              </ITText>
            )}
          </ITFlex>
          {row.mergedRows.length > 0 && (
            <ITText className="!text-[10px] text-slate-400">
              {t("import.mergedWith", { row: row.mergedRows[0] })}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "number",
      key: "quantity",
      label: t("import.thQuantity"),
      width: 110,
      render: (row: DeviceImportPreviewRow) => (
        <ITText className="!text-[11px] font-bold tabular-nums text-slate-800">{row.quantity}</ITText>
      ),
    },
    {
      type: "string",
      key: "action",
      label: t("import.thAction"),
      width: 150,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: t("import.actionCreate"), name: t("import.actionCreate") },
          { id: t("import.actionAdd"), name: t("import.actionAdd") },
        ],
        loading: false,
        error: false,
      },
      render: (row: DeviceImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          {badge(
            t(`import.action${row.action === "CREATE" ? "Create" : "Add"}`),
            row.action === "CREATE" ? "info" : "gray"
          )}
          {row.action === "ADD_UNITS" && (
            <ITText className="!text-[10px] text-slate-400">
              {t("import.currentUnits", { count: row.currentUnits })}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "assetTagFrom",
      label: t("import.thAssetTags"),
      width: 200,
      render: (row: DeviceImportPreviewRow) =>
        row.assetTagFrom ? (
          <ITText className="!text-[11px] font-semibold tabular-nums text-slate-600">
            {row.assetTagFrom} — {row.assetTagTo}
          </ITText>
        ) : (
          <ITText className="!text-[11px] text-slate-300">—</ITText>
        ),
    },
    {
      type: "string",
      key: "status",
      label: t("import.thStatus"),
      width: 220,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "1", name: t("import.statusReady") },
          { id: "2", name: t("import.statusWarning") },
          { id: "3", name: t("import.statusError") },
        ],
        loading: false,
        error: false,
      },
      render: (row: DeviceImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          {row.errors.length > 0
            ? badge(t("import.statusError"), "danger")
            : row.warnings.length > 0
              ? badge(t("import.statusWarning"), "warning")
              : badge(t("import.statusReady"), "success")}
          {row.errors.map((error) => (
            <ITText key={error} className="!text-[10px] text-rose-600">
              {t(`import.error${error}` as `import.error${DeviceImportRowError}`)}
            </ITText>
          ))}
          {row.warnings.map((warning) => (
            <ITText key={warning} className="!text-[10px] text-amber-600">
              {t(`import.warning${warning}` as `import.warning${DeviceImportRowWarning}`)}
            </ITText>
          ))}
        </ITFlex>
      ),
    },
  ];

  if (!preview || !summary) return null;

  return (
    <ITFlex direction="column" gap={5}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <div className="grid gap-3 sm:!grid-cols-2 lg:!grid-cols-5">
        <KpiTile label={t("import.statRows")} value={summary.rows} icon={<FaListOl size={16} />} tone="sky" />
        <KpiTile label={t("import.statValid")} value={summary.valid} icon={<FaCheckCircle size={16} />} tone="emerald" />
        <KpiTile
          label={t("import.statInvalid")}
          value={summary.invalid}
          icon={<FaTimesCircle size={16} />}
          tone={summary.invalid > 0 ? "rose" : "neutral"}
          hint={summary.invalid > 0 ? t("import.statusError") : undefined}
        />
        <KpiTile label={t("import.statUnits")} value={summary.units} icon={<FaLayerGroup size={16} />} tone="orange" />
        <KpiTile
          label={t("import.statNew")}
          value={summary.newDevices}
          icon={<FaPlus size={16} />}
          tone="violet"
          hint={t("import.statExisting") + `: ${summary.existingDevices}`}
        />
      </div>

      {summary.invalid > 0 && (
        <ITAlert variant="error">{t("import.invalidBanner", { count: summary.invalid })}</ITAlert>
      )}
      {summary.invalid === 0 && summary.genericRows > 0 && (
        <ITAlert variant="warning">{t("import.genericBanner", { count: summary.genericRows })}</ITAlert>
      )}
      {summary.invalid === 0 && summary.typesToCreate.length > 0 && (
        <ITAlert variant="info">{t("import.createGenericBanner")}</ITAlert>
      )}
      {summary.invalid === 0 && summary.existingDevices > 0 && (
        <ITAlert variant="warning">
          {t("import.existingBanner", { count: summary.existingDevices })}
        </ITAlert>
      )}

      <PanelCard
        title={t("import.previewTitle")}
        description={t("import.previewDescription")}
        actions={
          <>
            <ITButton variant="outlined" color="secondary" onClick={fx.reset} disabled={fx.confirming}>
              <ITText className="!text-[11px] font-bold">{t("import.uploadAnother")}</ITText>
            </ITButton>
            <ITButton
              variant="filled"
              color="primary"
              disabled={fx.hasErrors || fx.confirming || summary.valid === 0}
              onClick={() => void fx.confirm()}
            >
              <ITFlex align="center" gap={1}>
                <FaBoxOpen size={11} />
                <ITText className="!text-[11px] font-bold">
                  {fx.confirming
                    ? t("import.confirming")
                    : t("import.confirm", { count: summary.valid })}
                </ITText>
              </ITFlex>
            </ITButton>
          </>
        }
      >
        <ITDataTable
          columns={columns}
          fetchData={request as any}
          defaultItemsPerPage={50}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          virtualized
          virtualizedMaxHeight={420}
          rowHeight={56}
        />
      </PanelCard>
    </ITFlex>
  );
}
