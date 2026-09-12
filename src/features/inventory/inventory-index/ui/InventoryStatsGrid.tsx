import { ITCard, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { UseInventoryIndex } from "../model/useInventoryIndex";

export default function InventoryStatsGrid({ fx }: { fx: UseInventoryIndex }) {
  const { t } = useTranslation(["inventory"]);
  const unlocated = fx.unlocatedDevices.length ?? 0;

  return (
    <ITGrid container columns={12} spacing={3} className="mb-6">
      <ITGrid item xs={12} sm={6} md={4}>
        <ITCard className="p-5">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
              <FaBoxes size={20} className="text-white" />
            </div>
            <ITText className="text-2xl font-black text-slate-800">
              {fx.summary?.stats.totalDevices ?? 0}
            </ITText>
            <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">
              {t("index.totalDevices")}
            </ITText>
          </div>
        </ITCard>
      </ITGrid>

      <ITGrid item xs={12} sm={6} md={4}>
        <ITCard className="p-5">
          <div className="flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center">
              <FaWarehouse size={20} className="text-white" />
            </div>
            <ITText className="text-2xl font-black text-slate-800">
              {fx.summary?.stats.locatedDevices ?? 0}
            </ITText>
            <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">
              {t("index.locatedDevices")}
            </ITText>
          </div>
        </ITCard>
      </ITGrid>

      <ITGrid item xs={12} sm={6} md={4}>
        <ITCard className="p-5">
          <div className="flex flex-col items-center justify-center gap-2">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${unlocated > 0 ? "bg-amber-500" : "bg-slate-300"}`}
            >
              <FaBoxOpen size={20} className="text-white" />
            </div>
            <ITText className="text-2xl font-black text-slate-800">
              {unlocated}
            </ITText>
            <ITText className="text-[11px] text-slate-500 uppercase tracking-wider">
              {t("index.unlocatedDevices")}
            </ITText>
          </div>
        </ITCard>
      </ITGrid>
    </ITGrid>
  );
}