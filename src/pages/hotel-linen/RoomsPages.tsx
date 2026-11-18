import { useState } from "react";
import { ITButton } from "@axzydev/axzy_ui_system";
import { AppPage } from "@shared/ui/app-page";
import { FaDoorOpen, FaPlus } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { RoomsPanel } from "@features/hotel-linen/rooms";
import { useGoBack } from "@shared/lib/useGoBack";

/** Habitaciones: alta y edición de composición (camas y baños). */
export function LinenRoomsPage() {
  const { t } = useTranslation(["hotel-linen-rooms", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canManage = useCan("hotel_rooms.manage");
  const [newSignal, setNewSignal] = useState(0);
  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaDoorOpen size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
      actions={
        canManage ? (
          <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("new")} onClick={() => setNewSignal((n) => n + 1)} />
        ) : undefined
      }
    >
      <RoomsPanel newSignal={newSignal} />
    </AppPage>
  );
}
