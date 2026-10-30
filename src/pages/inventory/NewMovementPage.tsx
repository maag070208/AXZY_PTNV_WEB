import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ITBentoGrid,
  ITBentoSegments,
  ITBentoTile,
  ITButton,
  ITChip,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { LuArrowLeftRight, LuBoxes, LuCheck, LuInfo, LuPackageOpen, LuTrash2 } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import {
  inventoryApi,
  type Condition,
  type Device,
  type DeviceUnit,
  type DeviceUnitStatus,
  type DeviceType,
  type MovementType,
} from "@entities/inventory";
import {
  UnitIdentityEditor,
  emptyUnitRow,
  resizeUnitRows,
  usesUnitIdentity,
  type UnitIdentityRow,
} from "@features/inventory/unit-identities";
import { i18n } from "@shared/i18n";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { newId } from "@shared/lib/newId";
import { useGoBack } from "@shared/lib/useGoBack";
import { InsightNote, MiniList, Num } from "@shared/ui/bento-bits";
import { FormSection } from "@shared/ui/form-section";
import { LangostinGuide, LangostinState, type LangostinGuideStatus } from "@shared/ui/langostin";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { StickyActions } from "@shared/ui/sticky-actions";
/** Nombre de cada estado de pieza, ya traducido por el namespace de inventario. */
const STATUS_LABEL_KEY = {
  AVAILABLE: "dashboard.available",
  ON_LOAN: "dashboard.loaned",
  DAMAGED: "dashboard.damaged",
  IN_MAINTENANCE: "dashboard.maintenance",
  RETIRED: "dashboard.retirement",
} as const;

/** Token de color de cada estado de pieza (el estado, no la alarma). */
const STATUS_TONE: Record<DeviceUnitStatus, string> = {
  AVAILABLE: "success",
  ON_LOAN: "warning",
  DAMAGED: "danger",
  IN_MAINTENANCE: "info",
  RETIRED: "slate-500",
};

const MOVEMENT_HINT_KEY = {
  STOCK_IN: "movementHint.STOCK_IN",
  RETIREMENT: "movementHint.RETIREMENT",
  MAINTENANCE_IN: "movementHint.MAINTENANCE_IN",
  MAINTENANCE_OUT: "movementHint.MAINTENANCE_OUT",
} as const;

/** Tipos que se registran desde esta pantalla, en el orden en que se muestran. */
const TYPES = ["STOCK_IN", "RETIREMENT", "MAINTENANCE_IN", "MAINTENANCE_OUT"] as const;

type FormMovementType = (typeof TYPES)[number];

/** Tono pastel de cada tipo: identifica la operación, no la alarma. */
const TYPE_TONE: Record<FormMovementType, "success" | "danger" | "secondary" | "info"> = {
  STOCK_IN: "success",
  RETIREMENT: "danger",
  MAINTENANCE_IN: "secondary",
  MAINTENANCE_OUT: "info",
};

/**
 * La ENTRADA es distinta al resto: no mueve una pieza que ya existe, crea
 * piezas NUEVAS (con su folio de activo fijo), así que en su renglón se pide una
 * cantidad en vez de elegir la unidad física.
 */
const isEntry = (type: MovementType | ""): boolean => type === "STOCK_IN";

/** Tope de piezas por entrada, el mismo que valida la API. */
const MAX_ENTRY_QUANTITY = 5000;

interface Row {
  key: string;
  typeFilter: string;
  deviceId: string;
  unitId: string;
  type: MovementType | "";
  /** Piezas nuevas que crea una entrada (los demás tipos mueven una). */
  quantity: number;
  /** Identificación de cada pieza nueva de la entrada (serie, MAC, IP…). */
  unitRows: UnitIdentityRow[];
  condition: Condition | "";
  reason: string;
  notes: string;
  units: DeviceUnit[];
  unitsLoading: boolean;
}

const CONDITIONS: Condition[] = ["GOOD", "FAIR", "POOR", "BROKEN"];

