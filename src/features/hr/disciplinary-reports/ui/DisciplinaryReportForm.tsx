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
import type { DisciplinaryReason } from "@entities/hr";
import { searchEmployees } from "../model/useDisciplinaryReports";

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

const localToDateStr = (value: Date): string => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
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
      <div className="pb-3 mb-3 border-b border-slate-100 pr-6">
        <ITFlex align="center" gap={2}>
          <FaFilePen size={14} className="text-rose-500" />
          <ITText className="text-lg font-black text-slate-800">{tt("form.title")}</ITText>
        </ITFlex>
        <ITText className="text-[11px] text-slate-400 mt-1">
          {tt("description")}
        </ITText>
      </div>

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
        <ITButton variant="outlined" color="secondary" onClick={close} disabled={saving}>
          <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
        </ITButton>
        <ITButton variant="filled" color="primary" onClick={handleSave} disabled={!canSave}>
          <ITText className="font-bold text-[11px]">
            {saving ? tt("form.saving") : tt("form.save")}
          </ITText>
        </ITButton>
      </ITFlex>
    </ITDialog>
  );
}