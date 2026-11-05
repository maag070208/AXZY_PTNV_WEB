import { ITAlert, ITBadget, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuCheck, LuChevronRight } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import type { UseHrHome } from "../model/useHrHome";

interface Props {
  fx: UseHrHome;
  onOpenAttendance: () => void;
  onOpenOvertime: () => void;
  onOpenReview: () => void;
  onRequestClose: () => void;
}

/** Círculo del paso: su número o el check cuando ya está hecho. */
function StepMark({ step, done }: { step: number; done: boolean }) {
  return done ? (
    <ITText
      as="span"
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full"
      style={{ backgroundColor: "var(--color-success-soft, #dcfce7)", color: "var(--color-success, #15803d)" }}
    >
      <LuCheck size={13} />
    </ITText>
  ) : (
    <ITBadget label={String(step)} color="gray" size="sm" variant="outlined" />
  );
}

/**
 * «Cierre de la semana» del inicio de RH: los cuatro pasos del cierre de la
 * pre-nómina con su estado real (revisión por departamento y cierre guardados en
 * el API). Los pasos de asistencia y tiempo extra abren su pantalla; el de
 * revisión abre el diálogo por departamento; el último cierra la semana.
 */
export default function HrWeeklyClose({ fx, onOpenAttendance, onOpenOvertime, onOpenReview, onRequestClose }: Props) {
  const { t } = useTranslation("hr-home");
  const report = fx.report;
  const attendanceDone = report ? report.summary.absences === 0 : false;
  const overtimeDone = report ? report.summary.pendingExtraMin === 0 : false;
  const reviewDone = fx.allReviewed;
  const closeDone = fx.closed;

  const rows: Array<{
    key: string;
    index: number;
    title: string;
    detail: string;
    done: boolean;
    action: "attendance" | "overtime" | "review" | "close";
  }> = [
    {
      key: "attendance",
      index: 1,
      title: t("closing.steps.attendance"),
      detail: attendanceDone ? t("closing.captions.attendanceDone") : t("closing.captions.attendancePending", { count: report?.summary.absences ?? 0 }),
      done: attendanceDone,
      action: "attendance",
    },
    {
      key: "overtime",
      index: 2,
      title: t("closing.steps.overtime"),
      detail: overtimeDone
        ? t("closing.captions.overtimeDone")
        : t("closing.captions.overtimePending", { count: fx.overtime?.topPending.length ?? 0 }),
      done: overtimeDone,
      action: "overtime",
    },
    {
      key: "review",
      index: 3,
      title: t("closing.steps.review"),
      detail: t("closing.captions.reviewState", { done: fx.reviewedCount, total: fx.totalDepartments }),
      done: reviewDone,
      action: "review",
    },
    {
      key: "close",
      index: 4,
      title: t("closing.steps.close"),
      detail: closeDone ? t("closing.captions.closeDone") : t("closing.captions.closePending"),
      done: closeDone,
      action: "close",
    },
  ];

  return (
    <PanelCard title={t("closing.title")} description={t("closing.description")}>
      {fx.reviewsError && (
        <ITAlert variant="error" className="mb-3">
          {fx.reviewsError}
        </ITAlert>
      )}
      <ITFlex direction="column">
        {rows.map((row) => (
          <ITFlex
            key={row.key}
            align="center"
            justify="between"
            gap={3}
            className="min-h-[52px] border-b border-slate-100 py-2 last:border-b-0"
          >
            <ITFlex align="center" gap={2} className="min-w-0">
              <StepMark step={row.index} done={row.done} />
              <ITFlex direction="column" className="min-w-0">
                <ITText className={`block font-semibold !text-[12.5px] ${row.done ? "text-slate-500" : "text-slate-800"}`}>
                  {row.title}
                </ITText>
                <ITText className="block !text-[11px] text-slate-500">{row.detail}</ITText>
              </ITFlex>
            </ITFlex>
            {row.action === "close" ? (
              closeDone ? (
                <ITButton variant="text" color="gray" size="sm" disabled={!fx.canClose || fx.busy} onClick={fx.reopenWeek}>
                  <ITText as="span" className="!text-[11px] font-semibold">{t("closing.reopen")}</ITText>
                </ITButton>
              ) : (
                <ITButton
                  variant="filled"
                  color="primary"
                  size="sm"
                  disabled={!reviewDone || !fx.canClose || fx.busy}
                  onClick={onRequestClose}
                >
                  <ITFlex align="center" gap={1}>
                    <ITText as="span" className="!text-[11px] font-bold !text-white">{t("closing.closeAction")}</ITText>
                    <LuChevronRight size={12} className="text-white" />
                  </ITFlex>
                </ITButton>
              )
            ) : (
              <ITButton
                variant="text"
                color="primary"
                size="sm"
                disabled={!report || (row.action === "review" && !fx.canReview)}
                onClick={
                  row.action === "attendance"
                    ? onOpenAttendance
                    : row.action === "overtime"
                      ? onOpenOvertime
                      : onOpenReview
                }
              >
                <ITText as="span" className="!text-[11px] font-semibold">
                  {row.action === "review" ? t("closing.continue") : t("closing.open")}
                </ITText>
              </ITButton>
            )}
          </ITFlex>
        ))}
      </ITFlex>
    </PanelCard>
  );
}
