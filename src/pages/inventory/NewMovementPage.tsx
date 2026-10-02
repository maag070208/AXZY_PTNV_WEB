import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Condition, type Device, type DeviceUnitStatus, type DeviceType, type MovementType, type DeviceUnit } from "@entities/inventory";
import { TYPE_BADGE_COLOR } from "@entities/inventory/model/movementColors";
import {
  UnitIdentityEditor,
  emptyUnitRow,
  resizeUnitRows,
  usesUnitIdentity,
  type UnitIdentityRow,
} from "@features/inventory/unit-identities";
import { i18n } from "@shared/i18n";
import { useRequestKey } from "@shared/lib/useRequestKey";

const STATUS_LABEL_KEY = {
  AVAILABLE: "dashboard.available",
  ON_LOAN: "dashboard.loaned",
  DAMAGED: "dashboard.damaged",
  IN_MAINTENANCE: "dashboard.maintenance",
  RETIRED: "dashboard.retirement",
} as const;

const MOVEMENT_HINT_KEY = {
  STOCK_IN: "movementHint.STOCK_IN",
  RETIREMENT: "movementHint.RETIREMENT",
  MAINTENANCE_IN: "movementHint.MAINTENANCE_IN",
  MAINTENANCE_OUT: "movementHint.MAINTENANCE_OUT",
} as const;

const TYPES: MovementType[] = ["STOCK_IN", "RETIREMENT", "MAINTENANCE_IN", "MAINTENANCE_OUT"];

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

const CONDITION_BADGE_COLOR = {
  GOOD: "success",
  FAIR: "info",
  POOR: "warning",
  BROKEN: "danger",
} as const;

const OPERABLE_STATUSES: DeviceUnitStatus[] = ["AVAILABLE", "IN_MAINTENANCE"];

const UNIT_STATUS: Partial<Record<MovementType, DeviceUnitStatus>> = {
  RETIREMENT: "AVAILABLE",
  MAINTENANCE_IN: "AVAILABLE",
  MAINTENANCE_OUT: "IN_MAINTENANCE",
};

