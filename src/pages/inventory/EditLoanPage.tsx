import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITSegmentedControl, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Device, type Loan, type DeviceType } from "@entities/inventory";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import { usersApi, type User } from "@entities/user";
import { CustodyLetterPreview } from "@widgets/custody-letter";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";

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
  const [quantity, setQuantity] = useState("1");
  const [available, setAvailable] = useState<number | null>(null);
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
          setQuantity(String(d.quantity));
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

  // Unidades de este préstamo que siguen prestadas (se liberan al editar).
  const unitsOnLoan = useMemo(() => {
    const item = loan?.items?.[0];
    return (item?.units ?? []).filter((u) => !u.returned).length;
  }, [loan]);

  const selectDevice = (did: string) => {
    setDeviceId(did);
    setAvailable(null);
    setQuantity("1");
    if (did) {
      inventoryApi.stock(did).then((ex) => {
        const bonus = did === loan?.items?.[0]?.deviceId ? unitsOnLoan : 0;
        setAvailable(ex.AVAILABLE + bonus);
      }).catch(() => setAvailable(0));
    }
  };

  const quantityNum = Number(quantity) || 0;
  const overStock = available !== null && quantityNum > available;

  const isValid =
    (assignment === "EMPLOYEE" ? !!custodianId : !!departmentId) &&
    !!deviceId &&
    quantityNum >= 1 &&
    available !== null &&
    !overStock;

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
              quantity: quantityNum || 1,
              returnedQuantity: 0,
            },
          ]
        : [],
    }),
    [assignment, custodianId, departmentId, subareaId, subareasDept, departments, custodians, deviceId, devices, quantityNum, notes, loan]
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
        deviceId,
        quantity: quantityNum,
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
      <ITPage title={t("loans.edit")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const lockedResource = (loan.items[0]?.returnedQuantity ?? 0) > 0;

  return (
    <ITPage
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
              <ITText as="legend" className="text-sm font-semibold text-slate-700">{t("loans.assignment")}</ITText>
              <ITSegmentedControl
                options={[
                  { value: "EMPLOYEE", label: t("loans.toEmployee"), icon: <FaFileSignature size={11} /> },
                  { value: "DEPARTMENT", label: t("loans.toDepartment"), icon: <FaFileSignature size={11} /> },
                ]}
                value={assignment}
                onChange={(v) => setAssignment(v as "EMPLOYEE" | "DEPARTMENT")}
                size="md"
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
                    setDeviceId("");
                    setAvailable(null);
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
              <ITGrid item xs={12} md={5}>
                <ITInput
                  name="quantity"
                  label={t("loans.quantityLabel")}
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  disabled={lockedResource}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={7}>
                <ITFlex align="center" gap={2} className="h-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <ITText className="text-xs text-slate-500">
                    {t("loans.available")}{" "}
                    <strong className="text-slate-700">{available ?? "—"}</strong>
                  </ITText>
                </ITFlex>
              </ITGrid>
            </ITGrid>

            {overStock && <ITAlert variant="error">{t("validation.overStock")}</ITAlert>}

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