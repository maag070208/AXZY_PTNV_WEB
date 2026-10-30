import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBentoGrid,
  ITBentoTile,
  ITButton,
  ITCheckbox,
  ITChip,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaTag } from "react-icons/fa";
import {
  LuArchive,
  LuBoxes,
  LuCircleCheck,
  LuLayers,
  LuListChecks,
  LuRotateCcw,
  LuSearch,
  LuTag,
} from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { inventoryApi, type DeviceType } from "@entities/inventory";
import { useCan } from "@entities/user";
import { useGoBack } from "@shared/lib/useGoBack";
import { usePrefersReducedMotion } from "@shared/lib/usePrefersReducedMotion";
import { InsightNote, Num } from "@shared/ui/bento-bits";
import { DialogHeader } from "@shared/ui/dialog-header";
import { FilterPills, type FilterPillItem } from "@shared/ui/filter-pills";
import { FormSection } from "@shared/ui/form-section";
import { Langostin, LangostinState, type LangostinAnim } from "@shared/ui/langostin";
import { ListSummaryStrip, type ListSummaryItem } from "@shared/ui/list-summary-strip";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";

type StatusFilter = "all" | "active" | "inactive" | "withDevices";

/** Campos de la unidad que un tipo puede habilitar (los cuatro del API). */
const UNIT_FIELDS = 4;

/** Foco visible para las tarjetas clicables (el mosaico del kit no lo trae). */
const TILE_FOCUS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2";

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

  const summary = useMemo<ListSummaryItem[]>(() => {
    /** Proporción del catálogo, redondeada: solo se muestra si hay tipos. */
    const share = (value: number): number =>
      stats.total > 0 ? Math.round((value / stats.total) * 100) : 0;
    return [
      {
        id: "all",
        label: t("types.summaryTypes"),
        value: <Num value={stats.total} />,
        tone: "sea",
        icon: <LuLayers size={15} />,
        caption: t("types.devicesCount", { count: stats.devices }),
      },
      {
        id: "active",
        label: t("types.active"),
        value: <Num value={stats.activeCount} />,
        tone: "mint",
        icon: <LuCircleCheck size={15} />,
        caption: t("types.share", { percent: share(stats.activeCount) }),
      },
      {
        id: "inactive",
        label: t("types.inactive"),
        value: <Num value={stats.inactiveCount} />,
        tone: "lavender",
        icon: <LuArchive size={15} />,
        caption: t("types.share", { percent: share(stats.inactiveCount) }),
      },
      {
        id: "withDevices",
        label: t("types.withDevices"),
        value: <Num value={stats.withDevices} />,
        tone: stats.withDevices > 0 ? "sun" : "plain",
        icon: <LuBoxes size={15} />,
        caption: t("types.ofTypes", { count: stats.total }),
      },
    ];
  }, [stats, t]);

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

  const clearFilters = () => {
    setFilter("all");
    setQuery("");
  };

  const hasFilters = query.trim() !== "" || filter !== "all";

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
        <div className="flex flex-col gap-4">
          <ListSummaryStrip items={summary} activeId={filter} onSelect={(id) => setFilter(id as StatusFilter)} />

          {/* Filtros en una fila: píldoras de estado + buscador. */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
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
          </div>

          {hasFilters && (
            <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
              <ITText className="!text-[12px] text-slate-500">{t("types.results", { count: visible.length })}</ITText>
              <ITButton variant="text" color="gray" size="sm" onClick={clearFilters}>
                <ITFlex align="center" gap={1}>
                  <LuRotateCcw size={12} />
                  <ITText className="font-bold text-[11px]">{t("types.clearFilters")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          )}

          {visible.length === 0 ? (
            <LangostinState
              kind="noResults"
              size="sm"
              action={
                <ITButton variant="outlined" color="primary" onClick={clearFilters}>
                  <ITText className="font-bold text-[11px]">{t("types.clearFilters")}</ITText>
                </ITButton>
              }
            />
          ) : (
            <ITBentoGrid>
              {/* Alta: tarjeta punteada, siempre a la vista al inicio del catálogo. */}
              {canManage && (
                <ITBentoTile
                  cols={3}
                  rows={2}
                  tone="plain"
                  onClick={openNew}
                  className={`items-center justify-center gap-1 text-center ${TILE_FOCUS}`}
                  style={{
                    border: "1.5px dashed color-mix(in srgb, var(--color-primary) 45%, transparent)",
                    background: "color-mix(in srgb, var(--color-primary) 5%, transparent)",
                    boxShadow: "none",
                  }}
                >
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full"
                    style={{ background: "var(--color-primary-soft)", color: "var(--color-primary)" }}
                  >
                    <FaPlus size={15} />
                  </span>
                  <span className="text-[13px] font-bold" style={{ color: "var(--color-primary)" }}>
                    {t("types.addCard")}
                  </span>
                  <span className="text-[11.5px]" style={{ color: "var(--it-bento-muted)" }}>
                    {t("types.addCardHint")}
                  </span>
                </ITBentoTile>
              )}

              {visible.map((tp) => {
                const devices = tp._count?.devices ?? 0;
                // Todas las tarjetas en blanco: el color va en el número y en el chip de
                // estado, para que la rejilla no se vuelva un muro de un solo tono.
                return (
                  <ITBentoTile
                    key={tp.id}
                    cols={3}
                    rows={2}
                    tone="plain"
                    label={<span className="line-clamp-2 leading-tight">{tp.name}</span>}
                    icon={<LuTag size={13} />}
                    onClick={canManage ? () => openEdit(tp) : undefined}
                    value={
                      <span style={{ color: tp.active && devices > 0 ? "var(--color-primary-500)" : "var(--it-bento-muted)" }}>
                        {devices}
                      </span>
                    }
                    caption={devices === 1 ? t("types.deviceUnit") : t("types.devicesUnit")}
                    className={canManage ? TILE_FOCUS : undefined}
                    aside={canManage ? <FaEdit size={12} className="mb-1 shrink-0 opacity-40" aria-hidden /> : undefined}
                  >
                    <div className="mt-2 flex min-w-0 items-center gap-1.5">
                      <ITChip size="sm" color="gray">
                        {tp.assetTagPrefix}
                      </ITChip>
                      <span
                        className="min-w-0 flex-1 truncate text-[11.5px]"
                        title={t("types.nextFolio", { folio: nextAssetTag(tp.assetTagPrefix, tp.counter) })}
                        style={{ color: "var(--it-bento-muted)" }}
                      >
                        {nextAssetTag(tp.assetTagPrefix, tp.counter)}
                      </span>
                      <ITChip size="sm" color={tp.active ? "success" : "gray"}>
                        {tp.active ? t("types.active") : t("types.inactive")}
                      </ITChip>
                    </div>

                    {/* Peso del tipo dentro del inventario: proporción real, no adorno. */}
                    {stats.devices > 0 && (
                      <div className="mt-2 flex items-center gap-2">
                        <div
                          aria-hidden
                          className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full"
                          style={{ background: "color-mix(in srgb, currentColor 12%, transparent)" }}
                        >
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.round((devices / stats.devices) * 100)}%`,
                              background: "color-mix(in srgb, currentColor 55%, transparent)",
                            }}
                          />
                        </div>
                        <span className="shrink-0 text-[10.5px]" style={{ color: "var(--it-bento-muted)" }}>
                          {t("types.shareOfDevices", { percent: Math.round((devices / stats.devices) * 100) })}
                        </span>
                      </div>
                    )}
                  </ITBentoTile>
                );
              })}
            </ITBentoGrid>
          )}
        </div>
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
              <div className="flex flex-col gap-4">
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
              </div>
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
