import { useMemo } from "react";
import { ITAlert, ITBadget, ITButton, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaEquals, FaListOl, FaPlus, FaTimesCircle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { makeClientTableFetch } from "@shared/api/clientTable";
import type {
  KitchenImportAction,
  KitchenImportPreviewRow,
  KitchenImportRowError,
  KitchenImportRowWarning,
  KitchenImportStrategy,
} from "@entities/kitchen";
import type { UseKitchenImport } from "../model/useKitchenImport";

/** Color del UI kit para cada estado de la fila. */
type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

/** Clave i18n de cada acción (el tipo es la fuente: no hay texto suelto). */
const ACTION_KEY = {
  CREATE: "actionCreate",
  ADD: "actionAdd",
  SET_UP: "actionSetUp",
  SET_DOWN: "actionSetDown",
  SET_SAME: "actionSetSame",
  NO_STOCK: "actionNoStock",
} as const satisfies Record<KitchenImportAction, string>;

/** Clave de traducción de una acción, ya como literal (para el `t` tipado). */
const actionKey = (action: KitchenImportAction): `import.${(typeof ACTION_KEY)[KitchenImportAction]}` =>
  `import.${ACTION_KEY[action]}`;

const ACTION_COLOR: Record<KitchenImportAction, BadgeColor> = {
  CREATE: "info",
  ADD: "success",
  SET_UP: "info",
  SET_DOWN: "warning",
  SET_SAME: "gray",
  NO_STOCK: "gray",
};

/**
 * Estado de un renglón, como texto ordenable: el prefijo numérico hace que el
 * orden del filtro sea el útil (primero las que se pueden cargar, luego las que
 * hay que revisar y al final las que no entran).
 */
const statusOf = (row: KitchenImportPreviewRow): string =>
  row.errors.length > 0 ? "3" : row.warnings.length > 0 ? "2" : "1";

/** Cantidad con hasta 3 decimales, sin ceros de relleno. */
const quantity = (value: number): string => String(Math.round(value * 1000) / 1000);

/**
 * Paso 2: exactamente lo que va a pasar, fila por fila.
 *
 * Es el paso que protege la bodega: la tabla dice si cada renglón crea el
 * artículo, le suma existencia (con su lote y caducidad) o le ajusta el saldo a
 * lo que dice el archivo, y con qué categoría y unidad queda. Mientras haya
 * filas con error, confirmar está bloqueado (la API tampoco cargaría nada).
 *
 * Cuando el archivo trae artículos que ya existen, aquí se elige qué hacer con
 * ellos —sumar o poner esa cantidad— y la previsualización se vuelve a resolver
 * para que lo revisado sea exactamente lo que se ejecuta.
 */
export default function ImportPreviewPanel({ fx }: { fx: UseKitchenImport }) {
  const { t } = useTranslation("kitchen");
  const preview = fx.preview;
  const summary = preview?.summary;

  const request = useMemo(() => {
    const rows = preview?.rows ?? [];
    return makeClientTableFetch<KitchenImportPreviewRow>(async () => rows, {
      row: { value: (r) => r.row },
      name: { value: (r) => [r.name, r.code] },
      catalog: { value: (r) => [r.categoryName, r.unitName] },
      quantity: { value: (r) => r.quantity },
      resulting: { value: (r) => r.resultingStock ?? 0 },
      action: { value: (r) => t(actionKey(r.action)) },
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
      render: (row: KitchenImportPreviewRow) => (
        <ITText className="!text-[11px] font-bold tabular-nums text-slate-500">{row.row}</ITText>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("import.thItem"),
      width: 280,
      filter: true,
      render: (row: KitchenImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="!text-[11px] font-bold text-slate-800">
            {row.name || t("items.empty")}
          </ITText>
          <ITFlex align="center" gap={1}>
            <ITText className="!text-[10px] text-slate-400">{row.code}</ITText>
            {row.codeDerived && (
              <ITText className="!text-[10px] text-amber-600">{t("import.warningCODE_DERIVED")}</ITText>
            )}
          </ITFlex>
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "catalog",
      label: t("import.thCatalog"),
      width: 230,
      filter: true,
      render: (row: KitchenImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          <ITFlex align="center" gap={1} wrap="wrap">
            {badge(row.categoryName, row.categoryNew ? "warning" : "gray")}
            {row.categoryNew && (
              <ITText className="!text-[10px] text-amber-600">{t("import.newCategory")}</ITText>
            )}
          </ITFlex>
          <ITFlex align="center" gap={1} wrap="wrap">
            {badge(row.unitName, row.unitNew ? "warning" : "gray")}
            {row.unitNew && <ITText className="!text-[10px] text-amber-600">{t("import.newUnit")}</ITText>}
            {row.tracksExpiry ? (
              <ITText className="!text-[10px] text-slate-400">
                {row.expiresAt
                  ? t("import.expiresOn", { date: row.expiresAt })
                  : t("import.perishable")}
              </ITText>
            ) : null}
          </ITFlex>
        </ITFlex>
      ),
    },
    {
      type: "number",
      key: "quantity",
      label: t("import.thQuantity"),
      width: 110,
      render: (row: KitchenImportPreviewRow) => (
        <ITText className="!text-[11px] font-bold tabular-nums text-slate-800">
          {quantity(row.quantity)}
        </ITText>
      ),
    },
    {
      type: "number",
      key: "resulting",
      label: t("import.thResulting"),
      width: 150,
      render: (row: KitchenImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="!text-[11px] font-bold tabular-nums text-slate-800">
            {row.resultingStock === null ? "—" : quantity(row.resultingStock)}
          </ITText>
          {row.currentStock !== null && (
            <ITText className="!text-[10px] text-slate-400">
              {t("import.currentStock", { count: quantity(row.currentStock) })}
            </ITText>
          )}
          {row.delta !== 0 && (
            <ITText
              className={`!text-[10px] font-semibold tabular-nums ${
                row.delta > 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {row.delta > 0 ? `+${quantity(row.delta)}` : quantity(row.delta)}
            </ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "action",
      label: t("import.thAction"),
      width: 160,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: t("import.actionCreate"), name: t("import.actionCreate") },
          { id: t("import.actionAdd"), name: t("import.actionAdd") },
          { id: t("import.actionSetUp"), name: t("import.actionSetUp") },
          { id: t("import.actionSetDown"), name: t("import.actionSetDown") },
          { id: t("import.actionSetSame"), name: t("import.actionSetSame") },
          { id: t("import.actionNoStock"), name: t("import.actionNoStock") },
        ],
        loading: false,
        error: false,
      },
      render: (row: KitchenImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          {badge(t(actionKey(row.action)), ACTION_COLOR[row.action])}
          {row.lotCode && (
            <ITText className="!text-[10px] text-slate-400">{t("import.lot", { code: row.lotCode })}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "status",
      label: t("import.thStatus"),
      width: 240,
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
      render: (row: KitchenImportPreviewRow) => (
        <ITFlex direction="column" gap={0.5}>
          {row.errors.length > 0
            ? badge(t("import.statusError"), "danger")
            : row.warnings.length > 0
              ? badge(t("import.statusWarning"), "warning")
              : badge(t("import.statusReady"), "success")}
          {row.errors.map((error) => (
            <ITText key={error} className="!text-[10px] text-rose-600">
              {t(`import.error${error}` as `import.error${KitchenImportRowError}`)}
            </ITText>
          ))}
          {row.warnings.map((warning) => (
            <ITText key={warning} className="!text-[10px] text-amber-600">
              {t(`import.warning${warning}` as `import.warning${KitchenImportRowWarning}`)}
            </ITText>
          ))}
        </ITFlex>
      ),
    },
  ];

  if (!preview || !summary) return null;

  /** Selector de la estrategia con los artículos que ya existen. */
  const strategyOption = (value: KitchenImportStrategy, label: string, hint: string) => (
    <button
      type="button"
      onClick={() => fx.selectStrategy(value)}
      disabled={fx.loading || fx.confirming}
      className={`flex-1 rounded-xl border p-3 text-left transition ${
        fx.strategy === value
          ? "border-[#1e3a5f] !bg-[#1e3a5f]/5"
          : "border-slate-200 !bg-white hover:border-slate-300"
      }`}
    >
      <ITFlex align="center" gap={1}>
        <span
          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full border ${
            fx.strategy === value ? "border-[#1e3a5f]" : "border-slate-300"
          }`}
        >
          {fx.strategy === value && <span className="h-1.5 w-1.5 rounded-full bg-[#1e3a5f]" />}
        </span>
        <ITText className="!text-[11px] font-black uppercase tracking-wider text-slate-700">
          {label}
        </ITText>
      </ITFlex>
      <ITText className="mt-1 block !text-[11px] leading-snug text-slate-500">{hint}</ITText>
    </button>
  );

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
        <KpiTile
          label={t("import.statIn")}
          value={quantity(summary.quantityIn)}
          icon={<FaPlus size={16} />}
          tone="orange"
          hint={t("import.statLots", { count: summary.lots })}
        />
        <KpiTile
          label={t("import.statOut")}
          value={quantity(summary.quantityOut)}
          icon={<FaEquals size={16} />}
          tone={summary.quantityOut > 0 ? "amber" : "neutral"}
          hint={t("import.statAdjusted", { count: summary.adjustedOut })}
        />
      </div>

      {summary.invalid > 0 && (
        <ITAlert variant="error">{t("import.invalidBanner", { count: summary.invalid })}</ITAlert>
      )}

      {summary.invalid === 0 && fx.hasExisting && (
        <PanelCard title={t("import.existingTitle")} description={t("import.existingDescription")}>
          <ITFlex gap={3} wrap="wrap">
            {strategyOption("ADD", t("import.strategyAdd"), t("import.strategyAddHint"))}
            {strategyOption("SET", t("import.strategySet"), t("import.strategySetHint"))}
          </ITFlex>
        </PanelCard>
      )}

      {summary.invalid === 0 && (summary.categoriesToCreate.length > 0 || summary.unitsToCreate.length > 0) && (
        <ITAlert variant="info">
          {[
            summary.categoriesToCreate.length > 0
              ? t("import.catalogCategories", { categories: summary.categoriesToCreate.join(", ") })
              : null,
            summary.unitsToCreate.length > 0
              ? t("import.catalogUnits", { units: summary.unitsToCreate.join(", ") })
              : null,
            t("import.catalogBannerTail"),
          ]
            .filter(Boolean)
            .join(" ")}
        </ITAlert>
      )}

      {summary.invalid === 0 && summary.withoutStock > 0 && (
        <ITAlert variant="warning">{t("import.withoutStockBanner", { count: summary.withoutStock })}</ITAlert>
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
          // La tabla no reacciona al cambio de `fetchData`: al re-resolver la
          // previsualización (otra estrategia) hay que empujarla con el token.
          reloadTrigger={fx.previewToken}
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
