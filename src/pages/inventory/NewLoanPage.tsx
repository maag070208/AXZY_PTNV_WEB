import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITButton,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITToast, ITText, ITStack } from "@axzydev/axzy_ui_system";
import { FaFileSignature } from "react-icons/fa";
import { LuFileText, LuMessageCircle, LuPackageOpen, LuUser } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Device, type DeviceType } from "@entities/inventory";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import { usersApi, type User } from "@entities/user";
import { CustodyLetterPreview } from "@widgets/custody-letter";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { UnitPicker, useSelectableUnits } from "@features/inventory/unit-picker";
import { LoanAgent, type LoanAgentItem } from "@widgets/loan-agent";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { useGoBack } from "@shared/lib/useGoBack";
import { FormSection } from "@shared/ui/form-section";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { PanelCard } from "@shared/ui/panel-card";
import { StickyActions } from "@shared/ui/sticky-actions";
import { LangostinState } from "@shared/ui/langostin";

const MODE_KEY = "ptnv.newLoan.mode";

// Preferencia por persona (chat con Langostín o formulario clásico); por defecto, chat.
const readMode = (): "chat" | "form" => {
  try {
    return localStorage.getItem(MODE_KEY) === "form" ? "form" : "chat";
  } catch {
    return "chat";
  }
};

export default function NewLoanPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
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
  const [mode, setModeState] = useState<"chat" | "form">(readMode);
  // Equipos armados en la conversación (el formulario clásico usa deviceId + selectedUnitIds).
  const [chatItems, setChatItems] = useState<LoanAgentItem[]>([]);

  const setMode = (next: "chat" | "form") => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* sin almacenamiento: la preferencia solo dura la sesión */
    }
  };

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

  const whoDone = assignment === "EMPLOYEE" ? !!custodianId : !!departmentId;
  const whatDone = !!deviceId && quantityNum >= 1;
  const isValid = whoDone && whatDone;

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
      items: mode === "chat"
        ? chatItems.map((ci, idx) => ({
            id: `item-${idx}`,
            deviceId: ci.device.id,
            device: ci.device,
            quantity: ci.units.length || 1,
            returnedQuantity: 0,
            units: ci.units.map((u) => ({ id: u.id, deviceUnit: u })),
          }))
        : deviceId
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
    [mode, chatItems, assignment, custodianId, departmentId, subareaId, subareasDept, departments, custodians, deviceId, devices, quantityNum, selectedUnits, notes]
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
        items:
          mode === "chat"
            ? chatItems.map((ci) => ({ deviceId: ci.device.id, unitIds: ci.units.map((u) => u.id) }))
            : [{ deviceId, unitIds: selectedUnits.map((u) => u.id) }],
      };
      await inventoryApi.createLoan(payload, requestKey(payload));
      setToast({ message: t("loans.saved"), type: "success" });
      setTimeout(() => goBack("/inventory/loans"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("loans.new")} backAction={() => goBack("/inventory/loans")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("loans.new")}
      description={t("loans.formSub")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loans.title"), onClick: () => navigate("/inventory/loans") }, { label: t("loans.new") }]}
      backAction={() => goBack("/inventory/loans")}
    >
      {mode === "chat" ? (
        <LoanAgent
          assignment={assignment}
          setAssignment={setAssignment}
          custodianId={custodianId}
          setCustodianId={setCustodianId}
          departmentId={departmentId}
          setDepartmentId={setDepartmentId}
          subareaId={subareaId}
          setSubareaId={setSubareaId}
          notes={notes}
          setNotes={setNotes}
          items={chatItems}
          setItems={setChatItems}
          custodians={custodians}
          departments={departments}
          subareas={subareas}
          devices={devices}
          saving={saving}
          onSubmit={handleSubmit}
          onUseForm={() => setMode("form")}
        />
      ) : (
      <>
      <ITFlex justify="end">
        <ITButton variant="text" color="secondary" size="sm" onClick={() => {
            // El chat arranca limpio: no hereda lo que quedó a medias en el formulario.
            setAssignment("EMPLOYEE");
            setCustodianId("");
            setDepartmentId("");
            setSubareaId("");
            setNotes("");
            setChatItems([]);
            setMode("chat");
          }} disabled={saving}>
          <ITFlex align="center" gap={1}>
            <LuMessageCircle size={14} />
            <ITText as="span" className="text-[11px] font-bold">{t("loans.agent.useChat")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <FormSection
            number={1}
            icon={<LuUser size={16} />}
            title={t("loans.sectionWho")}
            description={t("loans.sectionWhoHint")}
            complete={whoDone}
          >
            <ITStack spacing={4}>
              {/* Asignación a personal o departamento */}
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
            </ITStack>
          </FormSection>

          <FormSection
            number={2}
            icon={<LuPackageOpen size={16} />}
            title={t("loans.sectionWhat")}
            description={t("loans.sectionWhatHint")}
            complete={whatDone}
          >
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
              <ITGrid item xs={12}>
                <ITInput name="notes" label={t("loans.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </ITGrid>
            </ITGrid>
          </FormSection>
        </div>

        {/* Resumen vivo: lo capturado hasta ahora */}
        <LiveSummary
          title={t("loans.summaryTitle")}
          total={2}
          done={(whoDone ? 1 : 0) + (whatDone ? 1 : 0)}
        >
          <LiveSummaryRow label={t("loans.summaryTo")} value={draftLoan.custodian?.name ?? draftLoan.department?.name} />
          <LiveSummaryRow label={t("loans.summaryDevice")} value={draftLoan.items[0]?.device?.name} />
          <LiveSummaryRow label={t("loans.summaryPieces")} value={quantityNum > 0 ? quantityNum : undefined} />
        </LiveSummary>
      </div>

      </>
      )}

      <PanelCard title={t("loans.preview")} icon={<LuFileText size={16} />}>
        <CustodyLetterPreview loan={draftPreview as never} />
      </PanelCard>

      {mode === "form" && (
      <StickyActions>
        <ITButton label={t("common:actions.cancel")} variant="outlined" color="gray" size="sm" className="!rounded-full" onClick={() => goBack("/inventory/loans")} disabled={saving} />
        <ITButton
          label={saving ? t("new.saving") : t("loans.save")}
          variant="rounded"
          color="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !isValid}
        />
      </StickyActions>
      )}

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}