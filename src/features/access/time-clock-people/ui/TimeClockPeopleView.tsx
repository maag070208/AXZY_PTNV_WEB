import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ITDataTable, ITFlex, ITSearchSelect } from "@axzydev/axzy_ui_system";
import type { Column, ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { useTimeClockPeople } from "../model/useTimeClockPeople";
import PersonDetailCard from "./PersonDetailCard";
import type { ClockGender, TimeClockPerson } from "@entities/time-clock";

const GENDERS: ClockGender[] = ["unknown", "male", "female"];
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none";
const primary = "cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";
const ghost = "cursor-pointer rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50";
const danger = "cursor-pointer rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 disabled:opacity-50";

interface Props {
  /** Reloj elegido por el panel o el dashboard; si viene, no se muestra selector. */
  clockSerial?: string;
}

/** Personas del reloj: alta, baja y ficha. Cada acción escribe en el reloj. */
export default function TimeClockPeopleView({ clockSerial }: Props) {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockPeople(clockSerial);
  const controlled = clockSerial !== undefined;
  const [form, setForm] = useState({ employeeNumber: "", name: "", gender: "unknown" as ClockGender });
  const [confirming, setConfirming] = useState<string | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const people = useMemo(() => fx.data?.people ?? [], [fx.data]);
  const fetchData = useMemo(
    () => makeClientTableFetch<TimeClockPerson>(async () => people, { cards: { value: (p) => p.cards.length } }),
    [people]
  );

  const columns: Column<TimeClockPerson>[] = [
    { key: "employeeNumber", label: t("people.table.number"), width: 140, filter: true, sortable: true, truncate: true },
    { key: "name", label: t("people.table.name"), width: "40%", filter: true, sortable: true, truncate: true },
    {
      key: "cards",
      label: t("people.table.cards"),
      width: 140,
      sortable: true,
      render: (row) => t("people.table.cardsCount", { count: row.cards.length }),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 240,
      pinned: "right",
      actions: (row) =>
        confirming === row.employeeNumber ? (
          <ITFlex align="center" justify="end" gap={2}>
            <span className="text-xs text-red-600">{t("people.confirmRemove")}</span>
            <button type="button" className={danger} disabled={fx.busy}
              onClick={async () => { if (await fx.remove(row.employeeNumber)) setConfirming(null); }}>
              {t("people.actions.yes")}
            </button>
            <button type="button" className={ghost} onClick={() => setConfirming(null)}>{t("people.actions.no")}</button>
          </ITFlex>
        ) : (
          <ITFlex align="center" justify="end" gap={2}>
            <button type="button" className={ghost} onClick={() => setViewing(row.employeeNumber)}>{t("people.actions.view")}</button>
            <button type="button" className={danger} disabled={fx.busy} onClick={() => setConfirming(row.employeeNumber)}>
              {t("people.actions.remove")}
            </button>
          </ITFlex>
        ),
    },
  ];

  const submitCreate = async () => {
    const ok = await fx.create({ ...form, employeeNumber: form.employeeNumber.trim(), name: form.name.trim() });
    if (ok) setForm({ employeeNumber: "", name: "", gender: "unknown" });
  };

  return (
    <div className={`flex flex-col gap-5 ${controlled ? "" : "p-6"}`}>
      <p className="text-xs text-amber-700">{t("people.warning")}</p>

      <ITFlex align="end" gap={3} wrap="wrap">
        {!controlled && (
          <ITSearchSelect
            name="timeClockPeopleClock"
            label={t("people.clock")}
            options={fx.devices.map((d) => ({ value: d.clockSerial, label: d.name }))}
            value={fx.serial}
            onChange={(value) => fx.setSerial(String(value))}
            className="min-w-[240px]"
          />
        )}
        <button type="button" className={ghost} onClick={fx.reload} disabled={fx.loading || fx.busy}>{t("people.refresh")}</button>
      </ITFlex>

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

      {viewing && (
        <PersonDetailCard
          clockSerial={fx.serial}
          employeeNumber={viewing}
          editable
          onChanged={fx.reload}
          onClose={() => setViewing(null)}
        />
      )}

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchData as unknown as (p: ITDataTableFetchParams) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={fx.version}
        layout="fixed"
        density="compact"
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        debounceMs={350}
        variant="bordered"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
        onRowClick={(row) => setViewing((row as unknown as TimeClockPerson).employeeNumber)}
      />
    </div>
  );
}
