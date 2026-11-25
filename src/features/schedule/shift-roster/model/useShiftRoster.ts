import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  scheduleApi,
  toDayKey,
  type RosterCell,
  type RosterEntry,
  type RosterWeek,
  type Schedule,
} from "@entities/schedule";
import { useDepartmentOptions } from "@entities/department";
import { useWeekStartDay } from "@entities/sys-config";

/** Valor del select para «Descanso»; "" = «Horario base» (quita el rol). */
export const REST_VALUE = "__REST__";

const shiftDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const cellKey = (userId: string, date: string) => `${userId}|${date}`;

/** Valor del select que representa lo ya guardado en la celda. */
export const savedValue = (cell: RosterCell): string =>
  cell.source !== "ROSTER" ? "" : cell.restDay ? REST_VALUE : (cell.scheduleId ?? "");

const errorMessage = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);

/**
 * Estado del rol semanal: semana, departamento, datos del API, cambios locales
 * (solo las celdas modificadas) y acciones de guardar / copiar.
 */
export const useShiftRoster = () => {
  const { t } = useTranslation("schedules");
  const [weekDate, setWeekDate] = useState(() => new Date());
  const [departmentId, setDepartmentId] = useState("");
  const [week, setWeek] = useState<RosterWeek | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  /** Cambios sin guardar: valor elegido por celda. */
  const [edits, setEditsState] = useState<Record<string, string>>({});
  /** Espejo síncrono de `edits` para pintar/arrastrar sin cierres obsoletos. */
  const editsRef = useRef<Record<string, string>>({});
  /** Pila de mapas previos para «Deshacer» (máx. 30). */
  const undoRef = useRef<Record<string, string>[]>([]);
  const [undoCount, setUndoCount] = useState(0);
  const [search, setSearch] = useState("");
  /** Pincel: null = ninguno; "" = horario base; REST_VALUE; o scheduleId. */
  const [brush, setBrush] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const setEdits = useCallback((next: Record<string, string>) => {
    editsRef.current = next;
    setEditsState(next);
  }, []);
  const departments = useDepartmentOptions();
  const weekStart = useWeekStartDay();

  const date = toDayKey(weekDate);

  const rangeValue = useMemo<[Date, Date]>(() => {
    const offset = (weekDate.getDay() - weekStart + 7) % 7;
    const start = new Date(weekDate);
    start.setDate(weekDate.getDate() - offset);
    start.setHours(0, 0, 0, 0);
    return [start, shiftDays(start, 6)];
  }, [weekDate, weekStart]);

  const reloadSchedules = useCallback(async () => {
    try {
      setSchedules(await scheduleApi.list());
    } catch {
      /* el rol sigue funcionando con la lista previa */
    }
  }, []);
  useEffect(() => {
    void reloadSchedules();
  }, [reloadSchedules]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    scheduleApi
      .rosterQuery({ weekDate: date, departmentId: departmentId || undefined })
      .then((res) => {
        if (!active) return;
        setWeek(res);
        setEdits({});
        undoRef.current = [];
        setUndoCount(0);
      })
      .catch((e: unknown) => active && setError(errorMessage(e, t("roster.loadError"))))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [date, departmentId, reloadKey, t, setEdits]);

  const reload = useCallback(() => setReloadKey((k) => k + 1), []);

  const dirtyCount = Object.keys(edits).length;
  const closed = week?.closed ?? false;

  /** Personas visibles tras el filtro de búsqueda (nombre o número de empleado). */
  const visiblePeople = useMemo(() => {
    const people = week?.people ?? [];
    const q = search.trim().toLowerCase();
    if (!q) return people;
    return people.filter((p) => p.name.toLowerCase().includes(q) || (p.employeeNumber ?? "").toLowerCase().includes(q));
  }, [week, search]);

  /** Índice userId|fecha → celda, para pintar por coordenadas. */
  const cellIndex = useMemo(() => {
    const map = new Map<string, RosterCell>();
    for (const p of week?.people ?? []) for (const c of p.cells) map.set(cellKey(p.userId, c.date), c);
    return map;
  }, [week]);

  const pushUndo = () => {
    undoRef.current.push(editsRef.current);
    if (undoRef.current.length > 30) undoRef.current.shift();
    setUndoCount(undoRef.current.length);
  };

  /** Pinta celdas con un valor; `newOperation` apila un punto de deshacer. */
  const paintCells = (keys: string[], value: string, newOperation = true) => {
    const prev = editsRef.current;
    let next: Record<string, string> | null = null;
    for (const key of keys) {
      const cell = cellIndex.get(key);
      if (!cell) continue;
      const current = key in (next ?? prev) ? (next ?? prev)[key] : savedValue(cell);
      const target = value === savedValue(cell) ? null : value;
      if ((target ?? savedValue(cell)) === current) continue;
      if (!next) next = { ...prev };
      if (target === null) delete next[key];
      else next[key] = target;
    }
    if (!next) return;
    if (newOperation) pushUndo();
    setEdits(next);
  };

  /** Inicia un trazo de arrastre: un único punto de deshacer. */
  const beginStroke = () => pushUndo();
  /** Si el trazo no cambió nada, retira su punto de deshacer. */
  const endStroke = (startEdits: Record<string, string>) => {
    if (editsRef.current === startEdits && undoRef.current.length) {
      undoRef.current.pop();
      setUndoCount(undoRef.current.length);
    }
  };
  const currentEdits = () => editsRef.current;

  const undo = () => {
    const prev = undoRef.current.pop();
    if (!prev) return;
    setUndoCount(undoRef.current.length);
    setEdits(prev);
  };

  const discard = () => {
    undoRef.current = [];
    setUndoCount(0);
    setEdits({});
  };

  const save = async () => {
    const entries: RosterEntry[] = Object.entries(edits).map(([key, value]) => {
      const [userId, cellDate] = key.split("|");
      if (value === "") return { userId, date: cellDate, clear: true };
      if (value === REST_VALUE) return { userId, date: cellDate, restDay: true };
      return { userId, date: cellDate, scheduleId: value };
    });
    if (!entries.length) return;
    setSaving(true);
    setError(null);
    try {
      const res = await scheduleApi.rosterSave(entries);
      setNotice(t("roster.saved", { count: res.saved + res.cleared }));
      reload();
    } catch (e) {
      setError(errorMessage(e, t("roster.saveError")));
    } finally {
      setSaving(false);
    }
  };

  /** Asigna en bloque (personas × días) SIN guardar: queda en los cambios pendientes como un solo paso de deshacer. */
  const stageBulk = (userIds: string[], days: string[], value: string) => {
    const keys: string[] = [];
    for (const userId of userIds) for (const day of days) keys.push(cellKey(userId, day));
    paintCells(keys, value);
  };

  const copyPreviousWeek = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await scheduleApi.rosterCopyWeek({
        fromWeekDate: toDayKey(shiftDays(weekDate, -7)),
        toWeekDate: date,
        // Con filtro de departamento solo se copia a las personas que se ven.
        userIds: (departmentId || search.trim()) && week ? visiblePeople.map((p) => p.userId) : undefined,
      });
      setNotice(t("roster.copied", { count: res.copied }));
      reload();
    } catch (e) {
      setError(errorMessage(e, t("roster.copyError")));
    } finally {
      setSaving(false);
    }
  };

  const hasRosterCells = useMemo(
    () => !!week?.people.some((p) => p.cells.some((c) => c.source === "ROSTER")),
    [week],
  );

  return {
    weekDate,
    setWeekDate,
    previousWeek: () => setWeekDate((d) => shiftDays(d, -7)),
    nextWeek: () => setWeekDate((d) => shiftDays(d, 7)),
    rangeValue,
    departmentId,
    setDepartmentId,
    departments,
    week,
    schedules,
    reloadSchedules,
    loading,
    error,
    setError,
    notice,
    setNotice,
    saving,
    closed,
    dirtyCount,
    hasRosterCells,
    edits,
    search,
    setSearch,
    visiblePeople,
    brush,
    setBrush,
    paintCells,
    beginStroke,
    endStroke,
    currentEdits,
    undo,
    undoCount,
    discard,
    save,
    stageBulk,
    copyPreviousWeek,
  };
};

export type UseShiftRoster = ReturnType<typeof useShiftRoster>;
