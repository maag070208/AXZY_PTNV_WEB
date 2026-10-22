import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTimeClockPeople } from "../model/useTimeClockPeople";
import type { ClockGender } from "@entities/time-clock";

const GENDERS: ClockGender[] = ["unknown", "male", "female"];
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none";
const primary = "cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
const ghost = "cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";
const danger = "cursor-pointer rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";

/** Personas y tarjetas del reloj: alta, cambio de nombre, baja, y tarjetas. Cada acción escribe en el reloj. */
interface Props {
  /** Reloj elegido por el panel; si viene, no se muestra selector. */
  clockSerial?: string;
}

export default function TimeClockPeopleView({ clockSerial }: Props) {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockPeople(clockSerial);
  const controlled = clockSerial !== undefined;
  const [form, setForm] = useState({ employeeNumber: "", name: "", gender: "unknown" as ClockGender });
  const [editing, setEditing] = useState<{ employeeNumber: string; name: string } | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [newCard, setNewCard] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState("");

  const people = (fx.data?.people ?? []).filter(
    (p) => !filter || p.employeeNumber.includes(filter) || p.name.toLowerCase().includes(filter.toLowerCase())
  );

  const submitCreate = async () => {
    const ok = await fx.create({ ...form, employeeNumber: form.employeeNumber.trim(), name: form.name.trim() });
    if (ok) setForm({ employeeNumber: "", name: "", gender: "unknown" });
  };

  return (
    <div className="flex flex-col gap-5 p-6">
      <p className="text-xs text-amber-700">{t("people.warning")}</p>

      <div className="flex flex-wrap items-end gap-3">
        {!controlled && (
          <label className="flex flex-col gap-1 text-xs text-slate-500">
            {t("people.clock")}
            <select className={field} value={fx.serial} onChange={(e) => fx.setSerial(e.target.value)}>
              {fx.devices.map((d) => (
                <option key={d.clockSerial} value={d.clockSerial}>{d.name}</option>
              ))}
            </select>
          </label>
        )}
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          {t("people.filter")}
          <input className={field} value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={t("people.filterPlaceholder")} />
        </label>
        <button type="button" className={ghost} onClick={fx.reload} disabled={fx.loading || fx.busy}>{t("people.refresh")}</button>
      </div>

      <section className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          {t("people.form.number")}
          <input className={field} value={form.employeeNumber} onChange={(e) => setForm({ ...form, employeeNumber: e.target.value })} maxLength={32} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          {t("people.form.name")}
          <input className={field} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} maxLength={64} />
        </label>
        <label className="flex flex-col gap-1 text-xs text-slate-500">
          {t("people.form.gender")}
          <select className={field} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as ClockGender })}>
            {GENDERS.map((g) => <option key={g} value={g}>{t(`people.genders.${g}`)}</option>)}
          </select>
        </label>
        <button type="button" className={primary} disabled={fx.busy || !form.employeeNumber.trim() || form.name.trim().length < 2} onClick={() => void submitCreate()}>
          {t("people.form.add")}
        </button>
      </section>

      {fx.error && <p role="alert" className="text-sm text-red-600">{fx.error}</p>}
      {fx.toast && <p role="status" className="text-sm text-emerald-700" onClick={fx.dismissToast}>{fx.toast}</p>}
      {fx.loading && <p className="text-sm text-slate-400">{t("people.loading")}</p>}

      {fx.data && (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-2">{t("people.table.number")}</th>
                <th className="px-4 py-2">{t("people.table.name")}</th>
                <th className="px-4 py-2">{t("people.table.cards")}</th>
                <th className="px-4 py-2 text-right">{t("people.table.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {people.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-6 text-center text-slate-400">{t("people.empty")}</td></tr>
              )}
              {people.map((p) => {
                const isEditing = editing?.employeeNumber === p.employeeNumber;
                const isOpen = open === p.employeeNumber;
                return (
                  <FragmentRow key={p.employeeNumber}>
                    <tr className="border-t border-slate-100">
                      <td className="px-4 py-2 font-mono text-slate-700">{p.employeeNumber}</td>
                      <td className="px-4 py-2">
                        {isEditing ? (
                          <input className={field} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} maxLength={64} />
                        ) : (
                          <span className="text-slate-900">{p.name}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        <button type="button" className={ghost} onClick={() => setOpen(isOpen ? null : p.employeeNumber)}>
                          {t("people.table.cardsCount", { count: p.cards.length })}
                        </button>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex justify-end gap-2">
                          {isEditing ? (
                            <>
                              <button type="button" className={primary} disabled={fx.busy || editing.name.trim().length < 2}
                                onClick={async () => { if (await fx.rename(p.employeeNumber, editing.name.trim())) setEditing(null); }}>
                                {t("people.actions.save")}
                              </button>
                              <button type="button" className={ghost} onClick={() => setEditing(null)}>{t("people.actions.cancel")}</button>
                            </>
                          ) : confirming === p.employeeNumber ? (
                            <>
                              <span className="self-center text-xs text-red-600">{t("people.confirmRemove")}</span>
                              <button type="button" className={danger} disabled={fx.busy}
                                onClick={async () => { if (await fx.remove(p.employeeNumber)) setConfirming(null); }}>
                                {t("people.actions.yes")}
                              </button>
                              <button type="button" className={ghost} onClick={() => setConfirming(null)}>{t("people.actions.no")}</button>
                            </>
                          ) : (
                            <>
                              <button type="button" className={ghost} disabled={fx.busy} onClick={() => setEditing({ employeeNumber: p.employeeNumber, name: p.name })}>
                                {t("people.actions.rename")}
                              </button>
                              <button type="button" className={danger} disabled={fx.busy} onClick={() => setConfirming(p.employeeNumber)}>
                                {t("people.actions.remove")}
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr className="border-t border-slate-100 bg-slate-50/60">
                        <td colSpan={4} className="px-4 py-3">
                          <div className="flex flex-col gap-2">
                            {p.cards.length === 0 && <span className="text-xs text-slate-400">{t("people.noCards")}</span>}
                            {p.cards.map((c) => (
                              <div key={c} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2">
                                <span className="font-mono text-sm text-slate-800">{c}</span>
                                <button type="button" className={danger} disabled={fx.busy} onClick={() => void fx.removeCard(c)}>
                                  {t("people.actions.removeCard")}
                                </button>
                              </div>
                            ))}
                            <div className="flex items-end gap-2">
                              <label className="flex flex-col gap-1 text-xs text-slate-500">
                                {t("people.form.cardNo")}
                                <input className={field} inputMode="numeric" value={newCard[p.employeeNumber] ?? ""}
                                  onChange={(e) => setNewCard({ ...newCard, [p.employeeNumber]: e.target.value.replace(/\D/g, "") })} maxLength={20} />
                              </label>
                              <button type="button" className={primary}
                                disabled={fx.busy || !(newCard[p.employeeNumber] ?? "").length}
                                onClick={async () => { if (await fx.addCard(p.employeeNumber, newCard[p.employeeNumber])) setNewCard({ ...newCard, [p.employeeNumber]: "" }); }}>
                                {t("people.actions.addCard")}
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </FragmentRow>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Agrupa una fila de datos y su panel de tarjetas sin envolverlas en un <tbody> extra.
function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
