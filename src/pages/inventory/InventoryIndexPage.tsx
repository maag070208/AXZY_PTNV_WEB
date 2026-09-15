import { ITButton, ITFlex, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxes, FaClipboardList, FaFilePdf, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  useInventoryIndex,
  InventoryStatsGrid,
  InventoryMovementsTable,
} from "@features/inventory/inventory-index";
import { downloadInventoryPDF } from "@widgets/inventory/inventory-pdf";

export default function InventoryIndexPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const fx = useInventoryIndex({ download: downloadInventoryPDF });

  if (fx.loading) {
    return (
      <ITPage title={t("index.title")} loading backAction={() => fx.navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("index.title")}
      description={t("index.description")}
      backAction={() => fx.navigate(-1)}
      icon={<FaBoxes size={20} />}
      maxWidth="6xl"
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => fx.navigate("/") },
        { label: t("index.title") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            size="sm"
            onClick={() => fx.navigate("/inventario/movimientos")}
          >
            <ITFlex align="center" gap={1}>
              <FaClipboardList size={12} />
              <ITText className="font-bold text-[11px]">
                {t("index.viewKardex")}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="outlined"
            color="primary"
            size="sm"
            onClick={fx.handleDownloadPDF}
            disabled={fx.downloadingPDF || !fx.summary}
          >
            <ITFlex align="center" gap={1}>
              <FaFilePdf size={12} />
              <ITText className="font-bold text-[11px]">
                {fx.downloadingPDF ? t("index.generating") : t("index.reportPdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          {fx.isAdmin && (
            <ITButton
              variant="filled"
              color="primary"
              onClick={() => fx.navigate("/inventario/movimientos/nuevo")}
            >
              <ITFlex align="center" gap={1}>
                <FaPlus size={12} />
                <ITText className="font-bold text-[11px]">
                  {t("index.newMovement")}
                </ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <InventoryStatsGrid fx={fx} />

      <InventoryMovementsTable fetchData={fx.fetchTableData} reloadKey={0} />
    </ITPage>
  );
}