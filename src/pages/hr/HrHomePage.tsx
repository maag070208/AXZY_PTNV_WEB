import { useState } from "react";
import { ITAlert, ITButton, ITConfirmDialog, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { LuCalendarDays, LuChevronLeft, LuChevronRight, LuUserRound } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  HrPendingToday,
  HrQuickActions,
  HrReports,
  HrReviewDialog,
  HrWeeklyClose,
  useHrHome,
  type HrQuickAction,
} from "@features/hr/hr-home";
import { downloadHrReportPdf } from "@widgets/reports";
import { useGoBack } from "@shared/lib/useGoBack";

/**
 * Inicio de RH: lo pendiente de hoy, las acciones rápidas, el cierre de la
 * semana de pre-nómina (revisión por departamento y cierre en el API) y los
 * reportes de la semana elegida. Cada sección aparece solo si la sesión tiene
 * el permiso de su fuente.
 */
export default function HrHomePage() {
  const { t } = useTranslation(["hr-home", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const fx = useHrHome();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);

  const canCreateUsers = useCan("users.create");
  const canAssignSchedules = useCan("schedules.view");
  const canApproveOvertime = useCan("overtime.approve");

  const actions: HrQuickAction[] = [];
  if (canCreateUsers) {
    actions.push({
      id: "newEmployee",
      label: t("quick.newEmployee"),
      caption: t("quick.newEmployeeCaption"),
      onClick: () => navigate("/users/new"),
      highlight: true,
    });
  }
  if (canAssignSchedules) {
    actions.push({
      id: "assignSchedule",
      label: t("quick.assignSchedule"),
      caption: t("quick.assignScheduleCaption"),
      onClick: () => navigate("/schedules/assign"),
    });
  }
  if (canApproveOvertime) {
    actions.push({
      id: "approveOvertime",
      label: t("quick.approveOvertime"),
      caption: t("quick.approveOvertimeCaption", { count: fx.overtime?.topPending.length ?? 0 }),
      onClick: () => navigate("/schedules/overtime/approval"),
    });
  }
  if (fx.canPayroll) {
    actions.push({
      id: "closePayroll",
      label: t("quick.closePayroll"),
      caption: t("quick.closePayrollCaption", { week: fx.weekLabel }),
      onClick: () => setReviewOpen(true),
      highlight: !canCreateUsers,
    });
  }

  const weekPill = (
    <ITFlex align="center" gap={1} className="rounded-full border px-1 py-0.5" style={{ background: "var(--it-card-bg, #ffffff)", borderColor: "var(--it-card-border, #e2e8f0)" }}>
      <ITButton
        variant="text"
        color="gray"
        size="sm"
        onClick={fx.previousWeek}
        aria-label={t("week.previous")}
        title={t("week.previous")}
      >
        <LuChevronLeft size={14} />
      </ITButton>
      <ITFlex align="center" gap={1} className="px-1">
        <LuCalendarDays size={12} className="text-slate-500" />
        <ITText as="span" className="whitespace-nowrap !text-[12px] font-bold">{fx.weekLabel}</ITText>
      </ITFlex>
      <ITButton
        variant="text"
        color="gray"
        size="sm"
        onClick={fx.nextWeek}
        aria-label={t("week.next")}
        title={t("week.next")}
      >
        <LuChevronRight size={14} />
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<LuUserRound size={20} />}
      backAction={() => goBack("/")}
      maxWidth="7xl"
      actions={weekPill}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.hr"), onClick: () => navigate("/employees") },
        { label: t("title") },
      ]}
    >
      {fx.reportError && (
        <ITAlert variant="error" className="mb-3" dismissible>
          {fx.reportError}
        </ITAlert>
      )}
      <ITFlex direction="column" gap={4}>
        {(fx.canAttendance || fx.canOvertime || fx.canRecords) && (
          <HrPendingToday
            attendance={fx.attendance}
            overtime={fx.overtime}
            records={fx.records}
            onAttendance={() => navigate("/hr/time-clock/entries-exits")}
            onOvertime={() => navigate("/schedules/overtime/approval")}
            onRecords={() => navigate("/employees/records")}
          />
        )}

        <div className="grid grid-cols-1 gap-4 xl:!grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
          <HrQuickActions actions={actions} />
          {fx.canPayroll && (
            <HrWeeklyClose
              fx={fx}
              onOpenAttendance={() => navigate("/hr/time-clock/entries-exits")}
              onOpenOvertime={() => navigate("/schedules/overtime/approval")}
              onOpenReview={() => setReviewOpen(true)}
              onRequestClose={() => setConfirmClose(true)}
            />
          )}
        </div>

        {fx.canPayroll && <HrReports fx={fx} downloadPdf={downloadHrReportPdf} />}
      </ITFlex>

      <HrReviewDialog
        fx={fx}
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        onRequestClose={() => setConfirmClose(true)}
      />
      <ITConfirmDialog
        isOpen={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => {
          setConfirmClose(false);
          setReviewOpen(false);
          void fx.closeWeek();
        }}
        title={t("confirm.title")}
        message={t("confirm.message", { week: fx.weekLabel })}
        confirmLabel={t("confirm.confirm")}
        cancelLabel={t("confirm.cancel")}
        variant="primary"
        loading={fx.busy}
      />
    </ITPage>
  );
}
