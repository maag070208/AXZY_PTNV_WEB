import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import type { LangostinAnim } from "@shared/ui/langostin";
import { dyn } from "@shared/i18n/dyn";
import SpriteTile from "./SpriteTile";

interface Props {
  anim: LangostinAnim;
  selected: boolean;
  onSelect: (anim: LangostinAnim) => void;
}

/** Ficha de una animación: el sprite y su nombre. Al elegirla, se marca. */
export default function AnimTile({ anim, selected, onSelect }: Props) {
  const { t: tt } = useTranslation("langostin");
  const d = dyn(tt);

  return (
    <button
      type="button"
      onClick={() => onSelect(anim)}
      title={d(`anims.${anim}.hint`)}
      data-testid={`langostin-anim-${anim}`}
      className={`group flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-2 py-3 transition ${
        selected
          ? "border-[#f97316] bg-[#fff7ed] shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
      }`}
    >
      <SpriteTile anim={anim} size={48} />
      <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-700">
        {d(`anims.${anim}.name`)}
        {selected && <FaCheck size={9} className="text-[#f97316]" />}
      </span>
    </button>
  );
}
