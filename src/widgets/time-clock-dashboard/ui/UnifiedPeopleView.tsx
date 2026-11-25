import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FaCheck, FaSyncAlt } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { AppDispatch } from "@app/store";
import { showToast } from "@app/toast/toast.slice";
import { departmentsApi, type Department } from "@entities/department";
import { timeClockApi, type UnifiedPeople, type UnifiedPerson } from "@entities/time-clock";
import { useCan } from "@entities/user";

/** Personas de todos los relojes en una sola tabla: una columna por reloj, solo lectura. */
export default function UnifiedPeopleView() {
  const { t } = useTranslation("time-clock");
  const [data, setData] = useState<UnifiedPeople | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [onlyUnlinked, setOnlyUnlinked] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [creating, setCreating] = useState<UnifiedPerson | null>(null);
  const [newName, setNewName] = useState("");
  const [newDept, setNewDept] = useState("");
  const [departments, setDepartments] = useState<Department[]>([]);
  const dispatch = useDispatch<AppDispatch>();
  const canLink = useCan("time_clock.link");
  const canCreateUser = useCan("users.create");
  const canWriteClock = useCan("time_clock.write");
  const canCreate = canCreateUser && canWriteClock;
  const canOpenRecord = useCan("hr.records");

  const notifyError = (e: any) =>
    dispatch(showToast({ message: e?.message ?? t("dashboard.unified.actionFailed"), type: "error" }));

  const link = async (p: UnifiedPerson) => {
    if (!p.system.userId) return;
    setBusy(p.employeeNumber);
    try {
      await timeClockApi.linkPerson(p.employeeNumber, p.system.userId);
      dispatch(showToast({ message: t("dashboard.unified.linkedOk", { number: p.employeeNumber, name: p.system.userName }), type: "success" }));
      load(true);
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(null);
    }
  };

  const openCreate = (p: UnifiedPerson) => {
    setCreating(p);
    setNewName(p.name);
    setNewDept("");
    if (departments.length === 0) departmentsApi.list(true).then(setDepartments).catch(() => undefined);
  };

  const create = async () => {
    if (!creating || !newName.trim()) return;
    setBusy(creating.employeeNumber);
    try {
      const r = await timeClockApi.createEmployeeFromClock(creating.employeeNumber, {
        name: newName.trim(),
        departmentId: newDept || undefined,
      });
      dispatch(showToast({ message: t("dashboard.unified.createdOk", { name: r.userName, username: r.username }), type: "success" }));
      setCreating(null);
      load(true);
    } catch (e) {
      notifyError(e);
    } finally {
      setBusy(null);
    }
  };

  const load = (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    timeClockApi
      .peopleUnified()
      .then(setData)
      .catch((e: any) => setError(e?.message ?? t("dashboard.unified.empty")))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const all = (data?.people ?? []).filter((p) => !onlyUnlinked || p.system.status !== "LINKED");
    return q ? all.filter((p) => p.employeeNumber.toLowerCase().includes(q) || p.name.toLowerCase().includes(q)) : all;
  }, [data, query, onlyUnlinked]);

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITText className="text-sm text-slate-500">{t("dashboard.unified.hint")}</ITText>
        <ITButton variant="outlined" color="secondary" size="sm" disabled={loading} onClick={() => load()}>
          <ITFlex align="center" gap={2}>
            <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
            {t("dashboard.unified.refresh")}
          </ITFlex>
        </ITButton>
      </ITFlex>

      {error && <ITAlert variant="error">{error}</ITAlert>}
      {data?.clocks.filter((c) => c.error).map((c) => (
        <ITAlert key={c.serial} variant="warning">
          {t("dashboard.unified.clockError", { clock: c.name, code: c.error })}
        </ITAlert>
      ))}

      <ITFlex align="center" gap={3} wrap="wrap">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("dashboard.unified.search")}
          className="w-full max-w-md rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:border-slate-400"
        />
        <button
          type="button"
          onClick={() => setOnlyUnlinked((v) => !v)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${onlyUnlinked ? "border-amber-400 bg-amber-50 text-amber-800" : "border-slate-200 bg-white text-slate-500"}`}
        >
          {t("dashboard.unified.onlyUnlinked")}
        </button>
      </ITFlex>

      {loading && !data && <ITText className="text-sm text-slate-400">{t("dashboard.loading")}</ITText>}

      {data && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">{t("dashboard.unified.number")}</th>
                <th className="px-4 py-3">{t("dashboard.unified.name")}</th>
                <th className="px-4 py-3">{t("dashboard.unified.system")}</th>
                {data.clocks.map((c) => (
                  <th key={c.serial} className="px-4 py-3 text-center">{c.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.employeeNumber} className="border-t border-slate-100">
                  <td className="px-4 py-2 font-mono">{p.employeeNumber}</td>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">
                    <ITFlex align="center" gap={2} wrap="wrap">
                      {p.system.status === "LINKED" && (
                        <>
                          <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">{t("dashboard.unified.linked")}</span>
                          {canOpenRecord && p.system.userId ? (
                            <Link to={`/employees/${p.system.userId}`} className="text-xs text-slate-600 underline">{p.system.userName}</Link>
                          ) : (
                            <span className="text-xs text-slate-600">{p.system.userName}</span>
                          )}
                        </>
                      )}
                      {p.system.status === "MATCH" && (
                        <>
                          <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-semibold text-amber-800">{t("dashboard.unified.matches", { name: p.system.userName })}</span>
                          {canLink && (
                            <ITButton variant="outlined" color="primary" size="sm" disabled={busy === p.employeeNumber} onClick={() => link(p)}>
                              {t("dashboard.unified.link")}
                            </ITButton>
                          )}
                        </>
                      )}
                      {p.system.status === "NONE" && (
                        <>
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">{t("dashboard.unified.missing")}</span>
                          {canCreate && (
                            <ITButton variant="outlined" color="primary" size="sm" disabled={busy === p.employeeNumber} onClick={() => openCreate(p)}>
                              {t("dashboard.unified.create")}
                            </ITButton>
                          )}
                        </>
                      )}
                    </ITFlex>
                  </td>
                  {data.clocks.map((c) => (
                    <td key={c.serial} className="px-4 py-2 text-center">
                      {p.presentIn.includes(c.serial) ? <FaCheck className="inline text-emerald-600" /> : <span className="text-slate-300">{t("dashboard.unified.none")}</span>}
                    </td>
                  ))}
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={3 + data.clocks.length} className="px-4 py-8 text-center text-slate-400">
                    {t("dashboard.unified.empty")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <ITDialog isOpen={!!creating} onClose={() => setCreating(null)} className="w-full !max-w-md">
        <ITFlex direction="column" gap={3}>
          <ITText className="text-base font-bold">{t("dashboard.unified.createTitle")}</ITText>
          <ITText className="text-sm text-slate-500">{t("dashboard.unified.createHint", { number: creating?.employeeNumber })}</ITText>
          <ITInput name="newEmployeeName" label={t("dashboard.unified.createName")} value={newName} onChange={(e) => setNewName(e.target.value)} />
          <ITSelect
            name="newEmployeeDepartment"
            label={t("dashboard.unified.createDepartment")}
            options={[{ value: "", label: t("dashboard.unified.noDepartment") }, ...departments.filter((d) => d.active).map((d) => ({ value: d.id, label: d.name }))]}
            value={newDept}
            onChange={(e) => setNewDept(e.target.value)}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" size="sm" onClick={() => setCreating(null)}>{t("dashboard.unified.cancel")}</ITButton>
            <ITButton variant="raised-text" color="primary" size="sm" disabled={!newName.trim() || busy !== null} onClick={create}>{t("dashboard.unified.confirmCreate")}</ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
