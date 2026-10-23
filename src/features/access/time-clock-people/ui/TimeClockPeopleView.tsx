import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaEllipsisH, FaFingerprint, FaIdCard, FaSyncAlt, FaUserCheck, FaUserSlash } from "react-icons/fa";
import { ITButton, ITDialog, ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import { useTimeClockPeople } from "../model/useTimeClockPeople";
import PersonDetailDialog from "./PersonDetailDialog";
import { timeClockApi, type TimeClockPerson } from "@entities/time-clock";
import { useCan } from "@entities/user";

/** Persona con su presencia de rostro y huellas (null mientras se leen los conteos). */
type Row = TimeClockPerson & { faces: number | null; fingerprints: number | null };
type Filter = "all" | "noFace" | "noFingerprint" | "noCard";
const FILTERS: Filter[] = ["all", "noFace", "noFingerprint", "noCard"];
const TONES = [
  "bg-blue-100 text-blue-700",
  "bg-orange-100 text-orange-700",
  "bg-emerald-100 text-emerald-700",
  "bg-violet-100 text-violet-700",
  "bg-pink-100 text-pink-700",
  "bg-cyan-100 text-cyan-700",
];
const TOTAL_CHECKS = 3;

interface Props {
  /** Reloj elegido por el panel o el dashboard; si viene, no se muestra selector. */
  clockSerial?: string;
}

const initials = (name: string): string =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
const toneOf = (key: string): string => TONES[[...key].reduce((sum, c) => sum + c.charCodeAt(0), 0) % TONES.length];

/** Foto de la persona si tiene rostro registrado; si no, sus iniciales. Libera la URL al salir. */
function PersonAvatar({ clockSerial, employeeNumber, name, hasFace }: { clockSerial: string; employeeNumber: string; name: string; hasFace: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    if (!hasFace || !clockSerial) return;
    let url: string | null = null;
    let cancelled = false;
    timeClockApi
      .personPhoto(clockSerial, employeeNumber)
      .then((blob) => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
      setSrc(null);
    };
  }, [clockSerial, employeeNumber, hasFace]);
  if (src) return <img src={src} alt={name} className="h-10 w-10 shrink-0 rounded-full border border-slate-200 object-cover" />;
  return (
    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold ${toneOf(employeeNumber)}`}>
      {initials(name)}
    </span>
  );
}

function Chip({ on, icon, label }: { on: boolean; icon: React.ReactNode; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${
        on ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-dashed border-slate-300 text-slate-500"
      }`}
    >
      {icon}
      {label}
    </span>
  );
}

