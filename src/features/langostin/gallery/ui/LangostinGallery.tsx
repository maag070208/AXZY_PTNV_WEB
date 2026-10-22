import { useEffect, useMemo, useState } from "react";
import { ITFlex, ITGrid, ITInput, ITSelect, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { FaFilm, FaGamepad, FaImages, FaUser } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { Escena, type LangostinAnim, type LangostinScene } from "@shared/ui/langostin";
import { PanelCard } from "@shared/ui/panel-card";
import { KpiTile } from "@shared/ui/kpi-tile";
import { dyn } from "@shared/i18n/dyn";
import { ALL_ANIMS, ANIM_GROUPS, SCENE_CATALOG } from "../model/catalog";
import { setFrameSpeed } from "../model/ticker";
import AnimTile from "./AnimTile";
import SceneCard from "./SceneCard";

const SPEEDS = [
  { value: "80", label: "Rápida" },
  { value: "140", label: "Normal" },
  { value: "220", label: "Lenta" },
];

/** Galería de la mascota: todas las animaciones y todos los escenarios. */
export default function LangostinGallery() {
  const { t: tt } = useTranslation(["langostin", "common"]);
  const d = dyn(tt);

  const [anim, setAnim] = useState<LangostinAnim>("idle");
  const [scene, setScene] = useState<LangostinScene>("hotel");
  const [mascot, setMascot] = useState(true);
  const [speed, setSpeed] = useState(140);
  const [query, setQuery] = useState("");

  // El reloj global de las fichas de animación sigue la misma velocidad que
  // los escenarios, para que todo se mueva parejo.
  useEffect(() => {
    setFrameSpeed(speed);
  }, [speed]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return ALL_ANIMS.filter(
      (a) =>
        a.toLowerCase().includes(q) ||
        d(`anims.${a}.name`).toLowerCase().includes(q) ||
        d(`anims.${a}.hint`).toLowerCase().includes(q)
    );
  }, [query, d]);

  const sceneEntry = SCENE_CATALOG.find((s) => s.id === scene);

  return (
    <ITStack direction="column" spacing={4}>
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={d("kpis.anims")}
            value={ALL_ANIMS.length}
            icon={<FaGamepad size={16} />}
            tone="orange"
            hint={d("kpis.animsHint")}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={d("kpis.scenes")}
            value={SCENE_CATALOG.length}
            icon={<FaImages size={16} />}
            tone="sky"
            hint={d("kpis.scenesHint")}
          />
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <KpiTile
            label={d("kpis.selected")}
            value={d(`anims.${anim}.name`)}
            icon={<FaUser size={16} />}
            tone="emerald"
            hint={d(`scenes.${scene}.name`)}
          />
        </ITGrid>
      </ITGrid>

      <PanelCard
        title={d("stage.title")}
        description={d("stage.description")}
        actions={
          <ITFlex align="center" gap={3} wrap="wrap">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <input
                type="checkbox"
                checked={mascot}
                onChange={(e) => setMascot(e.target.checked)}
                className="h-4 w-4 cursor-pointer accent-[#f97316]"
              />
              {d("stage.showMascot")}
            </label>
            <ITSelect
              name="speed"
              value={String(speed)}
              onChange={(e) => setSpeed(Number(e.target.value))}
              options={SPEEDS.map((s) => ({ value: s.value, label: s.label }))}
              className="w-40"
            />
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={7}>
            <div className="flex items-center justify-center rounded-2xl bg-[#dff1f8] p-4">
              <Escena
                scene={scene}
                anim={anim}
                mascot={mascot}
                speed={speed}
                className="h-auto w-full"
                style={{ width: "100%", height: "auto" }}
                label={d(`scenes.${scene}.name`)}
              />
            </div>
          </ITGrid>
          <ITGrid item xs={12} md={5}>
            <ITStack direction="column" spacing={2}>
              <div>
                <ITText className="!text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {d("stage.sceneLabel")}
                </ITText>
                <ITText
                  className="!text-[18px] font-black text-slate-900"
                  data-testid="langostin-stage-scene"
                >
                  {d(`scenes.${scene}.name`)}
                </ITText>
                <ITText className="!text-[12px] text-slate-500">{d(`scenes.${scene}.idea`)}</ITText>
              </div>
              <div>
                <ITText className="!text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {d("stage.animLabel")}
                </ITText>
                <ITText
                  className="!text-[18px] font-black text-slate-900"
                  data-testid="langostin-stage-anim"
                >
                  {d(`anims.${anim}.name`)}
                </ITText>
                <ITText className="!text-[12px] text-slate-500">{d(`anims.${anim}.hint`)}</ITText>
              </div>
              {sceneEntry && (
                <button
                  type="button"
                  onClick={() => setAnim(sceneEntry.suggested)}
                  className="w-fit cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 transition hover:border-[#f97316] hover:text-[#ea580c]"
                >
                  {d("scenes.suggested")}: {d(`anims.${sceneEntry.suggested}.name`)}
                </button>
              )}
            </ITStack>
          </ITGrid>
        </ITGrid>
      </PanelCard>

      <PanelCard
        title={d("animsSection.title")}
        description={d("animsSection.description")}
        actions={
          <div className="w-64">
            <ITInput
              name="search"
              placeholder={d("animsSection.search")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        }
      >
        {filtered ? (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:!grid-cols-6 lg:!grid-cols-8">
            {filtered.map((a) => (
              <AnimTile key={a} anim={a} selected={a === anim} onSelect={setAnim} />
            ))}
            {filtered.length === 0 && (
              <ITText className="col-span-full py-6 text-center text-[12px] text-slate-400 italic">
                {d("animsSection.noResults")}
              </ITText>
            )}
          </div>
        ) : (
          <ITStack direction="column" spacing={4}>
            {ANIM_GROUPS.map((group) => (
              <div key={group.id}>
                <ITText className="mb-2 block !text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  {d(`groups.${group.id}`)}
                </ITText>
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:!grid-cols-6 lg:!grid-cols-8">
                  {group.anims.map((a) => (
                    <AnimTile key={a} anim={a} selected={a === anim} onSelect={setAnim} />
                  ))}
                </div>
              </div>
            ))}
          </ITStack>
        )}
      </PanelCard>

      <PanelCard title={d("scenesSection.title")} description={d("scenesSection.description")}>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:!grid-cols-4">
          {SCENE_CATALOG.map((entry) => (
            <SceneCard
              key={entry.id}
              scene={entry.id}
              anim={anim}
              suggested={entry.suggested}
              selected={entry.id === scene}
              speed={speed}
              onSelectScene={setScene}
              onSelectAnim={setAnim}
            />
          ))}
        </div>
        <ITFlex align="center" gap={2} className="mt-4">
          <FaFilm size={12} className="text-slate-400" />
          <ITText className="!text-[11px] text-slate-500">{d("scenesSection.footer")}</ITText>
        </ITFlex>
      </PanelCard>
    </ITStack>
  );
}
