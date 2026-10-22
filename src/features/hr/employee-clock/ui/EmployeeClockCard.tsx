import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useCan } from "@entities/user";
import type { EmployeeClockStatus } from "@entities/time-clock";
import { useEmployeeClock } from "../model/useEmployeeClock";

type ClockRow = EmployeeClockStatus["clocks"][number];

const STATE_TONE: Record<NonNullable<ClockRow["state"]> | "NO_RESPONSE", string> = {
  DADA_DE_ALTA: "border-emerald-200 text-emerald-700",
  SIN_ALTA: "border-slate-200 text-slate-600",
  NO_RESPONSE: "border-red-200 text-red-700",
};

/** Alta de la persona en los relojes: estado por reloj y alta con confirmación (hoy, solo el reloj de prueba). */
export default function EmployeeClockCard({ userName, userId }: { userName: string; userId: string }) {
  const { t } = useTranslation("time-clock");
  const fx = useEmployeeClock(userId, true);
  const [target, setTarget] = useState<ClockRow | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const canWrite = useCan("time_clock.write");

  const number = fx.status?.employeeNumber ?? null;

  const confirm = async () => {
    if (!target) return;
    const ok = await fx.alta(target.serial);
    if (ok) setDone(t("employeeClock.done", { name: userName, clock: target.name }));
    setTarget(null);
  };

  if (fx.loading && !fx.status) return <ITText className="text-sm text-slate-400">{t("employeeClock.loading")}</ITText>;

  return (
    <ITFlex direction="column" gap={3}>
      {!number && <ITText className="text-sm text-amber-700">{t("employeeClock.noNumber")}</ITText>}
      {fx.error && <ITText role="alert" className="text-sm text-red-600">{fx.error}</ITText>}
      {done && <ITText role="status" className="text-sm text-emerald-700">{done}</ITText>}
      {fx.status && fx.status.clocks.length === 0 && <ITText className="text-sm text-slate-400">{t("employeeClock.empty")}</ITText>}

      {fx.status?.clocks.map((c) => {
        const tone = c.connection === "NO_RESPONSE" ? STATE_TONE.NO_RESPONSE : STATE_TONE[c.state ?? "SIN_ALTA"];
        const label = c.connection === "NO_RESPONSE" ? t("employeeClock.state.NO_RESPONSE") : t(`employeeClock.state.${c.state}`);
        const canAdd = canWrite && !!number && c.connection === "ONLINE" && c.state === "SIN_ALTA" && c.canAlta;
        return (
          <ITFlex key={c.serial} align="center" justify="between" gap={3} wrap="wrap" className="rounded-xl border border-slate-200 px-4 py-3">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-sm font-semibold text-slate-900">{c.name}</ITText>
              <span className={`w-fit rounded-full border px-2.5 py-0.5 text-xs font-medium ${tone}`}>{label}</span>
            </ITFlex>
            {canAdd ? (
              <ITButton variant="filled" color="primary" size="sm" onClick={() => setTarget(c)}>
                {t("employeeClock.alta")}
              </ITButton>
            ) : (
              <ITText className="text-xs text-slate-400">{c.canAlta ? "" : t("employeeClock.readOnly")}</ITText>
            )}
          </ITFlex>
        );
      })}

      <ITDialog
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={t("employeeClock.confirmTitle", { clock: target?.name ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={4} className="mt-2">
          <ITText className="text-sm text-slate-600">
            {t("employeeClock.confirmBody", { name: userName, number: number ?? "", clock: target?.name ?? "" })}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setTarget(null)}>
              {t("people.actions.no")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={fx.loading} onClick={() => void confirm()}>
              {t("employeeClock.alta")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
