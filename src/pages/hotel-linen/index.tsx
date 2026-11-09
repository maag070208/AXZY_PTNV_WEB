import { useState } from "react";
import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaExchangeAlt, FaMapMarkedAlt, FaPlus, FaTshirt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import LinenCatalogPanel from "@features/hotel-linen/catalog/ui/LinenCatalogPanel";
import LinenAreasPanel from "@features/hotel-linen/areas/ui/LinenAreasPanel";
import LinenStockBoard from "@features/hotel-linen/stock/ui/LinenStockBoard";
import TransfersBoard from "@features/hotel-linen/transfers/ui/TransfersBoard";
import TransferForm from "@features/hotel-linen/transfers/ui/TransferForm";
import TransferDetailView from "@features/hotel-linen/transfers/ui/TransferDetailView";
import { useCosign } from "@features/hotel-linen/cosign";
import { useGoBack } from "@shared/lib/useGoBack";

const newButton = (label: string, onClick: () => void) => (
  <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={label} onClick={onClick} />
);

export function LinenCatalogPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canManage = useCan("hotel_store.manage");
  const [newSignal, setNewSignal] = useState(0);
  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("catalog.title")}
      description={t("catalog.description")}
      icon={<FaTshirt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("catalog.title") },
      ]}
      backAction={() => goBack("/")}
      actions={canManage ? newButton(t("catalog.new"), () => setNewSignal((n) => n + 1)) : undefined}
    >
      <LinenCatalogPanel newSignal={newSignal} />
    </ITPage>
  );
}

export function LinenAreasPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canManage = useCan("hotel_store.manage");
  const [newSignal, setNewSignal] = useState(0);
  return (
    <ITPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("areas.title")}
      description={t("areas.description")}
      icon={<FaMapMarkedAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("areas.title") },
      ]}
      backAction={() => goBack("/linen/catalog")}
      actions={canManage ? newButton(t("areas.new"), () => setNewSignal((n) => n + 1)) : undefined}
    >
      <LinenAreasPanel newSignal={newSignal} />
    </ITPage>
  );
}

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenStockPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("stock.title")}
      description={t("stock.description")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("stock.title") },
      ]}
      backAction={() => goBack("/")}
    >
      <LinenStockBoard />
    </ITPage>
  );
}

export function LinenTransfersPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canSend = useCan("hotel_linen.transfer_send");
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("transfers.title")}
      description={t("transfers.description")}
      icon={<FaExchangeAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("transfers.title") },
      ]}
      backAction={() => goBack("/")}
      actions={canSend ? newButton(t("transfers.new.action"), () => navigate("/linen/transfers/new")) : undefined}
    >
      <TransfersBoard onOpen={(id) => navigate(`/linen/transfers/${id}`)} />
    </ITPage>
  );
}

export function LinenTransferNewPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const cosign = useCosign();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("transfers.new.title")}
      description={t("transfers.new.description")}
      icon={<FaExchangeAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("transfers.title"), onClick: () => navigate("/linen/transfers") },
        { label: t("transfers.new.action") },
      ]}
      backAction={() => goBack("/linen/transfers")}
    >
      <TransferForm
        requestCosign={cosign.request}
        onDone={(id) => navigate(`/linen/transfers/${id}`, { replace: true })}
        onCancel={() => goBack("/linen/transfers")}
      />
      {cosign.dialog}
    </ITPage>
  );
}

export function LinenTransferDetailPage() {
  const { t } = useTranslation(["hotel-linen", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  const cosign = useCosign();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("transfers.detail.title")}
      icon={<FaExchangeAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("transfers.title"), onClick: () => navigate("/linen/transfers") },
        { label: t("transfers.detail.title") },
      ]}
      backAction={() => goBack("/linen/transfers")}
    >
      <TransferDetailView id={id} requestCosign={cosign.request} />
      {cosign.dialog}
    </ITPage>
  );
}
export {
  LinenDirtyDetailPage,
  LinenDirtyNewPage,
  LinenDirtyPage,
  LinenLaundryPage,
  LinenReconciliationPage,
  LinenRequestDetailPage,
  LinenRequestNewPage,
  LinenRequestsPage,
} from "./LaundryPages";
export * from "./WriteoffPages";
