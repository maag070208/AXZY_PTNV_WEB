import { AppPage } from "@shared/ui/app-page";
import { FaBoxOpen, FaProjectDiagram } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RestockBoard } from "@features/hotel-linen/restock";
import { FlowBoard } from "@features/hotel-linen/flow";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenRestockPage() {
  const { t } = useTranslation(["hotel-linen-restock", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <RestockBoard onCreated={(id) => navigate(`/linen/requests/${id}`)} />
    </AppPage>
  );
}

export function LinenFlowPage() {
  const { t } = useTranslation(["hotel-linen-flow", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaProjectDiagram size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <FlowBoard />
    </AppPage>
  );
}
