import { ITBadget, ITButton, ITFlex, ITGrid, ITInput } from "@axzydev/axzy_ui_system";
import { FaCalendarAlt, FaCheck, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { KitchenItemRow } from "@entities/kitchen";
import type { StockInLine } from "../model/types";
import StockInExpiryField from "./StockInExpiryField";

interface Props {
  line: StockInLine;
  item?: KitchenItemRow;
  complete: boolean;
  onPatch: (patch: Partial<StockInLine>) => void;
  onRemove: () => void;
}

/** Un renglón de la entrada, editable (cantidad, caducidad, lote, costo). */
export default function StockInLineRow({ line, item, complete, onPatch, onRemove }: Props) {
  const { t } = useTranslation("kitchen");
  return (
    <div
      className={[
        "rounded-xl border bg-white p-4 transition-shadow",
        complete ? "border-slate-200 hover:shadow-sm" : "border-amber-200 bg-amber-50/20",
      ].join(" ")}
    >
      <ITGrid container columns={12} spacing={3} className="items-center">
        <ITGrid item xs={12} md={3}>
          <ITFlex align="center" gap={3}>
            <div
              className={[
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                complete ? "bg-primary-50 text-primary-600" : "bg-amber-50 text-amber-500",
              ].join(" ")}
            >
              {complete ? <FaCheck size={13} /> : <FaCalendarAlt size={13} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-800">{item?.name ?? "—"}</p>
              <ITFlex align="center" gap={2} className="mt-1">
                {item?.code && <span className="text-[10px] font-medium text-slate-400">{item.code}</span>}
                {item && (
                  <ITBadget color="gray" size="sm">
                    {item.unit.name}
                  </ITBadget>
                )}
              </ITFlex>
            </div>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={6} md={2}>
          <ITInput
            name={`q-${line.key}`}
            type="number"
            label={t("stockIn.quantity")}
            value={line.quantity}
            onChange={(event) => onPatch({ quantity: event.target.value })}
          />
        </ITGrid>

        <ITGrid item xs={6} md={2}>
          <StockInExpiryField line={line} item={item} onPatch={onPatch} />
        </ITGrid>

        <ITGrid item xs={6} md={2}>
          <ITInput
            name={`l-${line.key}`}
            label={t("stockIn.lotCode")}
            value={line.lotCode}
            onChange={(event) => onPatch({ lotCode: event.target.value })}
          />
        </ITGrid>

        <ITGrid item xs={6} md={2}>
          <ITInput
            name={`c-${line.key}`}
            type="number"
            label={t("stockIn.unitCost")}
            value={line.unitCost}
            onChange={(event) => onPatch({ unitCost: event.target.value })}
          />
        </ITGrid>

        <ITGrid item xs={12} md={1}>
          <div className="flex h-full items-center justify-end pt-2 md:justify-center md:pt-4">
            <ITButton variant="text" color="error" size="sm" onClick={onRemove} className="!h-9 !w-9 !p-0">
              <FaTrash size={12} />
            </ITButton>
          </div>
        </ITGrid>
      </ITGrid>
    </div>
  );
}
