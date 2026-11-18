import { useState } from "react";
import { ITButton } from "@axzydev/axzy_ui_system";
import { AppPage } from "@shared/ui/app-page";
import { FaBoxOpen, FaFileCsv, FaProjectDiagram } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { RestockBoard } from "@features/hotel-linen/restock";
import { FlowBoard } from "@features/hotel-linen/flow";
import { downloadReportCsv, type ReportDoc } from "@shared/lib/reportDoc";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

export function LinenRestockPage() {
  const { t } = useTranslation(["hotel-linen-restock", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <RestockBoard onCreated={(id) => navigate(`/linen/requests/${id}`)} />
    </AppPage>
  );
}

export function LinenFlowPage() {
  const { t } = useTranslation(["hotel-linen-flow", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [doc, setDoc] = useState<ReportDoc | null>(null);
  return (
    <AppPage
      className={pageClass}
      noPadding
      title={t("title")}
      description={t("description")}
      icon={<FaProjectDiagram size={20} />}
      actions={
        <ITButton
          variant="outlined"
          color="secondary"
          icon={<FaFileCsv size={12} />}
          label={t("exportCsv")}
          disabled={!doc}
          onClick={() => doc && downloadReportCsv(doc, "blancos-flujo")}
        />
      }
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen") },
        { label: t("title") },
      ]}
      backAction={() => goBack("/")}
    >
      <FlowBoard onDoc={setDoc} />
    </AppPage>
  );
}
