import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { departmentsApi, type Department } from "@entities/department";
import { scheduleApi, type Schedule } from "@entities/schedule";
import { timeClockApi } from "@entities/time-clock";
import {
  employeeSyncApi,
  useCan,
  type EmployeeSyncAltaRow,
  type EmployeeSyncClockResult,
  type EmployeeSyncConfirmResult,
  type EmployeeSyncInvalidRow,
  type EmployeeSyncPreview,
  type EmployeeSyncReportRow,
} from "@entities/user";

/** Paso del asistente: subir el archivo, revisar lo que va a pasar, resultado. */
export type EmployeeSyncStep = "upload" | "review" | "done";

/** Pestaña del paso de revisión. */
export type EmployeeSyncTab = "altas" | "bajas" | "cambios" | "porResolver";

/** Lo que se puede editar de cada alta en pantalla (lo demás viene del Excel). */
export interface AltaDraft {
  username: string;
  password: string;
  jobTitle: string;
  scheduleId: string;
}

/** Borradores por número de fila de Excel. */
export type AltaDrafts = Record<number, AltaDraft>;

/** Fila del reporte final: una persona con lo que quedó en sistema y reloj. */
export interface EmployeeSyncResultRow {
  key: string;
  userId: string;
  name: string;
  employeeNumber?: string;
  kind: "created" | "deactivated" | "updated";
  /** El reloj se toca solo en altas y bajas (los cambios son solo del sistema). */
  clockApplies: boolean;
  clock?: EmployeeSyncClockResult;
}

/** Códigos de error por fila con texto propio; el resto se muestra crudo. */
const FIELD_ERROR_KEYS = {
  USERNAME_TAKEN: "sync.fieldErrors.USERNAME_TAKEN",
  EMPLOYEE_NUMBER_TAKEN: "sync.fieldErrors.EMPLOYEE_NUMBER_TAKEN",
  DEPARTMENT_NOT_FOUND: "sync.fieldErrors.DEPARTMENT_NOT_FOUND",
  SCHEDULE_NOT_FOUND: "sync.fieldErrors.SCHEDULE_NOT_FOUND",
  USER_NOT_FOUND: "sync.fieldErrors.USER_NOT_FOUND",
  INVALID_EMPLOYEE_NUMBER: "sync.fieldErrors.INVALID_EMPLOYEE_NUMBER",
  MISSING_USERNAME: "sync.fieldErrors.MISSING_USERNAME",
  MISSING_PASSWORD: "sync.fieldErrors.MISSING_PASSWORD",
  USER_NOT_ACTIVE: "sync.fieldErrors.USER_NOT_ACTIVE",
} as const;

/** Códigos que devuelve un reloj; el resto se muestra crudo. */
const CLOCK_CODE_KEYS = {
  TIME_CLOCK_READ_ONLY: "sync.result.clockCode.TIME_CLOCK_READ_ONLY",
} as const;

/** Mensaje de un error del API (ya viene localizado por la API). */
const messageOf = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

/** Nombre de departamento comparable (sin acentos, mayúsculas ni espacios de más). */
const normalizeName = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Asistente de sincronización de empleados desde el Excel de nómina.
 *
 * Sube el archivo → previsualiza sin escribir nada → confirma lo revisado →
 * muestra el reporte del sistema y de los relojes. Las altas se editan en
 * pantalla (usuario, contraseña temporal y horario); las bajas se pueden
 * excluir una por una; los cambios de nombre/departamento se aplican solo si se
 * enciende el interruptor global. Lo que queda por resolver nunca se confirma:
 * se corrige el Excel y se vuelve a subir.
 */
