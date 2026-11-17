import { ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { formatTimeInTZ } from "@shared/utils/dates";

export interface TimelineInput {
  entryAt: string | null;
  exitAt: string | null;
  outings?: Array<{ exitAt: string; returnAt: string | null }>;
  incompleteSequence?: boolean;
  timezone: string;
}

/** Pasos de la secuencia: Entrada → Salida → Regreso → … → Salida final. */
export const timelineSteps = (
  { entryAt, exitAt, outings = [], timezone }: TimelineInput,
  labels: { entry: string; exit: string; back: string; finalExit: string }
): string[] => {
  const steps: string[] = [];
  if (entryAt) steps.push(`${labels.entry} ${formatTimeInTZ(entryAt, timezone)}`);
  for (const o of outings) {
    steps.push(`${labels.exit} ${formatTimeInTZ(o.exitAt, timezone)}`);
    if (o.returnAt) steps.push(`${labels.back} ${formatTimeInTZ(o.returnAt, timezone)}`);
  }
  if (exitAt) steps.push(`${labels.finalExit} ${formatTimeInTZ(exitAt, timezone)}`);
  return steps;
};

/** Texto plano de la secuencia (para CSV). */
export const timelineText = (
  input: TimelineInput,
  labels: { entry: string; exit: string; back: string; finalExit: string }
): string => timelineSteps(input, labels).join(" → ");

/** Línea de tiempo de una jornada, con la marca de secuencia incompleta. */
export default function PunchTimeline(props: TimelineInput) {
  const { t } = useTranslation("access-report");
  const steps = timelineSteps(props, {
    entry: t("timeline.entry"),
    exit: t("timeline.exit"),
    back: t("timeline.back"),
    finalExit: t("timeline.finalExit"),
  });
  return (
    <ITFlex align="center" wrap="wrap" gap={1.5}>
      <ITText className="text-[12px] tabular-nums text-slate-700">
        {steps.length > 0 ? steps.join(" → ") : "—"}
      </ITText>
      {props.incompleteSequence && (
        <ITBadget color="warning" size="sm">
          {t("timeline.incomplete")}
        </ITBadget>
      )}
    </ITFlex>
  );
}
