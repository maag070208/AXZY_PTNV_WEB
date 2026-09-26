import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Condition, type Device, type DeviceUnitStatus, type DeviceType, type MovementType, type DeviceUnit } from "@entities/inventory";
import { TYPE_BADGE_COLOR } from "@entities/inventory/model/movementColors";

const STATUS_LABEL_KEY = {
  AVAILABLE: "dashboard.available",
  ON_LOAN: "dashboard.loaned",
  DAMAGED: "dashboard.damaged",
  IN_MAINTENANCE: "dashboard.maintenance",
  RETIRED: "dashboard.retirement",
} as const;

const MOVEMENT_HINT_KEY = {
  RETIREMENT: "movementHint.RETIREMENT",
  MAINTENANCE_IN: "movementHint.MAINTENANCE_IN",
  MAINTENANCE_OUT: "movementHint.MAINTENANCE_OUT",
} as const;

const TYPES: MovementType[] = ["RETIREMENT", "MAINTENANCE_IN", "MAINTENANCE_OUT"];

interface Row {
  key: string;
  typeFilter: string;
  deviceId: string;
  unitId: string;
  type: MovementType | "";
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
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [rows, setRows] = useState<Row[]>([{ key: crypto.randomUUID(), typeFilter: "", deviceId: "", unitId: "", type: "", condition: "", reason: "", notes: "", units: [], unitsLoading: false }]);

  useEffect(() => {
    Promise.all([inventoryApi.types(), inventoryApi.devices()])
      .then(([ts, ds]) => {
        setTypes(ts);
        setDevices(ds);
      })
      .finally(() => setLoading(false));
  }, []);

  const loadUnits = async (key: string, deviceId: string) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, units: [], unitsLoading: true } : x)));
    try {
      const all = await inventoryApi.units(deviceId);
      setRows((r) => r.map((x) => (x.key === key ? { ...x, units: all, unitsLoading: false } : x)));
    } catch {
      setRows((r) => r.map((x) => (x.key === key ? { ...x, units: [], unitsLoading: false } : x)));
      window.alert("Error al cargar las unidades");
    }
  };

  const updateRow = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

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
        const validStatus = UNIT_STATUS[tp];
        const unitOk = x.unitId && validStatus && x.units.find((u) => u.id === x.unitId)?.status === validStatus;
        return { ...x, type: tp, unitId: unitOk ? x.unitId : "" };
      })
    );
  };

  const addRow = () => setRows((r) => [...r, { key: crypto.randomUUID(), typeFilter: "", deviceId: "", unitId: "", type: "", condition: "", reason: "", notes: "", units: [], unitsLoading: false }]);
  const removeRow = (key: string) => setRows((r) => r.filter((x) => x.key !== key));

  const visibleUnits = (r: Row) => {
    const base = r.units.filter((u) => OPERABLE_STATUSES.includes(u.status));
    const status = r.type ? UNIT_STATUS[r.type as MovementType] : undefined;
    return status ? base.filter((u) => u.status === status) : base;
  };

  const unitLabel = (u: DeviceUnit) => {
    const extras = [u.serialNumber, u.hostname, u.macAddress].filter(Boolean).join(" · ");
    return `${u.assetTag}${extras ? ` · ${extras}` : ""} · ${u.status}`;
  };

  const validRow = (r: Row) =>
    !!r.deviceId &&
    !!r.unitId &&
    !!r.type &&
    (r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN" ? !!r.reason.trim() : true) &&
    (r.type !== "MAINTENANCE_OUT" || !!r.condition);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    rows.forEach((r, idx) => {
      if ((r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN") && r.reason.trim().length < 3) {
        e[`motivo-${idx}`] = "El motivo debe tener al menos 3 caracteres";
      }
      if (r.type === "MAINTENANCE_OUT" && r.notes.trim().length > 0 && r.notes.trim().length < 3) {
        e[`observaciones-${idx}`] = "La observación debe tener al menos 3 caracteres";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = rows.length > 0 && rows.every(validRow);

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: "Revisa los campos marcados", type: "error" });
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
        [...groups.entries()].map(([tp, rs]) =>
          inventoryApi.registerMovement({
            type: tp,
            reason: rs.find((r) => r.reason.trim())?.reason || undefined,
            items: rs.map((r) => ({
              deviceId: r.deviceId,
              unitId: r.unitId,
              quantity: 1,
              condition: tp === "MAINTENANCE_OUT" ? (r.condition as Condition) : undefined,
              notes: r.notes.trim() ? r.notes : undefined,
            })),
          })
        )
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
      <ITPage title={t("new.title")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
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
            {rows.length} {rows.length === 1 ? t("new.row") : t("new.rows")} · {rows.length} {rows.length === 1 ? t("new.piece") : t("new.pieces")}
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
                    <ITSearchSelect
                      label={t("new.unit")}
                      placeholder={t("new.unitPlaceholder")}
                      options={visible.map((u) => ({ value: u.id, label: unitLabel(u) }))}
                      value={r.unitId}
                      disabled={!r.deviceId}
                      isLoading={r.unitsLoading}
                      onChange={(v) => updateRow(r.key, { unitId: String(v) })}
                    />
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

                {(r.type === "RETIREMENT" || r.type === "MAINTENANCE_IN") && (
                  <div>
                    <ITInput
                      name={`motivo-${r.key}`}
                      label={t("new.reason")}
                      value={r.reason}
                      onChange={(e) => updateRow(r.key, { reason: e.target.value })}
                      required
                      aria-invalid={!!errors[`motivo-${idx}`]}
                    />
                    {errors[`motivo-${idx}`] && (
                      <span role="alert" className="text-red-500 text-xs mt-1 block">
                        {errors[`motivo-${idx}`]}
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
                                  {c}
                                </ITBadget>
                              </button>
                            );
                          })}
                        </ITFlex>
                        <div>
                      <ITInput
                        name={`observaciones-${r.key}`}
                        label={t("new.comment")}
                        value={r.notes}
                        onChange={(e) => updateRow(r.key, { notes: e.target.value })}
                        aria-invalid={!!errors[`observaciones-${idx}`]}
                      />
                      {errors[`observaciones-${idx}`] && (
                        <span role="alert" className="text-red-500 text-xs mt-1 block">
                          {errors[`observaciones-${idx}`]}
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

                {r.type && r.deviceId && !r.unitsLoading && visible.length === 0 && (
                  <ITText className="text-[11px] font-semibold text-amber-600">{t("new.withoutUnitsStatus")}</ITText>
                )}

                {r.type && r.deviceId && visible.length > 0 && (
                  <ITText className="text-[11px] text-slate-400">{t(MOVEMENT_HINT_KEY[r.type as keyof typeof MOVEMENT_HINT_KEY])}</ITText>
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