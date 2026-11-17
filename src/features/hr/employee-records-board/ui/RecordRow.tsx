import { ITText } from "@axzydev/axzy_ui_system";
import { FaRegBell } from "react-icons/fa";
import type { RecordGapsRow } from "@entities/dashboard";
import { toTitleCase } from "@shared/utils/text";
import { recordStatus, type RecordStatus, type UseEmployeeRecords } from "../model/useEmployeeRecords";
import { InitialsAvatar } from "@shared/ui/initials-avatar";
import { countDone, hairline, recordsGrid } from "./recordStyles";


const STATUS_STYLE: Record<RecordStatus, { bg: string; fg: string }> = {
  REQUIRED: { bg: "#fbeaea", fg: "#b83a3a" },
  INCOMPLETE: { bg: "#eef0f4", fg: "#556070" },
  COMPLETE: { bg: "#e4f5e9", fg: "#2d7a45" },
};


/** Barra fina con el avance a la izquierda y "hecho/total" a la derecha. */
function Progress({ done, total, label }: { done: number; total: number; label: string }) {
  const pct = total ? Math.round((done / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2" title={label}>
      <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full" style={{ background: "#eef0f4" }}>
        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: done === total && total > 0 ? "var(--color-success)" : "#64748b" }} />
      </div>
      <span className="text-[12px] tabular-nums text-slate-600">{done}/{total}</span>
    </div>
  );
}

interface Props {
  row: RecordGapsRow;
  fx: UseEmployeeRecords;
  active: boolean;
  last: boolean;
}

/** Una fila de la tabla de expedientes (divs con roles ARIA, no <table>). */
export default function RecordRow({ row: r, fx, active, last }: Props) {
  const { t } = fx;
  const status = recordStatus(r);
  const fieldsTotal = r.filledFields.length + r.missingFields.length;
  const reqDone = countDone(r.requiredDocuments);
  const st = STATUS_STYLE[status];
  const name = toTitleCase(r.name);
  return (
    <div
      role="row"
      onClick={() => fx.select(r.userId)}
      className={`${recordsGrid} cursor-pointer px-4 py-2.5 ${active ? "" : "hover:bg-slate-50/60"}`}
      style={{
        borderBottom: last ? undefined : hairline,
        background: active ? "#eef1f6" : undefined,
        boxShadow: active ? "inset 3px 0 0 #17233a" : undefined,
      }}
    >
      <span role="cell" onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className="h-4 w-4 cursor-pointer"
          checked={fx.checkedIds.has(r.userId)}
          onChange={() => fx.toggleChecked(r.userId)}
          aria-label={t("records.selectRow", { name })}
        />
      </span>
      <span role="cell" className="min-w-0">
        <div className="flex items-center gap-3">
          <InitialsAvatar name={r.name} />
          <div className="min-w-0">
            <div className="line-clamp-2 text-[13px] font-bold leading-tight text-slate-900">{name}</div>
            <div className="text-[11px] text-slate-500">{r.employeeNumber ? `#${r.employeeNumber}` : "#—"}</div>
          </div>
        </div>
      </span>
      <span role="cell" className="text-[13px] text-slate-700">{toTitleCase(r.departmentName) || "—"}</span>
      <span role="cell">
        <div
          className="flex items-center gap-1"
          title={r.requiredDocuments.map((d) => `${d.delivered ? "✓" : "✗"} ${d.name}`).join("\n")}
        >
          {r.requiredDocuments.map((d) => (
            <span
              key={d.id}
              className="h-2.5 w-2.5 rounded-full"
              style={{ border: `2px solid ${d.delivered ? "var(--color-success)" : "var(--color-danger)"}`, background: d.delivered ? "var(--color-success)" : "transparent" }}
            />
          ))}
          <ITText as="span" className="ml-1.5 text-[12.5px] font-bold tabular-nums text-slate-900">
            {reqDone}/{r.requiredDocuments.length}
          </ITText>
        </div>
      </span>
      <span role="cell">
        <Progress
          done={countDone(r.otherDocuments)}
          total={r.otherDocuments.length}
          label={t("records.progress", { done: countDone(r.otherDocuments), total: r.otherDocuments.length })}
        />
      </span>
      <span role="cell">
        <Progress done={r.filledFields.length} total={fieldsTotal} label={t("records.progress", { done: r.filledFields.length, total: fieldsTotal })} />
      </span>
      <span role="cell">
        <span className="inline-block whitespace-nowrap rounded-md px-2 py-1 text-[12px] font-medium" style={{ background: st.bg, color: st.fg }}>
          {t(`records.status.${status}`)}
        </span>
      </span>
      <span role="cell" onClick={(e) => e.stopPropagation()}>
        {status !== "COMPLETE" && (
          <button
            type="button"
            title={t("records.notify")}
            aria-label={t("records.notify")}
            disabled={fx.notifying === r.userId}
            onClick={() => void fx.notify(r)}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-white text-slate-700 disabled:opacity-50"
            style={{ border: "1px solid #dde3ea" }}
          >
            <FaRegBell size={13} />
          </button>
        )}
      </span>
    </div>
  );
}
