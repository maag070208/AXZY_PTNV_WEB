import { useTranslation } from "react-i18next";
import { LangostinAnim } from "./langostinSprite";
import Langostin from "./Langostin";

interface Props {
  anim: LangostinAnim;
  size?: number;
  animated?: boolean;
}

/** Avatar de Langostin al lado de los mensajes y del bloque de opciones. */
export default function LangostinAvatar({ anim, size = 28, animated = true }: Props) {
  const { t } = useTranslation("tickets");
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm">
      <Langostin anim={anim} size={size} animated={animated} label={t("new.agent.mascot")} />
    </span>
  );
}
