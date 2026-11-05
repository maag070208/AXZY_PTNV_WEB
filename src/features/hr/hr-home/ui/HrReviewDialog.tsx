import { ITButton, ITCheckbox, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { LuListChecks } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { hoursDecimal } from "@entities/schedule";
import { DialogHeader } from "@shared/ui/dialog-header";
import type { UseHrHome } from "../model/useHrHome";

interface Props {
  fx: UseHrHome;
  open: boolean;
  onClose: () => void;
  onRequestClose: () => void;
}

/**
 * «Revisar pre-nómina por departamento»: marca cada departamento como revisado
 * (o todos de una vez) y, cuando ya no falta ninguno, cierra la semana. La
 * revisión y el cierre quedan en el API con quién y cuándo.
 */
export default function HrReviewDialog({ fx, open, onClose, onRequestClose }: Props) {
  const { t } = useTranslation("hr-home");
  const reviewed = new Set(fx.reviews?.reviews.map((review) => review.departmentId ?? "") ?? []);
  return (
    <ITDialog isOpen={open} onClose={onClose} className="max-w-2xl">
      <DialogHeader
        icon={<LuListChecks />}
        tone="primary"
        title={t("review.title")}
        subtitle={t("review.subtitle", { week: fx.weekLabel })}
      />
      <div className="max-h-[52vh] overflow-y-auto">
        {fx.departmentRows.length === 0 ? (
          <ITText className="block py-6 text-center text-slate-500 !text-[12.5px]">{t("review.empty")}</ITText>
        ) : (
          fx.departmentRows.map((dept) => {
            const done = reviewed.has(dept.departmentId ?? "");
            return (
              <ITFlex
                key={dept.departmentId ?? "none"}
                align="center"
                justify="between"
                gap={3}
                className="min-h-[46px] border-b border-slate-100 py-2 last:border-b-0"
              >
                <ITCheckbox
                  checked={done}
                  disabled={!fx.canReview || fx.busy || fx.closed}
                  onChange={() => fx.toggleReview(dept.departmentId)}
                  label={
                    <ITFlex direction="column" className="min-w-0">
                      <ITText className="block font-semibold !text-[12.5px] text-slate-800">{dept.name}</ITText>
                      <ITText className="block !text-[11px] text-slate-500">
                        {t("review.people", { count: dept.people })} · {t("review.hours", { hours: hoursDecimal(dept.normalMin) })} ·{" "}
                        {t("review.extra", { hours: hoursDecimal(dept.extraMin) })} · {t("review.absences", { count: dept.absences })}
                      </ITText>
                    </ITFlex>
                  }
                />
                {done && (
                  <ITText as="span" className="shrink-0 !text-[10.5px] font-semibold" style={{ color: "var(--color-success)" }}>
                    {t("review.reviewed")}
                  </ITText>
                )}
              </ITFlex>
            );
          })
        )}
      </div>
      <ITFlex align="center" justify="between" gap={3} className="mt-4">
        <ITButton
          variant="outlined"
          color="gray"
          size="sm"
          disabled={!fx.canReview || fx.busy || fx.closed || fx.departmentRows.length === 0}
          onClick={fx.reviewAll}
        >
          <ITText as="span" className="!text-[11.5px] font-semibold">{t("review.markAll")}</ITText>
        </ITButton>
        <ITFlex align="center" gap={2}>
          <ITButton variant="text" color="gray" size="sm" onClick={onClose}>
            <ITText as="span" className="!text-[11.5px] font-semibold">{t("review.close")}</ITText>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            size="sm"
            disabled={!fx.canClose || fx.busy || !fx.allReviewed || fx.closed}
            onClick={onRequestClose}
          >
            <ITText as="span" className="!text-[11.5px] font-bold !text-white">{t("review.closeWeek")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
