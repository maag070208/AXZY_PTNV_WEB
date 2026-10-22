import { useTranslation } from "react-i18next";
import { FaCheck } from "react-icons/fa";
import { Escena, type LangostinAnim, type LangostinScene } from "@shared/ui/langostin";
import { dyn } from "@shared/i18n/dyn";

interface Props {
  scene: LangostinScene;
  /** Animación con la que se dibuja la mascota en el escenario. */
  anim: LangostinAnim;
  /** Animación sugerida para el escenario (chip). */
  suggested: LangostinAnim;
  selected: boolean;
  speed: number;
  onSelectScene: (scene: LangostinScene) => void;
  onSelectAnim: (anim: LangostinAnim) => void;
}

/** Tarjeta de un escenario: el fondo con la mascota y sus datos. */
export default function SceneCard({
  scene,
  anim,
  suggested,
  selected,
  speed,
  onSelectScene,
  onSelectAnim,
}: Props) {
  const { t: tt } = useTranslation("langostin");
  const d = dyn(tt);

  return (
    <div
      className={`flex cursor-pointer flex-col overflow-hidden rounded-2xl border transition ${
        selected ? "border-[#f97316] shadow-md" : "border-slate-200 bg-white hover:border-slate-300"
      }`}
      onClick={() => onSelectScene(scene)}
      data-testid={`langostin-scene-${scene}`}
    >
      <div className="flex items-center justify-center bg-[#dff1f8] px-2 py-2">
        <Escena
          scene={scene}
          anim={anim}
          speed={speed}
          className="h-auto w-full"
          style={{ width: "100%", height: "auto" }}
          label={d(`scenes.${scene}.name`)}
        />
      </div>
      <div className="flex flex-col gap-1 p-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[13px] font-bold text-slate-900">{d(`scenes.${scene}.name`)}</span>
          {selected && <FaCheck size={10} className="text-[#f97316]" />}
        </div>
        <p className="text-[11px] text-slate-500">{d(`scenes.${scene}.idea`)}</p>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAnim(suggested);
          }}
          className="mt-1 w-fit cursor-pointer rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-semibold text-slate-600 transition hover:border-[#f97316] hover:text-[#ea580c]"
        >
          {d("scenes.suggested")}: {d(`anims.${suggested}.name`)}
        </button>
      </div>
    </div>
  );
}
