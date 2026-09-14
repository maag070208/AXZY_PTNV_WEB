import { ITFlex, ITLoader, ITPage } from "@axzydev/axzy_ui_system";
import { FaClipboardList } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useDeviceAvailability } from "@entities/device";
import { DeviceAvailabilityView } from "@widgets/device-availability";

export default function DeviceAvailabilityPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["device", "common"]);
  const { groups, loading } = useDeviceAvailability();

  return (
    <ITPage
      title={t("device:availability.title")}
      description={t("device:availability.description")}
      backAction={() => navigate(-1)}
      icon={<FaClipboardList size={20} />}
      maxWidth="6xl"
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("device:list.title"), onClick: () => navigate("/dispositivos") },
        { label: t("device:availability.title") },
      ]}
    >
      {loading ? (
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      ) : (
        <DeviceAvailabilityView groups={groups} />
      )}
    </ITPage>
  );
}