export default function NewMovementPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestKey = useRequestKey();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
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
      window.alert(i18n.t("inventory:units.loadError"));
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
    updateRow(key, { deviceId, unitId: "", type: "", units: [] });
    if (deviceId) loadUnits(key, deviceId);
  };

  const selectFilterType = (key: string, typeId: string) => {
    updateRow(key, { typeFilter: typeId, deviceId: "", unitId: "", type: "", units: [] });
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
    key: crypto.randomUUID(),
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

  /** Dispositivo del renglón (trae su tipo, que decide qué identidad se pide). */
  const deviceOf = (r: Row) => devices.find((d) => d.id === r.deviceId);

  const isValid = rows.length > 0 && rows.every(validRow);

  /** Piezas que toca el movimiento: una por renglón, o la cantidad si es entrada. */
  const pieceCount = rows.reduce((sum, r) => sum + (isEntry(r.type) ? r.quantity : 1), 0);

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
      setTimeout(() => navigate("/inventory/movements"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        noPadding title={t("new.title")} backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      noPadding
      title={t("new.title")}
      description={t("new.description")}
      icon={<FaSave size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("movements.title"), onClick: () => navigate("/inventory/movements") }, { label: t("movements.new") }]}
      backAction={() => navigate("/inventory/movements")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("new.register")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex as="section" direction="column" gap={5} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ITText className="text-sm font-semibold text-slate-700">{t("new.detail")}</ITText>

        <ITFlex align="center" justify="between" gap={2}>
          <ITText className="text-[11px] font-bold text-slate-500">
            {rows.length} {rows.length === 1 ? t("new.row") : t("new.rows")} · {pieceCount}{" "}
            {pieceCount === 1 ? t("new.piece") : t("new.pieces")}
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={4}>
          {rows.map((r, idx) => {
            const visible = visibleUnits(r);
            const validStatus = r.type ? UNIT_STATUS[r.type as MovementType] : undefined;
            const availFiltered = r.typeFilter ? devices.filter((d) => d.typeId === r.typeFilter) : devices;
            const unitSel = r.unitId ? r.units.find((u) => u.id === r.unitId) : undefined;
            const validTypes = unitSel ? TYPES.filter((tp) => UNIT_STATUS[tp as MovementType] === unitSel.status) : TYPES;
            return (
              <ITFlex key={r.key} direction="column" gap={3} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <ITFlex align="center" justify="between" gap={2}>
                  <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {t("new.item")} {idx + 1}
                  </ITText>
                  <ITButton variant="outlined" color="error" size="lg" onClick={() => removeRow(r.key)} disabled={rows.length === 1}>
                    {t("common:actions.delete")}
                  </ITButton>
                </ITFlex>

                <ITGrid container columns={12} spacing={3}>
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      label={t("new.typeFilter")}
                      placeholder={t("new.typeFilterPlaceholder")}
                      options={[{ value: "", label: t("new.all") }, ...types.map((tp) => ({ value: tp.id, label: tp.name }))]}
                      value={r.typeFilter}
                      onChange={(v) => selectFilterType(r.key, String(v))}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      label={t("new.productType")}
                      placeholder={t("new.productTypePlaceholder")}
                      options={availFiltered.map((d) => ({ value: d.id, label: `${d.name} (${d.brand} ${d.model})` }))}
                      value={r.deviceId}
                      onChange={(v) => selectDevice(r.key, String(v))}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
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
                          <span role="alert" className="text-red-500 text-xs mt-1 block">
                            {errors[`quantity-${idx}`]}
                          </span>
                        )}
                      </div>
                    ) : (
                      <ITSearchSelect
                        label={t("new.unit")}
                        placeholder={t("new.unitPlaceholder")}
                        options={visible.map((u) => ({ value: u.id, label: unitLabel(u) }))}
                        value={r.unitId}
                        disabled={!r.deviceId}
                        isLoading={r.unitsLoading}
                        onChange={(v) => updateRow(r.key, { unitId: String(v) })}
                      />
                    )}
                  </ITGrid>
                </ITGrid>

                <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("new.howLabel")}</ITText>
                <ITFlex gap={2} wrap="wrap">
                  {validTypes.map((tp) => {
                    const sel = r.type === tp;
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => selectType(r.key, tp)}
                        className={`rounded-full p-0 transition-all ${sel ? "shadow-md scale-105" : "opacity-50 hover:opacity-100"}`}
                      >
                        <ITBadget color={TYPE_BADGE_COLOR[tp]} variant={sel ? "filled" : "outlined"} size="lg">
                          {t(`typeLabels.${tp}`)}
                        </ITBadget>
                      </button>
                    );
                  })}
                </ITFlex>

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
                      <span role="alert" className="text-red-500 text-xs mt-1 block">
                        {errors[`reason-${idx}`]}
                      </span>
                    )}
                  </div>
                )}

                {r.type === "MAINTENANCE_OUT" && (
                      <>
                        <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("loanReturn.condition")}</ITText>
                        <ITFlex gap={2} wrap="wrap">
                          {CONDITIONS.map((c) => {
                            const sel = r.condition === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateRow(r.key, { condition: c })}
                                className={`rounded-full p-0 transition-all ${sel ? "shadow-md scale-105" : "opacity-50 hover:opacity-100"}`}
                              >
                                <ITBadget color={CONDITION_BADGE_COLOR[c]} variant={sel ? "filled" : "outlined"} size="lg">
                                  {t(`loanReturn.conditionLabels.${c}`)}
                                </ITBadget>
                              </button>
                            );
                          })}
                        </ITFlex>
                        <div>
                      <ITInput
                        name={`notes-${r.key}`}
                        label={t("new.comment")}
                        value={r.notes}
                        onChange={(e) => updateRow(r.key, { notes: e.target.value })}
                        aria-invalid={!!errors[`notes-${idx}`]}
                      />
                      {errors[`notes-${idx}`] && (
                        <span role="alert" className="text-red-500 text-xs mt-1 block">
                          {errors[`notes-${idx}`]}
                        </span>
                      )}
                    </div>
                        {r.condition === "BROKEN" && (
                          <ITText className="text-[11px] font-semibold text-red-600">{t("loanReturn.brokenRetirementHint")}</ITText>
                        )}
                      </>
                    )}

                {r.type && validStatus && (
                  <ITText className="text-[11px] font-semibold text-slate-500">
                    {t("new.unitStatusHint", { status: t(STATUS_LABEL_KEY[validStatus]) })}
                  </ITText>
                )}

                {r.type && r.deviceId && !isEntry(r.type) && !r.unitsLoading && visible.length === 0 && (
                  <ITText className="text-[11px] font-semibold text-amber-600">{t("new.withoutUnitsStatus")}</ITText>
                )}

                {r.type && r.deviceId && (isEntry(r.type) || visible.length > 0) && (
                  <ITText className="text-[11px] text-slate-400">{t(MOVEMENT_HINT_KEY[r.type as keyof typeof MOVEMENT_HINT_KEY])}</ITText>
                )}

                {/* Las piezas nuevas se identifican aquí mismo (serie, MAC, IP):
                    es opcional y por pieza, y el tipo del dispositivo decide qué
                    campos se piden. */}
                {isEntry(r.type) && usesUnitIdentity(deviceOf(r)?.type) && (
                  <ITFlex direction="column" gap={2} className="rounded-xl border border-slate-100 !bg-slate-50/60 p-3">
                    <ITText className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {t("new.identifyPieces", { count: r.quantity })}
                    </ITText>
                    <ITText className="text-[11px] text-slate-400">{t("new.identifyPiecesHint")}</ITText>
                    <UnitIdentityEditor
                      type={deviceOf(r)?.type}
                      units={r.unitRows}
                      onChange={(id, field, value) => updateUnitRow(r.key, id, field, value)}
                      label={(index) => `${t("new.pieceRow")} ${index + 1}`}
                      openFirst={1}
                    />
                  </ITFlex>
                )}
              </ITFlex>
            );
          })}
          <ITFlex>
            <ITButton variant="outlined" color="secondary" size="lg" onClick={addRow}>
              + {t("new.addRow")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}