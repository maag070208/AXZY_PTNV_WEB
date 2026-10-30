import { useState } from "react";
import { ITLoader, ITText, ITFlex } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { scheduleApi } from "@entities/schedule";
import { ScheduleChat, type ScheduleAgentPatch } from "@features/schedule";
import { emitAppEvent } from "@shared/lib/appEvents";
import { LangostinAvatar } from "@shared/ui/langostin";

interface Props {
  /** Cierra el panel al terminar. */
  onDone: () => void;
}

/**
 * Alta de **horario dentro del panel**: reusa el chat del formulario (pregunta
 * nombre, días, horas y jornada partida) y al aplicar guarda el horario aquí
 * mismo, con loader y confirmación. En Horarios no hay botón de alta.
 */
export default function ScheduleChatAgent({ onDone }: Props) {
  const { t } = useTranslation("schedules");
  const [state, setState] = useState<"chat" | "work" | "ok" | "err">("chat");

  const save = async (patch: ScheduleAgentPatch) => {
    setState("work");
    const startedAt = Date.now();
    try {
      await scheduleApi.create({
        name: patch.name?.trim() || t("new"),
        days: patch.days,
        entryToleranceMin: patch.entryToleranceMin,
        exitToleranceMin: patch.exitToleranceMin,
        mealBreakMin: patch.mealBreakMin,
        minOvertimeMin: patch.minOvertimeMin,
      });
      const wait = Math.max(0, 700 - (Date.now() - startedAt));
      window.setTimeout(() => {
        setState("ok");
        emitAppEvent("schedule:created", {});
        window.setTimeout(onDone, 1400);
      }, wait);
    } catch {
      setState("err");
      window.setTimeout(() => setState("chat"), 2500);
    }
  };

  return (
    <ITFlex direction="column" className="relative h-full min-h-0">
      <ScheduleChat onApply={(patch) => void save(patch)} />

      {state !== "chat" && (
        <div
          className={`absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[color-mix(in_srgb,var(--it-card-bg)_88%,transparent)] px-6 text-center backdrop-blur-sm ${
            state === "ok" ? "ticket-sent-pop" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          <LangostinAvatar anim={state === "work" ? "work" : state === "ok" ? "ok" : "err"} size={54} />
          {state === "work" && (
            <>
              <ITText className="!text-[14px] font-bold">{t("agent.saving")}</ITText>
              <ITLoader variant="dots" size="md" color="primary" />
            </>
          )}
          {state === "ok" && (
            <ITText className="ticket-sent-check !text-[15px] font-bold text-[color:var(--color-success)]">
              {t("agent.savedOk")}
            </ITText>
          )}
          {state === "err" && (
            <ITText className="!text-[13px] font-semibold text-[color:var(--color-danger)]">
              {t("agent.saveError")}
            </ITText>
          )}
        </div>
      )}
    </ITFlex>
  );
}
