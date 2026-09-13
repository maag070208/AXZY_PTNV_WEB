import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBoxes, FaFileSignature, FaPlus, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { Location, Sublugar } from "@entities/location";

interface Props {
  loc: Location;
  isAdmin: boolean;
  newSublugar: string;
  onNewSublugar: (value: string) => void;
  onAddSublugar: () => void;
  onRemoveSublugar: (s: Sublugar) => void;
}

export default function LocationInfoCard({
  loc,
  isAdmin,
  newSublugar,
  onNewSublugar,
  onAddSublugar,
  onRemoveSublugar,
}: Props) {
  const { t: tt } = useTranslation(["locations"]);
  return (
    <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} md={4}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.location")}
            </ITText>
            <ITText className="font-bold uppercase tracking-tight text-slate-800">
              {loc.lugar}
            </ITText>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={3}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.status")}
            </ITText>
            <ITFlex align="center" gap={2}>
              <ITBadget color={loc.active ? "success" : "danger"} size="small">
                {loc.active ? tt("detail.active") : tt("detail.inactive")}
              </ITBadget>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={2}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.devices")}
            </ITText>
            <ITFlex align="center" gap={2} className="text-slate-600">
              <FaBoxes size={14} />
              <ITText className="font-bold">{tt("detail.deviceCount", { count: loc._count?.devices ?? 0 })}</ITText>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={3}>
          <ITFlex direction="column" gap={1}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.cartas")}
            </ITText>
            <ITFlex align="center" gap={2} className="text-slate-600">
              <FaFileSignature size={14} />
              <ITText className="font-bold">{tt("detail.cartaCount", { count: loc._count?.cartas ?? 0 })}</ITText>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12}>
          <ITFlex direction="column" gap={2}>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.areas")}
            </ITText>
            {!loc.sublugares?.length ? (
              <ITText className="text-[12px] font-bold text-slate-400">
                {tt("detail.noSubareas")}
              </ITText>
            ) : (
              <ITFlex wrap="wrap" gap={2}>
                {loc.sublugares.map((s) => (
                  <ITFlex
                    key={s.id}
                    align="center"
                    gap={2}
                    className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200"
                  >
                    <ITText className="text-[11px] font-black uppercase tracking-wide">
                      {s.name}
                    </ITText>
                    {isAdmin && (
                      <FaTimes
                        size={10}
                        className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        onClick={() => onRemoveSublugar(s)}
                        title={tt("detail.removeSubarea")}
                      />
                    )}
                  </ITFlex>
                ))}
              </ITFlex>
            )}
          </ITFlex>
        </ITGrid>

        {isAdmin && (
          <ITGrid item xs={12}>
            <ITFlex gap={2}>
              <ITInput
                name="newSublugar"
                value={newSublugar}
                onChange={(e) => onNewSublugar(e.target.value)}
                placeholder={tt("detail.newSubareaPlaceholder")}
                onKeyDown={(e) => e.key === "Enter" && onAddSublugar()}
                className="flex-1"
              />
              <ITButton
                variant="filled"
                color="primary"
                onClick={onAddSublugar}
                disabled={!newSublugar.trim()}
                title={tt("detail.addSubarea")}
              >
                <ITFlex align="center" gap={1}>
                  <FaPlus size={12} />
                  <ITText className="font-bold text-[11px]">{tt("detail.add")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITGrid>
        )}
      </ITGrid>
    </ITCard>
  );
}