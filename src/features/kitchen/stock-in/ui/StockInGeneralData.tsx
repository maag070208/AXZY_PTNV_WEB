import { ITDatePicker, ITGrid, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { Supplier } from "@entities/kitchen";
import { PanelCard } from "@shared/ui/panel-card";

interface Props {
  suppliers: Supplier[];
  supplierId: string;
  onSupplierChange: (value: string) => void;
  reference: string;
  onReferenceChange: (value: string) => void;
  date: Date;
  onDateChange: (value: Date) => void;
  notes: string;
  onNotesChange: (value: string) => void;
}

/** Datos generales de la entrada: proveedor, referencia, fecha y notas. */
export default function StockInGeneralData({
  suppliers,
  supplierId,
  onSupplierChange,
  reference,
  onReferenceChange,
  date,
  onDateChange,
  notes,
  onNotesChange,
}: Props) {
  const { t } = useTranslation("kitchen");
  return (
    <PanelCard title={t("stockIn.dataTitle")} description={t("stockIn.dataDescription")}>
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="kitchenSupplier"
              label={t("stockIn.supplier")}
              options={[
                { value: "", label: t("stockIn.noSupplier") },
                ...suppliers.map((supplier) => ({ value: supplier.id, label: supplier.name })),
              ]}
              value={supplierId}
              onChange={(value) => onSupplierChange(String(value))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="kitchenReference"
              label={t("stockIn.reference")}
              value={reference}
              onChange={(event) => onReferenceChange(event.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITDatePicker
              name="kitchenStockInDate"
              label={t("stockIn.date")}
              value={date}
              onChange={(event) => {
                const value = event.target.value;
                if (value instanceof Date) onDateChange(value);
              }}
              className="w-full"
            />
          </ITGrid>
          <ITGrid item xs={12}>
            <ITInput
              name="kitchenStockInNotes"
              label={t("stockIn.notes")}
              value={notes}
              onChange={(event) => onNotesChange(event.target.value)}
            />
          </ITGrid>
        </ITGrid>
      </PanelCard>
  );
}
