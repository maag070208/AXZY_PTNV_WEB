import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITText,
  ITTextarea,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import {
  FaBan,
  FaDoorOpen,
  FaEye,
  FaFileCsv,
  FaListUl,
  FaSignInAlt,
  FaSignOutAlt,
  FaUndo,
} from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { formatDateTime } from "@shared/utils/dates";
import { dyn } from "@shared/i18n/dyn";
import { LocationMap } from "@shared/ui/location-map";
import {
  accessApi,
  type AccessEvent,
  type AccessEventType,
  type AccessStats,
  type Site,
} from "@entities/access";
import { fileName } from "@shared/i18n";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const TYPE_COLOR: Record<AccessEventType, BadgeColor> = {
  ENTRY: "success",
  EXIT: "warning",
};

/** Fecha local `YYYY-MM-DD` (el backend completa el fin del día si no trae hora). */
const toDateInput = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const formatCoords = (lat: number | null, lng: number | null): string =>
  lat != null && lng != null ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : "";

export default function AccessPage() {
  const { t: tt } = useTranslation(["access", "common"]);
  const navigate = useNavigate();
  const canVoid = useCan("access.void");

  const [sites, setSites] = useState<Site[]>([]);
  const [sitesError, setSitesError] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(),
    new Date(),
  ]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [includeVoided, setIncludeVoided] = useState(false);
  const [stats, setStats] = useState<AccessStats | null>(null);
  const [exporting, setExporting] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const [detail, setDetail] = useState<AccessEvent | null>(null);
  const [detailError, setDetailError] = useState<string | null>(null);

  const [voidTarget, setVoidTarget] = useState<AccessEvent | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidError, setVoidError] = useState<string | null>(null);
  const [voidSaving, setVoidSaving] = useState(false);

  useEffect(() => {
    let active = true;
    accessApi
      .sites()
      .then((list) => {
        if (active) setSites(list);
      })
      .catch(() => {
        if (active) setSitesError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const reload = () => setReloadKey((k) => k + 1);

  const externalFilters = useMemo(() => {
    const filters: Record<string, string | number | boolean> = {};
    if (dateRange[0]) filters.start = toDateInput(dateRange[0]);
    if (dateRange[1]) filters.end = toDateInput(dateRange[1]);
    const q = employeeQuery.trim();
    if (q) filters.q = q;
    if (typeFilter) filters.type = typeFilter;
    if (includeVoided) filters.includeVoided = true;
    return filters;
  }, [dateRange, employeeQuery, typeFilter, includeVoided]);

  // KPIs: se recalculan con los mismos filtros (independientes de la página).
  useEffect(() => {
    let active = true;
    accessApi
      .stats({ page: 1, limit: 1, filters: externalFilters })
      .then((res) => {
        if (active) setStats(res);
      })
      .catch(() => {
        if (active) setStats(null);
      });
    return () => {
      active = false;
    };
  }, [externalFilters, reloadKey]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await accessApi.table({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const applyRange = (preset: "today" | "yesterday" | "last7") => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (preset === "today") {
      setDateRange([today, today]);
      return;
    }
    if (preset === "yesterday") {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      setDateRange([y, y]);
      return;
    }
    const start = new Date(today);
    start.setDate(start.getDate() - 6);
    setDateRange([start, today]);
  };

  const clearFilters = () => {
    setDateRange([new Date(), new Date()]);
    setEmployeeQuery("");
    setTypeFilter("");
    setIncludeVoided(false);
  };

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const res = await accessApi.table({
        page: 1,
        limit: 5000,
        filters: externalFilters,
        sort: { key: "occurredAt", direction: "desc" },
      });
      const header = [
        tt("columns.occurredAt"),
        tt("columns.employee"),
        tt("columns.type"),
        tt("columns.site"),
        tt("columns.locationSource"),
        tt("columns.guard"),
        tt("columns.status"),
      ];
      const lines = res.data.map((e) => [
        formatDateTime(e.occurredAt),
        [e.employeeNameSnapshot, e.employeeNumberSnapshot ? `#${e.employeeNumberSnapshot}` : ""]
          .filter(Boolean)
          .join(" "),
        tt(`types.${e.type}`),
        e.site?.name ?? "",
        tt(`locationSources.${e.locationSource}`),
        e.guard?.name ?? "",
        e.voidedAt ? tt("status.voided") : tt("status.active"),
      ]);
      const escape = (cell: unknown) => `"${String(cell ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((row) => row.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${fileName("access")}-${toDateInput(dateRange[0] ?? new Date())}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setToast(err instanceof Error ? err.message : tt("errors.load"));
    } finally {
      setExporting(false);
    }
  };

  const openDetail = async (event: AccessEvent) => {
    setDetail(event);
    setDetailError(null);
    try {
      setDetail(await accessApi.get(event.id));
    } catch (err: unknown) {
      setDetailError(err instanceof Error ? err.message : tt("errors.detail"));
    }
  };

  const openVoid = (event: AccessEvent) => {
    setVoidTarget(event);
    setVoidReason("");
    setVoidError(null);
  };

  const confirmVoid = async () => {
    if (!voidTarget) return;
    const reason = voidReason.trim();
    if (!reason) {
      setVoidError(tt("void.reasonRequired"));
      return;
    }
    setVoidSaving(true);
    setVoidError(null);
    try {
      await accessApi.void(voidTarget.id, reason);
      setVoidTarget(null);
      reload();
      setToast(tt("void.success"));
    } catch (err: unknown) {
      setVoidError(err instanceof Error ? err.message : tt("void.error"));
    } finally {
      setVoidSaving(false);
    }
  };

  const typeOptions = useMemo(
    () => [
      { id: "ENTRY", name: tt("types.ENTRY") },
      { id: "EXIT", name: tt("types.EXIT") },
    ],
    [tt]
  );

  const kpis = [
    { key: "total", value: stats?.total ?? 0, tint: "bg-[#0D5777]/10", color: "text-[#0D5777]", icon: <FaListUl size={15} /> },
    { key: "entries", value: stats?.entries ?? 0, tint: "bg-emerald-50", color: "text-emerald-600", icon: <FaSignInAlt size={15} /> },
    { key: "exits", value: stats?.exits ?? 0, tint: "bg-amber-50", color: "text-amber-600", icon: <FaSignOutAlt size={15} /> },
    { key: "voided", value: stats?.voided ?? 0, tint: "bg-rose-50", color: "text-rose-600", icon: <FaBan size={15} /> },
  ];

  const columns: Column<AccessEvent>[] = [
    {
      key: "occurredAt",
      label: tt("columns.occurredAt"),
      type: "date",
      width: 160,
      sortable: false,
      render: (e) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatDateTime(e.occurredAt)}
        </ITText>
      ),
    },
    {
      key: "employeeNameSnapshot",
      label: tt("columns.employee"),
      type: "string",
      width: 240,
      sortable: false,
      render: (e) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">
            {e.employeeNameSnapshot ?? "—"}
          </ITText>
          <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
            {e.employeeNumberSnapshot ? `#${e.employeeNumberSnapshot}` : "—"}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "type",
      label: tt("columns.type"),
      type: "catalog",
      width: 130,
      sortable: false,
      filter: "catalog",
      catalogOptions: { data: typeOptions, loading: false, error: false },
      render: (e) => (
        <ITBadget color={TYPE_COLOR[e.type]} size="lg">
          {tt(`types.${e.type}`)}
        </ITBadget>
      ),
    },
    {
      key: "siteId",
      label: tt("columns.site"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      catalogOptions: {
        data: sites.map((s) => ({ id: s.id, name: s.name })),
        loading: false,
        error: sitesError,
      },
      render: (e) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {e.site?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "guard.name",
      label: tt("columns.guard"),
      type: "string",
      width: 200,
      render: (e) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {e.guard?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "actions",
      label: tt("columns.actions"),
      type: "actions",
      width: 100,
      actions: (e) => (
        <ITFlex align="center" gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="secondary"
            title={tt("actions.view")}
            onClick={() => void openDetail(e)}
          >
            <FaEye size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title={tt("title")}
      description={tt("description")}
      icon={<FaDoorOpen size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("title") },
      ]}
      backAction={() => navigate("/")}
    >
      {sitesError && (
        <ITAlert variant="warning" dismissible onDismiss={() => setSitesError(false)}>
          {tt("errors.sites")}
        </ITAlert>
      )}

      {/* Filtros */}
      <ITCard title={tt("toolbar.title")} className="!p-5 border border-slate-200">
        <ITFlex direction="column" gap={3}>
          <ITFlex align="center" wrap="wrap" gap={2}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              {tt("presets.title")}
            </ITText>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("today")}>
              {tt("presets.today")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("yesterday")}>
              {tt("presets.yesterday")}
            </ITButton>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => applyRange("last7")}>
              {tt("presets.last7")}
            </ITButton>
            <ITButton variant="text" color="gray" size="sm" onClick={clearFilters} className="ml-auto">
              <ITFlex align="center" gap={1}>
                <FaUndo size={11} />
                <ITText className="font-bold text-[11px]">{tt("filters.clear")}</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>

          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITDatePicker
                name="accessDateRange"
                label={tt("filters.dateRange")}
                range
                value={dateRange}
                onChange={handleDateRange}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="accessEmployee"
                label={tt("filters.employee")}
                placeholder={tt("filters.employeePlaceholder")}
                value={employeeQuery}
                onChange={(e) => setEmployeeQuery(e.target.value)}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name="accessType"
                label={tt("filters.type")}
                options={[
                  { value: "", label: tt("filters.allTypes") },
                  { value: "ENTRY", label: tt("types.ENTRY") },
                  { value: "EXIT", label: tt("types.EXIT") },
                ]}
                value={typeFilter}
                onChange={(value) => setTypeFilter(String(value))}
                className="w-full min-w-0"
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITFlex align="end" className="h-full pb-2">
                <ITCheckbox
                  name="accessIncludeVoided"
                  label={tt("filters.includeVoided")}
                  checked={includeVoided}
                  onChange={setIncludeVoided}
                />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITFlex>
      </ITCard>

      {/* KPIs + exportar */}
      <ITFlex wrap="wrap" gap={3}>
        {kpis.map((k) => (
          <ITFlex
            key={k.key}
            grow={1}
            basis="160px"
            align="center"
            gap={3}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ITFlex
              align="center"
              justify="center"
              className={`h-10 w-10 shrink-0 rounded-xl ${k.tint} ${k.color}`}
            >
              {k.icon}
            </ITFlex>
            <ITFlex direction="column" gap={0} className="min-w-0">
              <ITText className="text-xl font-black leading-none text-slate-800">{k.value}</ITText>
              <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
                {dyn(tt)(`kpis.${k.key}`)}
              </ITText>
            </ITFlex>
          </ITFlex>
        ))}
        <ITFlex align="center" justify="center" className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <ITButton variant="outlined" color="gray" onClick={handleExportCsv} disabled={exporting}>
            <ITFlex align="center" gap={1}>
              <FaFileCsv className="text-emerald-600" size={13} />
              <ITText className="font-bold text-[11px]">
                {exporting ? tt("actions.exporting") : tt("actions.exportCsv")}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[10, 25, 50]}
        debounceMs={350}
        size="lg"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
      />

      <ITDialog
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        className="w-full !max-w-3xl"
      >
        {detailError && (
          <ITAlert variant="error" dismissible onDismiss={() => setDetailError(null)}>
            {detailError}
          </ITAlert>
        )}
        {detail && (
          <div style={{ minWidth: "100%" }}>
            {/* Header */}
            <div className="pb-4 pr-8 mb-5" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <ITFlex align="center" wrap="wrap" gap={2} className="mb-1.5">
                <ITBadget color={TYPE_COLOR[detail.type]} size="lg">
                  {tt(`types.${detail.type}`)}
                </ITBadget>
                <ITBadget color={detail.voidedAt ? "danger" : "success"} size="lg">
                  {detail.voidedAt ? tt("status.voided") : tt("status.active")}
                </ITBadget>
                <span className="text-xs text-slate-400">
                  · {formatDateTime(detail.occurredAt)}
                </span>
              </ITFlex>
              <ITText className="text-xl font-bold leading-tight text-slate-900">
                {detail.employeeNameSnapshot ?? "—"}
              </ITText>
              {detail.employeeNumberSnapshot && (
                <ITText className="text-xs text-slate-400">
                  #{detail.employeeNumberSnapshot}
                </ITText>
              )}
            </div>

            {/* Cuerpo */}
            <div className="overflow-y-auto pr-1" style={{ maxHeight: "min(60vh, 560px)" }}>
              <ITGrid container columns={12} spacing={4}>
                {detail.latitude != null && detail.longitude != null && (
                  <ITGrid item xs={12}>
                    <LocationMap
                      latitude={detail.latitude}
                      longitude={detail.longitude}
                      caption={tt("detail.map")}
                      linkLabel={tt("detail.viewOnMap")}
                    />
                  </ITGrid>
                )}
                <ITGrid item xs={12} md={6}>
                  <DetailRow label={tt("detail.site")} value={detail.site?.name ?? "—"} />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow label={tt("detail.guard")} value={detail.guard?.name ?? "—"} />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.deviceTimestamp")}
                    value={detail.deviceTimestamp ? formatDateTime(detail.deviceTimestamp) : "—"}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.locationSource")}
                    value={tt(`locationSources.${detail.locationSource}`)}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow label={tt("detail.method")} value={tt(`methods.${detail.method}`)} />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.accuracy")}
                    value={detail.gpsAccuracyMeters != null ? `${detail.gpsAccuracyMeters} m` : "—"}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.coordinates")}
                    value={formatCoords(detail.latitude, detail.longitude) || tt("coordinates.none")}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.credentialVersion")}
                    value={detail.credentialVersion != null ? String(detail.credentialVersion) : "—"}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.device")}
                    value={[detail.deviceId, detail.deviceCode].filter(Boolean).join(" · ") || "—"}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow label={tt("detail.clientEventId")} value={detail.clientEventId ?? "—"} />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow
                    label={tt("detail.createdAt")}
                    value={formatDateTime(detail.createdAt)}
                  />
                </ITGrid>
                <ITGrid item xs={12} md={6}>
                  <DetailRow label={tt("detail.notes")} value={detail.notes ?? "—"} />
                </ITGrid>
                {detail.voidedAt && (
                  <>
                    <ITGrid item xs={12} md={6}>
                      <DetailRow label={tt("detail.voidReason")} value={detail.voidReason ?? "—"} />
                    </ITGrid>
                    <ITGrid item xs={12} md={6}>
                      <DetailRow
                        label={tt("detail.voidedAt")}
                        value={formatDateTime(detail.voidedAt)}
                      />
                    </ITGrid>
                  </>
                )}
              </ITGrid>
            </div>

            {/* Footer */}
            <ITFlex justify="end" gap={2} className="mt-5 pt-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              {canVoid && !detail.voidedAt && (
                <ITButton
                  variant="outlined"
                  color="danger"
                  onClick={() => {
                    openVoid(detail);
                    setDetail(null);
                  }}
                >
                  <ITFlex align="center" gap={1}>
                    <FaBan size={12} />
                    <ITText className="font-bold text-[11px]">{tt("actions.void")}</ITText>
                  </ITFlex>
                </ITButton>
              )}
              <ITButton variant="filled" color="primary" onClick={() => setDetail(null)}>
                <ITText className="font-bold text-[11px]">{tt("actions.close")}</ITText>
              </ITButton>
            </ITFlex>
          </div>
        )}
      </ITDialog>

      <ITDialog
        isOpen={!!voidTarget}
        onClose={() => setVoidTarget(null)}
        title={tt("void.title")}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITText className="text-[12px] text-slate-600">{tt("void.message")}</ITText>
          <ITTextarea
            name="voidReason"
            label={tt("void.reasonLabel")}
            placeholder={tt("void.reasonPlaceholder")}
            value={voidReason}
            onChange={setVoidReason}
            rows={3}
            maxLength={500}
            error={voidError ?? undefined}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setVoidTarget(null)}>
              {tt("void.cancel")}
            </ITButton>
            <ITButton
              variant="filled"
              color="danger"
              disabled={voidSaving}
              onClick={() => void confirmVoid()}
            >
              {tt("void.confirm")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <ITFlex
      direction="column"
      gap={1}
      className="py-3"
      style={{ borderTop: "1px solid #f1f5f9" }}
    >
      <ITText className="text-xs text-slate-400">{label}</ITText>
      <ITText className="text-sm font-semibold text-slate-800 break-words">{value}</ITText>
    </ITFlex>
  );
}
