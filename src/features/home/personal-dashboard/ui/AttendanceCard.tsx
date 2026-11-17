import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AttendanceTodayRow, AttendanceTodayWidget } from "@entities/dashboard";
import { dyn } from "@shared/i18n/dyn";
import { InitialsAvatar } from "@shared/ui/initials-avatar";
import { toTitleCase } from "@shared/utils/text";
import { formatTimeInTZ } from "@shared/utils/dates";
import { CardShell, StackedBar, StatChip } from "@shared/ui/dashboard-card";

const ORANGE = "#f97316";

interface Chip {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Color de fondo suave cuando el chip es una alerta (valor > 0). */
  tint?: string;
  /** Criterio del filtro: qué filas de la lista pertenecen a este chip. */
  match: (r: AttendanceTodayRow) => boolean;
  /** Pantalla de detalle de este estado (enlace "Ver reporte"). */
  to: string;
}

/** Tarjeta "Asistencia de hoy": barra apilada por estado y chips con el conteo. */
export default function AttendanceCard({ attendance }: { attendance: AttendanceTodayWidget | null }) {
  const { t: tt } = useTranslation("dashboard");
  const t = dyn(tt);
  const navigate = useNavigate();
  const c = attendance?.counts;
  const present = c?.PRESENT ?? 0;
  const late = c?.LATE ?? 0;
  const notArrived = c?.NOT_ARRIVED ?? 0;
  const notYet = c?.NOT_YET ?? 0;
  const unlinked = c?.UNLINKED ?? 0;
  const onSite = c?.onSite ?? 0;

  const arrived = present + late;
  // Programados = quienes hoy tienen turno (o no se pueden medir por falta de vínculo).
  const scheduled = present + late + notArrived + notYet + unlinked;

  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const chips: Chip[] = [
    { key: "PRESENT", label: t("attendance.status.PRESENT"), value: present, color: "var(--color-success)", match: (r) => r.status === "PRESENT", to: "/schedules/payroll" },
    { key: "LATE", label: t("attendance.status.LATE"), value: late, color: "var(--color-warning)", match: (r) => r.status === "LATE", to: "/schedules/payroll" },
    { key: "NOT_ARRIVED", label: t("attendance.status.NOT_ARRIVED"), value: notArrived, color: "var(--color-danger)", tint: "#fbeaea", match: (r) => r.status === "NOT_ARRIVED", to: "/schedules/payroll" },
    { key: "NOT_YET", label: t("attendance.status.NOT_YET"), value: notYet, color: "#9aa3b2", tint: "#eef0f4", match: (r) => r.status === "NOT_YET", to: "/schedules/payroll" },
    { key: "ON_SITE", label: t("attendance.onSite"), value: onSite, color: "var(--color-violet-500)", match: (r) => r.onSite, to: "/access" },
    { key: "UNLINKED", label: t("attendance.status.UNLINKED"), value: unlinked, color: ORANGE, tint: "#fef1e3", match: (r) => r.status === "UNLINKED", to: "/hr/time-clock/employees" },
  ];
  const selected = chips.find((c) => c.key === selectedKey) ?? null;
  const listRows = selected ? (attendance?.rows ?? []).filter(selected.match) : [];
  const tz = attendance?.timezone;
  const time = (iso: string | null) => (iso ? formatTimeInTZ(iso, tz) : "");
  // Detalle a la derecha de cada fila según el estado de la persona.
  const detailOf = (r: AttendanceTodayRow) => {
    if (r.status === "UNLINKED") return t("attendance.unlinkedShort");
    if (r.status === "LATE") return `${time(r.entryAt)} +${r.lateMin} min`;
    if (r.status === "NOT_ARRIVED" || r.status === "NOT_YET") return r.shift ?? "—";
    return time(r.entryAt) || r.shift || "—";
  };

  // Segmentos de la barra: lo que se puede medir hoy, cada uno con su color.
  const segments = [
    { key: "PRESENT", value: present, color: "var(--color-success)" },
    { key: "LATE", value: late, color: "var(--color-warning)" },
    { key: "NOT_ARRIVED", value: notArrived, color: "var(--color-danger)" },
    { key: "NOT_YET", value: notYet, color: "#c3c9d4" },
    { key: "UNLINKED", value: unlinked, color: ORANGE },
  ];

  return (
    <CardShell
      title={t("attendance.title")}
      className="xl:basis-[44%]"
      right={
        <span className="text-[13px] text-slate-600">
          <b className="font-bold text-slate-900">{arrived}</b> {t("attendance.arrivedOfScheduled", { total: scheduled })}
        </span>
      }
    >
      <StackedBar segments={segments} label={t("attendance.title")} />

      <div className="mt-4 grid grid-cols-2 gap-2 sm:!grid-cols-3">
        {chips.map((chip) => (
          <StatChip
            key={chip.key}
            label={chip.label}
            value={chip.value}
            color={chip.color}
            tint={chip.tint}
            selected={selectedKey === chip.key}
            onClick={() => setSelectedKey(selectedKey === chip.key ? null : chip.key)}
          />
        ))}
      </div>

      {selected && (
        <div className="mt-3 flex min-h-0 flex-col">
          <div className="mb-1 flex items-center justify-between gap-2 text-[13px]">
            <b className="font-semibold text-slate-900">{selected.label} · {listRows.length}</b>
            <span className="flex items-center gap-3">
              <button type="button" className="cursor-pointer text-[12px] font-semibold text-slate-900 underline" onClick={() => navigate(selected.to)}>
                {t("attendance.viewReportShort")}
              </button>
              <button type="button" className="cursor-pointer text-[12px] text-slate-500 underline" onClick={() => setSelectedKey(null)}>
                {t("attendance.clearFilter")}
              </button>
            </span>
          </div>
          <div className="max-h-[216px] overflow-auto" style={{ borderTop: "1px solid #eef1f5" }}>
            {listRows.length === 0 ? (
              <div className="py-4 text-center text-[12.5px] text-slate-500">{t("attendance.nobody")}</div>
            ) : (
              listRows.map((r) => (
                <div key={r.userId} className="flex items-center justify-between gap-3 py-1.5" style={{ borderBottom: "1px solid #f3f5f8" }}>
                  <span className="flex min-w-0 items-center gap-2.5 text-[13px] text-slate-800">
                    <InitialsAvatar name={r.name} size={28} />
                    <span className="truncate">{toTitleCase(r.name)}</span>
                  </span>
                  <span className="shrink-0 text-[12.5px] tabular-nums text-slate-600">{detailOf(r)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </CardShell>
  );
}
