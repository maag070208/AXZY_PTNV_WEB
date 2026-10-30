import { useTranslation } from "react-i18next";

interface Props {
  title: string;
  categoryName: string;
  detail: string;
  where: string;
  urgency: string;
  notes: string;
  fileCount: number;
  completed: number;
  total: number;
  /** Nombre de la persona a nombre de quien se levanta el ticket (ADMIN). */
  requester?: string;
}

// Vista en vivo del ticket: se llena conforme el agente recibe cada dato.
export default function TicketSummaryPanel({
  title,
  categoryName,
  detail,
  where,
  urgency,
  notes,
  fileCount,
  completed,
  total,
  requester = "",
}: Props) {
  const { t } = useTranslation("tickets");

  const rows = [
    { label: t("new.summary.category"), value: categoryName },
    { label: t("new.summary.detail"), value: detail, clamp: true },
    { label: t("new.summary.where"), value: where },
    { label: t("new.summary.urgency"), value: urgency },
    { label: t("new.summary.evidence"), value: fileCount > 0 ? t("new.summary.files", { count: fileCount }) : "" },
    { label: t("new.summary.notes"), value: notes, clamp: true },
    { label: t("new.summary.requester"), value: requester },
  ];

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-[var(--it-card-bg)] p-6 shadow-sm lg:sticky lg:top-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-base font-bold text-slate-900">{t("new.summary.heading")}</h2>
        <p className="text-sm text-slate-500">{t("new.summary.sub")}</p>
      </div>

      <div className="flex flex-col rounded-xl border border-dashed border-slate-200 px-4 py-3">
        <p className={`pb-2 text-sm font-semibold ${title ? "text-slate-900" : "text-slate-400"}`}>
          {title || t("new.summary.autoTitle")}
        </p>
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-4 border-t border-dashed border-slate-200 py-2.5"
          >
            <span className="shrink-0 text-sm text-slate-500">{row.label}</span>
            <span
              key={row.value}
              className={`agent-pop min-w-0 text-right text-sm ${row.value ? "text-slate-900" : "text-slate-300"} ${
                row.clamp ? "line-clamp-2" : ""
              }`}
            >
              {row.value || "—"}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-1.5" aria-hidden>
        {Array.from({ length: total }, (_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full ${i < completed ? "bg-slate-900" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <div className="rounded-xl bg-sky-50 px-4 py-3 text-xs leading-5 text-slate-600">
        <strong className="font-semibold text-slate-800">{t("new.why.title")}</strong>{" "}
        {t("new.why.body")}
      </div>
    </section>
  );
}
