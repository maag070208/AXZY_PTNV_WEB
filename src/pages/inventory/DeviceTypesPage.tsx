import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITButton,
  ITCard,
  ITDataTable,
  ITCheckbox,
  ITChip,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITText,
  type Column, ITStack } from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaTag } from "react-icons/fa";
import { LuListChecks, LuSearch, LuTag } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { inventoryApi, type DeviceType } from "@entities/inventory";
import { useCan } from "@entities/user";
import { useGoBack } from "@shared/lib/useGoBack";
import { usePrefersReducedMotion } from "@shared/lib/usePrefersReducedMotion";
import { InsightNote, Num } from "@shared/ui/bento-bits";
import { DialogHeader } from "@shared/ui/dialog-header";
import { FilterPills, type FilterPillItem } from "@shared/ui/filter-pills";
import { RowAction } from "@shared/ui/row-action";
import { FormSection } from "@shared/ui/form-section";
import { Langostin, LangostinState, type LangostinAnim } from "@shared/ui/langostin";
import { StackedBar, seriesColor } from "@shared/ui/charts";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";

type StatusFilter = "all" | "active" | "inactive" | "withDevices";

/** Campos de la unidad que un tipo puede habilitar (los cuatro del API). */
const UNIT_FIELDS = 4;

/** Folio de activo fijo: `PREFIJO-0001`. Mismo formato que el API. */
const formatAssetTag = (prefix: string, counter: number): string =>
  `${prefix}-${String(counter).padStart(4, "0")}`;

/** El contador guardado es el último folio consumido; el siguiente suma uno. */
const nextAssetTag = (prefix: string, counter: number): string => formatAssetTag(prefix, counter + 1);

/** ¿El tipo cae en el filtro elegido? */
const matchesFilter = (tp: DeviceType, filter: StatusFilter): boolean => {
  if (filter === "active") return tp.active;
  if (filter === "inactive") return !tp.active;
  if (filter === "withDevices") return (tp._count?.devices ?? 0) > 0;
  return true;
};

