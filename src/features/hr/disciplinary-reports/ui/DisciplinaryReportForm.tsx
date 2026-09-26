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
import type { MotivoActaAdministrativa } from "@entities/personal";
import { searchEmpleados } from "../model/useActasReporte";

const MOTIVOS: MotivoActaAdministrativa[] = [
  "INASISTENCIA",
  "RETARDO",
  "EBRIEDAD",
  "CONDUCTA",
  "INCUMPLIMIENTO",
  "OTRO",
];

interface Props {
  isOpen: boolean;
  saving: boolean;
  onClose: () => void;
  onSave: (input: {
    userId: string;
    motivo: MotivoActaAdministrativa;
    fechaIncidente: string;
    descripcion: string;
    sancion?: string;
  }) => void;
}

interface EmpleadoOption {
  value: string;
  label: string;
}

const localToDateStr = (value: Date): string => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export default function ActaAdministrativaForm({
  isOpen,
  saving,
  onClose,
  onSave,
}: Props) {
  const { t: tt } = useTranslation(["actas", "common"]);
  const [empleados, setEmpleados] = useState<EmpleadoOption[]>([]);
  const [busyEmpleados, setBusyEmpleados] = useState(false);
  const [userId, setUserId] = useState("");
  const [motivo, setMotivo] = useState<MotivoActaAdministrativa | "">("");
  const [fechaIncidente, setFechaIncidente] = useState<string>("");
  const [descripcion, setDescripcion] = useState("");
  const [sancion, setSancion] = useState("");

  const reset = () => {
    setUserId("");
    setMotivo("");
    setFechaIncidente("");
    setDescripcion("");
    setSancion("");
    setEmpleados([]);
  };

  const close = () => {
    reset();
    onClose();
  };

  const handleSearchEmpleados = async (query?: string) => {
    setBusyEmpleados(true);
    try {
      const data = await searchEmpleados(query);
      setEmpleados(
        data.map((u) => ({
          value: u.id,
          label: [u.name, u.numeroEmpleado ? `#${u.numeroEmpleado}` : null]
            .filter(Boolean)
            .join(" "),
        }))
      );
    } finally {
      setBusyEmpleados(false);
    }
  };

  const handleSave = () => {
    if (!userId || !motivo || !fechaIncidente || !descripcion.trim()) return;
    onSave({
      userId,
      motivo,
      fechaIncidente,
      descripcion: descripcion.trim(),
      sancion: sancion.trim() || undefined,
    });
  };

  const canSave = Boolean(userId && motivo && fechaIncidente && descripcion.trim()) && !saving;

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
            label={tt("form.empleado")}
            placeholder={tt("form.empleadoHint")}
            options={empleados}
            value={userId}
            onChange={(value) => setUserId(String(value))}
            onSearch={handleSearchEmpleados}
            isLoading={busyEmpleados}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITSelect
            name="actaMotivo"
            label={tt("form.motivo")}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value as MotivoActaAdministrativa)}
            options={[
              { value: "", label: "—" },
              ...MOTIVOS.map((m) => ({ value: m, label: tt(`motivos.${m}`) })),
            ]}
          />
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITDatePicker
            name="actaFechaIncidente"
            label={tt("form.fechaIncidente")}
            value={fechaIncidente ? new Date(`${fechaIncidente}T12:00:00`) : undefined}
            onChange={(event) => {
              const value = event.target.value;
              setFechaIncidente(value instanceof Date ? localToDateStr(value) : "");
            }}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITTextarea
            name="actaDescripcion"
            label={tt("form.descripcion")}
            value={descripcion}
            onChange={setDescripcion}
            rows={4}
            placeholder={tt("form.descripcionHint")}
          />
        </ITGrid>
        <ITGrid item xs={12}>
          <ITTextarea
            name="actaSancion"
            label={tt("form.sancion")}
            value={sancion}
            onChange={setSancion}
            rows={2}
            placeholder={tt("form.sancionHint")}
          />
        </ITGrid>
      </ITGrid>

      <ITFlex justify="end" gap={2} className="mt-6 pt-4 border-t border-slate-100">
        <ITButton variant="outlined" color="secondary" onClick={close} disabled={saving}>
          <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
        </ITButton>
        <ITButton variant="filled" color="primary" onClick={handleSave} disabled={!canSave}>
          <ITText className="font-bold text-[11px]">
            {saving ? tt("form.guardando") : tt("form.guardar")}
          </ITText>
        </ITButton>
      </ITFlex>
    </ITDialog>
  );
}