/** Personas del reloj: lista unificada con presencia de rostro, huella y tarjeta. Las bajas piden confirmación. */
export default function TimeClockPeopleView({ clockSerial }: Props) {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockPeople(clockSerial);
  const controlled = clockSerial !== undefined;
  const canWrite = useCan("time_clock.write");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [removing, setRemoving] = useState<TimeClockPerson | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const bio = fx.biometrics?.people ?? {};
    return (fx.data?.people ?? [])
      .map((p) => ({
        ...p,
        faces: bio[p.employeeNumber]?.faces ?? null,
        fingerprints: bio[p.employeeNumber]?.fingerprints ?? null,
      }))
      .sort((a, b) => a.employeeNumber.localeCompare(b.employeeNumber, "es", { numeric: true }));
  }, [fx.data, fx.biometrics]);


  const visible = rows.filter((r) => {
    const q = query.trim().toLowerCase();
    if (q && !r.name.toLowerCase().includes(q) && !r.employeeNumber.toLowerCase().includes(q)) return false;
    if (filter === "noFace") return (r.faces ?? 0) === 0;
    if (filter === "noFingerprint") return (r.fingerprints ?? 0) === 0;
    if (filter === "noCard") return r.cards.length === 0;
    return true;
  });

  const confirmRemove = async () => {
    if (!removing) return;
    if (await fx.remove(removing.employeeNumber)) setRemoving(null);
  };

  return (
    <div className={`flex flex-col gap-5 ${controlled ? "" : "p-6"}`}>
      <section className="flex flex-wrap items-center gap-3">
        {!controlled && (
          <ITSearchSelect
            name="timeClockPeopleClock"
            label={t("people.clock")}
            options={fx.devices.map((d) => ({ value: d.clockSerial, label: d.name }))}
            value={fx.serial}
            onChange={(value) => fx.setSerial(String(value))}
            className="min-w-[220px]"
          />
        )}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("people.view.search")}
          className="min-w-[240px] flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-slate-400"
        />
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              filter === f ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white text-slate-600 hover:border-slate-400"
            }`}
          >
            {t(`people.view.filters.${f}`)}
          </button>
        ))}
        <ITButton
          variant="outlined"
          color="secondary"
          size="sm"
          disabled={fx.loading || fx.busy || fx.biometricsLoading}
          onClick={() => {
            fx.reload();
            fx.reloadBiometrics();
          }}
        >
          <ITFlex align="center" gap={2}>
            <FaSyncAlt size={11} className={fx.loading || fx.biometricsLoading ? "animate-spin" : ""} />
            {t("people.view.refreshAll")}
          </ITFlex>
        </ITButton>
      </section>

      {fx.error && <p role="alert" className="text-sm text-red-600">{fx.error}</p>}
      {fx.biometricsError && <p role="alert" className="text-sm text-red-600">{fx.biometricsError}</p>}
      {fx.toast && <p role="status" className="text-sm text-emerald-700" onClick={fx.dismissToast}>{fx.toast}</p>}
      {fx.loading && <p className="text-sm text-slate-400">{t("people.loading")}</p>}

      <ul className="divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
        {visible.map((r) => {
          const done = [(r.faces ?? 0) > 0, (r.fingerprints ?? 0) > 0, r.cards.length > 0].filter(Boolean).length;
          return (
            <li
              key={r.employeeNumber}
              className="flex cursor-pointer flex-wrap items-center gap-4 px-5 py-4 transition hover:bg-slate-50"
              onClick={() => setViewing(r.employeeNumber)}
            >
              <div className="flex min-w-[220px] flex-1 items-center gap-3">
                <PersonAvatar clockSerial={fx.serial} employeeNumber={r.employeeNumber} name={r.name} hasFace={(r.faces ?? 0) > 0} />
                <div className="min-w-0">
                  <p className="truncate font-semibold text-slate-900">{r.name}</p>
                  <p className="font-mono text-xs text-slate-500">#{r.employeeNumber}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip on={(r.faces ?? 0) > 0} icon={<FaUserCheck size={10} />} label={t("people.view.chips.face")} />
                <Chip on={(r.fingerprints ?? 0) > 0} icon={<FaFingerprint size={10} />} label={t("people.view.chips.fingerprint")} />
                <Chip on={r.cards.length > 0} icon={<FaIdCard size={10} />} label={t("people.view.chips.card")} />
              </div>
              <div className="w-36">
                <p className="text-xs text-slate-500">{t("people.view.progress", { done, total: TOTAL_CHECKS })}</p>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(done / TOTAL_CHECKS) * 100}%` }} />
                </div>
              </div>
              <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <ITButton variant="raised-text" color="primary" size="sm" onClick={() => setViewing(r.employeeNumber)}>
                  {t("people.actions.view")}
                </ITButton>
                {canWrite && (
                  <div className="relative">
                    <button
                      type="button"
                      aria-label={t("people.view.more")}
                      className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                      onClick={() => setMenuFor(menuFor === r.employeeNumber ? null : r.employeeNumber)}
                    >
                      <FaEllipsisH size={12} />
                    </button>
                    {menuFor === r.employeeNumber && (
                      <div className="absolute right-0 z-10 mt-1 w-40 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                        <button
                          type="button"
                          disabled={fx.busy}
                          className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                          onClick={() => {
                            setMenuFor(null);
                            setRemoving(r);
                          }}
                        >
                          {t("people.actions.remove")}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </li>
          );
        })}
        {visible.length === 0 && <li className="px-5 py-10 text-center text-sm text-slate-400">{t("people.view.empty")}</li>}
      </ul>

      {viewing && (
        <PersonDetailDialog
          clockSerial={fx.serial}
          employeeNumber={viewing}
          editable={canWrite}
          onChanged={fx.reload}
          onClose={() => setViewing(null)}
        />
      )}

      <ITDialog
        isOpen={!!removing}
        onClose={() => setRemoving(null)}
        title={t("people.confirm.title", { name: removing?.name ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={4} className="mt-2">
          <ITText className="text-sm text-slate-600">
            {t("people.confirm.body", { name: removing?.name ?? "", number: removing?.employeeNumber ?? "" })}
          </ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setRemoving(null)}>
              {t("people.actions.no")}
            </ITButton>
            <ITButton variant="filled" color="danger" disabled={fx.busy} onClick={() => void confirmRemove()}>
              <ITFlex align="center" gap={2}>
                <FaUserSlash size={12} />
                {t("people.confirm.action")}
              </ITFlex>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </div>
  );
}
