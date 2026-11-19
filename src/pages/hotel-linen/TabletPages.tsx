import { AppPage } from "@shared/ui/app-page";
import { FaTabletAlt } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TabletBoard } from "@features/hotel-linen/tablet";
import { useGoBack } from "@shared/lib/useGoBack";

/** Tablet de pedido de blancos por habitación (una vista por rol). */
export function LinenTabletPage() {
  const { t } = useTranslation(["hotel-linen-tablet", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaTabletAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <TabletBoard />
    </AppPage>
  );
}
