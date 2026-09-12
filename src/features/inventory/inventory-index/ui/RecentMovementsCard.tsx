import { ITButton, ITCard, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseInventoryIndex } from "../model/useInventoryIndex";

export default function RecentMovementsCard({ fx }: { fx: UseInventoryIndex }) {
  const { t } = useTranslation(["inventory"]);

  return (
    <ITCard className="p-5">
      <ITFlex align="center" justify="between" className="mb-4">
        <ITFlex align="center" gap={2}>
          <FaArrowRight size={16} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("index.recentMovements")}
          </ITText>
        </ITFlex>
        <ITButton
          size="small"
          variant="outlined"
          onClick={() => fx.navigate("/inventario/movimientos")}
        >
          <ITFlex align="center" gap={1}>
            <ITText className="font-bold text-[10px]">{t("index.viewKardex")}</ITText>
            <FaArrowRight size={10} />
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITText className="text-[11px] text-slate-400 italic text-center py-4">
        {t("index.kardexHint")}
      </ITText>
    </ITCard>
  );
}