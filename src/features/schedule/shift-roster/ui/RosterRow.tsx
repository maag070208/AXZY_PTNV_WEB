import { memo } from "react";
import { useTranslation } from "react-i18next";
import type { CSSProperties } from "react";
import type { RosterPerson, Schedule } from "@entities/schedule";
import { REST_VALUE, cellKey, savedValue } from "../model/useShiftRoster";
import { BASE_TONE, REST_TONE, type Tone } from "../model/shiftColors";
import { dateLocale } from "@shared/i18n";

const EMPTY_TONE: Tone = { background: "#ffffff", color: "#6b7280" };

/** Día corto ("Jue") y fecha ("19/11") de un YYYY-MM-DD. */
const dayParts = (iso: string) => {
  const d = new Date(`${iso}T00:00:00Z`);
  const name = d.toLocaleDateString(dateLocale(), { weekday: "short", timeZone: "UTC" }).replace(".", "");
  return {
    name: `${name.charAt(0).toUpperCase()}${name.slice(1)}`,
    date: d.toLocaleDateString(dateLocale(), { day: "2-digit", month: "2-digit", timeZone: "UTC" }),
  };
};

interface Props {
  person: RosterPerson;
  /** Valor editado por celda (undefined = sin cambio), en el orden de los días. */
  vals: (string | undefined)[];
  editable: boolean;
  painting: boolean;
  tones: Map<string, Tone>;
  byId: Map<string, Schedule>;
  onPaintPerson: (userId: string) => void;
}

/** Fila de una persona; memoizada por persona + valores de sus celdas. */
function RosterRow({ person: p, vals, editable, painting, tones, byId, onPaintPerson }: Props) {
  const { t } = useTranslation("schedules");
  return (
    <tr>
      <td className="sticky left-0 z-10 min-w-[120px] max-w-[150px] sm:min-w-[170px] sm:max-w-none border-b border-slate-100 bg-white px-3 py-1.5">
        {editable ? (
          <button
            type="button"
            disabled={!painting}
            onClick={() => onPaintPerson(p.userId)}
            title={t("roster.paintPerson", { name: p.name })}
            className={`block w-full text-left ${painting ? "cursor-pointer hover:text-sky-700" : "cursor-default"}`}
          >
            <span className="block font-semibold text-slate-800">{p.name}</span>
            {p.employeeNumber && <span className="block text-[12px] text-slate-500">#{p.employeeNumber}</span>}
          </button>
        ) : (
          <>
            <span className="block font-semibold text-slate-800">{p.name}</span>
            {p.employeeNumber && <span className="block text-[12px] text-slate-500">#{p.employeeNumber}</span>}
          </>
        )}
      </td>
      {p.cells.map((cell, i) => {
        const dirtyVal = vals[i];
        const dirty = dirtyVal !== undefined;
        const value = dirty ? dirtyVal : savedValue(cell);
        let tone: Tone;
        let label: string;
        let dashed = false;
        let italic = false;
        if (value === "") {
          // Sin turno del día: se ve el horario base (si existe) con borde punteado.
          if (cell.source === "BASE" && cell.restDay) {
            tone = REST_TONE;
            label = t("roster.baseSuffix", { name: t("roster.rest") });
            dashed = italic = true;
          } else if (cell.source === "BASE" && cell.scheduleName) {
            tone = (cell.scheduleId && tones.get(cell.scheduleId)) || BASE_TONE;
            label = t("roster.baseSuffix", { name: cell.scheduleName });
            dashed = italic = true;
          } else if (cell.source === "NONE") {
            tone = EMPTY_TONE;
            label = t("roster.noSchedule");
            dashed = true;
          } else {
            // Se quitó un turno guardado: el detalle del base no viene en la celda.
            tone = BASE_TONE;
            label = t("roster.baseOption");
            dashed = italic = true;
          }
        } else if (value === REST_VALUE) {
          tone = REST_TONE;
          label = t("roster.rest");
        } else {
          tone = tones.get(value) ?? BASE_TONE;
          label = byId.get(value)?.name ?? cell.scheduleName ?? "";
        }
        const empty = tone === EMPTY_TONE;
        const style: CSSProperties = {
          background: tone.background,
          color: tone.color,
          border: `1.5px ${dashed ? "dashed" : "solid"} ${dashed ? (empty ? "#c9d0da" : "#6b7280") : "transparent"}`,
          fontStyle: italic ? "italic" : undefined,
          fontWeight: dashed ? 400 : 600,
          boxShadow: dirty ? "inset 0 0 0 2px #d99a1e" : undefined,
        };
        const d = dayParts(cell.date);
        const title = `${p.name}, ${d.name} ${d.date}: ${label}`;
        const cls = "block min-h-[38px] w-full whitespace-normal break-words rounded-lg px-1.5 py-1 text-center text-[13px] leading-tight";
        return (
          <td key={cell.date} className="border-b border-slate-100 p-1.5 text-center align-middle">
            {editable ? (
              <button
                type="button"
                data-k={cellKey(p.userId, cell.date)}
                aria-label={title}
                title={title}
                style={style}
                className={`${cls} cursor-pointer`}
              >
                {label}
              </button>
            ) : (
              <div className={cls} style={style} title={title}>
                {label}
              </div>
            )}
          </td>
        );
      })}
    </tr>
  );
}

const sameVals = (a: (string | undefined)[], b: (string | undefined)[]) => a.length === b.length && a.every((v, i) => v === b[i]);

export default memo(
  RosterRow,
  (a, b) =>
    a.person === b.person &&
    a.editable === b.editable &&
    a.painting === b.painting &&
    a.tones === b.tones &&
    a.byId === b.byId &&
    a.onPaintPerson === b.onPaintPerson &&
    sameVals(a.vals, b.vals),
);
