import { ITPage } from "@axzydev/axzy_ui_system";
import { FaFingerprint } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { TimeClockTab, useTimeClock } from "@features/access/time-clock";

export default function TimeClockPage() {
  const { t } = useTranslation(["time-clock", "common"]);
  const navigate = useNavigate();
  const fx = useTimeClock();
  // Dar de alta/baja relojes exige relojes.administrar (igual que en la API).
  const canManageClocks = useCan("time_clocks.manage");

  return (
    <ITPage
      title={t("title")}
      description={t("description")}
      icon={<FaFingerprint size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.access"), onClick: () => navigate("/access") },
        { label: t("title") },
      ]}
      backAction={() => navigate("/access")}
    >
      <TimeClockTab
        fx={fx}
        onManageClocks={canManageClocks ? () => navigate("/time-clocks") : undefined}
      />
    </ITPage>
  );
}