/** Tono pastel de cada condición de la pieza. */
const CONDITION_TONE: Record<Condition, "success" | "info" | "warning" | "danger"> = {
  GOOD: "success",
  FAIR: "info",
  POOR: "warning",
  BROKEN: "danger",
};

const OPERABLE_STATUSES: DeviceUnitStatus[] = ["AVAILABLE", "IN_MAINTENANCE"];

/** Estado que la pieza debe tener para que el movimiento la pueda tomar. */
const UNIT_STATUS: Partial<Record<MovementType, DeviceUnitStatus>> = {
  RETIREMENT: "AVAILABLE",
  MAINTENANCE_IN: "AVAILABLE",
  MAINTENANCE_OUT: "IN_MAINTENANCE",
};

/** Fondo y tinta de una píldora seleccionable, con tokens (claro y oscuro). */
const pillStyle = (tone: string, active: boolean): CSSProperties =>
  active
    ? {
        background: `color-mix(in srgb, var(--color-${tone}) 16%, transparent)`,
        color: `color-mix(in srgb, var(--color-${tone}) 68%, var(--color-text-default))`,
      }
    : { background: "color-mix(in srgb, currentColor 6%, transparent)", color: "inherit", opacity: 0.75 };

/** Chip de estado con el componente del sistema (el tono se mapea a su color). */
const CHIP_COLOR: Record<string, "success" | "warning" | "danger" | "info" | "gray"> = {
  success: "success",
  warning: "warning",
  danger: "danger",
  info: "info",
  primary: "info",
  secondary: "gray",
};

function StatusChip({ label, tone, icon }: { label: string; tone: string; icon?: ReactNode }) {
  return (
    <ITChip size="sm" color={CHIP_COLOR[tone] ?? "gray"} icon={icon}>
      {label}
    </ITChip>
  );
}

/** Botón píldora de una opción (tipo de movimiento, condición): pastel al elegirse. */
const pillClass =
  "inline-flex cursor-pointer items-center gap-1.5 rounded-full !border-0 px-3 py-1.5 text-[12px] font-semibold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]";