export const useEmployeeSync = () => {
  const { t: tt } = useTranslation("employees");
  const canEdit = useCan("users.edit");
  const canWriteClock = useCan("time_clock.write");
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<EmployeeSyncStep>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<EmployeeSyncPreview | null>(null);
  const [result, setResult] = useState<EmployeeSyncConfirmResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rowErrors, setRowErrors] = useState<EmployeeSyncInvalidRow[]>([]);
  const [step2Tab, setStep2Tab] = useState<EmployeeSyncTab>("altas");
  const [drafts, setDrafts] = useState<AltaDrafts>({});
  const [excludedBajas, setExcludedBajas] = useState<Set<string>>(new Set());
  const [includeChanges, setIncludeChanges] = useState(false);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  // Catálogos que la revisión necesita: horarios activos para las altas y los
  // departamentos para resolver el id de un cambio de departamento (el preview
  // solo trae el nombre).
  useEffect(() => {
    let active = true;
    Promise.all([
      scheduleApi.list().catch(() => [] as Schedule[]),
      departmentsApi.list().catch(() => [] as Department[]),
    ]).then(([scheduleList, departmentList]) => {
      if (!active) return;
      setSchedules(scheduleList.filter((schedule) => schedule.active));
      setDepartments(departmentList);
    });
    return () => {
      active = false;
    };
  }, []);

  const scheduleOptions = useMemo(
    () => [
      { value: "", label: tt("sync.altas.noSchedule") },
      ...schedules.map((schedule) => ({ value: schedule.id, label: schedule.name })),
    ],
    [schedules, tt]
  );

  const departmentIdByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const department of departments) map.set(normalizeName(department.name), department.id);
    return map;
  }, [departments]);

  const reset = useCallback(() => {
    setStep("upload");
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setRowErrors([]);
    setDrafts({});
    setExcludedBajas(new Set());
    setIncludeChanges(false);
    setStep2Tab("altas");
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  /** Paso 1: elige el archivo (todavía no se lee). */
  const selectFile = useCallback((selected: File | null) => {
    setFile(selected);
    setPreview(null);
    setResult(null);
    setError(null);
    setRowErrors([]);
    setDrafts({});
    setExcludedBajas(new Set());
    setIncludeChanges(false);
    setStep("upload");
  }, []);

  /** Llama a la API de previsualización. No escribe nada en el sistema. */
  const runPreview = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setRowErrors([]);
    try {
      const data = await employeeSyncApi.preview(file);
      setPreview(data);
      setStep("review");
      setStep2Tab("altas");
      setExcludedBajas(new Set());
      setIncludeChanges(false);
      setDrafts(
        Object.fromEntries(
          data.altas.map((alta: EmployeeSyncAltaRow) => [
            alta.row,
            {
              username: alta.proposedUsername ?? "",
              password: alta.proposedPassword ?? "",
              jobTitle: alta.jobTitle ?? "",
              scheduleId: alta.scheduleId ?? "",
            },
          ])
        )
      );
    } catch (caught) {
      setPreview(null);
      setStep("upload");
      setError(messageOf(caught, tt("sync.errors.preview")));
    } finally {
      setLoading(false);
    }
  }, [file, tt]);

  /** Edita un campo de una alta. */
  const setDraft = useCallback((row: number, patch: Partial<AltaDraft>) => {
    setDrafts((current) => ({
      ...current,
      [row]: {
        username: current[row]?.username ?? "",
        password: current[row]?.password ?? "",
        jobTitle: current[row]?.jobTitle ?? "",
        scheduleId: current[row]?.scheduleId ?? "",
        ...patch,
      },
    }));
  }, []);

  /** Incluye o excluye una baja propuesta. */
  const toggleBaja = useCallback((userId: string, include: boolean) => {
    setExcludedBajas((current) => {
      const next = new Set(current);
      if (include) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }, []);

  const counts = preview?.counts;

  const selection = useMemo(() => {
    const created = preview?.altas.length ?? 0;
    const deactivated = Math.max((preview?.bajas.length ?? 0) - excludedBajas.size, 0);
    const updated = includeChanges ? preview?.cambios.length ?? 0 : 0;
    return { created, deactivated, updated, total: created + deactivated + updated };
  }, [preview, excludedBajas, includeChanges]);

  /** Ninguna alta puede quedar sin usuario o sin contraseña temporal. */
  const altasIncomplete = useMemo(
    () =>
      (preview?.altas ?? []).some((alta) => {
        const draft = drafts[alta.row];
        return !draft || !draft.username.trim() || !draft.password;
      }),
    [preview, drafts]
  );

  const canConfirm =
    canEdit && !!preview && !confirming && !loading && selection.total > 0 && !altasIncomplete;

  /** Cuerpo de la confirmación: exactamente lo revisado en pantalla. */
  const buildPayload = useCallback(() => {
    if (!preview) return null;
    const altas = preview.altas.map((alta) => {
      const draft = drafts[alta.row];
      return {
        row: alta.row,
        employeeNumber: alta.employeeNumber,
        name: alta.name,
        departmentId: alta.departmentId,
        jobTitle: draft?.jobTitle.trim() || undefined,
        username: draft?.username.trim() ?? "",
        password: draft?.password ?? "",
        scheduleId: draft?.scheduleId || undefined,
      };
    });
    const bajas = preview.bajas
      .filter((baja) => !excludedBajas.has(baja.userId))
      .map((baja) => ({ userId: baja.userId }));
    const cambios = includeChanges
      ? preview.cambios.map((cambio) => ({
          userId: cambio.userId,
          name: cambio.excelName,
          // El preview trae el nombre del departamento, no su id: se resuelve
          // contra el catálogo; si ya no existe, la API decide con el nombre.
          departmentId:
            departmentIdByName.get(normalizeName(cambio.excelDepartmentName ?? "")) ?? undefined,
        }))
      : undefined;
    return { altas, bajas, cambios };
  }, [preview, drafts, excludedBajas, includeChanges, departmentIdByName]);

  /** Paso 2: aplica la sincronización (todo o nada). Pinta el 422 por fila. */
  const confirm = useCallback(async () => {
    const payload = buildPayload();
    if (!payload || !canConfirm) return;
    setConfirming(true);
    setError(null);
    setRowErrors([]);
    try {
      const data = await employeeSyncApi.confirm(payload);
      setResult(data);
      setStep("done");
    } catch (caught) {
      const apiError = caught as {
        message?: string;
        code?: string;
        details?: { rows?: EmployeeSyncInvalidRow[] };
      };
      const rows = apiError.details?.rows ?? [];
      if (apiError.code === "USER_SYNC_INVALID_ROWS" && rows.length > 0) {
        setRowErrors(rows);
        setError(tt("sync.confirm.invalidRows", { count: rows.length }));
        const firstRow = rows.find((row) => row.row !== undefined);
        if (firstRow) setStep2Tab("altas");
        else if (rows.some((row) => row.userId)) setStep2Tab("bajas");
      } else {
        setError(messageOf(caught, tt("sync.errors.confirm")));
      }
    } finally {
      setConfirming(false);
    }
  }, [buildPayload, canConfirm, tt]);

  /** Filas del reporte final (una por persona), con sistema y reloj. */
  const resultRows = useMemo<EmployeeSyncResultRow[]>(() => {
    if (!result) return [];
    const clockByUser = new Map(result.clock.results.map((entry) => [entry.userId, entry]));
    const rows: EmployeeSyncResultRow[] = [];
    for (const person of result.system.created) {
      rows.push({
        key: `created-${person.userId}`,
        userId: person.userId,
        name: person.name,
        employeeNumber: person.employeeNumber,
        kind: "created",
        clockApplies: true,
        clock: clockByUser.get(person.userId),
      });
    }
    for (const person of result.system.deactivated) {
      rows.push({
        key: `deactivated-${person.userId}`,
        userId: person.userId,
        name: person.name,
        employeeNumber: person.employeeNumber,
        kind: "deactivated",
        clockApplies: true,
        clock: clockByUser.get(person.userId),
      });
    }
    for (const person of result.system.updated) {
      rows.push({
        key: `updated-${person.userId}`,
        userId: person.userId,
        name: person.name,
        kind: "updated",
        clockApplies: false,
        clock: clockByUser.get(person.userId),
      });
    }
    return rows;
  }, [result]);

  /** Estado del reloj de una fila del reporte, listo para pintar. */
  const clockStateOf = useCallback(
    (row: EmployeeSyncResultRow): "ok" | "pending" | "failed" | null => {
      if (!row.clockApplies) return null;
      if (!row.clock) return "pending";
      if (row.clock.ok) return "ok";
      return row.clock.pending ? "pending" : "failed";
    },
    []
  );

  /** Reintenta el alta o la baja en los relojes de una persona pendiente. */
  const retryClock = useCallback(
    async (userId: string) => {
      if (!result) return;
      const target = resultRows.find((row) => row.userId === userId);
      if (!target) return;
      const action = target.kind === "deactivated" ? "BAJA" : "ALTA";
      setRetrying(userId);
      setError(null);
      try {
        const response =
          action === "ALTA"
            ? await timeClockApi.employeeClockAltaAll(userId)
            : await timeClockApi.employeeClockBajaAll(userId);
        const clocks = response.results;
        const previous = result.clock.results.find((entry) => entry.userId === userId);
        const next: EmployeeSyncClockResult = {
          userId,
          name: previous?.name ?? target.name,
          action,
          ok: clocks.every((clock) => clock.ok),
          pending: clocks.some((clock) => !clock.ok && clock.code === "TIME_CLOCK_READ_ONLY"),
          clocks,
          schedule: previous?.schedule,
        };
        setResult((current) => {
          if (!current) return current;
          const exists = current.clock.results.some((entry) => entry.userId === userId);
          const results = exists
            ? current.clock.results.map((entry) => (entry.userId === userId ? next : entry))
            : [...current.clock.results, next];
          return { ...current, clock: { ...current.clock, results } };
        });
        if (!next.ok && !next.pending) {
          setError(tt("sync.result.retryFailed", { name: next.name }));
        }
      } catch (caught) {
        setError(messageOf(caught, tt("sync.result.retryFailed", { name: target.name })));
      } finally {
        setRetrying(null);
      }
    },
    [result, resultRows, tt]
  );

  /** Filas que se mandan al Excel del reporte. */
  const reportRows = useMemo<EmployeeSyncReportRow[]>(() => {
    if (!result) return [];
    return resultRows.map((row) => {
      const state = clockStateOf(row);
      const scheduleError =
        row.clock?.schedule && !row.clock.schedule.ok
          ? tt("sync.result.scheduleError", { error: row.clock.schedule.error ?? "" })
          : null;
      const clock =
        state === "ok"
          ? tt("sync.result.excelClockOk")
          : state === "pending"
            ? tt("sync.result.excelClockPending")
            : state === "failed"
              ? [tt("sync.result.excelClockFailed"), scheduleError].filter(Boolean).join(" · ")
              : tt("sync.result.excelClockNotApplicable");
      const system =
        row.kind === "created"
          ? tt("sync.result.excelCreated")
          : row.kind === "deactivated"
            ? tt("sync.result.excelDeactivated")
            : tt("sync.result.excelUpdated");
      return {
        employeeNumber: row.employeeNumber,
        name: row.name,
        system,
        clock,
      };
    });
  }, [result, resultRows, clockStateOf, tt]);

  /** Descarga el reporte final como Excel (lo genera la API). */
  const downloadReport = useCallback(async () => {
    if (reportRows.length === 0) return;
    setExporting(true);
    setError(null);
    try {
      const blob = await employeeSyncApi.exportReport(reportRows);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "sincronizacion-empleados.xlsx";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (caught) {
      setError(messageOf(caught, tt("sync.errors.export")));
    } finally {
      setExporting(false);
    }
  }, [reportRows, tt]);

  /** Texto de un código de error por fila (cae al código si no hay traducción). */
  const fieldErrorLabel = useCallback(
    (code: string) => {
      const key = code in FIELD_ERROR_KEYS ? FIELD_ERROR_KEYS[code as keyof typeof FIELD_ERROR_KEYS] : null;
      return key ? tt(key) : code;
    },
    [tt]
  );

  /** Texto de un código que devolvió un reloj. */
  const clockCodeLabel = useCallback(
    (code: string) => {
      const key = code in CLOCK_CODE_KEYS ? CLOCK_CODE_KEYS[code as keyof typeof CLOCK_CODE_KEYS] : null;
      return key ? tt(key) : code;
    },
    [tt]
  );

  return {
    inputRef,
    step,
    file,
    preview,
    counts,
    result,
    loading,
    confirming,
    exporting,
    retrying,
    error,
    setError,
    rowErrors,
    step2Tab,
    setStep2Tab,
    drafts,
    setDraft,
    scheduleOptions,
    excludedBajas,
    toggleBaja,
    includeChanges,
    setIncludeChanges,
    selection,
    altasIncomplete,
    canConfirm,
    canEdit,
    canWriteClock,
    resultRows,
    clockStateOf,
    reportRows,
    selectFile,
    runPreview,
    confirm,
    retryClock,
    downloadReport,
    reset,
    fieldErrorLabel,
    clockCodeLabel,
  };
};

export type UseEmployeeSync = ReturnType<typeof useEmployeeSync>;
