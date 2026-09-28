import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITSegmentedControl, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Device, type DeviceType } from "@entities/inventory";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import { usersApi, type User } from "@entities/user";
import { CustodyLetterPreview } from "@widgets/custody-letter";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { UnitPicker, useSelectableUnits } from "@features/inventory/unit-picker";
import { useRequestKey } from "@shared/lib/useRequestKey";

export default function NewLoanPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const requestKey = useRequestKey();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [types, setTypes] = useState<DeviceType[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [custodians, setCustodians] = useState<User[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subareas, setSubareas] = useState<Subarea[]>([]);

  const [assignment, setAssignment] = useState<"EMPLOYEE" | "DEPARTMENT">("EMPLOYEE");
  const [custodianId, setCustodianId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [subareaId, setSubareaId] = useState("");
  const [typeId, setTypeId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    Promise.all([inventoryApi.types(), inventoryApi.devices(), usersApi.employees(), departmentsApi.list(), subareaApi.list()])
      .then(([ts, ds, us, deps, subs]) => {
        setTypes(ts.filter((x) => x.active));
        setDevices(ds);
        setCustodians(us);
        setDepartments(deps);
        setSubareas(subs);
      })
      .finally(() => setLoading(false));
  }, []);

  // Subáreas filtradas por el departamento seleccionado.
  const subareasDept = useMemo(
    () => (departmentId ? subareas.filter((s) => s.departmentId === departmentId) : []),
    [subareas, departmentId]
  );

  const devicesType = useMemo(
    () => (typeId ? devices.filter((d) => d.typeId === typeId) : []),
    [devices, typeId]
  );

  // Piezas exactas que se entregan: la carta imprime su activo fijo y serie.
  const { units, loading: unitsLoading, error: unitsError } = useSelectableUnits(deviceId);
  const selectedUnits = useMemo(
    () => units.filter((u) => selectedUnitIds.includes(u.id)),
    [units, selectedUnitIds]
  );

  const selectDevice = (id: string) => {
    setDeviceId(id);
    setSelectedUnitIds([]);
  };

  const quantityNum = selectedUnits.length;

  const isValid =
    (assignment === "EMPLOYEE" ? !!custodianId : !!departmentId) &&
    !!deviceId &&
    quantityNum >= 1;

  const draftLoan = useMemo(
    () => ({
      id: "draft",
      number: "CARTA-XXXX",
      date: new Date().toISOString(),
      custodianId: assignment === "EMPLOYEE" ? custodianId : null,
      custodian: assignment === "EMPLOYEE"
        ? (() => {
            const u = custodians.find((x) => x.id === custodianId);
            return u ? { id: u.id, name: u.name, username: u.username, employeeNumber: u.employeeNumber ?? null, department: u.department ?? null } : null;
          })()
        : null,
      departmentId: assignment === "DEPARTMENT" ? departmentId : null,
      department: assignment === "DEPARTMENT"
        ? (() => {
            const d = departments.find((x) => x.id === departmentId);
            return d ? { id: d.id, name: d.name } : null;
          })()
        : null,
      subareaId: assignment === "DEPARTMENT" ? subareaId || null : null,
      subarea: assignment === "DEPARTMENT"
        ? (() => {
            const s = subareasDept.find((x) => x.id === subareaId);
            return s ? { id: s.id, name: s.name } : null;
          })()
        : null,
      status: "ACTIVE" as const,
      notes: notes || null,
      items: deviceId
        ? [
            {
              id: "item",
              deviceId,
              device: devices.find((d) => d.id === deviceId),
              quantity: quantityNum || 1,
              returnedQuantity: 0,
              units: selectedUnits.map((u) => ({ id: u.id, deviceUnit: u })),
            },
          ]
        : [],
    }),
    [assignment, custodianId, departmentId, subareaId, subareasDept, departments, custodians, deviceId, devices, quantityNum, selectedUnits, notes]
  );

  // El preview se actualiza con debounce para no parpadear en cada tecla.
  const draftPreview = useDebouncedValue(draftLoan, 500);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = {
        custodianId: assignment === "EMPLOYEE" ? custodianId : undefined,
        departmentId: assignment === "DEPARTMENT" ? departmentId : undefined,
        subareaId: assignment === "DEPARTMENT" ? subareaId || undefined : undefined,
        notes: notes || undefined,
        items: [{ deviceId, unitIds: selectedUnits.map((u) => u.id) }],
      };
      await inventoryApi.createLoan(payload, requestKey(payload));
      setToast({ message: t("loans.saved"), type: "success" });
      setTimeout(() => navigate("/inventory/loans"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("loans.new")} backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("loans.new")}
      description={t("loans.formSub")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title"), onClick: () => navigate("/inventory/loans") }, { label: t("loans.new") }]}
      backAction={() => navigate("/inventory/loans")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("loans.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={6}>
          <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            {/* Asignación a personal o departamento */}
            <ITFlex as="fieldset" direction="column" gap={2}>
              <ITText as="legend" className="text-sm font-semibold text-slate-700">{t("loans.assignment")}</ITText>
              <ITSegmentedControl
                options={[
                  { value: "EMPLOYEE", label: t("loans.toEmployee"), icon: <FaFileSignature size={11} /> },
                  { value: "DEPARTMENT", label: t("loans.toDepartment"), icon: <FaFileSignature size={11} /> },
                ]}
                value={assignment}
                onChange={(v) => setAssignment(v as "EMPLOYEE" | "DEPARTMENT")}
                size="md"
              />
            </ITFlex>

            {assignment === "EMPLOYEE" ? (
              <ITSearchSelect
                label={t("loans.custodian")}
                placeholder={t("loans.custodianPlaceholder")}
                options={custodians.map((u) => ({ value: u.id, label: u.name }))}
                value={custodianId}
                onChange={(v) => setCustodianId(String(v))}
              />
            ) : (
              <>
                <ITSearchSelect
                  label={t("loans.department")}
                  placeholder={t("loans.departmentPlaceholder")}
                  options={departments.map((d) => ({ value: d.id, label: d.name }))}
                  value={departmentId}
                  onChange={(v) => {
                    setDepartmentId(String(v));
                    setSubareaId("");
                  }}
                />
                {subareasDept.length > 0 && (
                  <ITSearchSelect
                    label={t("loans.subarea")}
                    placeholder={t("loans.subareaPlaceholder")}
                    options={subareasDept.map((s) => ({ value: s.id, label: s.name }))}
                    value={subareaId}
                    onChange={(v) => setSubareaId(String(v))}
                  />
                )}
              </>
            )}

            <ITText className="text-sm font-semibold text-slate-700">{t("loans.resource")}</ITText>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12}>
                <ITSearchSelect
                  label={t("loans.deviceType")}
                  placeholder={t("loans.deviceTypePlaceholder")}
                  options={types.map((x) => ({ value: x.id, label: `${x.name} (${x.assetTagPrefix})` }))}
                  value={typeId}
                  onChange={(v) => {
                    setTypeId(String(v));
                    selectDevice("");
                  }}
                />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITSearchSelect
                  label={t("loans.device")}
                  placeholder={t("loans.devicePlaceholder")}
                  options={devicesType.map((d) => ({ value: d.id, label: `${d.name} (${d.brand} ${d.model})` }))}
                  value={deviceId}
                  onChange={(v) => selectDevice(String(v))}
                />
              </ITGrid>
              {deviceId && (
                <ITGrid item xs={12}>
                  <UnitPicker
                    units={units}
                    selected={selectedUnitIds}
                    onChange={setSelectedUnitIds}
                    loading={unitsLoading}
                    error={unitsError}
                  />
                </ITGrid>
              )}
            </ITGrid>

            <ITInput name="notes" label={t("loans.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={6}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{t("loans.preview")}</ITText>
            <CustodyLetterPreview loan={draftPreview as never} />
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}