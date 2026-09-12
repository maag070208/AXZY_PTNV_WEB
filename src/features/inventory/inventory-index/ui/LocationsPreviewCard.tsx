import { ITBadget, ITButton, ITCard, ITFlex, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowRight, FaMapMarkerAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatLocation } from "@entities/location";
import type { UseInventoryIndex } from "../model/useInventoryIndex";

export default function LocationsPreviewCard({ fx }: { fx: UseInventoryIndex }) {
  const { t } = useTranslation(["inventory"]);

  return (
    <ITCard className="p-5">
      <ITFlex align="center" justify="between" className="mb-4">
        <ITFlex align="center" gap={2}>
          <FaMapMarkerAlt size={16} className="text-slate-400" />
          <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
            {t("index.locations", { count: fx.locations.length })}
          </ITText>
        </ITFlex>
        <ITButton
          size="small"
          variant="outlined"
          onClick={() => fx.navigate("/inventario/ubicaciones")}
        >
          <ITFlex align="center" gap={1}>
            <ITText className="font-bold text-[10px]">{t("index.viewAll")}</ITText>
            <FaArrowRight size={10} />
          </ITFlex>
        </ITButton>
      </ITFlex>

      {fx.locations.slice(0, 5).map((loc) => (
        <ITFlex
          key={loc.id}
          align="center"
          justify="between"
          className="py-2 border-b border-slate-100 last:border-0"
        >
          <ITFlex align="center" gap={2}>
            <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
              <FaMapMarkerAlt size={12} className="text-blue-500" />
            </div>
            <ITStack direction="column" spacing={0}>
              <ITText className="text-[11px] font-bold text-slate-700">
                {formatLocation(loc)}
              </ITText>
              {loc.descripcion && (
                <ITText className="text-[9px] text-slate-400">
                  {loc.descripcion}
                </ITText>
              )}
            </ITStack>
          </ITFlex>
          <ITBadget color="primary" size="small">
            {loc._count?.devices ?? 0}
          </ITBadget>
        </ITFlex>
      ))}
    </ITCard>
  );
}