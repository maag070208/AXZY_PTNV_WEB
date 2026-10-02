import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Device, type Loan, type DeviceType } from "@entities/inventory";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import { usersApi, type User } from "@entities/user";
import { CustodyLetterPreview } from "@widgets/custody-letter";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { UnitPicker, useSelectableUnits } from "@features/inventory/unit-picker";

export default function EditLoanPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [loan, setLoan] = useState<Loan | null>(null);
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
    if (!id) return;
    Promise.all([
      inventoryApi.getLoan(id),
      inventoryApi.types(),
      inventoryApi.devices(),
      usersApi.employees(),
      departmentsApi.list(),
      subareaApi.list(),
    ])
      .then(([p, ts, ds, us, deps, subs]) => {
        setLoan(p);
        setTypes(ts.filter((x) => x.active));
        setDevices(ds);
        setCustodians(us);
        setDepartments(deps);
        setSubareas(subs);

        if (p.custodian) setAssignment("EMPLOYEE");
        else if (p.department) setAssignment("DEPARTMENT");
        setCustodianId(p.custodian?.id ?? "");
        setDepartmentId(p.department?.id ?? "");
        setSubareaId(p.subarea?.id ?? "");
        setNotes(p.notes ?? "");
        const d = p.items[0];
        if (d) {
          setTypeId(d.device?.typeId ?? "");
          setDeviceId(d.deviceId);
          setSelectedUnitIds((d.units ?? []).filter((u) => !u.returned).map((u) => u.deviceUnit.id));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const subareasDept = useMemo(
    () => (departmentId ? subareas.filter((s) => s.departmentId === departmentId) : []),
    [subareas, departmentId]
  );
  const devicesType = useMemo(
    () => (typeId ? devices.filter((d) => d.typeId === typeId) : []),
    [devices, typeId]
  );

  // Unidades que la carta tiene prestadas: al cambiar el recurso se liberan,
  // así que también se pueden volver a elegir.
  const originalDeviceId = loan?.items?.[0]?.deviceId ?? "";
  const currentUnitIds = useMemo(
    () => (loan?.items?.[0]?.units ?? []).filter((u) => !u.returned).map((u) => u.deviceUnit.id),
    [loan]
  );
  const { units, loading: unitsLoading, error: unitsError } = useSelectableUnits(
    deviceId,
    deviceId === originalDeviceId ? currentUnitIds : []
  );
  const selectedUnits = useMemo(
    () => units.filter((u) => selectedUnitIds.includes(u.id)),
    [units, selectedUnitIds]
  );

  const selectDevice = (did: string) => {
    setDeviceId(did);
    setSelectedUnitIds(did && did === originalDeviceId ? currentUnitIds : []);
  };

  const quantityNum = selectedUnits.length;
  const lockedResource = (loan?.items?.[0]?.returnedQuantity ?? 0) > 0;
  // Solo se manda el recurso si cambió: así editar la asignación o las
  // observaciones no reasigna unidades (y funciona aunque haya devoluciones).
  const resourceChanged =
    deviceId !== originalDeviceId ||
    selectedUnitIds.length !== currentUnitIds.length ||
    selectedUnitIds.some((u) => !currentUnitIds.includes(u));

  const isValid =
    (assignment === "EMPLOYEE" ? !!custodianId : !!departmentId) &&
    !!deviceId &&
    (lockedResource || quantityNum >= 1);

  const draftLoan = useMemo<Loan>(
    () => ({
      id: "draft",
      number: loan?.number ?? "CARTA-XXXX",
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
              quantity: lockedResource ? (loan?.items?.[0]?.quantity ?? 1) : quantityNum || 1,
              returnedQuantity: 0,
              // Con devoluciones el recurso no cambia: la carta muestra todo lo entregado.
              units: lockedResource ? loan?.items?.[0]?.units : selectedUnits.map((u) => ({ id: u.id, deviceUnit: u })),
            },
          ]
        : [],
    }),
    [assignment, custodianId, departmentId, subareaId, subareasDept, departments, custodians, deviceId, devices, quantityNum, selectedUnits, lockedResource, notes, loan]
  );
  const draftPreview = useDebouncedValue(draftLoan, 500);

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await inventoryApi.updateLoan(id, {
        custodianId: assignment === "EMPLOYEE" ? custodianId : undefined,
        departmentId: assignment === "DEPARTMENT" ? departmentId : undefined,
        subareaId: assignment === "DEPARTMENT" ? subareaId || undefined : undefined,
        notes: notes || undefined,
        ...(resourceChanged && !lockedResource ? { deviceId, unitIds: selectedUnitIds } : {}),
      });
      setToast({ message: t("loans.savedEdit"), type: "success" });
      setTimeout(() => navigate(`/inventory/loans/${id}`), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !loan) {
    return (
      <ITPage
        noPadding title={t("loans.edit")} backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      noPadding
      title={t("loans.edit")}
      description={`${loan.number}`}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title"), onClick: () => navigate("/inventory/loans") }, { label: t("loans.edit") }]}
      backAction={() => navigate(`/inventory/loans/${loan.id}`)}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("loans.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {lockedResource && (
        <ITAlert variant="warning" dismissible={false}>
          {t("loans.editResourceBlocked")}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={6}>
          <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITFlex as="fieldset" direction="column" gap={2}>
              <ITSearchSelect
                name="loanAssignment"
                label={t("loans.assignment")}
                options={[
                  { value: "EMPLOYEE", label: t("loans.toEmployee") },
                  { value: "DEPARTMENT", label: t("loans.toDepartment") },
                ]}
                value={assignment}
                onChange={(v) => setAssignment(String(v) as "EMPLOYEE" | "DEPARTMENT")}
                className="mt-2"
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
                  disabled={lockedResource}
                />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITSearchSelect
                  label={t("loans.device")}
                  placeholder={t("loans.devicePlaceholder")}
                  options={devicesType.map((d) => ({ value: d.id, label: `${d.name} (${d.brand} ${d.model})` }))}
                  value={deviceId}
                  onChange={(v) => selectDevice(String(v))}
                  disabled={lockedResource}
                />
              </ITGrid>
              {deviceId && !lockedResource && (
                <ITGrid item xs={12}>
                  <UnitPicker
                    units={units}
                    selected={selectedUnitIds}
                    onChange={setSelectedUnitIds}
                    loading={unitsLoading}
                    error={unitsError}
                    currentIds={deviceId === originalDeviceId ? currentUnitIds : []}
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