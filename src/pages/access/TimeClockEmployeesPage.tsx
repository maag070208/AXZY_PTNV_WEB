import { ITButton, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaExchangeAlt, FaLink, FaMagic } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TimeClockEmployeesTab, useTimeClockEmployees } from "@features/access/time-clock-employees";

export default function TimeClockEmployeesPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useTimeClockEmployees();

  return (
    <ITPage
      noPadding
      title={t("employees.title")}
      description={t("employees.description")}
      icon={<FaLink size={20} />}
      // Las acciones de la pantalla, en el encabezado (como en Checadas).
      actions={
        <ITFlex align="center" wrap="wrap" gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            size="sm"
            onClick={() => navigate("/hr/time-clock/employees/differences")}
          >
            <ITFlex align="center" gap={1}>
              <FaExchangeAlt size={11} />
              <ITText className="font-bold text-[11px]">{t("differences.open")}</ITText>
            </ITFlex>
          </ITButton>
          {fx.canLink && (
            <ITButton
              variant="filled"
              color="primary"
              size="sm"
              disabled={fx.saving || !fx.summary?.registrationSuggestions}
              onClick={() => void fx.linkSuggested()}
            >
              <ITFlex align="center" gap={1}>
                <FaMagic size={11} />
                <ITText className="font-bold text-[11px]">
                  {t("employees.actions.linkSuggested", {
                    count: fx.summary?.registrationSuggestions ?? 0,
                  })}
                </ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.hr"), onClick: () => navigate("/employees") },
        { label: t("employees.title") },
      ]}
      backAction={() => navigate("/hr/time-clock")}
    >
      <TimeClockEmployeesTab
        fx={fx}
        onSeeReport={() => navigate("/hr/time-clock/entries-exits")}
      />
    </ITPage>
  );
}
