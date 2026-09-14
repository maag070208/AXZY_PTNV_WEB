import {
  ITAlert,
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaPlus } from "react-icons/fa";
import {
  useInventoryMovements,
  MovementsFiltersCard,
  MovementsTimeline,
} from "@features/inventory/movements-list";
import { downloadInventoryPDF } from "@widgets/inventory/inventory-pdf";

export default function InventoryMovementsPage() {
  const fx = useInventoryMovements({ download: downloadInventoryPDF });

  if (fx.loading) {
    return (
      <ITPage
        title={fx.t("movements.loadingTitle")}
        loading
        backAction={() => fx.navigate(-1)}
      >
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={fx.t("movements.title")}
      description={fx.t("movements.description", { count: fx.movements.length })}
      backAction={() => fx.navigate(-1)}
      breadcrumbs={[
        { label: fx.t("common:breadcrumbs.home"), onClick: () => fx.navigate("/") },
        { label: fx.t("index.title"), onClick: () => fx.navigate("/inventario") },
        { label: fx.t("movements.loadingTitle") },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="primary"
            size="small"
            onClick={fx.handleDownloadPDF}
            disabled={fx.downloadingPDF || fx.movements.length === 0}
          >
            <ITFlex align="center" gap={1}>
              <FaFilePdf size={12} />
              <ITText className="font-bold text-[11px]">
                {fx.downloadingPDF
                  ? fx.t("movements.generating")
                  : fx.t("movements.pdf")}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => fx.navigate("/inventario/movimientos/nuevo")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">
                {fx.t("index.newMovement")}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      {fx.error && (
        <ITAlert
          variant="error"
          dismissible
          onDismiss={() => fx.setError(null)}
        >
          {fx.error}
        </ITAlert>
      )}

      <MovementsFiltersCard fx={fx} />
      <MovementsTimeline fx={fx} />

      {fx.toast && (
        <ITToast
          message={fx.toast.message}
          type={fx.toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => fx.setToast(null)}
        />
      )}
    </ITPage>
  );
}