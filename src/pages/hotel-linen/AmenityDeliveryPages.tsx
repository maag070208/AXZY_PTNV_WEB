import { ITButton } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlus, FaTruckLoading } from "react-icons/fa";
import { AppPage } from "@shared/ui/app-page";
import { useGoBack } from "@shared/lib/useGoBack";
import { AmenityDeliveriesBoard, AmenityDeliveryDetailView, AmenityDeliveryForm } from "@features/hotel-linen/amenity-delivery";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenAmenityDeliveriesPage() {
  const { t } = useTranslation(["hotel-linen-amenity-delivery", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaTruckLoading size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
      actions={<ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("new.action")} onClick={() => navigate("/linen/amenity-deliveries/new")} />}
    >
      <AmenityDeliveriesBoard onOpen={(id) => navigate(`/linen/amenity-deliveries/${id}`)} />
    </AppPage>
  );
}

export function LinenAmenityDeliveryNewPage() {
  const { t } = useTranslation(["hotel-linen-amenity-delivery", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("new.title")}
      description={t("new.description")}
      icon={<FaTruckLoading size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title"), onClick: () => navigate("/linen/amenity-deliveries", { replace: true }) },
        { label: t("new.action") },
      ]}
      backAction={() => goBack("/linen/amenity-deliveries")}
    >
      <AmenityDeliveryForm
        onDone={(id) => navigate(`/linen/amenity-deliveries/${id}`, { replace: true })}
        onCancel={() => goBack("/linen/amenity-deliveries")}
      />
    </AppPage>
  );
}

export function LinenAmenityDeliveryDetailPage() {
  const { t } = useTranslation(["hotel-linen-amenity-delivery", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("detail.title")}
      icon={<FaTruckLoading size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title"), onClick: () => navigate("/linen/amenity-deliveries", { replace: true }) },
        { label: t("detail.title") },
      ]}
      backAction={() => goBack("/linen/amenity-deliveries")}
    >
      <AmenityDeliveryDetailView id={id} onOpenTransfer={(tid) => navigate(`/linen/transfers/${tid}`)} />
    </AppPage>
  );
}
