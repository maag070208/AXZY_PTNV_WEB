import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaFingerprint, FaUserCheck, FaUserSlash, FaSyncAlt } from "react-icons/fa";
import { ITButton, ITDataTable, ITDialog, ITFlex, ITSearchSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column, ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { dateLocale } from "@shared/i18n/format";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { useTimeClockPeople } from "../model/useTimeClockPeople";
import PersonDetailDialog from "./PersonDetailDialog";
import type { ClockGender, TimeClockPerson } from "@entities/time-clock";
import { useCan } from "@entities/user";

const GENDERS: ClockGender[] = ["unknown", "male", "female"];
const field = "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900 focus:outline-none";
const primary = "cursor-pointer rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 active:scale-95 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400";

/** Fila de la tabla: la persona más su presencia de rostro y huellas (null mientras se leen). */
type Row = TimeClockPerson & { faces: number | null; fingerprints: number | null };

interface Props {
  /** Reloj elegido por el panel o el dashboard; si viene, no se muestra selector. */
  clockSerial?: string;
}

const yesNo = (n: number | null) => (n === null ? null : n > 0 ? "true" : "false");

function Presence({ count, icon }: { count: number | null; icon: React.ReactNode }) {
  const { t } = useTranslation("time-clock");
  if (count === null) return <span className="text-xs text-slate-400">{t("people.table.pending")}</span>;
  if (count === 0) return <span className="text-xs text-slate-400">{t("people.table.no")}</span>;
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
      {icon}
      {t("people.table.yes")}
    </span>
  );
}

/** Personas del reloj: alta, baja (con confirmación) y ficha en modal. Cada acción escribe en el reloj. */
export default function TimeClockPeopleView({ clockSerial }: Props) {
  const { t } = useTranslation("time-clock");
  const fx = useTimeClockPeople(clockSerial);
  const controlled = clockSerial !== undefined;
  const canWrite = useCan("time_clock.write");
  const [form, setForm] = useState({ employeeNumber: "", name: "", gender: "unknown" as ClockGender });
  const [removing, setRemoving] = useState<TimeClockPerson | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);

  const rows: Row[] = useMemo(() => {
    const bio = fx.biometrics?.people ?? {};
    return (fx.data?.people ?? []).map((p) => ({
      ...p,
      faces: bio[p.employeeNumber]?.faces ?? null,
      fingerprints: bio[p.employeeNumber]?.fingerprints ?? null,
    }));
  }, [fx.data, fx.biometrics]);
  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Row>(async () => rows, {
        cards: { value: (r) => r.cards.length },
        faces: { value: (r) => yesNo(r.faces), match: "equals" },
        fingerprints: { value: (r) => yesNo(r.fingerprints), match: "equals" },
      }),
    [rows]
  );

  const yesNoOptions = [
    { value: "true", label: t("people.table.yes") },
    { value: "false", label: t("people.table.no") },
  ];

  const columns: Column<Row>[] = [
    { key: "employeeNumber", label: t("people.table.number"), width: 130, filter: true, sortable: true, truncate: true },
    { key: "name", label: t("people.table.name"), width: "32%", filter: true, sortable: true, truncate: true },
    {
      key: "faces",
      label: t("people.table.faces"),
      width: 130,
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: yesNoOptions },
      sortable: true,
      render: (row) => <Presence count={row.faces} icon={<FaUserCheck size={10} />} />,
    },
    {
      key: "fingerprints",
      label: t("people.table.fingerprints"),
      width: 130,
      type: "catalog",
      filter: "catalog",
      catalogOptions: { data: yesNoOptions },
      sortable: true,
      render: (row) => <Presence count={row.fingerprints} icon={<FaFingerprint size={10} />} />,
    },
    {
      key: "cards",
      label: t("people.table.cards"),
      width: 120,
      sortable: true,
      render: (row) => t("people.table.cardsCount", { count: row.cards.length }),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 180,
      pinned: "right",
      actions: (row) => (
        <ITFlex align="center" justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setViewing(row.employeeNumber)}>
            {t("people.actions.view")}
          </ITButton>
          {canWrite && (
            <ITButton variant="outlined" color="danger" size="sm" disabled={fx.busy} onClick={() => setRemoving(row)}>
              {t("people.actions.remove")}
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  const submitCreate = async () => {
    const ok = await fx.create({ ...form, employeeNumber: form.employeeNumber.trim(), name: form.name.trim() });
    if (ok) setForm({ employeeNumber: "", name: "", gender: "unknown" });
  };

  const confirmRemove = async () => {
    if (!removing) return;
    if (await fx.remove(removing.employeeNumber)) setRemoving(null);
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
        <ITButton variant="outlined" color="secondary" size="sm" disabled={fx.loading || fx.busy} onClick={fx.reload}>
          <ITFlex align="center" gap={2}>
            <FaSyncAlt size={11} />
            {t("people.refresh")}
          </ITFlex>
        </ITButton>
        <ITButton variant="outlined" color="secondary" size="sm" disabled={fx.biometricsLoading} onClick={fx.reloadBiometrics}>
          <ITFlex align="center" gap={2}>
            <FaFingerprint size={11} />
            {t("people.biometrics.refresh")}
          </ITFlex>
        </ITButton>
        <ITText className="text-xs text-slate-400">
          {fx.biometricsLoading
            ? t("people.biometrics.loading")
            : fx.biometrics
              ? t("people.biometrics.updated", { time: new Date(fx.biometrics.updatedAt).toLocaleTimeString(dateLocale()) })
              : ""}
        </ITText>
      </ITFlex>

      {canWrite && (
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
      )}

      {fx.error && <p role="alert" className="text-sm text-red-600">{fx.error}</p>}
      {fx.biometricsError && <p role="alert" className="text-sm text-red-600">{fx.biometricsError}</p>}
      {fx.toast && <p role="status" className="text-sm text-emerald-700" onClick={fx.dismissToast}>{fx.toast}</p>}
      {fx.loading && <p className="text-sm text-slate-400">{t("people.loading")}</p>}

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchData as unknown as (p: ITDataTableFetchParams) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        reloadTrigger={`${fx.version}-${fx.biometrics?.updatedAt ?? ""}`}
        layout="fixed"
        density="compact"
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        debounceMs={350}
        variant="bordered"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
        onRowClick={(row) => setViewing((row as unknown as Row).employeeNumber)}
      />

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