export default function DeviceTypesPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const { t: tLangostin } = useTranslation("langostin");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const reduced = usePrefersReducedMotion();
  const canManage = useCan("catalogs.manage");

  // Catálogo completo: la API ya devuelve el conteo de dispositivos por tipo.
  const [types, setTypes] = useState<DeviceType[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const [filter, setFilter] = useState<StatusFilter>("all");
  const [query, setQuery] = useState("");

  // Alta y edición en el mismo diálogo (M2).
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeviceType | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [prefix, setPrefix] = useState("");
  const [active, setActive] = useState(true);
  const [useSerialNumber, setUseSerialNumber] = useState(true);
  const [useMac, setUseMac] = useState(false);
  const [useIp, setUseIp] = useState(false);
  const [useHostname, setUseHostname] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setLoadFailed(false);
    inventoryApi
      .types()
      .then((rows) => {
        if (alive) setTypes(rows);
      })
      .catch(() => {
        if (alive) setLoadFailed(true);
      });
    return () => {
      alive = false;
    };
  }, [reloadKey]);

  const openNew = () => {
    setEditing(null);
    setName("");
    setCode("");
    setPrefix("");
    setActive(true);
    setUseSerialNumber(true);
    setUseMac(false);
    setUseIp(false);
    setUseHostname(false);
    setError(null);
    setShowForm(true);
  };

  const openEdit = (tp: DeviceType) => {
    if (!canManage) return;
    setEditing(tp);
    setName(tp.name);
    setCode(tp.code);
    setPrefix(tp.assetTagPrefix);
    setActive(tp.active);
    setUseSerialNumber(tp.useSerialNumber);
    setUseMac(tp.useMac);
    setUseIp(tp.useIp);
    setUseHostname(tp.useHostname);
    setError(null);
    setShowForm(true);
  };

  const close = () => {
    if (saving) return;
    setShowForm(false);
    setEditing(null);
    setError(null);
  };

  const enabledFields = [useSerialNumber, useMac, useIp, useHostname].filter(Boolean).length;
  const identityComplete = name.trim() !== "" && prefix.trim() !== "" && code.trim() !== "";
  const canSave = identityComplete && !saving;

  const save = async () => {
    if (!canSave) return;
    setError(null);
    setSaving(true);
    try {
      if (editing) {
        await inventoryApi.updateType(editing.id, {
          name: name.trim(),
          assetTagPrefix: prefix.trim(),
          active,
          useSerialNumber,
          useMac,
          useIp,
          useHostname,
        });
      } else {
        await inventoryApi.createType({
          name: name.trim(),
          code: code.trim(),
          assetTagPrefix: prefix.trim(),
          useSerialNumber,
          useMac,
          useIp,
          useHostname,
        });
      }
      setSaving(false);
      setShowForm(false);
      setEditing(null);
      setReloadKey((key) => key + 1);
    } catch (e) {
      setError(e instanceof Error && e.message ? e.message : t("types.saveError"));
      setSaving(false);
    }
  };

  // Totales reales del catálogo (el listado ya trae todos los tipos y su conteo).
  const stats = useMemo(() => {
    const rows = types ?? [];
    const total = rows.length;
    const activeCount = rows.filter((tp) => tp.active).length;
    const withDevices = rows.filter((tp) => (tp._count?.devices ?? 0) > 0).length;
    const devices = rows.reduce((acc, tp) => acc + (tp._count?.devices ?? 0), 0);
    return { total, activeCount, inactiveCount: total - activeCount, withDevices, devices };
  }, [types]);

  /** Proporción del catálogo, redondeada: solo se muestra si hay tipos. */
  const share = (value: number): number => (stats.total > 0 ? Math.round((value / stats.total) * 100) : 0);

  // Distribución del inventario: los 7 tipos con más dispositivos + "Otros".
  const distribution = useMemo(() => {
    const rows = [...(types ?? [])].sort((a, b) => (b._count?.devices ?? 0) - (a._count?.devices ?? 0));
    const top = rows.filter((tp) => (tp._count?.devices ?? 0) > 0).slice(0, 7);
    const used = top.reduce((acc, tp) => acc + (tp._count?.devices ?? 0), 0);
    const segments = top.map((tp, i) => ({
      label: tp.assetTagPrefix,
      value: tp._count?.devices ?? 0,
      color: seriesColor(i),
      display: String(tp._count?.devices ?? 0),
    }));
    if (stats.devices - used > 0) {
      segments.push({ label: t("types.others"), value: stats.devices - used, color: "var(--color-secondary-300)", display: String(stats.devices - used) });
    }
    return segments;
  }, [types, stats.devices, t]);

  const pills = useMemo<FilterPillItem<StatusFilter>[]>(
    () => [
      { id: "all", label: t("types.all") },
      { id: "active", label: t("types.active") },
      { id: "inactive", label: t("types.inactive") },
      { id: "withDevices", label: t("types.withDevices") },
    ],
    [t]
  );

  // El buscador cubre las tres columnas de la tabla anterior: nombre, código y prefijo.
  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return (types ?? []).filter((tp) => {
      if (!matchesFilter(tp, filter)) return false;
      if (!needle) return true;
      return `${tp.name} ${tp.code} ${tp.assetTagPrefix}`.toLowerCase().includes(needle);
    });
  }, [types, filter, query]);

  // Tabla del catálogo: mismas columnas y orden que el diseño de referencia.
  const columns: Column<DeviceType>[] = useMemo(() => {
    const maxDevices = Math.max(1, ...(types ?? []).map((tp) => tp._count?.devices ?? 0));
    return [
      {
        key: "name",
        label: t("types.colType"),
        type: "string",
        sortable: true,
        render: (tp: DeviceType) => (
          <ITFlex align="center" gap={2} className="min-w-0">
            <ITText as="span"
              aria-hidden
              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
              style={{ background: seriesColor((types ?? []).findIndex((x) => x.id === tp.id) % 7) }}
            />
            <ITText className="truncate font-semibold !text-[12.5px] tracking-[0.01em]">{tp.name}</ITText>
          </ITFlex>
        ),
      },
      {
        key: "assetTagPrefix",
        label: t("types.colPrefix"),
        type: "string",
        sortable: true,
        render: (tp: DeviceType) => (
          <ITChip size="sm" color="gray">
            {tp.assetTagPrefix}
          </ITChip>
        ),
      },
      {
        key: "next",
        label: t("types.colNext"),
        type: "string",
        sortable: false,
        render: (tp: DeviceType) => (
          <ITText muted className="tabular-nums !text-[12px]">
            {nextAssetTag(tp.assetTagPrefix, tp.counter)}
          </ITText>
        ),
      },
      {
        key: "devices",
        label: t("types.colDevices"),
        type: "number",
        sortable: true,
        render: (tp: DeviceType) => {
          const devices = tp._count?.devices ?? 0;
          return (
            <ITFlex align="center" gap={2} className="min-w-0">
              <ITText className="w-6 shrink-0 text-right !text-[15px] font-extrabold tabular-nums !text-slate-900">
                {devices}
              </ITText>
              <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,currentColor_10%,transparent)]">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${Math.round((devices / maxDevices) * 100)}%`, background: "var(--color-primary-500)" }}
                />
              </div>
            </ITFlex>
          );
        },
      },
      {
        key: "share",
        label: t("types.colShare"),
        type: "number",
        sortable: false,
        render: (tp: DeviceType) => (
          <ITText muted className="tabular-nums !text-[12px]">
            {share(tp._count?.devices ?? 0)}%
          </ITText>
        ),
      },
      {
        key: "active",
        label: t("types.colStatus"),
        type: "catalog",
        sortable: true,
        render: (tp: DeviceType) => (
          <ITChip size="sm" color={tp.active ? "success" : "gray"}>
            {tp.active ? t("types.active") : t("types.inactive")}
          </ITChip>
        ),
      },
      {
        key: "actions",
        label: "",
        type: "actions",
        width: 60,
        actions: (tp: DeviceType) =>
          canManage ? <RowAction icon={<FaEdit size={12} />} label={t("types.edit")} onClick={() => openEdit(tp)} /> : null,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [types, canManage, t, share]);

  // La tabla filtra y ordena en cliente sobre la lista ya filtrada por las píldoras.
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<DeviceType>(() => Promise.resolve(visible), {
        name: { value: (tp) => tp.name },
        assetTagPrefix: { value: (tp) => tp.assetTagPrefix },
        devices: { value: (tp) => tp._count?.devices ?? 0 },
        active: { match: "equals" },
      }),
    [visible]
  );

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };

  const newButton = (
    <ITButton variant="filled" color="primary" onClick={openNew}>
      <ITFlex align="center" gap={1}>
        <FaPlus size={12} />
        <ITText className="font-bold text-[11px]">{t("types.new")}</ITText>
      </ITFlex>
    </ITButton>
  );

  const identityValue = prefix.trim() ? nextAssetTag(prefix.trim(), editing ? editing.counter : 0) : undefined;
  const doneSections = (identityComplete ? 1 : 0) + (enabledFields > 0 ? 1 : 0);
  const langostinAnim: LangostinAnim = saving
    ? "work"
    : error
      ? "err"
      : canSave
        ? "ok"
        : "help";

  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("types.title")}
      description={t("types.description")}
      icon={<FaTag size={20} />}
      backAction={() => goBack("/inventory")}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title"), onClick: () => navigate("/inventory") },
        { label: t("types.title") },
      ]}
      actions={canManage ? newButton : undefined}
    >
      {loadFailed ? (
        <LangostinState
          kind="error"
          description={t("common:errors.load")}
          action={
            <ITButton variant="outlined" color="primary" onClick={() => setReloadKey((key) => key + 1)}>
              <ITText className="font-bold text-[11px]">{t("ui.retry")}</ITText>
            </ITButton>
          }
        />
      ) : types === null ? (
        <LangostinState kind="loading" />
      ) : types.length === 0 ? (
        <LangostinState
          kind="empty"
          title={t("types.empty")}
          description={t("types.emptyHint")}
          action={canManage ? newButton : undefined}
        />
      ) : (
        <ITStack spacing={3}>
          {/* Resumen: una sola tarjeta con las cuatro cifras separadas por línea. */}
          <ITCard contentClassName="!p-0">
            <ITFlex className="!grid grid-cols-2 md:!grid-cols-4">
              {[
                { key: "all", label: t("types.summaryTypes"), value: stats.total, caption: t("types.devicesCount", { count: stats.devices }) },
                { key: "active", label: t("types.active"), value: stats.activeCount, caption: t("types.share", { percent: share(stats.activeCount) }) },
                { key: "inactive", label: t("types.inactive"), value: stats.inactiveCount, caption: t("types.share", { percent: share(stats.inactiveCount) }) },
                { key: "withDevices", label: t("types.withDevices"), value: stats.withDevices, caption: t("types.ofTypes", { count: stats.total }) },
              ].map((item, i) => (
                <ITFlex
                  key={item.key}
                  direction="column"
                  gap={1}
                  className={`min-w-0 px-5 py-4 ${i > 0 ? "border-t border-slate-100 md:border-l md:border-t-0" : ""}`}
                >
                  <ITText muted className="!text-[12.5px] font-semibold">
                    {item.label}
                  </ITText>
                  <ITFlex align="baseline" gap={2} className="min-w-0">
                    <ITText className="!text-[32px] font-extrabold leading-none tabular-nums !text-slate-900">
                      <Num value={item.value} />
                    </ITText>
                    <ITText muted className="truncate !text-[12px]">
                      {item.caption}
                    </ITText>
                  </ITFlex>
                </ITFlex>
              ))}
            </ITFlex>
          </ITCard>

          {/* Distribución del inventario por tipo, con su leyenda */}
          <ITCard>
            <ITFlex align="baseline" justify="between" gap={2} className="mb-3">
              <ITText className="!text-[13px] font-bold !text-slate-800">{t("types.distribution")}</ITText>
              <ITText muted className="!text-[12px]">
                {t("types.devicesTotal", { count: stats.devices })}
              </ITText>
            </ITFlex>
            <StackedBar segments={distribution} />
          </ITCard>

          {/* Catálogo en tabla, con filtros en una fila */}
          <ITCard contentClassName="!p-0">
            <ITFlex align="center" wrap="wrap" gap={2} className="px-4 py-3">
              <FilterPills items={pills} value={filter} onChange={setFilter} />
              <div className="w-full sm:ml-auto sm:w-72">
                <ITInput
                  name="deviceTypeSearch"
                  placeholder={t("types.search")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  iconLeft={<LuSearch size={14} />}
                  className="w-full min-w-0"
                />
              </div>
              <ITText muted className="whitespace-nowrap !text-[12px]">
                {t("types.resultsShort", { shown: visible.length, total: types.length })}
              </ITText>
            </ITFlex>

            {visible.length === 0 ? (
              <div className="px-4 pb-4">
                <LangostinState
                  kind="noResults"
                  size="sm"
                  action={
                    <ITButton variant="outlined" color="primary" onClick={clearFilters}>
                      <ITText className="font-bold text-[11px]">{t("types.clearFilters")}</ITText>
                    </ITButton>
                  }
                />
              </div>
            ) : (
              <ITDataTable showViewToggle={false}
                key={`types:${filter}:${query}`}
                columns={columns as unknown as Column<Record<string, unknown>>[]}
                fetchData={fetchData as never}
                defaultItemsPerPage={25}
                itemsPerPageOptions={[25, 50, 100]}
                layout="fixed"
                density="compact"
                rowHeight={50}
                virtualized
                virtualizedMaxHeight={460}
              />
            )}
          </ITCard>

          {canManage && (
            <ITButton variant="outlined" color="primary" onClick={openNew} className="w-full">
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11.5px]">{t("types.addRow")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITStack>
      )}

      {/* M2: alta y edición en el mismo diálogo, con resumen vivo a la derecha. */}
      <ITDialog isOpen={showForm} onClose={close} className="w-full max-w-3xl">
        <DialogHeader
          icon={editing ? <LuTag size={20} /> : <FaPlus size={18} />}
          title={editing ? t("types.edit") : t("types.new")}
          subtitle={t("types.formSubtitle")}
          tone={editing ? "primary" : "success"}
        />

        {error && (
          <div className="mb-4">
            <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </ITAlert>
          </div>
        )}

        <div className="max-h-[62vh] overflow-y-auto pr-1">
          <ITGrid container columns={12} spacing={4} className="items-start">
            <ITGrid item xs={12} lg={8}>
              <ITStack spacing={4}>
                <FormSection
                  number={1}
                  title={t("types.sectionIdentity")}
                  description={t("types.sectionIdentityHint")}
                  icon={<LuTag size={15} />}
                  complete={identityComplete}
                >
                  <ITGrid container columns={12} spacing={3}>
                    <ITGrid item xs={12} sm={6}>
                      <ITInput
                        name="name"
                        label={t("types.name")}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("types.namePlaceholder")}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6}>
                      <ITInput
                        name="code"
                        label={t("types.code")}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={!!editing}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6}>
                      <ITInput
                        name="prefix"
                        label={t("types.prefix")}
                        value={prefix}
                        onChange={(e) => setPrefix(e.target.value)}
                        placeholder={t("types.prefixPlaceholder")}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6} className="flex items-end pb-2">
                      <ITCheckbox
                        name="active"
                        label={t("types.active")}
                        checked={active}
                        onChange={setActive}
                      />
                    </ITGrid>
                  </ITGrid>
                </FormSection>

                <FormSection
                  number={2}
                  title={t("types.fields")}
                  description={t("types.fieldsHint")}
                  icon={<LuListChecks size={15} />}
                  complete={enabledFields > 0}
                >
                  <ITGrid container columns={12} spacing={3}>
                    <ITGrid item xs={12} sm={6}>
                      <ITCheckbox
                        name="useSerialNumber"
                        label={t("devices.serialNumber")}
                        checked={useSerialNumber}
                        onChange={setUseSerialNumber}
                      />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6}>
                      <ITCheckbox name="useMac" label={t("devices.mac")} checked={useMac} onChange={setUseMac} />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6}>
                      <ITCheckbox name="useIp" label={t("devices.ip")} checked={useIp} onChange={setUseIp} />
                    </ITGrid>
                    <ITGrid item xs={12} sm={6}>
                      <ITCheckbox
                        name="useHostname"
                        label={t("devices.hostname")}
                        checked={useHostname}
                        onChange={setUseHostname}
                      />
                    </ITGrid>
                  </ITGrid>
                </FormSection>
              </ITStack>
            </ITGrid>

            <ITGrid item xs={12} lg={4}>
              <LiveSummary
                title={t("types.summaryTitle")}
                total={2}
                done={doneSections}
                className="w-full"
                footer={!identityComplete ? <InsightNote>{t("types.missingHint")}</InsightNote> : undefined}
              >
                <LiveSummaryRow label={t("types.name")} value={name.trim()} />
                <LiveSummaryRow label={t("types.code")} value={code.trim()} />
                <LiveSummaryRow label={t("types.series")} value={identityValue} />
                <LiveSummaryRow
                  label={t("types.state")}
                  value={
                    <ITChip size="sm" color={active ? "success" : "gray"}>
                      {active ? t("types.active") : t("types.inactive")}
                    </ITChip>
                  }
                />
                <LiveSummaryRow
                  label={t("types.fields")}
                  value={t("types.fieldsCount", { done: enabledFields, total: UNIT_FIELDS })}
                />
              </LiveSummary>
            </ITGrid>
          </ITGrid>
        </div>

        {/* Pie fijo del modal: Langostín reacciona al estado y las acciones quedan a la derecha. */}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <Langostin anim={langostinAnim} size={44} animated={!reduced} label={tLangostin("guide.label")} />
          <ITFlex gap={2} className="ml-auto">
            <ITButton variant="outlined" color="gray" onClick={close} disabled={saving}>
              <ITText className="font-bold text-[12px]">{t("common:actions.cancel")}</ITText>
            </ITButton>
            <ITButton variant="rounded" color="primary" onClick={() => void save()} disabled={!canSave}>
              <ITText className="font-bold text-[12px]">
                {saving ? t("types.saving") : t("common:actions.save")}
              </ITText>
            </ITButton>
          </ITFlex>
        </div>
      </ITDialog>
    </ITPage>
  );
}
