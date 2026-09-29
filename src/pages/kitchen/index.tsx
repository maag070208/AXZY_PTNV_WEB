import { useState } from "react";
import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { useCan } from "@entities/user";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  FaArrowDown,
  FaArrowUp,
  FaBook,
  FaBoxes,
  FaClipboardCheck,
  FaClipboardList,
  FaFileInvoice,
  FaListAlt,
  FaPlus,
  FaShoppingCart,
  FaTags,
  FaTruck,
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
import { InvoiceDetailPanel, InvoiceFormPanel, InvoicesPanel } from "@features/kitchen/invoices";
import { downloadPurchaseOrderPdf } from "@widgets/purchase-order-pdf";
import { SupplierDetailPanel, SupplierFormPanel, SuppliersPanel } from "@features/kitchen/suppliers";

/** Botón principal de la cabecera (mismo estilo que "Nuevo empleado" en Personal). */
const newButton = (label: string, onClick: () => void) => (
  <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={label} onClick={onClick} />
);

const crumbs = (
  navigate: ReturnType<typeof useNavigate>,
  home: string,
  parent: string,
  leaf: string,
  /** Paso intermedio opcional (p. ej. Artículos para entradas, salidas y conteo). */
  middle?: { label: string; path: string }
) => [
  { label: home, onClick: () => navigate("/") },
  { label: parent, onClick: () => navigate("/kitchen") },
  ...(middle ? [{ label: middle.label, onClick: () => navigate(middle.path) }] : []),
  { label: leaf },
];

export function KitchenOverviewPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      noPadding
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
  const canManage = useCan("kitchen.manage");
  const canIn = useCan("kitchen.stock_in");
  const canOut = useCan("kitchen.stock_out");
  const canCount = useCan("kitchen.adjust");
  const [newSignal, setNewSignal] = useState(0);
  return (
    <ITPage
      noPadding
      title={t("items.title")}
      description={t("items.description")}
      icon={<FaBoxes size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("items.title"))}
      backAction={() => navigate("/kitchen")}
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {canIn && (
            <ITButton variant="outlined" color="success" icon={<FaArrowDown size={11} />} label={t("items.quick.stockIn")} onClick={() => navigate("/kitchen/stock-in")} />
          )}
          {canOut && (
            <ITButton variant="outlined" color="warning" icon={<FaArrowUp size={11} />} label={t("items.quick.stockOut")} onClick={() => navigate("/kitchen/stock-out")} />
          )}
          {canCount && (
            <ITButton variant="outlined" color="secondary" icon={<FaClipboardCheck size={11} />} label={t("items.quick.count")} onClick={() => navigate("/kitchen/count")} />
          )}
          {canManage && newButton(t("items.new"), () => setNewSignal((n) => n + 1))}
        </div>
      }
    >
      <KitchenItemsPanel newSignal={newSignal} />
    </ITPage>
  );
}

export function KitchenItemDetailPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      noPadding
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
      noPadding
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
      noPadding
      title={t("stockIn.title")}
      description={t("stockIn.description")}
      icon={<FaArrowDown size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("stockIn.title"), { label: t("items.title"), path: "/kitchen/items" })}
      backAction={() => navigate("/kitchen/items")}
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
      noPadding
      title={t("stockOut.title")}
      description={t("stockOut.description")}
      icon={<FaArrowUp size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("stockOut.title"), { label: t("items.title"), path: "/kitchen/items" })}
      backAction={() => navigate("/kitchen/items")}
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
      noPadding
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
      noPadding
      title={t("count.title")}
      description={t("count.description")}
      icon={<FaClipboardCheck size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("count.title"), { label: t("items.title"), path: "/kitchen/items" })}
      backAction={() => navigate("/kitchen/items")}
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
      noPadding
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
      noPadding
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
  const canCreate = useCan("purchase_orders.create");
  return (
    <ITPage
      noPadding
      title={t("purchaseOrders.title")}
      description={t("purchaseOrders.description")}
      icon={<FaShoppingCart size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("purchaseOrders.title"))}
      backAction={() => navigate("/kitchen/restock")}
      actions={canCreate ? newButton(t("purchaseOrders.new"), () => navigate("/kitchen/purchase-orders/new")) : undefined}
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
      noPadding
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
      noPadding
      title={t("purchaseOrders.detail")}
      icon={<FaShoppingCart size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("purchaseOrders.title"))}
      backAction={() => navigate("/kitchen/purchase-orders")}
    >
      <PurchaseOrderDetailPanel id={id} onDownloadPdf={downloadPurchaseOrderPdf} />
    </ITPage>
  );
}

export function KitchenInvoicesPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const canRegister = useCan("invoices.register");
  return (
    <ITPage
      title={t("invoices.title")}
      description={t("invoices.description")}
      icon={<FaFileInvoice size={20} />}
      noPadding
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("invoices.title"))}
      backAction={() => navigate("/kitchen/purchase-orders")}
      actions={canRegister ? newButton(t("invoices.new"), () => navigate("/kitchen/invoices/new")) : undefined}
    >
      <InvoicesPanel />
    </ITPage>
  );
}

export function KitchenInvoiceFormPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      noPadding
      title={t("invoices.new")}
      description={t("invoices.description")}
      icon={<FaFileInvoice size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("invoices.title"))}
      backAction={() => navigate("/kitchen/invoices")}
    >
      <InvoiceFormPanel />
    </ITPage>
  );
}

export function KitchenInvoiceDetailPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <ITPage
      noPadding
      title={t("invoices.detail")}
      icon={<FaFileInvoice size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("invoices.title"))}
      backAction={() => navigate("/kitchen/invoices")}
    >
      <InvoiceDetailPanel id={id} />
    </ITPage>
  );
}

export function KitchenSuppliersPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const canManage = useCan("kitchen.manage");
  return (
    <ITPage
      noPadding
      title={t("suppliers.title")}
      description={t("suppliers.description")}
      icon={<FaTruck size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("suppliers.title"))}
      backAction={() => navigate("/kitchen")}
      actions={canManage ? newButton(t("suppliers.new"), () => navigate("/kitchen/suppliers/new")) : undefined}
    >
      <SuppliersPanel />
    </ITPage>
  );
}

export function KitchenSupplierFormPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <ITPage
      noPadding
      title={id ? t("suppliers.edit") : t("suppliers.new")}
      description={t("suppliers.description")}
      icon={<FaTruck size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("suppliers.title"))}
      backAction={() => navigate(id ? `/kitchen/suppliers/${id}` : "/kitchen/suppliers")}
    >
      <SupplierFormPanel id={id} />
    </ITPage>
  );
}

export function KitchenSupplierDetailPage() {
  const { t } = useTranslation(["kitchen", "common"]);
  const navigate = useNavigate();
  const { id } = useParams();
  return (
    <ITPage
      noPadding
      title={t("suppliers.detail")}
      icon={<FaTruck size={20} />}
      breadcrumbs={crumbs(navigate, t("common:breadcrumbs.home"), t("common:nav.kitchen"), t("suppliers.title"))}
      backAction={() => navigate("/kitchen/suppliers")}
    >
      <SupplierDetailPanel id={id} />
    </ITPage>
  );
}
