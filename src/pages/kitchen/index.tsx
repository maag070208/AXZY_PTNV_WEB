import { ITPage } from "@axzydev/axzy_ui_system";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowDown,
  FaArrowUp,
  FaBook,
  FaBoxes,
  FaClipboardCheck,
  FaClipboardList,
  FaListAlt,
  FaShoppingCart,
  FaTags,
  FaTruckLoading,
  FaUtensils,
} from "react-icons/fa";
import KitchenOverviewPanel from "@features/kitchen/overview/ui/KitchenOverviewPanel";
import KitchenItemsPanel from "@features/kitchen/items/ui/KitchenItemsPanel";
import KitchenItemDetailPanel from "@features/kitchen/items/ui/KitchenItemDetailPanel";
import KitchenLotsPanel from "@features/kitchen/lots/ui/KitchenLotsPanel";
import KitchenStockInPanel from "@features/kitchen/stock-in/ui/KitchenStockInPanel";
import KitchenStockOutPanel from "@features/kitchen/stock-out/ui/KitchenStockOutPanel";
import KitchenLedgerPanel from "@features/kitchen/ledger/ui/KitchenLedgerPanel";
import KitchenCountPanel from "@features/kitchen/count/ui/KitchenCountPanel";
import KitchenRestockPanel from "@features/kitchen/restock/ui/KitchenRestockPanel";
import KitchenCatalogPanel from "@features/kitchen/catalog/ui/KitchenCatalogPanel";
import {
  PurchaseOrderDetailPanel,
  PurchaseOrderFormPanel,
  PurchaseOrdersPanel,
} from "@features/kitchen/purchase-orders";

const crumbs = (
  navigate: ReturnType<typeof useNavigate>,
  home: string,
  parent: string,
  leaf: string
) => [
  { label: home, onClick: () => navigate("/") },
  { label: parent, onClick: () => navigate("/kitchen") },
  { label: leaf },
];

export function KitchenOverviewPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("overview.title")}
      description={t("overview.description")}
      icon={<FaUtensils size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("overview.title"))}
      backAction={() => navigate("/")}
    >
      <KitchenOverviewPanel />
    </ITPage>
  );
}

export function KitchenItemsPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("items.title")}
      description={t("items.description")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("items.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenItemsPanel />
    </ITPage>
  );
}

export function KitchenItemDetailPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("items.detail")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("items.detail"))}
      backAction={() => navigate("/kitchen/items")}
    >
      <KitchenItemDetailPanel />
    </ITPage>
  );
}

export function KitchenLotsPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("lots.title")}
      description={t("lots.description")}
      icon={<FaListAlt size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("lots.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenLotsPanel />
    </ITPage>
  );
}

export function KitchenStockInPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("stockIn.title")}
      description={t("stockIn.description")}
      icon={<FaArrowDown size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("stockIn.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenStockInPanel />
    </ITPage>
  );
}

export function KitchenStockOutPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("stockOut.title")}
      description={t("stockOut.description")}
      icon={<FaArrowUp size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("stockOut.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenStockOutPanel />
    </ITPage>
  );
}

export function KitchenLedgerPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("ledger.title")}
      description={t("ledger.description")}
      icon={<FaBook size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("ledger.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenLedgerPanel />
    </ITPage>
  );
}

export function KitchenCountPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("count.title")}
      description={t("count.description")}
      icon={<FaClipboardCheck size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("count.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenCountPanel />
    </ITPage>
  );
}

export function KitchenRestockPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("restock.title")}
      description={t("restock.description")}
      icon={<FaTruckLoading size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("restock.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenRestockPanel />
    </ITPage>
  );
}

export function KitchenCatalogPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("catalog.title")}
      description={t("catalog.description")}
      icon={<FaTags size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("catalog.title"))}
      backAction={() => navigate("/kitchen")}
    >
      <KitchenCatalogPanel />
    </ITPage>
  );
}

export function KitchenPurchaseOrdersPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      title={t("purchaseOrders.title")}
      description={t("purchaseOrders.description")}
      icon={<FaShoppingCart size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("purchaseOrders.title"))}
      backAction={() => navigate("/kitchen/restock")}
    >
      <PurchaseOrdersPanel />
    </ITPage>
  );
}

export function KitchenPurchaseOrderFormPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <ITPage
      title={id ? t("purchaseOrders.edit") : t("purchaseOrders.new")}
      description={t("purchaseOrders.description")}
      icon={<FaClipboardList size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("purchaseOrders.title"))}
      backAction={() => navigate("/kitchen/purchase-orders")}
    >
      <PurchaseOrderFormPanel id={id} />
    </ITPage>
  );
}

export function KitchenPurchaseOrderDetailPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <ITPage
      title={t("purchaseOrders.detail")}
      icon={<FaShoppingCart size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("purchaseOrders.title"))}
      backAction={() => navigate("/kitchen/purchase-orders")}
    >
      <PurchaseOrderDetailPanel id={id} />
    </ITPage>
  );
}
