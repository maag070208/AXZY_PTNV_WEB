import { ITButton, ITFlex, ITGrid, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { FaCalendarAlt, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { KitchenItemRow } from "@entities/kitchen";
import type { StockInLine } from "../model/types";
import StockInExpiryField from "./StockInExpiryField";

interface Props {
  items: KitchenItemRow[];
  draft: StockInLine;
  draftItem?: KitchenItemRow;
  draftReady: boolean;
  onDraftChange: (patch: Partial<StockInLine>) => void;
  onAdd: () => void;
}

/** Caja para agregar un artículo a la entrada (el renglón se confirma con el botón). */
export default function StockInAddLineForm({ items, draft, draftItem, draftReady, onDraftChange, onAdd }: Props) {
  const { t } = useTranslation("kitchen");
  return (
    <div className="rounded-xl border border-primary-100 bg-primary-50/30 p-4 sm:p-5">
      <ITFlex align="center" gap={2} className="mb-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary-600 text-white">
          <FaPlus size={10} />
        </div>
        <span className="text-xs font-bold text-slate-700">{t("stockIn.addItemTitle")}</span>
      </ITFlex>

      <ITGrid container columns={12} spacing={3} className="items-end">
        <ITGrid item xs={12} md={4}>
          <ITSearchSelect
            name="draftItem"
            label={t("stockIn.item")}
            options={items.map((item) => ({ value: item.id, label: `${item.code} · ${item.name}` }))}
            value={draft.itemId}
            onChange={(value) => onDraftChange({ itemId: String(value), expiresAt: null })}
          />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <ITInput
            name="draftQty"
            type="number"
            label={draftItem ? `${t("stockIn.quantity")} (${draftItem.unit.name})` : t("stockIn.quantity")}
            value={draft.quantity}
            onChange={(event) => onDraftChange({ quantity: event.target.value })}
          />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <StockInExpiryField line={draft} item={draftItem} onPatch={onDraftChange} />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <ITInput
            name="draftLot"
            label={t("stockIn.lotCode")}
            value={draft.lotCode}
            onChange={(event) => onDraftChange({ lotCode: event.target.value })}
          />
        </ITGrid>
        <ITGrid item xs={6} md={2}>
          <ITButton
            variant="filled"
            color="primary"
            disabled={!draftReady}
            onClick={onAdd}
            className="!h-[42px] w-full"
          >
            <ITFlex align="center" justify="center" gap={2}>
              <FaPlus size={10} />
              <span className="text-[11px] font-semibold">{t("stockIn.addButton")}</span>
            </ITFlex>
          </ITButton>
        </ITGrid>
      </ITGrid>

      {draftItem?.tracksExpiry && !draft.expiresAt && (
        <ITFlex align="center" gap={2} className="mt-3">
          <FaCalendarAlt size={10} className="text-amber-500" />
          <span className="text-[11px] font-medium text-amber-600">{t("stockIn.expiryHint")}</span>
        </ITFlex>
      )}
    </div>
  );
}
