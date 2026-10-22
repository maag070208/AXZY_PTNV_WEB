import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaFingerprint, FaSpinner } from "react-icons/fa";
import { ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { timeClockApi, type FingerprintCapture, type FingerprintStatus } from "@entities/time-clock";

const MAX_FINGERS = 10;

interface Props {
  userId: string;
  userName: string;
  number: string;
  serial: string;
  clockName: string;
  /** Solo quien tiene `time_clock.write` puede capturar y dar de alta. */
  canWrite: boolean;
  onApplied: () => void;
}

/**
 * Huellas de una persona en un reloj: los diez dedos a la vista, elegir uno libre,
 * capturarlo con el sensor del reloj, revisar la calidad y dar de alta con confirmación.
 * La plantilla nunca se muestra ni se guarda en el navegador.
 */
export default function FingerprintPanel({ userId, userName, number, serial, clockName, canWrite, onApplied }: Props) {
  const { t } = useTranslation("time-clock");
  const [status, setStatus] = useState<FingerprintStatus | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [capture, setCapture] = useState<FingerprintCapture | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState<"capture" | "apply" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const load = () =>
    timeClockApi
      .fingerprintStatus(userId, serial)
      .then((s) => {
        setStatus(s);
        setSelected((current) => (current && !s.fingerIds.includes(current) ? current : null));
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : t("employeeClock.fingerprint.error")));

  useEffect(() => {
    setCapture(null);
    setDone(null);
    void load();
    // Se consulta al cambiar de persona o de reloj.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, serial]);

  const taken = new Set(status?.fingerIds ?? []);
  const count = status?.fingerprints ?? 0;
  const full = count >= MAX_FINGERS;

  const run = async (kind: "capture" | "apply", action: () => Promise<void>) => {
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("employeeClock.fingerprint.error"));
    } finally {
      setBusy(null);
    }
  };

  const doCapture = () =>
    run("capture", async () => {
      setDone(null);
      if (selected === null) return;
      setCapture(await timeClockApi.fingerprintCapture(userId, serial, selected));
    });

  const doApply = () =>
    run("apply", async () => {
      if (!capture) return;
      await timeClockApi.fingerprintApply(userId, serial, capture.captureId);
      setCapture(null);
      setSelected(null);
      setConfirming(false);
      setDone(t("employeeClock.fingerprint.applied", { clock: clockName }));
      await load();
      onApplied();
    });

  // Pasos: 1 elegir dedo, 2 capturar, 3 dar de alta.
  const step = done ? 3 : capture ? 3 : selected !== null ? 2 : 1;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <FaFingerprint size={18} />
          </span>
          <div className="flex flex-col">
            <ITText className="text-sm font-bold text-slate-900">{t("employeeClock.fingerprint.title")}</ITText>
            <ITText className="text-xs text-slate-500">{clockName}</ITText>
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
            full ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-700"
          }`}
        >
          {count} / {MAX_FINGERS}
        </span>
      </header>

      {/* Pasos */}
      <ol className="grid grid-cols-3 gap-2 text-[11px] font-semibold">
        {[1, 2, 3].map((n) => {
          const label = [t("employeeClock.fingerprint.steps.pick"), t("employeeClock.fingerprint.steps.capture"), t("employeeClock.fingerprint.steps.apply")][n - 1];
          const active = step === n;
          const complete = step > n;
          return (
            <li
              key={n}
              className={`flex items-center gap-2 rounded-xl px-3 py-2 ${
                active ? "bg-slate-900 text-white" : complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-50 text-slate-400"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[10px]">
                {complete ? <FaCheck size={9} /> : n}
              </span>
              {label}
            </li>
          );
        })}
      </ol>

      {/* Diez dedos */}
      <div className="grid grid-cols-5 gap-2">
        {Array.from({ length: MAX_FINGERS }, (_, i) => i + 1).map((fingerNo) => {
          const registered = taken.has(fingerNo);
          const isSelected = selected === fingerNo;
          const disabled = !canWrite || registered || busy !== null || full;
          return (
            <button
              key={fingerNo}
              type="button"
              disabled={registered ? true : disabled}
              onClick={() => {
                setSelected(fingerNo);
                setCapture(null);
                setDone(null);
              }}
              className={`group flex flex-col items-center justify-center gap-1 rounded-xl border-2 py-3 text-xs font-semibold transition ${
                registered
                  ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                  : isSelected
                    ? "border-slate-900 bg-slate-900 text-white shadow-md"
                    : "border-dashed border-slate-300 text-slate-500 hover:border-slate-900 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
              }`}
            >
              {registered ? <FaCheck size={14} /> : <FaFingerprint size={16} className={isSelected ? "text-white" : "text-slate-400"} />}
              <span>{fingerNo}</span>
            </button>
          );
        })}
      </div>
      <ITText className="text-xs text-slate-500">
        {registered(status) ? t("employeeClock.fingerprint.legendRegistered") : t("employeeClock.fingerprint.legendPick")}
      </ITText>

      {error && <ITText role="alert" className="text-sm text-red-600">{error}</ITText>}
      {done && (
        <ITText role="status" className="rounded-xl bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700">
          {done}
        </ITText>
      )}

      {/* Captura */}
      {canWrite && selected !== null && !capture && (
        <ITFlex align="center" justify="between" gap={3} wrap="wrap" className="rounded-xl border border-slate-200 px-4 py-3">
          <ITText className="text-sm text-slate-700">
            {busy === "capture" ? t("employeeClock.fingerprint.placeFinger") : t("employeeClock.fingerprint.readyToCapture", { finger: selected })}
          </ITText>
          <ITButton variant="filled" color="primary" size="sm" disabled={busy !== null} onClick={() => void doCapture()}>
            <ITFlex align="center" gap={2}>
              {busy === "capture" && <FaSpinner size={11} className="animate-spin" />}
              {t("employeeClock.fingerprint.capture")}
            </ITFlex>
          </ITButton>
        </ITFlex>
      )}

      {capture && (
        <div className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4">
          <ITFlex align="center" justify="between" gap={3} wrap="wrap">
            <ITText className="text-sm font-semibold text-slate-900">
              {t("employeeClock.fingerprint.captured", { finger: capture.fingerNo })}
            </ITText>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums ${
                capture.acceptable ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}
            >
              {t("employeeClock.fingerprint.qualityValue", { quality: capture.quality })}
            </span>
          </ITFlex>
          <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-100" role="meter" aria-valuenow={capture.quality} aria-valuemin={0} aria-valuemax={100}>
            <div
              className={`h-full rounded-full transition-all duration-500 ${capture.acceptable ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${capture.quality}%` }}
            />
            <span className="absolute top-0 h-full w-px bg-slate-900/60" style={{ left: `${capture.minQuality}%` }} />
          </div>
          <ITText className="text-xs text-slate-500">
            {capture.acceptable
              ? t("employeeClock.fingerprint.qualityOk", { min: capture.minQuality })
              : t("employeeClock.fingerprint.qualityLow", { min: capture.minQuality })}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" size="sm" disabled={busy !== null} onClick={() => void doCapture()}>
              {t("employeeClock.fingerprint.captureAgain")}
            </ITButton>
            {capture.acceptable && (
              <ITButton variant="filled" color="primary" size="sm" disabled={busy !== null} onClick={() => setConfirming(true)}>
                {t("employeeClock.fingerprint.apply")}
              </ITButton>
            )}
          </ITFlex>
        </div>
      )}

      {!canWrite && <ITText className="text-xs text-slate-400">{t("employeeClock.fingerprint.readOnly")}</ITText>}

      <ITDialog
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        title={t("employeeClock.fingerprint.confirmTitle", { clock: clockName })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={4} className="mt-2">
          <ITText className="text-sm text-slate-600">
            {t("employeeClock.fingerprint.confirmBody", { finger: capture?.fingerNo ?? "", name: userName, number, clock: clockName })}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setConfirming(false)}>
              {t("people.actions.no")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={busy !== null} onClick={() => void doApply()}>
              <ITFlex align="center" gap={2}>
                {busy === "apply" && <FaSpinner size={11} className="animate-spin" />}
                {t("employeeClock.fingerprint.apply")}
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </section>
  );
}

const registered = (status: FingerprintStatus | null): boolean => (status?.fingerIds.length ?? 0) > 0;
