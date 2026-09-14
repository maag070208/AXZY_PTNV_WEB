import {
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITGrid,
  ITInput,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaDotCircle, FaMapMarkerAlt, FaPlus, FaSitemap, FaTimes } from "react-icons/fa";
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

function SectionLabel({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <ITFlex align="center" gap={1.5}>
      <span className="w-1 h-3.5 rounded-full bg-gradient-to-b from-blue-500 to-indigo-600" />
      <span className="text-slate-500">{icon}</span>
      <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
        {text}
      </ITText>
    </ITFlex>
  );
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
        <ITGrid item xs={12} md={7}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12}>
              <SectionLabel
                icon={<FaMapMarkerAlt size={11} />}
                text={tt("detail.location")}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITText className="font-black uppercase tracking-tight text-slate-800 text-lg leading-none">
                {loc.lugar}
              </ITText>
              {loc.descripcion && (
                <ITText className="text-[12px] text-slate-500 mt-1">
                  {loc.descripcion}
                </ITText>
              )}
            </ITGrid>
          </ITGrid>
        </ITGrid>

        <ITGrid item xs={12} md={5}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12}>
              <SectionLabel
                icon={<FaDotCircle size={11} />}
                text={tt("detail.status")}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITBadget color={loc.active ? "success" : "danger"} size="small">
                {tt(loc.active ? "detail.active" : "detail.inactive")}
              </ITBadget>
            </ITGrid>
          </ITGrid>
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={4} className="mt-6">
        <ITGrid item xs={12}>
          <SectionLabel icon={<FaSitemap size={11} />} text={tt("detail.areas")} />
        </ITGrid>
        <ITGrid item xs={12}>
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
                  className="bg-gradient-to-r from-slate-100 to-slate-50 text-slate-700 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-300 hover:shadow-sm transition-all"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
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