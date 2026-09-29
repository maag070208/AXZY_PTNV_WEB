import { ITAlert, ITBadget, ITFlex, ITToast } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import { useStockIn } from "../model/useStockIn";
import StockInHeader from "./StockInHeader";
import StockInGeneralData from "./StockInGeneralData";
import StockInAddLineForm from "./StockInAddLineForm";
import StockInLinesList from "./StockInLinesList";
import StockInFooter from "./StockInFooter";

/**
 * Entrada de almacén: compone el encabezado, los datos generales, los renglones
 * (cada uno crea un lote) y el pie con las acciones. La lógica está en
 * `model/useStockIn` y cada sección es un componente reutilizable de `ui/`.
 */
export default function KitchenStockInPanel() {
  const { t } = useTranslation("kitchen");
  const fx = useStockIn();

  return (
    <div className="relative min-h-screen w-full pb-36">
      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}

      <ITFlex direction="column" gap={5}>
        <StockInHeader products={fx.lines.length} units={fx.totalUnits} />

        {fx.error && (
          <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
            {fx.error}
          </ITAlert>
        )}

        <StockInGeneralData
          suppliers={fx.suppliers}
          supplierId={fx.supplierId}
          onSupplierChange={fx.setSupplierId}
          reference={fx.reference}
          onReferenceChange={fx.setReference}
          date={fx.date}
          onDateChange={fx.setDate}
          notes={fx.notes}
          onNotesChange={fx.setNotes}
        />

        <PanelCard title={t("stockIn.itemsTitle")} description={t("stockIn.itemsDescription")} actions={fx.lines.length > 0 ? (
                <ITBadget color="gray" size="sm">
                  {t("stockIn.articlesCount", { count: fx.lines.length })}
                </ITBadget>
              ) : undefined}>
            <StockInAddLineForm
              items={fx.items}
              draft={fx.draft}
              draftItem={fx.draftItem}
              draftReady={fx.draftReady}
              onDraftChange={fx.updateDraft}
              onAdd={fx.addLine}
            />
            <StockInLinesList
              lines={fx.lines}
              itemById={fx.itemById}
              onPatch={fx.patchLine}
              onRemove={fx.removeLine}
            />
          </PanelCard>

        <div className="h-8 w-full shrink-0" aria-hidden="true" />
      </ITFlex>

      <StockInFooter
        articles={fx.lines.length}
        units={fx.totalUnits}
        totalCost={fx.totalCost}
        saving={fx.saving}
        disabled={!fx.allComplete}
        onCancel={fx.cancel}
        onSubmit={() => void fx.submit()}
      />
    </div>
  );
}
