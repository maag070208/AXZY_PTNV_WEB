import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { FaFileSignature } from "react-icons/fa";
import { AppPage } from "@shared/ui/app-page";
import { useGoBack } from "@shared/lib/useGoBack";
import { SignoffBoard, SignoffDetailView } from "@features/hotel-linen/signoff";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenSignoffsPage() {
  const { t } = useTranslation(["hotel-linen-signoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <SignoffBoard onOpen={(id) => navigate(`/linen/signoffs/${id}`)} />
    </AppPage>
  );
}

export function LinenSignoffDetailPage() {
  const { t } = useTranslation(["hotel-linen-signoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("detail.title")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title"), onClick: () => navigate("/linen/signoffs", { replace: true }) },
        { label: t("detail.title") },
      ]}
      backAction={() => goBack("/linen/signoffs")}
    >
      <SignoffDetailView id={id} />
    </AppPage>
  );
}
