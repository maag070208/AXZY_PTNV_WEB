import { ITButton, ITPage } from "@axzydev/axzy_ui_system";
import { FaClipboardList, FaPlus, FaTrashAlt } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCan } from "@entities/user";
import { WriteoffDetailView, WriteoffForm, WriteoffsBoard } from "@features/hotel-linen/writeoffs";
import { CountDetailView, CountsBoard } from "@features/hotel-linen/counts";
import { useCosign } from "@features/hotel-linen/cosign";
import { downloadWriteoffWeeklyPdf } from "@widgets/writeoff-weekly-pdf";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenWriteoffsPage() {
  const { t } = useTranslation(["hotel-linen-writeoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canRequest = useCan("hotel_linen.writeoff_request");
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("writeoffs.title")}
      description={t("writeoffs.description")}
      icon={<FaTrashAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("writeoffs.title") },
      ]}
      backAction={() => goBack("/")}
      actions={
        canRequest ? (
          <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("writeoffs.new.action")} onClick={() => navigate("/linen/writeoffs/new")} />
        ) : undefined
      }
    >
      <WriteoffsBoard onOpen={(id) => navigate(`/linen/writeoffs/${id}`)} onDownloadPdf={(r) => void downloadWriteoffWeeklyPdf(r)} />
    </ITPage>
  );
}

export function LinenWriteoffNewPage() {
  const { t } = useTranslation(["hotel-linen-writeoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("writeoffs.new.title")}
      description={t("writeoffs.new.description")}
      icon={<FaTrashAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("writeoffs.title"), onClick: () => navigate("/linen/writeoffs") },
        { label: t("writeoffs.new.action") },
      ]}
      backAction={() => goBack("/linen/writeoffs")}
    >
      <WriteoffForm
        onDone={(ids) => navigate(ids.length === 1 ? `/linen/writeoffs/${ids[0]}` : "/linen/writeoffs", { replace: true })}
        onCancel={() => goBack("/linen/writeoffs")}
      />
    </ITPage>
  );
}

export function LinenWriteoffDetailPage() {
  const { t } = useTranslation(["hotel-linen-writeoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  const cosign = useCosign();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("writeoffs.detail.title")}
      icon={<FaTrashAlt size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("writeoffs.title"), onClick: () => navigate("/linen/writeoffs") },
        { label: t("writeoffs.detail.title") },
      ]}
      backAction={() => goBack("/linen/writeoffs")}
    >
      <WriteoffDetailView id={id} requestCosign={cosign.request} />
      {cosign.dialog}
    </ITPage>
  );
}

export function LinenCountsPage() {
  const { t } = useTranslation(["hotel-linen-writeoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("counts.title")}
      description={t("counts.description")}
      icon={<FaClipboardList size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("counts.title") },
      ]}
      backAction={() => goBack("/")}
    >
      <CountsBoard onOpen={(id) => navigate(`/linen/counts/${id}`)} />
    </ITPage>
  );
}

export function LinenCountDetailPage() {
  const { t } = useTranslation(["hotel-linen-writeoff", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const { id = "" } = useParams();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("counts.detail.title")}
      icon={<FaClipboardList size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("counts.title"), onClick: () => navigate("/linen/counts") },
        { label: t("counts.detail.title") },
      ]}
      backAction={() => goBack("/linen/counts")}
    >
      <CountDetailView id={id} />
    </ITPage>
  );
}
