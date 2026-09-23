import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITPage,
  ITText,
  ITTextarea,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaBan, FaDoorOpen, FaEye } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { formatFechaHora } from "@shared/utils/dates";
import {
  accessApi,
  type AccessEvent,
  type AccessEventType,
  type AccessLocationSource,
  type Site,
} from "@entities/access";

type BadgeColor = "success" | "warning" | "danger" | "gray" | "info";

const TYPE_COLOR: Record<AccessEventType, BadgeColor> = {
  ENTRY: "success",
  EXIT: "warning",
};

const LOCATION_COLOR: Record<AccessLocationSource, BadgeColor> = {
  GPS: "success",
  SITE_ONLY: "gray",
  MANUAL: "warning",
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
  const role = useSelector((s: RootState) => s.auth.user?.role);
  const canVoid = role === "ADMIN" || role === "RECURSOS_HUMANOS";

  const [sites, setSites] = useState<Site[]>([]);
  const [sitesError, setSitesError] = useState(false);
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [employeeQuery, setEmployeeQuery] = useState("");
  const [includeVoided, setIncludeVoided] = useState(false);
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
    if (includeVoided) filters.includeVoided = true;
    return filters;
  }, [dateRange, employeeQuery, includeVoided]);

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

  const handleDateRange = (
    e:
      | React.ChangeEvent<HTMLInputElement>
      | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    if (Array.isArray(value)) setDateRange(value);
  };

  const typeOptions = useMemo(
    () => [
      { id: "ENTRY", name: tt("types.ENTRY") },
      { id: "EXIT", name: tt("types.EXIT") },
    ],
    [tt]
  );

  const columns: Column<AccessEvent>[] = [
    {
      key: "occurredAt",
      label: tt("columns.occurredAt"),
      type: "date",
      sortable: false,
      render: (e) => (
        <ITText className="text-[11px] font-bold text-slate-700 whitespace-nowrap">
          {formatFechaHora(e.occurredAt)}
        </ITText>
      ),
    },
    {
      key: "employeeNameSnapshot",
      label: tt("columns.employee"),
      type: "string",
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
      key: "locationSource",
      label: tt("columns.locationSource"),
      type: "string",
      render: (e) => (
        <ITBadget color={LOCATION_COLOR[e.locationSource]} size="lg">
          {tt(`locationSources.${e.locationSource}`)}
        </ITBadget>
      ),
    },
    {
      key: "guard.name",
      label: tt("columns.guard"),
      type: "string",
      render: (e) => (
        <ITText className="text-[11px] font-bold text-slate-600">
          {e.guard?.name ?? "—"}
        </ITText>
      ),
    },
    {
      key: "voidedAt",
      label: tt("columns.status"),
      type: "string",
      render: (e) =>
        e.voidedAt ? (
          <ITFlex direction="column" gap={0.5}>
            <ITBadget color="danger" size="lg">
              {tt("status.voided")}
            </ITBadget>
            {e.voidReason && (
              <ITText className="text-[9px] text-slate-400 max-w-[160px] truncate">
                {e.voidReason}
              </ITText>
            )}
          </ITFlex>
        ) : (
          <ITBadget color="success" size="lg">
            {tt("status.active")}
          </ITBadget>
        ),
    },
    {
      key: "actions",
      label: tt("columns.actions"),
      type: "actions",
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
          {canVoid && !e.voidedAt && (
            <ITButton
              variant="outlined"
              size="lg"
              color="danger"
              title={tt("actions.void")}
              onClick={() => openVoid(e)}
            >
              <FaBan size={12} />
            </ITButton>
          )}
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

      <ITFlex wrap="wrap" align="end" gap={3} className="mb-2">
        <ITDatePicker
          name="accessDateRange"
          label={tt("filters.dateRange")}
          range
          value={dateRange}
          onChange={handleDateRange}
          className="min-w-[240px]"
        />
        <ITInput
          name="accessEmployee"
          label={tt("filters.employee")}
          placeholder={tt("filters.employeePlaceholder")}
          value={employeeQuery}
          onChange={(e) => setEmployeeQuery(e.target.value)}
          className="min-w-[220px]"
        />
        <ITCheckbox
          name="accessIncludeVoided"
          label={tt("filters.includeVoided")}
          checked={includeVoided}
          onChange={setIncludeVoided}
          className="pb-2"
        />
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
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        debounceMs={350}
        size="lg"
      />

      <ITDialog
        isOpen={!!detail}
        onClose={() => setDetail(null)}
        title={tt("detail.title")}
        className="max-w-2xl"
      >
        {detailError && (
          <ITAlert variant="error" dismissible onDismiss={() => setDetailError(null)}>
            {detailError}
          </ITAlert>
        )}
        {detail && (
          <ITFlex direction="column" gap={3} className="mt-2">
            <DetailRow label={tt("detail.employee")} value={detail.employeeNameSnapshot ?? "—"} />
            <DetailRow
              label={tt("detail.employeeNumber")}
              value={detail.employeeNumberSnapshot ?? "—"}
            />
            <DetailRow label={tt("detail.type")} value={tt(`types.${detail.type}`)} />
            <DetailRow label={tt("detail.occurredAt")} value={formatFechaHora(detail.occurredAt)} />
            <DetailRow
              label={tt("detail.deviceTimestamp")}
              value={detail.deviceTimestamp ? formatFechaHora(detail.deviceTimestamp) : "—"}
            />
            <DetailRow label={tt("detail.site")} value={detail.site?.name ?? "—"} />
            <DetailRow label={tt("detail.guard")} value={detail.guard?.name ?? "—"} />
            <DetailRow
              label={tt("detail.locationSource")}
              value={tt(`locationSources.${detail.locationSource}`)}
            />
            <DetailRow label={tt("detail.method")} value={tt(`methods.${detail.method}`)} />
            <DetailRow
              label={tt("detail.coordinates")}
              value={formatCoords(detail.latitude, detail.longitude) || tt("coordinates.none")}
            />
            <DetailRow
              label={tt("detail.accuracy")}
              value={detail.gpsAccuracyMeters != null ? `${detail.gpsAccuracyMeters} m` : "—"}
            />
            <DetailRow
              label={tt("detail.credentialVersion")}
              value={detail.credentialVersion != null ? String(detail.credentialVersion) : "—"}
            />
            <DetailRow label={tt("detail.clientEventId")} value={detail.clientEventId ?? "—"} />
            <DetailRow
              label={tt("detail.device")}
              value={[detail.deviceId, detail.deviceCode].filter(Boolean).join(" · ") || "—"}
            />
            <DetailRow label={tt("detail.notes")} value={detail.notes ?? "—"} />
            <DetailRow
              label={tt("detail.status")}
              value={detail.voidedAt ? tt("status.voided") : tt("status.active")}
            />
            {detail.voidedAt && (
              <>
                <DetailRow label={tt("detail.voidReason")} value={detail.voidReason ?? "—"} />
                <DetailRow
                  label={tt("detail.voidedAt")}
                  value={formatFechaHora(detail.voidedAt)}
                />
              </>
            )}
            <DetailRow label={tt("detail.createdAt")} value={formatFechaHora(detail.createdAt)} />
          </ITFlex>
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
    <ITFlex direction="column" gap={0.5}>
      <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">
        {label}
      </ITText>
      <ITText className="text-[12px] font-bold text-slate-800 break-words">{value}</ITText>
    </ITFlex>
  );
}
