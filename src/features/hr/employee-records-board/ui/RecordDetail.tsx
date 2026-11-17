import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITButton, ITText } from "@axzydev/axzy_ui_system";
import type { RecordGapsRow } from "@entities/dashboard";
import { toTitleCase } from "@shared/utils/text";
import { recordStatus, type UseEmployeeRecords } from "../model/useEmployeeRecords";
import { InitialsAvatar } from "@shared/ui/initials-avatar";
import { NAVY, countDone, hairline } from "./recordStyles";

const OTHER_DOCS_PREVIEW = 4;
const FIELDS_PREVIEW = 4;

const chipBase = "inline-block rounded-md px-2.5 py-1 text-[12px]";
const linkBtn = "cursor-pointer text-[12px] font-semibold text-slate-900 underline";

interface Props {
  sel: RecordGapsRow;
  fx: UseEmployeeRecords;
  /** Abre el selector de archivo para subir el documento de ese tipo. */
  onPickFile: (typeId: string) => void;
}

/** Detalle del expediente de la persona elegida: avance, documentos y acciones. */
export default function RecordDetail({ sel, fx, onPickFile }: Props) {
  const { t } = fx;
  const navigate = useNavigate();
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);

  const reqDone = countDone(sel.requiredDocuments);
  const reqTotal = sel.requiredDocuments.length;
  const othersDone = countDone(sel.otherDocuments);
  const othersTotal = sel.otherDocuments.length;
  const fieldsDone = sel.filledFields.length;
  const fieldsTotal = fieldsDone + sel.missingFields.length;
  const done = reqDone + othersDone + fieldsDone;
  const total = reqTotal + othersTotal + fieldsTotal;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const complete = recordStatus(sel) === "COMPLETE";

  const uploadButton = (typeId: string, variant: "outlined" | "text" = "outlined") => (
    <ITButton
      variant={variant}
      color="secondary"
      size={variant === "outlined" ? "md" : "sm"}
      disabled={fx.uploading === typeId}
      onClick={() => onPickFile(typeId)}
      label={fx.uploading === typeId ? t("records.detail.uploading") : t("records.detail.upload")}
    />
  );

  const fields = [
    ...sel.filledFields.map((f) => ({ key: f, filled: true })),
    ...sel.missingFields.map((f) => ({ key: f, filled: false })),
  ];
  const shownFields = showAllFields ? fields : fields.slice(0, FIELDS_PREVIEW);
  const hiddenDocs = othersTotal - OTHER_DOCS_PREVIEW;

  return (
    <>
      <div className="flex items-center gap-3">
        <InitialsAvatar name={sel.name} size={44} />
        <div className="min-w-0">
          <div className="line-clamp-2 text-[15px] font-bold leading-tight text-slate-900">{toTitleCase(sel.name)}</div>
          <div className="mt-0.5 text-[12px] text-slate-500">
            {[sel.employeeNumber ? `#${sel.employeeNumber}` : "#—", sel.departmentName].filter(Boolean).join(" · ")}
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <ITText as="span" className="text-[13.5px] font-bold text-slate-900">{t("records.detail.total")}</ITText>
        <span className="flex items-baseline gap-1">
          <b className="text-[17px] font-bold tabular-nums text-slate-900">{done}</b>
          <span className="text-[12.5px] text-slate-500">{t("records.detail.ofTotal", { total })}</span>
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full" style={{ background: "#eef0f4" }}>
        <div className="h-full rounded-full transition-[width] duration-700" style={{ width: `${pct}%`, background: "#64748b" }} />
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 text-[12px] text-slate-500">
        <span>{t("records.detail.summaryRequired")} {reqDone}/{reqTotal}</span>
        <span>{t("records.detail.summaryOther")} {othersDone}/{othersTotal}</span>
        <span>{t("records.detail.summaryData")} {fieldsDone}/{fieldsTotal}</span>
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
        <div className="mt-4 pt-4" style={{ borderTop: hairline }}>
          <div className="text-[12px] font-bold uppercase tracking-[0.04em]" style={{ color: reqDone === reqTotal ? "var(--color-success)" : "#b83a3a" }}>
            {reqDone === reqTotal ? t("records.detail.requiredDone") : t("records.detail.requiredMissing", { count: reqTotal - reqDone })}
          </div>
          <div className="mt-1">
            {sel.requiredDocuments.map((d) => {
              const file = fx.documentOf(d.id);
              return (
                <div key={d.id} className="flex items-center justify-between gap-2 py-2">
                  <ITText as="span" className="flex-1 text-[13.5px] text-slate-800">{d.name}</ITText>
                  {d.delivered && file ? (
                    <div className="flex items-center gap-1">
                      <ITButton variant="text" color="secondary" size="sm" label={t("records.detail.view")} onClick={() => window.open(file.url, "_blank", "noopener")} />
                      {uploadButton(d.id, "text")}
                    </div>
                  ) : (
                    uploadButton(d.id)
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="mt-3 pt-4" style={{ borderTop: hairline }}>
          <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">
            {t("records.detail.other", { done: othersDone, total: othersTotal })}
          </div>
          {showAllDocs ? (
            <div className="mt-1">
              {sel.otherDocuments.map((d) => {
                const file = fx.documentOf(d.id);
                return (
                  <div key={d.id} className="flex items-center justify-between gap-2 py-1.5">
                    <ITText as="span" className="flex-1 text-[12.5px] text-slate-800">{d.name}</ITText>
                    {d.delivered && file ? (
                      <a href={file.url} target="_blank" rel="noreferrer" className="text-[12px] text-slate-500 hover:underline">
                        {t("records.detail.delivered")}
                      </a>
                    ) : (
                      uploadButton(d.id, "text")
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {sel.otherDocuments.slice(0, OTHER_DOCS_PREVIEW).map((d) => (
                <span key={d.id} className={chipBase} style={d.delivered ? { background: "#e4f5e9", color: "#2d7a45" } : { background: "#f1f3f6", color: "#556070" }}>
                  {d.name}
                </span>
              ))}
            </div>
          )}
          {hiddenDocs > 0 && (
            <button type="button" className={`${linkBtn} mt-2`} onClick={() => setShowAllDocs((v) => !v)}>
              {showAllDocs ? t("records.detail.showLess") : t("records.detail.moreFields", { count: hiddenDocs })}
            </button>
          )}
        </div>

        <div className="mt-3 pt-4" style={{ borderTop: hairline }}>
          <div className="text-[12px] font-bold uppercase tracking-[0.04em] text-slate-500">
            {t("records.detail.personal", { done: fieldsDone, total: fieldsTotal })}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            {shownFields.map((f) => (
              <span key={f.key} className={chipBase} style={f.filled ? { background: "#e4f5e9", color: "#2d7a45" } : { background: "#f1f3f6", color: "#556070" }}>
                {t(`records.profileFields.${f.key}`)}
              </span>
            ))}
            {fields.length > FIELDS_PREVIEW && (
              <button type="button" className={linkBtn} onClick={() => setShowAllFields((v) => !v)}>
                {showAllFields ? t("records.detail.showLess") : t("records.detail.moreFields", { count: fields.length - FIELDS_PREVIEW })}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 grid !grid-cols-2 gap-2 pt-4" style={{ borderTop: hairline }}>
        <button
          type="button"
          disabled={complete || fx.notifying === sel.userId}
          onClick={() => void fx.notify(sel)}
          className="cursor-pointer rounded-xl px-3 py-2.5 text-[13.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
          style={{ background: NAVY }}
        >
          {complete ? t("records.complete") : t("records.detail.send")}
        </button>
        <button
          type="button"
          onClick={() => navigate(`/employees/${sel.userId}`)}
          className="cursor-pointer rounded-xl bg-white px-3 py-2.5 text-[13.5px] font-semibold text-slate-900"
          style={{ border: "1px solid #dde3ea" }}
        >
          {t("records.detail.open")}
        </button>
      </div>
    </>
  );
}
