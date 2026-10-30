import { useTranslation } from "react-i18next";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";

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

  return (
    <LiveSummary
      title={t("new.summary.heading")}
      total={total}
      done={completed}
      footer={
        <p className="m-0 rounded-2xl bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
          <strong className="font-semibold text-slate-800">{t("new.why.title")}</strong> {t("new.why.body")}
        </p>
      }
    >
      <p className="m-0 text-[12.5px] text-slate-500">{t("new.summary.sub")}</p>
      <p className={`m-0 text-[14px] font-bold ${title ? "text-slate-800" : "text-slate-400"}`}>
        {title || t("new.summary.autoTitle")}
      </p>
      <LiveSummaryRow label={t("new.summary.category")} value={categoryName} />
      <LiveSummaryRow label={t("new.summary.detail")} value={<span className="line-clamp-2">{detail}</span>} />
      <LiveSummaryRow label={t("new.summary.where")} value={where} />
      <LiveSummaryRow label={t("new.summary.urgency")} value={urgency} />
      <LiveSummaryRow
        label={t("new.summary.evidence")}
        value={fileCount > 0 ? t("new.summary.files", { count: fileCount }) : ""}
      />
      <LiveSummaryRow label={t("new.summary.notes")} value={notes ? <span className="line-clamp-2">{notes}</span> : ""} />
      <LiveSummaryRow label={t("new.summary.requester")} value={requester} />
    </LiveSummary>
  );
}
