import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITLoader,
  ITSearchSelect,
  ITSegmentedControl,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaGripVertical, FaRegCircle, FaRegClock, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { usersApi, type User } from "@entities/user";
import { scheduleApi, type AsignadoPersona, type Horario } from "@entities/schedule";

const toDateInput = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const ASSIGNED_MIME = "application/x-assigned";
const PENDING_MIME = "application/x-pending";

export default function AssignSchedules() {
  const { t } = useTranslation("schedules");
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [employees, setEmployees] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [horarioId, setHorarioId] = useState("");
  const [desde, setDesde] = useState<Date>(new Date());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [assigned, setAssigned] = useState<AsignadoPersona[]>([]);
  const [q, setQ] = useState("");
  const [mode, setMode] = useState<"list" | "drag">("list");
  const [dragOver, setDragOver] = useState(false);
  const [removeOver, setRemoveOver] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([scheduleApi.list(), usersApi.empleados()])
      .then(([h, u]) => {
        setHorarios(h);
        setEmployees(u);
        if (h[0]) setHorarioId(h[0].id);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const loadAssigned = useCallback((id: string) => {
    if (!id) return;
    scheduleApi
      .asignadosDeHorario(id)
      .then(setAssigned)
      .catch(() => setAssigned([]));
  }, []);

  useEffect(() => {
    loadAssigned(horarioId);
  }, [horarioId, loadAssigned]);

  const employeeById = useMemo(() => new Map(employees.map((e) => [e.id, e])), [employees]);
  const assignedIds = useMemo(() => new Set(assigned.map((a) => a.userId)), [assigned]);
  const pending = useMemo(
    () => [...selected].map((id) => employeeById.get(id)).filter(Boolean) as User[],
    [selected, employeeById]
  );

  // Solo mostramos personas disponibles: ni ya asignadas a este horario ni pendientes.
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return employees.filter((e) => {
      if (assignedIds.has(e.id) || selected.has(e.id)) return false;
      if (!term) return true;
      return (
        e.name.toLowerCase().includes(term) ||
        (e.numeroEmpleado ?? "").toLowerCase().includes(term)
      );
    });
  }, [employees, assignedIds, selected, q]);

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const selectAllVisible = () => setSelected(new Set(filtered.map((e) => e.id)));
  const clearSelection = () => setSelected(new Set());

  const horarioOptions = horarios.map((h) => ({ value: h.id, label: h.nombre }));
  const currentHorario = horarios.find((h) => h.id === horarioId);

  const apply = async () => {
    if (!horarioId || selected.size === 0) return;
    setSaving(true);
    setError(null);
    try {
      const res = await scheduleApi.asignar({
        horarioId,
        userIds: [...selected],
        desde: toDateInput(desde),
      });
      setToast(t("assign.success", { count: res.asignados }));
      setSelected(new Set());
      loadAssigned(horarioId);
    } catch (e) {
      setError((e as Error).message ?? t("assign.error"));
    } finally {
      setSaving(false);
    }
  };

  const removeAssigned = async (userId: string) => {
    if (!horarioId) return;
    try {
      await scheduleApi.quitarAsignaciones({ horarioId, userIds: [userId] });
      loadAssigned(horarioId);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  if (loading) {
    return (
      <ITFlex justify="center" className="py-10">
        <ITLoader variant="spinner" size="lg" color="primary" />
      </ITFlex>
    );
  }

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={4} className="items-end">
        <ITGrid item xs={12} md={4}>
          <ITSearchSelect
            name="horario"
            label={t("assign.schedule")}
            options={horarioOptions}
            value={horarioId}
            onChange={(v) => {
              setHorarioId(String(v));
              setSelected(new Set());
            }}
            className="w-full min-w-0"
          />
        </ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITDatePicker
            name="desde"
            label={t("assign.since")}
            value={desde}
            onChange={(e) => {
              const v = e.target.value;
              if (v instanceof Date) setDesde(v);
            }}
            className="w-full min-w-0"
          />
        </ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITSegmentedControl
            options={[
              { value: "list", label: t("assign.modeList") },
              { value: "drag", label: t("assign.modeDrag") },
            ]}
            value={mode}
            onChange={(v) => setMode(v as "list" | "drag")}
          />
        </ITGrid>
        <ITGrid item xs={12} md={2}>
          <ITButton
            variant="filled"
            color="primary"
            onClick={apply}
            disabled={saving || selected.size === 0 || !horarioId}
            className="w-full"
          >
            <ITText className="font-bold text-[11px]">
              {t("assign.apply", { count: selected.size })}
            </ITText>
          </ITButton>
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={4} className="items-start">
        {/* Personas disponibles */}
        <ITGrid item xs={12} md={7} className="min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setRemoveOver(true);
            }}
            onDragLeave={() => setRemoveOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setRemoveOver(false);
              const a = e.dataTransfer.getData(ASSIGNED_MIME);
              const p = e.dataTransfer.getData(PENDING_MIME);
              if (a) void removeAssigned(a);
              else if (p) toggle(p);
            }}
            className={`rounded-2xl border-2 p-4 transition-colors ${
              removeOver ? "border-rose-400 bg-rose-50" : "border-slate-200 bg-white"
            } shadow-sm`}
          >
            <ITFlex direction="column" gap={3}>
              <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {t("assign.people")} · {filtered.length}
                </ITText>
                <ITFlex gap={2}>
                  <ITButton variant="text" color="primary" size="sm" onClick={selectAllVisible}>
                    {t("assign.selectAll")}
                  </ITButton>
                  <ITButton variant="text" color="gray" size="sm" onClick={clearSelection}>
                    {t("assign.clear")}
                  </ITButton>
                </ITFlex>
              </ITFlex>

              <ITInput
                name="searchPerson"
                placeholder={t("assign.search")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />

              <ITText className="text-[10px] text-slate-400">{t("assign.removeHint")}</ITText>

              <ITFlex direction="column" gap={1} className="max-h-[52vh] overflow-y-auto pr-1">
                {filtered.length === 0 ? (
                  <ITText className="text-[11px] italic text-slate-400">{t("assign.noPeople")}</ITText>
                ) : (
                  filtered.map((e) => (
                    <div
                      key={e.id}
                      draggable={mode === "drag"}
                      onDragStart={(ev) => ev.dataTransfer.setData("text/plain", e.id)}
                      className="rounded-lg border border-slate-200 bg-white"
                    >
                      <ITFlex align="center" justify="between" gap={2} className="px-3 py-2">
                        <ITFlex align="center" gap={2} className="min-w-0">
                          {mode === "drag" && <FaGripVertical size={11} className="text-slate-300" />}
                          <ITText className="truncate text-[12px] font-semibold text-slate-700">
                            {e.name}
                          </ITText>
                          <ITText className="text-[10px] text-slate-400">
                            {e.numeroEmpleado ? `#${e.numeroEmpleado}` : ""}
                          </ITText>
                        </ITFlex>
                        <ITButton
                          variant="icon-only"
                          color="gray"
                          size="sm"
                          onClick={() => toggle(e.id)}
                          ariaLabel={e.name}
                        >
                          <FaRegCircle size={12} />
                        </ITButton>
                      </ITFlex>
                    </div>
                  ))
                )}
              </ITFlex>
            </ITFlex>
          </div>
        </ITGrid>

        {/* Horario destino */}
        <ITGrid item xs={12} md={5} className="min-w-0">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const id = e.dataTransfer.getData("text/plain");
              if (id) setSelected((prev) => new Set(prev).add(id));
            }}
            className={`rounded-2xl border-2 border-dashed p-5 transition-colors ${
              dragOver ? "border-[#0D5777] bg-[#0D5777]/5" : "border-slate-300 bg-slate-50"
            }`}
          >
            <ITFlex direction="column" gap={3}>
              <ITFlex align="center" gap={2}>
                <ITFlex
                  align="center"
                  justify="center"
                  className="h-10 w-10 rounded-xl bg-[#0D5777]/10 text-[#0D5777]"
                >
                  <FaRegClock size={15} />
                </ITFlex>
                <ITFlex direction="column" gap={0} className="min-w-0">
                  <ITText className="truncate text-[13px] font-black text-slate-800">
                    {currentHorario?.nombre ?? "—"}
                  </ITText>
                  <ITText className="text-[10px] text-slate-400">
                    {t("assign.since")} {toDateInput(desde)}
                  </ITText>
                </ITFlex>
              </ITFlex>

              <ITText className="text-[11px] text-slate-500">
                {mode === "drag" ? t("assign.dragHint") : t("assign.dropHere")}
              </ITText>

              {/* Por asignar (pendientes, en gris) */}
              {pending.length > 0 && (
                <ITFlex direction="column" gap={1} className="border-t border-slate-200 pt-3">
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-amber-600">
                    {t("assign.pendingList")} · {pending.length}
                  </ITText>
                  <ITFlex direction="column" gap={1} className="max-h-[24vh] overflow-y-auto pr-1">
                    {pending.map((e) => (
                      <div
                        key={e.id}
                        draggable
                        onDragStart={(ev) => ev.dataTransfer.setData(PENDING_MIME, e.id)}
                        className="rounded-lg border border-dashed border-slate-300 bg-slate-100"
                      >
                        <ITFlex align="center" justify="between" gap={2} className="px-3 py-1.5">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <FaGripVertical size={10} className="text-slate-300" />
                            <ITText className="truncate text-[11px] font-semibold text-slate-400">
                              {e.name}
                            </ITText>
                          </ITFlex>
                          <ITButton
                            variant="icon-only"
                            color="gray"
                            size="sm"
                            onClick={() => toggle(e.id)}
                            ariaLabel={t("assign.remove")}
                            title={t("assign.remove")}
                          >
                            <FaTimes size={11} />
                          </ITButton>
                        </ITFlex>
                      </div>
                    ))}
                  </ITFlex>
                </ITFlex>
              )}

              {/* Asignadas actualmente (guardadas) */}
              <ITFlex direction="column" gap={1} className="border-t border-slate-200 pt-3">
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                  {t("assign.assignedList")} · {assigned.length}
                </ITText>
                {assigned.length === 0 ? (
                  <ITText className="text-[11px] italic text-slate-400">{t("assign.empty")}</ITText>
                ) : (
                  <ITFlex direction="column" gap={1} className="max-h-[30vh] overflow-y-auto pr-1">
                    {assigned.map((a) => (
                      <div
                        key={a.userId}
                        draggable
                        onDragStart={(ev) => ev.dataTransfer.setData(ASSIGNED_MIME, a.userId)}
                        className="rounded-lg border border-slate-200 bg-white"
                      >
                        <ITFlex align="center" justify="between" gap={2} className="px-3 py-1.5">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <FaGripVertical size={10} className="text-slate-300" />
                            <ITText className="truncate text-[11px] font-semibold text-slate-700">
                              {a.employeeName}
                            </ITText>
                            <ITText className="text-[10px] text-slate-400">
                              {a.numeroEmpleado ? `#${a.numeroEmpleado}` : ""}
                            </ITText>
                          </ITFlex>
                          <ITButton
                            variant="icon-only"
                            color="error"
                            size="sm"
                            onClick={() => void removeAssigned(a.userId)}
                            ariaLabel={t("assign.remove")}
                            title={t("assign.remove")}
                          >
                            <FaTimes size={11} />
                          </ITButton>
                        </ITFlex>
                      </div>
                    ))}
                  </ITFlex>
                )}
              </ITFlex>
            </ITFlex>
          </div>
        </ITGrid>
      </ITGrid>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
