import { useEffect, useMemo, useState } from "react";
import { ITButton, ITCard, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { RosterPerson, Schedule } from "@entities/schedule";
import { dateLocale } from "@shared/i18n";
import HelpHint from "./HelpHint";
import { REST_VALUE } from "../model/useShiftRoster";
import { BASE_TONE, REST_TONE, type Tone } from "../model/shiftColors";

const PRIMARY = "var(--color-primary)";

/** Chip del color del turno; el elegido lleva contorno oscuro con separación. */
const chipStyle = (tone: Tone, on: boolean, dashed = false) => ({
  background: tone.background,
  color: tone.color,
  border: `1.5px ${dashed ? "dashed" : "solid"} ${dashed ? "#6b7280" : "transparent"}`,
  outline: on ? "2px solid #111827" : undefined,
  outlineOffset: on ? 2 : undefined,
});

/** Chip de día: relleno primario cuando está elegido, además del contorno. */
const dayChipStyle = (on: boolean) =>
  on
    ? { background: PRIMARY, color: "#fff", border: "1.5px solid transparent", outline: "2px solid #111827", outlineOffset: 2 }
    : { background: "#ffffff", color: "#111827", border: "1.5px solid #cbd5e1" };

const dayLabel = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const name = d.toLocaleDateString(dateLocale(), { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${d.getUTCDate()}`;
};

interface Props {
  days: string[];
  schedules: Schedule[];
  /** Personas visibles (ya con filtro de departamento y búsqueda). */
  people: RosterPerson[];
  tones: Map<string, Tone>;
  /** Escribe las celdas en los cambios pendientes (no guarda). */
  onApply: (userIds: string[], days: string[], value: string) => void;
  /** Abre el alta de un turno con horario propio. */
  onNewShift?: () => void;
  /** Turno recién creado: se deja elegido en el paso 1. */
  pickShiftId?: string | null;
}

function StepTitle({ n, title, help }: { n: number; title: string; help: string }) {
  return (
    <div className="flex items-center gap-2 font-bold">
      <span
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white"
        style={{ background: PRIMARY }}
      >
        {n}
      </span>
      <ITText as="span" className="!text-[14px] font-bold">{title}</ITText>
      <HelpHint text={help} />
    </div>
  );
}

/**
 * Asignación en bloque en 3 pasos: turno → días → personas. «Aplicar» solo
 * escribe en los cambios pendientes del rol (un paso de deshacer); se guarda
 * desde la cuadrícula.
 */
export default function BulkAssignPanel({ days, schedules, people, tones, onApply, onNewShift, pickShiftId }: Props) {
  const { t } = useTranslation("schedules");
  /** null = sin elegir; "" = horario base; REST_VALUE = descanso; id = turno. */
  const [shift, setShift] = useState<string | null>(null);
  const [pickedDays, setPickedDays] = useState<Set<string>>(new Set());
  const [pickedPeople, setPickedPeople] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    if (pickShiftId) setShift(pickShiftId);
  }, [pickShiftId]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q) || (p.employeeNumber ?? "").toLowerCase().includes(q));
  }, [people, search]);
  // Solo cuentan las personas marcadas que siguen visibles.
  const selected = useMemo(() => people.filter((p) => pickedPeople.has(p.userId)), [people, pickedPeople]);
  const selectedDays = days.filter((d) => pickedDays.has(d));
  const allShown = shown.length > 0 && shown.every((p) => pickedPeople.has(p.userId));
  const allDays = days.length > 0 && selectedDays.length === days.length;
  const names = useMemo(() => new Map(schedules.map((s) => [s.id, s.name])), [schedules]);

  const shiftName = (v: string | null) =>
    v === null ? "" : v === "" ? t("roster.baseOption") : v === REST_VALUE ? t("roster.rest") : (names.get(v) ?? "");

  const toggle = (set: Set<string>, setSet: (n: Set<string>) => void, id: string) => {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  };

  const toggleAll = () => {
    const next = new Set(pickedPeople);
    for (const p of shown) {
      if (allShown) next.delete(p.userId);
      else next.add(p.userId);
    }
    setPickedPeople(next);
  };

  const ready = shift !== null && selectedDays.length > 0 && selected.length > 0;

  const apply = () => {
    if (shift === null || !ready) return;
    onApply(selected.map((p) => p.userId), selectedDays, shift);
    setResult(t("roster.bulk.result", { people: selected.length, shift: shiftName(shift), days: selectedDays.length }));
  };

  const shiftChip = (value: string, label: string, tone: Tone) => {
    const on = shift === value;
    return (
      <button
        key={value || "__BASE__"}
        type="button"
        aria-pressed={on}
        onClick={() => setShift(value)}
        style={chipStyle(tone, on, value === "")}
        className="rounded-full px-3 py-1.5 text-[14px] leading-tight transition hover:brightness-95"
      >
        {label}
      </button>
    );
  };

  /** Caja de cada paso: mismo estilo que las secciones de la guía. */
  const stepBox = "grid gap-3 rounded-xl border border-slate-200 bg-white p-4";

  return (
    <ITCard contentClassName="!p-0" className="bento-rise overflow-hidden">
      <div className="grid gap-4 p-5">
        <p className="text-[14px] text-slate-600">{t("roster.bulk.intro")}</p>

        <div className={stepBox}>
          <StepTitle n={1} title={t("roster.bulk.step1")} help={t("roster.help.bulkStep1")} />
          <div className="flex flex-wrap gap-1.5">
            {schedules.map((s) => shiftChip(s.id, s.name, tones.get(s.id) ?? BASE_TONE))}
            {shiftChip(REST_VALUE, t("roster.rest"), REST_TONE)}
            {shiftChip("", t("roster.baseBrush"), BASE_TONE)}
            {onNewShift && (
              <button
                type="button"
                onClick={onNewShift}
                className="rounded-full border-[1.5px] border-dashed px-3 py-1.5 text-[14px] font-semibold leading-tight transition hover:brightness-95"
                style={{ borderColor: PRIMARY, color: PRIMARY, background: "#ffffff" }}
              >
                {t("roster.customShift")}
              </button>
            )}
          </div>
        </div>

        <div className={stepBox}>
          <StepTitle n={2} title={t("roster.bulk.step2")} help={t("roster.help.bulkStep2")} />
          <div className="flex flex-wrap gap-1.5">
            <button
              type="button"
              aria-pressed={allDays}
              onClick={() => setPickedDays(allDays ? new Set() : new Set(days))}
              style={dayChipStyle(allDays)}
              className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold leading-tight"
            >
              {t("roster.bulk.wholeWeek")}
            </button>
            {days.map((d) => {
              const on = pickedDays.has(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(pickedDays, setPickedDays, d)}
                  style={dayChipStyle(on)}
                  className="rounded-full px-3.5 py-1.5 text-[14px] font-semibold leading-tight"
                >
                  {dayLabel(d)}
                </button>
              );
            })}
          </div>
        </div>

        <div className={stepBox}>
          <StepTitle n={3} title={t("roster.bulk.step3")} help={t("roster.help.bulkStep3")} />
          {/* Encabezado de la lista: buscar + seleccionar todas + contador en un renglón */}
          <div className="flex flex-wrap items-end gap-2">
            <ITInput
              name="bulkSearch"
              label={t("roster.bulk.searchPeople")}
              placeholder={t("roster.searchPlaceholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full min-w-[200px] max-w-[300px]"
            />
            <ITButton variant="outlined" color="secondary" size="sm" disabled={shown.length === 0} onClick={toggleAll}>
              <ITText as="span" className="text-[12px] font-bold">
                {allShown ? t("roster.bulk.deselectAll") : t("roster.bulk.selectAll")}
              </ITText>
            </ITButton>
            <span className="pb-1.5 text-[13px] font-semibold text-slate-600">
              {t("roster.bulk.count", { selected: selected.length, total: people.length })}
            </span>
          </div>
          {/* Lista compacta con scroll propio: 161 personas no deben estirar la página */}
          <div className="max-h-[340px] overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-1.5">
            <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {shown.map((p) => {
                const on = pickedPeople.has(p.userId);
                return (
                  <label
                    key={p.userId}
                    className={`flex min-w-0 cursor-pointer items-center gap-2 rounded-md border px-2.5 py-1.5 transition ${
                      on ? "border-transparent bg-white shadow-sm" : "border-transparent hover:bg-white"
                    }`}
                    style={on ? { boxShadow: `inset 0 0 0 1.5px ${PRIMARY}` } : undefined}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => toggle(pickedPeople, setPickedPeople, p.userId)}
                      style={{ accentColor: PRIMARY }}
                      className="h-4 w-4 shrink-0"
                    />
                    <span className="grid min-w-0">
                      <span className="truncate text-[13px] font-semibold text-slate-800">{p.name}</span>
                      <span className="truncate text-[11px] text-slate-500">
                        {[p.employeeNumber ? `#${p.employeeNumber}` : null, p.departmentName].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                  </label>
                );
              })}
              {shown.length === 0 && <p className="p-3 text-[13px] text-slate-500">{t("roster.empty")}</p>}
            </div>
          </div>
        </div>

        {result && (
          <div className="rounded-[10px] px-3.5 py-3 text-[14px]" style={{ background: "#e6f3f6", color: "#0a4f5f" }}>
            {result}
          </div>
        )}
      </div>

      {/* Pie fijo de la tarjeta: acción a la izquierda (el asistente flota abajo a la derecha) */}
      <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-slate-200 bg-white/95 px-5 py-3 backdrop-blur">
        <ITButton variant="filled" color="primary" size="sm" disabled={!ready} onClick={apply}>
          <ITText as="span" className="text-[12px] font-bold !text-white">{t("roster.bulk.apply")}</ITText>
        </ITButton>
        <HelpHint text={t("roster.help.bulkApply")} />
        <span className={`text-[14px] ${ready ? "font-semibold text-slate-800" : "text-slate-500"}`}>
          {ready
            ? t("roster.bulk.hintReady", { shift: shiftName(shift), people: selected.length, days: selectedDays.length })
            : t("roster.bulk.hintMissing")}
        </span>
      </div>
    </ITCard>
  );
}