export default function NewMovementPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [searchParams] = useSearchParams();
  const requestKey = useRequestKey();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    Promise.all([inventoryApi.types(), inventoryApi.devices()])
      .then(([ts, ds]) => {
        setTypes(ts);
        setDevices(ds);
        // Atajo desde el detalle del dispositivo ("Agregar unidades"): el
        // renglón llega con el dispositivo —y el tipo— ya elegidos.
        const deviceId = searchParams.get("deviceId") ?? "";
        const type = searchParams.get("type");
        const row = emptyRow({
          deviceId,
          type: type === "STOCK_IN" ? "STOCK_IN" : "",
        });
        setRows([row]);
        if (deviceId) void loadUnits(row.key, deviceId);
      })
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false));
    // Sólo al montar: los parámetros de la URL son del atajo, no del formulario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUnits = async (key: string, deviceId: string) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, units: [], unitsLoading: true } : x)));
    try {
      const all = await inventoryApi.units(deviceId);
      setRows((r) => r.map((x) => (x.key === key ? { ...x, units: all, unitsLoading: false } : x)));
    } catch {
      setRows((r) => r.map((x) => (x.key === key ? { ...x, units: [], unitsLoading: false } : x)));
      setToast({ message: i18n.t("inventory:units.loadError"), type: "error" });
    }
  };

  const updateRow = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  /** La cantidad manda: se ajustan los renglones de identidad conservando lo ya capturado. */
  const setQuantity = (key: string, quantity: number) => {
    setRows((r) =>
      r.map((x) => (x.key === key ? { ...x, quantity, unitRows: resizeUnitRows(x.unitRows, quantity) } : x))
    );
  };

  const updateUnitRow = (key: string, id: number, field: keyof UnitIdentityRow, value: string) => {
    setRows((r) =>
      r.map((x) =>
        x.key === key ? { ...x, unitRows: x.unitRows.map((u) => (u.id === id ? { ...u, [field]: value } : u)) } : x
      )
    );
  };

  const selectDevice = (key: string, deviceId: string) => {
    // Cambiar de dispositivo suelta la pieza elegida (era de otro equipo), pero
    // conserva el tipo: es la intención del movimiento y se valida con las piezas.
    updateRow(key, { deviceId, unitId: "", units: [] });
    if (deviceId) loadUnits(key, deviceId);
  };

  const selectFilterType = (key: string, typeId: string) => {
    updateRow(key, { typeFilter: typeId, deviceId: "", unitId: "", units: [] });
  };

  const selectType = (key: string, tp: MovementType) => {
    setRows((r) =>
      r.map((x) => {
        if (x.key !== key) return x;
        // La entrada no toca piezas existentes: se suelta la unidad elegida.
        if (isEntry(tp)) return { ...x, type: tp, unitId: "" };
        const validStatus = UNIT_STATUS[tp];
        const unitOk = x.unitId && validStatus && x.units.find((u) => u.id === x.unitId)?.status === validStatus;
        return { ...x, type: tp, unitId: unitOk ? x.unitId : "" };
      })
    );
  };

  const emptyRow = (patch: Partial<Row> = {}): Row => ({
    key: newId(),
    typeFilter: "",
    deviceId: "",
    unitId: "",
    type: "",
    quantity: 1,
    unitRows: [emptyUnitRow()],
    condition: "",
    reason: "",
    notes: "",
    units: [],
    unitsLoading: false,
    ...patch,
  });

  const addRow = () => setRows((r) => [...r, emptyRow()]);
  const removeRow = (key: string) => setRows((r) => r.filter((x) => x.key !== key));

  const visibleUnits = (r: Row) => {
    // Una entrada crea piezas nuevas: no hay unidad que elegir.
    if (isEntry(r.type)) return [];
    const base = r.units.filter((u) => OPERABLE_STATUSES.includes(u.status));
    const status = r.type ? UNIT_STATUS[r.type as MovementType] : undefined;
    return status ? base.filter((u) => u.status === status) : base;
  };

  const unitLabel = (u: DeviceUnit) => {
    const extras = [u.serialNumber, u.hostname, u.macAddress].filter(Boolean).join(" · ");
    return `${u.assetTag}${extras ? ` · ${extras}` : ""} · ${t(`unitStatus.${u.status}`)}`;
  };

  const deviceOf = (r: Row) => devices.find((d) => d.id === r.deviceId);

  /** El renglón tiene todo lo que la API exige para registrarse. */
  const validRow = (r: Row) =>
    !!r.deviceId &&
    !!r.type &&
    (isEntry(r.type) ? r.quantity >= 1 && r.quantity <= MAX_ENTRY_QUANTITY : !!r.unitId) &&
    (r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN" ? !!r.reason.trim() : true) &&
    (r.type !== "MAINTENANCE_OUT" || !!r.condition);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    rows.forEach((r, idx) => {
      if ((r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN") && r.reason.trim().length < 3) {
        e[`reason-${idx}`] = i18n.t("inventory:validation.reasonMin", { min: 3 });
      }
      if (r.type === "MAINTENANCE_OUT" && r.notes.trim().length > 0 && r.notes.trim().length < 3) {
        e[`notes-${idx}`] = i18n.t("inventory:validation.notesMin", { min: 3 });
      }
      if (isEntry(r.type) && (r.quantity < 1 || r.quantity > MAX_ENTRY_QUANTITY)) {
        e[`quantity-${idx}`] = i18n.t("inventory:validation.quantityRange", { max: MAX_ENTRY_QUANTITY });
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = rows.length > 0 && rows.every(validRow);

  /** Piezas que toca el movimiento: una por renglón, o la cantidad si es entrada. */
  const pieceCount = rows.reduce((sum, r) => sum + (isEntry(r.type) ? r.quantity : 1), 0);

  /** Dispositivos distintos del borrador y su existencia real (la que trae la API). */
  const selectedDevices = useMemo(() => {
    const ids = new Set(rows.map((r) => r.deviceId).filter(Boolean));
    return devices.filter((d) => ids.has(d.id));
  }, [rows, devices]);

  const stock = useMemo(
    () =>
      selectedDevices.reduce(
        (acc, d) => {
          acc.available += d.stock?.AVAILABLE ?? 0;
          acc.inMaintenance += d.stock?.IN_MAINTENANCE ?? 0;
          return acc;
        },
        { available: 0, inMaintenance: 0 }
      ),
    [selectedDevices]
  );

  const readyRows = rows.filter(validRow).length;
  const typeCount = new Set(rows.map((r) => r.type).filter(Boolean)).size;
  /** Lo que la API va a crear: un movimiento por tipo presente en el borrador. */
  const createdMovements = TYPES.filter((tp) => rows.some((r) => r.type === tp));
  // La insignia de la sección solo se marca cuando el formulario pasaría la validación.
  const formComplete =
    isValid &&
    rows.every((r) => {
      const reasonOk = r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN" ? r.reason.trim().length >= 3 : true;
      const notesOk = r.type === "MAINTENANCE_OUT" && r.notes.trim() ? r.notes.trim().length >= 3 : true;
      return reasonOk && notesOk;
    });
  const sectionsDone = (formComplete ? 1 : 0) + (typeCount > 0 ? 1 : 0);

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: i18n.t("common:validation.reviewFields"), type: "error" });
      return;
    }
    setSaving(true);
    try {
      const groups = new Map<MovementType, Row[]>();
      rows.forEach((r) => {
        if (!r.type) return;
        const arr = groups.get(r.type) ?? [];
        arr.push(r);
        groups.set(r.type, arr);
      });
      await Promise.all(
        // Un movimiento por tipo, cada uno con su clave: al reintentar tras un
        // fallo parcial, los que ya entraron no se duplican.
        [...groups.entries()].map(([tp, rs]) => {
          const payload = {
            type: tp,
            reason: rs.find((r) => r.reason.trim())?.reason || undefined,
            items: rs.map((r) => ({
              deviceId: r.deviceId,
              ...(isEntry(tp)
                ? {
                    quantity: r.quantity,
                    // Posicional: la pieza i lleva la identidad del renglón i.
                    units: r.unitRows.map((u) => ({
                      serialNumber: u.serialNumber || undefined,
                      macAddress: u.macAddress || undefined,
                      ip: u.ip || undefined,
                      hostname: u.hostname || undefined,
                    })),
                  }
                : { unitId: r.unitId, quantity: 1 }),
              condition: tp === "MAINTENANCE_OUT" ? (r.condition as Condition) : undefined,
              notes: r.notes.trim() ? r.notes : undefined,
            })),
          };
          return inventoryApi.registerMovement(payload, requestKey(payload));
        })
      );
      setToast({ message: t("messages.movementRegistered"), type: "success" });
      setTimeout(() => goBack("/inventory/movements"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("new.title")} backAction={() => goBack("/inventory/movements")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  if (loadError) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("new.title")} backAction={() => goBack("/inventory/movements")}>
        <LangostinState
          kind="error"
          action={
            <ITButton variant="rounded" color="primary" size="sm" onClick={() => goBack("/inventory/movements")}>
              {t("common:actions.back")}
            </ITButton>
          }
        />
      </ITPage>
    );
  }

  // Sin catálogo no hay nada que mover: se dice y se lleva al alta de dispositivos.
  if (devices.length === 0) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={t("new.title")}
        description={t("new.description")}
        backAction={() => goBack("/inventory/movements")}
      >
        <LangostinState
          kind="empty"
          title={t("new.noDevicesTitle")}
          description={t("new.noDevicesHint")}
          action={
            <ITButton variant="rounded" color="primary" size="sm" onClick={() => navigate("/inventory/devices")}>
              {t("new.goDevices")}
            </ITButton>
          }
        />
      </ITPage>
    );
  }

  // Pistas de Langostín por campo (clave = atributo `name` del input).
  const hints: Record<string, string> = {};
  for (const r of rows) {
    hints[`typeFilter-${r.key}`] = t("new.hints.typeFilter");
    hints[`device-${r.key}`] = t("new.hints.device");
    hints[`unit-${r.key}`] = t("new.hints.unit");
    hints[`quantity-${r.key}`] = t("new.hints.quantity");
    hints[`reason-${r.key}`] = t("new.hints.reason");
    hints[`notes-${r.key}`] = t("new.hints.notes");
  }
  const guideStatus: LangostinGuideStatus = saving
    ? "saving"
    : toast?.type === "success"
      ? "saved"
      : toast?.type === "error" || Object.keys(errors).length > 0
        ? "error"
        : "idle";

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("new.title")}
      description={t("new.formSub")}
      icon={<LuArrowLeftRight size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("movements.title"), onClick: () => navigate("/inventory/movements") }, { label: t("movements.new") }]}
      backAction={() => goBack("/inventory/movements")}
    >
      {/* El borrador en mosaicos: piezas, avance de los renglones y la existencia
          real del dispositivo elegido (stock que devuelve la API). */}
      <ITBentoGrid className="mb-4">
        <ITBentoTile
          tone="sea"
          cols={selectedDevices.length === 0 ? 12 : 6}
          rows={2}
          wide
          icon={<LuPackageOpen size={15} />}
          label={t("new.boardTitle")}
          value={<Num value={pieceCount} />}
          caption={t("new.boardRows", { count: rows.length })}
        >
          <div className="my-1 flex min-h-0 flex-1 flex-col justify-center gap-2">
            {rows.length > 1 && (
              <div className="h-6">
                <ITBentoSegments total={rows.length} done={readyRows} color="var(--color-success)" />
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 text-[11.5px] font-semibold">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: "color-mix(in srgb, currentColor 12%, transparent)" }}
              >
                <LuBoxes size={12} />
                {t("new.boardDevices", { count: selectedDevices.length })}
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{ background: "color-mix(in srgb, currentColor 12%, transparent)" }}
              >
                <LuArrowLeftRight size={12} />
                {t("new.boardTypes", { count: typeCount })}
              </span>
            </div>
          </div>
        </ITBentoTile>

        {/* Existencia real del dispositivo elegido: solo aparece cuando hay uno. */}
        {selectedDevices.length > 0 && (
          <ITBentoTile
            tone="mint"
            cols={6}
            rows={2}
            wide
            icon={<LuBoxes size={15} />}
            label={t("dashboard.available")}
            value={selectedDevices.length === 0 ? "—" : <Num value={stock.available} />}
            caption={
              selectedDevices.length === 0 ? (
                t("new.stockPick")
              ) : (
                <span className="break-words">
                  {selectedDevices.length === 1 ? selectedDevices[0].name : t("new.stockTitleMany", { count: selectedDevices.length })}
                </span>
              )
            }
            aside={
              selectedDevices.length > 0 ? (
                <div className="text-right">
                  <div className="it-bento-tile__value !text-[20px]">{stock.inMaintenance}</div>
                  <small className="it-bento-tile__caption">{t("dashboard.maintenance")}</small>
                </div>
              ) : undefined
            }
          />
        )}
      </ITBentoGrid>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          {/* ① El renglón: tipo de movimiento (con su explicación), piezas y motivo. */}
          <FormSection
            number={1}
            icon={<LuPackageOpen size={16} />}
            title={t("new.sectionRow")}
            description={t("new.sectionRowHint")}
            complete={formComplete}
          >
            <div className="flex flex-col gap-3">
              {rows.map((r, idx) => {
                const visible = visibleUnits(r);
                const device = deviceOf(r);
                const unitSel = r.unitId ? r.units.find((u) => u.id === r.unitId) : undefined;
                const validStatus = r.type ? UNIT_STATUS[r.type] : undefined;
                const validTypes = unitSel ? TYPES.filter((tp) => UNIT_STATUS[tp] === unitSel.status) : TYPES;
                const availFiltered = r.typeFilter ? devices.filter((d) => d.typeId === r.typeFilter) : devices;
                return (
                  <div
                    key={r.key}
                    className="flex flex-col gap-3 rounded-[16px] bg-[color-mix(in_srgb,currentColor_4%,transparent)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <p className="m-0 text-[12px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                          {t("new.item")} {idx + 1}
                        </p>
                        {device && <StatusChip label={device.name} tone="primary" icon={<LuBoxes size={11} />} />}
                      </div>
                      {rows.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRow(r.key)}
                          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full !border-0 px-2.5 py-1 text-[11.5px] font-semibold transition hover:brightness-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)]"
                          style={{
                            background: "color-mix(in srgb, var(--color-danger) 12%, transparent)",
                            color: "color-mix(in srgb, var(--color-danger) 68%, var(--color-text-default))",
                          }}
                        >
                          <LuTrash2 size={12} />
                          {t("common:actions.delete")}
                        </button>
                      )}
                    </div>

                    {/* El tipo primero: explica qué le pasa a las piezas y filtra la unidad. */}
                    <div className="flex flex-col gap-2">
                      <p className="m-0 text-[12px] font-semibold text-slate-700">{t("new.howLabel")}</p>
                      <div role="group" aria-label={t("new.howLabel")} className="flex flex-wrap gap-2">
                        {validTypes.map((tp) => {
                          const active = r.type === tp;
                          return (
                            <button
                              key={tp}
                              type="button"
                              aria-pressed={active}
                              onClick={() => selectType(r.key, tp)}
                              className={pillClass}
                              style={pillStyle(TYPE_TONE[tp], active)}
                            >
                              {active ? <LuCheck size={12} strokeWidth={3} /> : null}
                              {t(`typeLabels.${tp}`)}
                            </button>
                          );
                        })}
                      </div>
                      {!r.type ? (
                        <p className="m-0 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                          {t("new.chooseType")}
                        </p>
                      ) : (
                        <InsightNote icon={<LuInfo size={13} />}>
                          {t(MOVEMENT_HINT_KEY[r.type as keyof typeof MOVEMENT_HINT_KEY])}
                        </InsightNote>
                      )}
                      {r.type && validStatus && (
                        <div className="flex flex-wrap items-center gap-2 text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>
                          <span>{t("new.piecesStatus")}</span>
                          <StatusChip label={t(STATUS_LABEL_KEY[validStatus])} tone={STATUS_TONE[validStatus]} icon={<span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--color-${STATUS_TONE[validStatus]})` }} />} />
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <div className="min-w-[190px] flex-1">
                        <ITSearchSelect
                          name={`typeFilter-${r.key}`}
                          label={t("new.typeFilter")}
                          placeholder={t("new.typeFilterPlaceholder")}
                          options={[{ value: "", label: t("new.all") }, ...types.map((tp) => ({ value: tp.id, label: tp.name }))]}
                          value={r.typeFilter}
                          onChange={(v) => selectFilterType(r.key, String(v))}
                        />
                      </div>
                      <div className="min-w-[190px] flex-1">
                        <ITSearchSelect
                          name={`device-${r.key}`}
                          label={t("new.productType")}
                          placeholder={t("new.productTypePlaceholder")}
                          options={availFiltered.map((d) => ({ value: d.id, label: `${d.name} (${d.brand} ${d.model})` }))}
                          value={r.deviceId}
                          onChange={(v) => selectDevice(r.key, String(v))}
                        />
                      </div>
                    </div>

                    {isEntry(r.type) ? (
                      <div>
                        <ITInput
                          name={`quantity-${r.key}`}
                          type="number"
                          label={t("new.quantity")}
                          value={String(r.quantity)}
                          onChange={(e) =>
                            setQuantity(
                              r.key,
                              Math.min(MAX_ENTRY_QUANTITY, Math.max(1, Number(e.target.value.replace(/[^0-9]/g, "")) || 1))
                            )
                          }
                          aria-invalid={!!errors[`quantity-${idx}`]}
                        />
                        {errors[`quantity-${idx}`] && (
                          <span role="alert" className="mt-1 block text-xs" style={{ color: "var(--color-danger)" }}>
                            {errors[`quantity-${idx}`]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <ITSearchSelect
                        name={`unit-${r.key}`}
                        label={t("new.unit")}
                        placeholder={t("new.unitPlaceholder")}
                        options={visible.map((u) => ({ value: u.id, label: unitLabel(u) }))}
                        value={r.unitId}
                        disabled={!r.deviceId}
                        isLoading={r.unitsLoading}
                        onChange={(v) => updateRow(r.key, { unitId: String(v) })}
                      />
                    )}

                    {r.deviceId && !isEntry(r.type) && !r.unitsLoading && visible.length === 0 && (
                      <p className="m-0 text-[12px] font-semibold" style={{ color: "var(--color-warning)" }}>
                        {t("new.withoutUnitsStatus")}
                      </p>
                    )}

                    {(r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN" || isEntry(r.type)) && (
                      <div>
                        <ITInput
                          name={`reason-${r.key}`}
                          label={t("new.reason")}
                          value={r.reason}
                          onChange={(e) => updateRow(r.key, { reason: e.target.value })}
                          required={!isEntry(r.type)}
                          aria-invalid={!!errors[`reason-${idx}`]}
                        />
                        {errors[`reason-${idx}`] && (
                          <span role="alert" className="mt-1 block text-xs" style={{ color: "var(--color-danger)" }}>
                            {errors[`reason-${idx}`]}
                          </span>
                        )}
                      </div>
                    )}

                    {r.type === "MAINTENANCE_OUT" && (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-2">
                          <p className="m-0 text-[12px] font-semibold text-slate-700">{t("loanReturn.condition")}</p>
                          <div role="group" aria-label={t("loanReturn.condition")} className="flex flex-wrap gap-2">
                            {CONDITIONS.map((c) => {
                              const active = r.condition === c;
                              return (
                                <button
                                  key={c}
                                  type="button"
                                  aria-pressed={active}
                                  onClick={() => updateRow(r.key, { condition: c })}
                                  className={pillClass}
                                  style={pillStyle(CONDITION_TONE[c], active)}
                                >
                                  {t(`loanReturn.conditionLabels.${c}`)}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                        <div>
                          <ITInput
                            name={`notes-${r.key}`}
                            label={t("new.comment")}
                            value={r.notes}
                            onChange={(e) => updateRow(r.key, { notes: e.target.value })}
                            aria-invalid={!!errors[`notes-${idx}`]}
                          />
                          {errors[`notes-${idx}`] && (
                            <span role="alert" className="mt-1 block text-xs" style={{ color: "var(--color-danger)" }}>
                              {errors[`notes-${idx}`]}
                            </span>
                          )}
                        </div>
                        {r.condition === "BROKEN" && (
                          <p className="m-0 text-[11.5px] font-semibold" style={{ color: "var(--color-danger)" }}>
                            {t("loanReturn.brokenRetirementHint")}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Las piezas nuevas se identifican aquí mismo (serie, MAC, IP):
                        es opcional y por pieza, y el tipo del dispositivo decide qué
                        campos se piden. */}
                    {isEntry(r.type) && usesUnitIdentity(device?.type) && (
                      <div
                        className="flex flex-col gap-2 rounded-[14px] p-3"
                        style={{ background: "color-mix(in srgb, currentColor 4%, transparent)" }}
                      >
                        <p className="m-0 text-[12px] font-semibold text-slate-700">
                          {t("new.identifyPieces", { count: r.quantity })}
                        </p>
                        <p className="m-0 text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>
                          {t("new.identifyPiecesHint")}
                        </p>
                        <UnitIdentityEditor
                          type={device?.type}
                          units={r.unitRows}
                          onChange={(id, field, value) => updateUnitRow(r.key, id, field, value)}
                          label={(index) => `${t("new.pieceRow")} ${index + 1}`}
                          openFirst={1}
                        />
                      </div>
                    )}
                  </div>
                );
              })}

              <div>
                <ITButton variant="outlined" color="secondary" size="sm" className="!rounded-full" onClick={addRow}>
                  + {t("new.addRow")}
                </ITButton>
              </div>
            </div>
          </FormSection>

          {/* ② Cómo se registra: la API guarda un movimiento por tipo. */}
          <FormSection
            number={2}
            icon={<LuArrowLeftRight size={16} />}
            title={t("new.sectionReview")}
            description={t("new.sectionReviewHint")}
            complete={typeCount > 0}
          >
            {createdMovements.length === 0 ? (
              <InsightNote icon={<LuInfo size={13} />}>{t("new.reviewEmpty")}</InsightNote>
            ) : (
              <div className="flex flex-col gap-2">
                {createdMovements.map((tp) => {
                  const group = rows.filter((r) => r.type === tp);
                  const pieces = group.reduce((sum, r) => sum + (isEntry(tp) ? r.quantity : 1), 0);
                  const names = [...new Set(group.map((r) => deviceOf(r)?.name).filter(Boolean))].join(" · ");
                  return (
                    <div
                      key={tp}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[14px] bg-[color-mix(in_srgb,currentColor_4%,transparent)] px-3 py-2"
                    >
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <StatusChip label={t(`typeLabels.${tp}`)} tone={TYPE_TONE[tp]} icon={<span aria-hidden className="h-1.5 w-1.5 rounded-full" style={{ background: `var(--color-${TYPE_TONE[tp]})` }} />} />
                        <p className="m-0 min-w-0 truncate text-[12.5px] font-semibold text-slate-700">
                          {names || t("new.summaryNoDevices")}
                        </p>
                      </div>
                      <p className="m-0 shrink-0 text-[11.5px] font-semibold" style={{ color: "var(--color-text-muted)" }}>
                        {t("new.quantityPieces", { count: pieces })}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </FormSection>
        </div>

        {/* Resumen vivo: lo capturado hasta ahora, en lenguaje humano. */}
        <LiveSummary
          title={t("new.summaryTitle")}
          total={2}
          done={sectionsDone}
          footer={
            typeCount > 0 ? (
              <p className="m-0 text-[11.5px]" style={{ color: "var(--color-text-muted)" }}>
                {t("new.summaryHint", { count: typeCount })}
              </p>
            ) : undefined
          }
        >
          {selectedDevices.length > 0 && (
            <MiniList
              icon={<LuBoxes size={13} />}
              title={t("new.summaryDevices")}
              emptyLabel={t("new.summaryNoDevices")}
              items={selectedDevices.map((d) => ({
                id: d.id,
                name: d.name,
                right: t("new.availableCount", { count: d.stock?.AVAILABLE ?? 0 }),
              }))}
            />
          )}
          <LiveSummaryRow label={t("new.summaryTypes")} value={createdMovements.map((tp) => t(`typeLabels.${tp}`)).join(" · ")} />
          <LiveSummaryRow label={t("new.pieces")} value={pieceCount} />
          <LiveSummaryRow
            label={t("new.summaryReason")}
            value={rows.map((r) => r.reason.trim()).filter(Boolean).join(" · ")}
          />
        </LiveSummary>
      </div>

      <StickyActions>
        <ITButton
          label={t("common:actions.cancel")}
          variant="outlined"
          color="gray"
          size="sm"
          className="!rounded-full"
          onClick={() => goBack("/inventory/movements")}
          disabled={saving}
        />
        <ITButton
          label={saving ? t("new.saving") : t("new.register")}
          variant="rounded"
          color="primary"
          size="sm"
          onClick={() => void handleSubmit()}
          disabled={saving || !isValid}
        />
      </StickyActions>

      <LangostinGuide
        storageKey="inventory-movement-new"
        hints={hints}
        status={guideStatus}
        defaultText={t("new.hints.default")}
      />

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}
