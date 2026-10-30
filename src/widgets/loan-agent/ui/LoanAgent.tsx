import { useState } from "react";
import { ITButton, ITInput, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { Device, DeviceUnit } from "@entities/inventory";
import type { Department } from "@entities/department";
import type { Subarea } from "@entities/subarea";
import type { User } from "@entities/user";
import { UnitPicker, useSelectableUnits } from "@features/inventory/unit-picker";
import { AgentBubble, LangostinChat, UserBubble } from "@shared/ui/langostin-chat";
import OptionChip from "@shared/ui/option-chip/OptionChip";

/** Equipo ya agregado en la conversación: el dispositivo y las piezas exactas que se entregan. */
export interface LoanAgentItem {
  device: Device;
  units: DeviceUnit[];
}

export type LoanAssignment = "EMPLOYEE" | "DEPARTMENT";

type Step = "who" | "dept" | "subarea" | "device" | "qty" | "more" | "notes" | "summary";

interface LogEntry {
  q: string;
  a: string;
}

interface Snapshot {
  step: Step;
  log: LogEntry[];
  assignment: LoanAssignment;
  custodianId: string;
  departmentId: string;
  subareaId: string;
  items: LoanAgentItem[];
  notes: string;
  pendingDeviceId: string;
}

interface Props {
  // El estado vive en la página (el mismo del formulario clásico): así el
  // payload y la vista previa de la carta son idénticos con cualquiera de las dos vías.
  assignment: LoanAssignment;
  setAssignment: (v: LoanAssignment) => void;
  custodianId: string;
  setCustodianId: (v: string) => void;
  departmentId: string;
  setDepartmentId: (v: string) => void;
  subareaId: string;
  setSubareaId: (v: string) => void;
  notes: string;
  setNotes: (v: string) => void;
  items: LoanAgentItem[];
  setItems: (v: LoanAgentItem[]) => void;
  custodians: User[];
  departments: Department[];
  subareas: Subarea[];
  devices: Device[];
  saving: boolean;
  onSubmit: () => void;
  /** Salida al formulario clásico. */
  onUseForm: () => void;
}

const QUESTION = {
  who: "loans.agent.qWho",
  dept: "loans.agent.qDept",
  subarea: "loans.agent.qSubarea",
  device: "loans.agent.qDevice",
  qty: "loans.agent.qQty",
  more: "loans.agent.qMore",
  notes: "loans.agent.qNotes",
  summary: "loans.agent.qSummary",
} as const;

/**
 * Langostín en el alta de cartas responsivas (L1): pregunta para quién, qué
 * equipos y observaciones, y arma exactamente lo mismo que el formulario. No
 * guarda por su cuenta: el envío lo hace `onSubmit` de la página tras el resumen.
 * Los textos son fijos (nada de adivinar) y todo se puede deshacer con «Atrás».
 */
export default function LoanAgent(props: Props) {
  const {
    assignment, setAssignment, custodianId, setCustodianId, departmentId, setDepartmentId,
    subareaId, setSubareaId, notes, setNotes, items, setItems,
    custodians, departments, subareas, devices, saving, onSubmit, onUseForm,
  } = props;
  const { t } = useTranslation(["inventory", "common"]);
  const [step, setStep] = useState<Step>("who");
  const [log, setLog] = useState<LogEntry[]>([]);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [pendingDeviceId, setPendingDeviceId] = useState("");
  const [qty, setQty] = useState("1");
  const [notesDraft, setNotesDraft] = useState("");
  // El usuario puede preferir elegir las piezas exactas en vez de «las primeras N».
  const [pickExact, setPickExact] = useState(false);
  const [exactIds, setExactIds] = useState<string[]>([]);

  const { units, loading: unitsLoading, error: unitsError } = useSelectableUnits(pendingDeviceId);

  const pendingDevice = devices.find((d) => d.id === pendingDeviceId);
  const subareasDept = departmentId ? subareas.filter((s) => s.departmentId === departmentId) : [];
  const usedDeviceIds = new Set(items.map((i) => i.device.id));
  const deviceOptions = devices
    .filter((d) => !usedDeviceIds.has(d.id) && (d.stock?.AVAILABLE ?? 1) > 0)
    .map((d) => ({
      value: d.id,
      label: `${d.name} (${d.brand} ${d.model})${d.stock ? ` · ${t("loans.agent.availableCount", { count: d.stock.AVAILABLE })}` : ""}`,
    }));

  // Avanza un paso: guarda cómo estaba todo (para «Atrás») y suma la pareja pregunta/respuesta.
  const go = (next: Step, answer: string, apply?: () => void) => {
    setHistory((h) => [
      ...h,
      { step, log, assignment, custodianId, departmentId, subareaId, items, notes, pendingDeviceId },
    ]);
    setLog((l) => [...l, { q: t(QUESTION[step]), a: answer }]);
    apply?.();
    setStep(next);
  };

  const resetFields = () => {
    setAssignment("EMPLOYEE");
    setCustodianId("");
    setDepartmentId("");
    setSubareaId("");
    setItems([]);
    setNotes("");
    setPendingDeviceId("");
    setQty("1");
    setNotesDraft("");
    setPickExact(false);
    setExactIds([]);
  };

  const restart = () => {
    resetFields();
    setHistory([]);
    setLog([]);
    setStep("who");
  };

  const back = () => {
    const prev = history[history.length - 1];
    if (!prev) return;
    setHistory((h) => h.slice(0, -1));
    setStep(prev.step);
    setLog(prev.log);
    setAssignment(prev.assignment);
    setCustodianId(prev.custodianId);
    setDepartmentId(prev.departmentId);
    setSubareaId(prev.subareaId);
    setItems(prev.items);
    setNotes(prev.notes);
    setPendingDeviceId(prev.pendingDeviceId);
    setQty("1");
    setPickExact(false);
    setExactIds([]);
  };

  const custodianName = custodians.find((u) => u.id === custodianId)?.name;
  const departmentName = departments.find((d) => d.id === departmentId)?.name;
  const subareaName = subareasDept.find((s) => s.id === subareaId)?.name;
  const target = assignment === "EMPLOYEE" ? custodianName : [departmentName, subareaName].filter(Boolean).join(" / ");
  const totalPieces = items.reduce((n, i) => n + i.units.length, 0);

  const chips = (list: Array<{ label: string; emoji?: string; onClick: () => void }>) => (
    <div className="flex flex-wrap gap-2 pl-11">
      {list.map((c, i) => (
        <OptionChip key={c.label} label={c.label} emoji={c.emoji} delay={i * 40} onClick={c.onClick} />
      ))}
    </div>
  );

  const qtyNum = Math.floor(Number(qty));
  const qtyValid = qtyNum >= 1 && qtyNum <= units.length;
  const confirmQty = () => {
    if (!pendingDevice) return;
    const chosen = pickExact ? units.filter((u) => exactIds.includes(u.id)) : units.slice(0, qtyNum);
    if (chosen.length === 0) return;
    go("more", `${chosen.length} × ${pendingDevice.name}`, () => {
      setItems([...items, { device: pendingDevice, units: chosen }]);
      setPendingDeviceId("");
      setQty("1");
      setPickExact(false);
      setExactIds([]);
    });
  };

  const summaryLines = [
    t("loans.agent.sumTo", { name: target }),
    ...items.map((i) => t("loans.agent.sumItem", { name: i.device.name, count: i.units.length })),
    notes ? t("loans.agent.sumNotes", { notes }) : null,
  ]
    .filter((line): line is string => Boolean(line));

  const footer = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <ITButton variant="text" color="secondary" size="sm" onClick={back} disabled={history.length === 0 || saving}>
        <ITText className="text-[11px] font-bold">{t("loans.agent.back")}</ITText>
      </ITButton>
      <div className="flex flex-wrap items-center gap-2">
        <ITButton variant="text" color="secondary" size="sm" onClick={onUseForm} disabled={saving}>
          <ITText className="text-[11px] font-bold">{t("loans.agent.useForm")}</ITText>
        </ITButton>
        {step === "summary" && (
          <ITButton variant="filled" color="primary" size="sm" onClick={onSubmit} disabled={saving || items.length === 0}>
            <ITText className="text-[11px] font-bold">{saving ? t("new.saving") : t("loans.agent.confirm")}</ITText>
          </ITButton>
        )}
      </div>
    </div>
  );

  return (
    <LangostinChat
      title={t("loans.agent.botName")}
      subtitle={t("loans.agent.botSubtitle")}
      online={t("loans.agent.online")}
      restartLabel={t("loans.agent.restart")}
      onRestart={restart}
      height={440}
      footer={footer}
      className="motion-reduce:[&_.agent-bubble]:[animation:none] motion-reduce:[&_.agent-pop]:[animation:none]"
    >
      <AgentBubble text={t("loans.agent.hello")} />
      {log.map((entry, i) => (
        <div key={i} className="flex flex-col gap-3">
          <AgentBubble text={entry.q} />
          <UserBubble text={entry.a} />
        </div>
      ))}
      {step === "summary" ? (
        <>
          <AgentBubble text={t(QUESTION.summary)} avatar />
          {summaryLines.map((line) => (
            <AgentBubble key={line} text={line} />
          ))}
          <AgentBubble text={t("loans.agent.sumHint", { count: totalPieces })} />
        </>
      ) : (
        <AgentBubble text={t(QUESTION[step])} avatar />
      )}

      {step === "who" && (
        <>
          <div className="pl-11">
            <ITSearchSelect
              name="loanAgentCustodian"
              placeholder={t("loans.custodianPlaceholder")}
              options={custodians.map((u) => ({ value: u.id, label: u.name }))}
              onChange={(v) => {
                const id = String(v);
                const user = custodians.find((u) => u.id === id);
                go("device", user?.name ?? id, () => {
                  setAssignment("EMPLOYEE");
                  setCustodianId(id);
                });
              }}
            />
          </div>
          {chips([
            {
              label: t("loans.agent.toDepartment"),
              emoji: "🏢",
              onClick: () => go("dept", t("loans.agent.toDepartment"), () => setAssignment("DEPARTMENT")),
            },
          ])}
        </>
      )}

      {step === "dept" && (
        <div className="pl-11">
          <ITSearchSelect
            name="loanAgentDepartment"
            placeholder={t("loans.departmentPlaceholder")}
            options={departments.map((d) => ({ value: d.id, label: d.name }))}
            onChange={(v) => {
              const id = String(v);
              const dept = departments.find((d) => d.id === id);
              const hasSubareas = subareas.some((s) => s.departmentId === id);
              go(hasSubareas ? "subarea" : "device", dept?.name ?? id, () => {
                setDepartmentId(id);
                setSubareaId("");
              });
            }}
          />
        </div>
      )}

      {step === "subarea" &&
        chips([
          ...subareasDept.map((s) => ({
            label: s.name,
            emoji: "📍",
            onClick: () => go("device", s.name, () => setSubareaId(s.id)),
          })),
          { label: t("loans.agent.noSubarea"), emoji: "⏭️", onClick: () => go("device", t("loans.agent.noSubarea")) },
        ])}

      {step === "device" && (
        <div className="pl-11">
          {deviceOptions.length === 0 ? (
            <ITText className="text-xs text-slate-500">{t("loans.agent.noDevices")}</ITText>
          ) : (
            <ITSearchSelect
              name="loanAgentDevice"
              placeholder={t("loans.devicePlaceholder")}
              options={deviceOptions}
              onChange={(v) => {
                const id = String(v);
                const device = devices.find((d) => d.id === id);
                go("qty", device?.name ?? id, () => {
                  setPendingDeviceId(id);
                  setQty("1");
                  setPickExact(false);
                  setExactIds([]);
                });
              }}
            />
          )}
        </div>
      )}

      {step === "qty" && (
        <div className="flex flex-col gap-2 pl-11">
          {unitsLoading ? (
            <ITText className="text-xs text-slate-500">{t("loans.agent.loadingUnits")}</ITText>
          ) : unitsError ? (
            <ITText className="text-xs text-[color:var(--color-danger)]">{unitsError}</ITText>
          ) : units.length === 0 ? (
            <ITText className="text-xs text-slate-500">{t("loans.agent.noUnits")}</ITText>
          ) : pickExact ? (
            <>
              <UnitPicker units={units} selected={exactIds} onChange={setExactIds} />
              <div className="flex justify-end">
                <ITButton variant="filled" color="primary" size="sm" onClick={confirmQty} disabled={exactIds.length === 0}>
                  <ITText className="text-[11px] font-bold">{t("loans.agent.add")}</ITText>
                </ITButton>
              </div>
            </>
          ) : (
            <>
              <ITText className="text-[11px] text-slate-500">
                {t("loans.agent.qtyHint", { count: units.length })}
              </ITText>
              <div className="grid items-end gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
                <ITInput
                  name="loanAgentQty"
                  label={t("loans.quantityLabel")}
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <ITButton variant="filled" color="primary" size="sm" onClick={confirmQty} disabled={!qtyValid}>
                  <ITText className="text-[11px] font-bold">{t("loans.agent.add")}</ITText>
                </ITButton>
              </div>
              <div className="flex flex-wrap gap-2">
                {units.length > 1 && (
                  <OptionChip label={t("loans.agent.allUnits", { count: units.length })} onClick={() => setQty(String(units.length))} />
                )}
                <OptionChip label={t("loans.agent.pickExact")} emoji="🔎" onClick={() => setPickExact(true)} />
              </div>
            </>
          )}
        </div>
      )}

      {step === "more" &&
        chips([
          { label: t("loans.agent.addAnother"), emoji: "➕", onClick: () => go("device", t("loans.agent.addAnother")) },
          { label: t("loans.agent.thatsAll"), emoji: "✅", onClick: () => go("notes", t("loans.agent.thatsAll")) },
        ])}

      {step === "notes" && (
        <>
          <div className="grid gap-2 pl-11 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <ITInput
              name="loanAgentNotes"
              value={notesDraft}
              onChange={(e) => setNotesDraft(e.target.value)}
              placeholder={t("loans.agent.notesPlaceholder")}
            />
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              disabled={!notesDraft.trim()}
              onClick={() => go("summary", notesDraft.trim(), () => setNotes(notesDraft.trim()))}
            >
              <ITText className="whitespace-nowrap text-[11px] font-bold">{t("loans.agent.next")}</ITText>
            </ITButton>
          </div>
          {chips([
            { label: t("loans.agent.noNotes"), emoji: "⏭️", onClick: () => go("summary", t("loans.agent.noNotes"), () => setNotes("")) },
          ])}
        </>
      )}
    </LangostinChat>
  );
}
