import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { FaBalanceScale, FaClipboardList, FaPlus, FaSoap, FaTshirt } from "react-icons/fa";
import type { ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import {
  DirtyReceiptDetailView,
  DirtyReceiptForm,
  DirtyReceiptsBoard,
  LaundryBoardView,
  ReconciliationView,
  SupplyRequestDetailView,
  SupplyRequestForm,
  SupplyRequestsBoard,
} from "@features/hotel-linen/laundry";
import { useCosign } from "@features/hotel-linen/cosign";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

interface ShellProps {
  title: string;
  description?: string;
  icon: ReactNode;
  /** Pantalla padre en la ruta (para migas y volver). */
  parent?: { label: string; path: string };
  back: string;
  actions?: ReactNode;
  children: ReactNode;
}

function Shell({ title, description, icon, parent, back, actions, children }: ShellProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={title}
      description={description}
      icon={icon}
      breadcrumbs={[
        { label: t("breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("nav.linen") },
        ...(parent ? [{ label: parent.label, onClick: () => navigate(parent.path) }] : []),
        { label: title },
      ]}
      backAction={() => goBack(back)}
      actions={actions}
    >
      {children}
    </ITPage>
  );
}

const newButton = (label: string, onClick: () => void) => (
  <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={label} onClick={onClick} />
);

// ── Pedidos de área ──────────────────────────────────────────────────────────

export function LinenRequestsPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const navigate = useNavigate();
  const canRequest = useCan("hotel_linen.request");
  const cosign = useCosign();
  return (
    <Shell
      title={t("requests.title")}
      description={t("requests.description")}
      icon={<FaClipboardList size={20} />}
      back="/"
      actions={canRequest ? newButton(t("requests.new"), () => navigate("/linen/requests/new")) : undefined}
    >
      <SupplyRequestsBoard onOpen={(id) => navigate(`/linen/requests/${id}`)} requestCosign={cosign.request} />
      {cosign.dialog}
    </Shell>
  );
}

export function LinenRequestNewPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <Shell
      title={t("form.title")}
      icon={<FaClipboardList size={20} />}
      parent={{ label: t("requests.title"), path: "/linen/requests" }}
      back="/linen/requests"
    >
      <SupplyRequestForm onDone={(id) => navigate(`/linen/requests/${id}`, { replace: true })} onCancel={() => goBack("/linen/requests")} />
    </Shell>
  );
}

export function LinenRequestDetailPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const { id = "" } = useParams();
  const cosign = useCosign();
  return (
    <Shell
      title={t("detail.title")}
      icon={<FaClipboardList size={20} />}
      parent={{ label: t("requests.title"), path: "/linen/requests" }}
      back="/linen/requests"
    >
      <SupplyRequestDetailView id={id} requestCosign={cosign.request} />
      {cosign.dialog}
    </Shell>
  );
}

// ── Recepción de sucios ──────────────────────────────────────────────────────

export function LinenDirtyPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const navigate = useNavigate();
  const canReceive = useCan("hotel_linen.dirty_receive");
  return (
    <Shell
      title={t("dirty.title")}
      description={t("dirty.description")}
      icon={<FaTshirt size={20} />}
      back="/"
      actions={canReceive ? newButton(t("dirty.new"), () => navigate("/linen/dirty/new")) : undefined}
    >
      <DirtyReceiptsBoard onOpen={(id) => navigate(`/linen/dirty/${id}`)} />
    </Shell>
  );
}

export function LinenDirtyNewPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const navigate = useNavigate();
  const goBack = useGoBack();
  const cosign = useCosign();
  return (
    <Shell
      title={t("dirty.form.title")}
      icon={<FaTshirt size={20} />}
      parent={{ label: t("dirty.title"), path: "/linen/dirty" }}
      back="/linen/dirty"
    >
      <DirtyReceiptForm
        requestCosign={cosign.request}
        onDone={(id) => navigate(`/linen/dirty/${id}`, { replace: true })}
        onCancel={() => goBack("/linen/dirty")}
      />
      {cosign.dialog}
    </Shell>
  );
}

export function LinenDirtyDetailPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const { id = "" } = useParams();
  return (
    <Shell
      title={t("dirty.detail.title")}
      icon={<FaTshirt size={20} />}
      parent={{ label: t("dirty.title"), path: "/linen/dirty" }}
      back="/linen/dirty"
    >
      <DirtyReceiptDetailView id={id} />
    </Shell>
  );
}

// ── Lavandería y conciliación ────────────────────────────────────────────────

export function LinenLaundryPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  const cosign = useCosign();
  return (
    <Shell title={t("laundry.title")} description={t("laundry.description")} icon={<FaSoap size={20} />} back="/">
      <LaundryBoardView requestCosign={cosign.request} />
      {cosign.dialog}
    </Shell>
  );
}

export function LinenReconciliationPage() {
  const { t } = useTranslation("hotel-linen-laundry");
  return (
    <Shell title={t("reconciliation.title")} description={t("reconciliation.description")} icon={<FaBalanceScale size={20} />} back="/">
      <ReconciliationView />
    </Shell>
  );
}
