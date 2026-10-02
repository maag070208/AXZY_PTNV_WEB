import { ITFlex, ITGrid } from "@axzydev/axzy_ui_system";
import { FaBoxOpen } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { KitchenItemRow } from "@entities/kitchen";
import { isStockInLineComplete, type StockInLine } from "../model/types";
import StockInLineRow from "./StockInLineRow";

interface Props {
  lines: StockInLine[];
  itemById: Map<string, KitchenItemRow>;
  onPatch: (key: number, patch: Partial<StockInLine>) => void;
  onRemove: (key: number) => void;
}

const HEAD = "text-[10px] font-semibold uppercase tracking-wide text-slate-400";

/** Lista de renglones agregados (o el estado vacío). */
export default function StockInLinesList({ lines, itemById, onPatch, onRemove }: Props) {
  const { t } = useTranslation("kitchen");

  if (lines.length === 0) {
    return (
      <div className="mt-5 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12">
        <ITFlex direction="column" align="center" gap={3}>
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-300 shadow-sm">
            <FaBoxOpen size={20} />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-slate-600">{t("stockIn.itemsEmpty")}</p>
            <p className="mt-1 text-xs text-slate-400">{t("stockIn.emptyHint")}</p>
          </div>
        </ITFlex>
      </div>
    );
  }

  return (
    <div className="mt-5">
      <div className="mb-2 hidden rounded-lg bg-slate-50 px-4 py-3 md:block">
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item md={3}>
            <span className={HEAD}>{t("stockIn.item")}</span>
          </ITGrid>
          <ITGrid item md={2}>
            <span className={HEAD}>{t("stockIn.quantity")}</span>
          </ITGrid>
          <ITGrid item md={2}>
            <span className={HEAD}>{t("stockIn.expiresAt")}</span>
          </ITGrid>
          <ITGrid item md={2}>
            <span className={HEAD}>{t("stockIn.lotCode")}</span>
          </ITGrid>
          <ITGrid item md={2}>
            <span className={HEAD}>{t("stockIn.unitCost")}</span>
          </ITGrid>
          <ITGrid item md={1} />
        </ITGrid>
      </div>

      <ITFlex direction="column" gap={3}>
        {lines.map((line) => {
          const item = itemById.get(line.itemId);
          return (
            <StockInLineRow
              key={line.key}
              line={line}
              item={item}
              complete={isStockInLineComplete(line, item)}
              onPatch={(patch) => onPatch(line.key, patch)}
              onRemove={() => onRemove(line.key)}
            />
          );
        })}
      </ITFlex>
    </div>
  );
}
