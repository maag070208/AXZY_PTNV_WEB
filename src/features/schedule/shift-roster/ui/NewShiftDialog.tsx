import { useMemo, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { LuClock } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { scheduleApi, type Schedule, type ScheduleDayInput } from "@entities/schedule";
import { DialogHeader } from "@shared/ui/dialog-header";

/** "07:00" → "7AM", "15:30" → "3:30PM". */
const shortTime = (time: string): string => {
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}${m ? `:${String(m).padStart(2, "0")}` : ""}${h < 12 ? "AM" : "PM"}`;
};

const crosses = (start: string, end: string) => !!start && !!end && end <= start;

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (schedule: Schedule) => void;
  /** Turnos activos: si ya hay uno con ese nombre se reutiliza en vez de fallar. */
  existing?: Schedule[];
}

/** Alta rápida de un turno: 7 días iguales, sin descansos (el descanso se marca en el rol). */
export default function NewShiftDialog({ open, onClose, onCreated, existing = [] }: Props) {
  const { t } = useTranslation("schedules");
  const [start, setStart] = useState("07:00");
  const [end, setEnd] = useState("15:00");
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suggested = useMemo(() => (start && end ? `${shortTime(start)}-${shortTime(end)}` : ""), [start, end]);
  const finalName = nameTouched ? name : suggested;
  const overnight = crosses(start, end);

  const submit = async () => {
    if (!finalName.trim() || !start || !end) {
      setError(t("roster.newShift.required"));
      return;
    }
    const same = existing.find((x) => x.name.trim().toLowerCase() === finalName.trim().toLowerCase());
    if (same) {
      onCreated(same);
      return;
    }
    setSaving(true);
    setError(null);
    const days: ScheduleDayInput[] = [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      weekday,
      startTime: start,
      endTime: end,
      splitStartTime: null,
      splitEndTime: null,
      restDay: false,
    }));
    try {
      const created = await scheduleApi.create({
        name: finalName.trim(),
        entryToleranceMin: 10,
        exitToleranceMin: 10,
        mealBreakMin: 0,
        minOvertimeMin: 60,
        crossesMidnight: overnight,
        days,
      });
      onCreated(created);
      setNameTouched(false);
      setName("");
    } catch (e) {
      const code = (e as { code?: string }).code;
      setError(code === "SCHEDULE_NAME_TAKEN" ? t("roster.newShift.nameTaken") : e instanceof Error ? e.message : t("roster.newShift.error"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={open} onClose={onClose} className="max-w-md">
      <DialogHeader icon={<LuClock />} tone="primary" title={t("roster.newShift.title")} subtitle={t("roster.newShift.subtitle")} />
      <ITFlex direction="column" gap={3}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITFlex gap={3}>
          <label className="flex-1 text-[12px] font-semibold text-slate-600">
            {t("roster.newShift.start")}
            <input
              type="time"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
          <label className="flex-1 text-[12px] font-semibold text-slate-600">
            {t("roster.newShift.end")}
            <input
              type="time"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="mt-1 block w-full rounded-md border border-slate-300 px-2 py-1.5 text-sm"
            />
          </label>
        </ITFlex>
        <ITInput
          name="rosterNewShiftName"
          label={t("name")}
          value={finalName}
          onChange={(e) => {
            setName(e.target.value);
            setNameTouched(true);
          }}
        />
        {overnight && (
          <ITText muted className="!text-[11.5px]">
            {t("roster.newShift.overnight")}
          </ITText>
        )}
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={onClose} disabled={saving}>
            {t("cancel")}
          </ITButton>
          <ITButton variant="filled" color="primary" size="sm" onClick={() => void submit()} disabled={saving}>
            {t("roster.newShift.create")}
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
