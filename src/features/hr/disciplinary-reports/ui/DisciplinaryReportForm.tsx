import { useState } from "react";
import {
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaFilePen } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { DialogHeader } from "@shared/ui/dialog-header";
import type { DisciplinaryReason } from "@entities/hr";
import { localToDateStr } from "../model/dateStr";
import { searchEmployees } from "../model/useDisciplinaryReports";
import DisciplinaryReportAgent from "./DisciplinaryReportAgent";

const REASONS: DisciplinaryReason[] = [
  "ABSENCE",
  "TARDINESS",
  "INTOXICATION",
  "MISCONDUCT",
  "NONCOMPLIANCE",
  "OTHER",
];

interface Props {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    userId: string;
    reason: DisciplinaryReason;
    incidentDate: string;
    description: string;
    sanction?: string;
  }) => void;
}

interface EmployeeOption {
  value: string;
  label: string;
}

const MODE_KEY = "ptnv.disciplinaryReport.mode";

// Preferencia por persona (chat con Langostín o formulario clásico); por defecto, chat.
const readMode = (): "chat" | "form" => {
  try {
    return localStorage.getItem(MODE_KEY) === "form" ? "form" : "chat";
  } catch {
    return "chat";
  }
};

export default function DisciplinaryReportForm({
  isOpen,
  saving,
  onClose,
  onSave,
}: Props) {
  const { t: tt } = useTranslation(["disciplinary-reports", "common"]);
  const [employees, setEmployees] = useState<EmployeeOption[]>([]);
  const [busyEmployees, setBusyEmployees] = useState(false);
  const [userId, setUserId] = useState("");
  const [reason, setReason] = useState<DisciplinaryReason | "">("");
  const [incidentDate, setIncidentDate] = useState<string>("");
  const [description, setDescription] = useState("");
  const [sanction, setSanction] = useState("");
  const [mode, setModeState] = useState<"chat" | "form">(readMode);

  const setMode = (next: "chat" | "form") => {
    setModeState(next);
    try {
      localStorage.setItem(MODE_KEY, next);
    } catch {
      /* sin almacenamiento: la preferencia solo dura la sesión */
    }
  };

  const reset = () => {
    setUserId("");
    setReason("");
    setIncidentDate("");
    setDescription("");
    setSanction("");
    setEmployees([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSearchEmployees = async (query?: string) => {
    setBusyEmployees(true);
    try {
      const data = await searchEmployees(query);
      setEmployees(
        data.map((u) => ({
          value: u.id,
          label: [u.name, u.employeeNumber ? `#${u.employeeNumber}` : null]
            .filter(Boolean)
            .join(" "),
        }))
      );
    } finally {
      setBusyEmployees(false);
    }
  };

  const handleSave = () => {
    if (!userId || !reason || !incidentDate || !description.trim()) return;
    onSave({
      userId,
      reason,
      incidentDate,
      description: description.trim(),
      sanction: sanction.trim() || undefined,
    });
  };

  const canSave = Boolean(userId && reason && incidentDate && description.trim()) && !saving;

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={close}
      className="w-full max-w-2xl"
    >
      <DialogHeader
        icon={<FaFilePen size={16} />}
        tone="danger"
        title={tt("form.title")}
        subtitle={tt("description")}
      />

      {mode === "chat" ? (
        <DisciplinaryReportAgent saving={saving} onSave={onSave} onUseForm={() => setMode("form")} />
      ) : (
      <>
      <ITGrid container columns={12} spacing={2}>
        <ITGrid item xs={12}>
          <ITSearchSelect
            name="actaEmpleado"
            label={tt("form.employee")}
            placeholder={tt("form.employeeHint")}
            options={employees}
            value={userId}
            onChange={(value) => setUserId(String(value))}
            onSearch={handleSearchEmployees}
            isLoading={busyEmployees}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITSelect
            name="actaMotivo"
            label={tt("form.reason")}
            value={reason}
            onChange={(e) => setReason(e.target.value as DisciplinaryReason)}
            options={[
              { value: "", label: "—" },
              ...REASONS.map((m) => ({ value: m, label: tt(`reasons.${m}`) })),
            ]}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITDatePicker
            name="actaFechaIncidente"
            label={tt("form.incidentDate")}
            value={incidentDate ? new Date(`${incidentDate}T12:00:00`) : undefined}
            onChange={(event) => {
              const value = event.target.value;
              setIncidentDate(value instanceof Date ? localToDateStr(value) : "");
            }}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITTextarea
            name="actaDescripcion"
            label={tt("form.description")}
            value={description}
            onChange={setDescription}
            rows={4}
            placeholder={tt("form.descriptionHint")}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITTextarea
            name="actaSancion"
            label={tt("form.sanction")}
            value={sanction}
            onChange={setSanction}
            rows={2}
            placeholder={tt("form.sanctionHint")}
          />
        </ITGrid>
      </ITGrid>

      <ITFlex justify="end" gap={2} className="mt-6 pt-4 border-t border-slate-100">
        <ITButton variant="text" color="secondary" onClick={() => setMode("chat")} disabled={saving}>
          <ITText className="font-bold text-[11px]">{tt("form.agent.useChat")}</ITText>
        </ITButton>
        <ITButton variant="outlined" color="secondary" onClick={close} disabled={saving}>
          <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
        </ITButton>
        <ITButton variant="filled" color="primary" onClick={handleSave} disabled={!canSave}>
          <ITText className="font-bold text-[11px]">
            {saving ? tt("form.saving") : tt("form.save")}
          </ITText>
        </ITButton>
      </ITFlex>
      </>
      )}
    </ITDialog>
  );
}