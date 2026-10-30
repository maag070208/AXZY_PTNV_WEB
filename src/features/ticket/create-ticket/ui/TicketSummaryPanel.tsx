import { useTranslation } from "react-i18next";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { ITText } from "@axzydev/axzy_ui_system";

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
    >
      <ITText className="m-0 text-[12.5px] text-slate-500">{t("new.summary.sub")}</ITText>
      <ITText className={`m-0 text-[14px] font-bold ${title ? "text-slate-800" : "text-slate-400"}`}>
        {title || t("new.summary.autoTitle")}
      </ITText>
      <LiveSummaryRow label={t("new.summary.category")} value={categoryName} />
      <LiveSummaryRow label={t("new.summary.detail")} value={<ITText as="span" className="line-clamp-2">{detail}</ITText>} />
      <LiveSummaryRow label={t("new.summary.where")} value={where} />
      <LiveSummaryRow label={t("new.summary.urgency")} value={urgency} />
      <LiveSummaryRow
        label={t("new.summary.evidence")}
        value={fileCount > 0 ? t("new.summary.files", { count: fileCount }) : ""}
      />
      <LiveSummaryRow label={t("new.summary.notes")} value={notes ? <ITText as="span" className="line-clamp-2">{notes}</ITText> : ""} />
      <LiveSummaryRow label={t("new.summary.requester")} value={requester} />
    </LiveSummary>
  );
}
