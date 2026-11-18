import { ITButton } from "@axzydev/axzy_ui_system";
import { AppPage } from "@shared/ui/app-page";
import { FaClipboardCheck, FaPlus } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RoomReviewDetailView, RoomReviewForm, RoomReviewsBoard } from "@features/hotel-linen/room-review";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenRoomReviewsPage() {
  const { t } = useTranslation(["hotel-linen-room-review", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaClipboardCheck size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
      actions={<ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("new.action")} onClick={() => navigate("/linen/room-reviews/new")} />}
    >
      <RoomReviewsBoard onOpen={(id) => navigate(`/linen/room-reviews/${id}`)} />
    </AppPage>
  );
}

export function LinenRoomReviewNewPage() {
  const { t } = useTranslation(["hotel-linen-room-review", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("new.title")}
      description={t("new.description")}
      icon={<FaClipboardCheck size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title"), onClick: () => navigate("/linen/room-reviews", { replace: true }) },
        { label: t("new.action") },
      ]}
      backAction={() => goBack("/linen/room-reviews")}
    >
      <RoomReviewForm
        onDone={(id) => navigate(`/linen/room-reviews/${id}`, { replace: true })}
        onCancel={() => goBack("/linen/room-reviews")}
        onGoToPar={() => navigate("/linen/room-par")}
      />
    </AppPage>
  );
}

export function LinenRoomReviewDetailPage() {
  const { t } = useTranslation(["hotel-linen-room-review", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("detail.title")}
      icon={<FaClipboardCheck size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title"), onClick: () => navigate("/linen/room-reviews", { replace: true }) },
        { label: t("detail.title") },
      ]}
      backAction={() => goBack("/linen/room-reviews")}
    >
      <RoomReviewDetailView id={id} />
    </AppPage>
  );
}
