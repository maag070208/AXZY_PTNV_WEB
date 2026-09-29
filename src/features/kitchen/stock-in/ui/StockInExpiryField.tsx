import { ITDatePicker } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type { KitchenItemRow } from "@entities/kitchen";
import type { StockInLine } from "../model/types";

interface Props {
  line: StockInLine;
  item?: KitchenItemRow;
  onPatch: (patch: Partial<StockInLine>) => void;
}

/**
 * Caducidad del renglón: el selector cuando el artículo es perecedero o, si no
 * controla caducidad, una caja "No aplica" en el mismo lugar.
 */
export default function StockInExpiryField({ line, item, onPatch }: Props) {
  const { t } = useTranslation("kitchen");

  if (item && !item.tracksExpiry) {
    return (
      <div className="flex h-[42px] flex-col justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 px-3">
        <span className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
          {t("stockIn.expiresAt")}
        </span>
        <span className="mt-0.5 text-[11px] font-medium text-slate-500">{t("stockIn.noExpiry")}</span>
      </div>
    );
  }

  return (
    <ITDatePicker
      name={`exp-${line.key}`}
      label={t("stockIn.expiresAt")}
      value={line.expiresAt ?? undefined}
      onChange={(event) => {
        const value = event.target.value;
        if (value instanceof Date) onPatch({ expiresAt: value });
      }}
      className="w-full"
    />
  );
}
