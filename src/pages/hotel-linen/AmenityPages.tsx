import { FaPlus, FaSprayCan } from "react-icons/fa";
import { ITButton, ITPage, ITTabs } from "@axzydev/axzy_ui_system";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  AmenityControlView,
  AmenityControlsBoard,
  AmenityLowStockPanel,
  SpaTodayPanel,
} from "@features/hotel-linen/amenities";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

/** Control semanal de amenidades + bodega bajo mínimo + Spa hoy. */
export function LinenAmenitiesPage() {
  const { t } = useTranslation(["hotel-linen-amenity", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canControl = useCan("hotel_linen.amenities_control");
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("page.title")}
      description={t("page.description")}
      icon={<FaSprayCan size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("page.title") },
      ]}
      backAction={() => goBack("/")}
      actions={
        canControl ? (
          <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("page.new")} onClick={() => navigate("/linen/amenities/new")} />
        ) : undefined
      }
    >
      <ITTabs
        variant="line"
        items={[
          { id: "controls", label: t("tabs.controls"), content: <AmenityControlsBoard onOpen={(id) => navigate(`/linen/amenities/${id}`)} /> },
          { id: "lowStock", label: t("tabs.lowStock"), content: <AmenityLowStockPanel /> },
          { id: "spa", label: t("tabs.spa"), content: <SpaTodayPanel /> },
        ]}
      />
    </ITPage>
  );
}

/** Control nuevo (sin id) o detalle de un control existente. */
export function LinenAmenityControlPage() {
  const { t } = useTranslation(["hotel-linen-amenity", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id } = useParams();
  const isNew = !id || id === "new";
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={isNew ? t("form.pageTitle") : t("sheet.pageTitle")}
      icon={<FaSprayCan size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("page.title"), onClick: () => navigate("/linen/amenities") },
        { label: isNew ? t("page.new") : t("sheet.pageTitle") },
      ]}
      backAction={() => goBack("/linen/amenities")}
    >
      <AmenityControlView key={isNew ? "new" : id} id={isNew ? undefined : id} />
    </ITPage>
  );
}
