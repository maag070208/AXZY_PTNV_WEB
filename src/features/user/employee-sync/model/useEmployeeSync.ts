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
  type EmployeeSyncPendingCandidate,
  type EmployeeSyncPendingRow,
  type EmployeeSyncPreview,
  type EmployeeSyncReportRow,
} from "@entities/user";

/** Paso del asistente: subir el archivo, revisar lo que va a pasar, resultado. */
export type EmployeeSyncStep = "upload" | "review" | "done";

/** Pestaña del paso de revisión. */
export type EmployeeSyncTab = "altas" | "bajas" | "cambios" | "porResolver";

/** Lo que se puede editar de cada alta en pantalla (lo demás viene del Excel). */
export interface AltaDraft {
  /** Número de empleado del Excel; vacío = el alta queda sin número. */
  employeeNumber: string;
  /** Departamento resuelto; vacío = RH todavía no lo ha elegido. */
  departmentId: string;
  username: string;
  password: string;
  jobTitle: string;
  scheduleId: string;
}

/**
 * Borradores por `rowKey` (identidad única `hoja:renglón` de la API). No se
 * indexa por `row`: el número de renglón se repite entre hojas del Excel.
 */
export type AltaDrafts = Record<string, AltaDraft>;

/** Fila de "Por resolver" ya resuelta en pantalla (sin editar el Excel). */
export interface EmployeeSyncResolvedPending {
  rowKey: string;
  row: number;
  name: string | null;
  employeeNumber: string | null;
  kind: "linked" | "converted";
  /** Persona del sistema a la que se vinculó (solo `linked`). */
  userId?: string;
  userName?: string;
  /** Departamento con el que pasó a altas (solo `converted`). */
  departmentName?: string;
  /** Candidatos de la fila, para poder cambiar la vinculación. */
  candidates: EmployeeSyncPendingCandidate[];
}

/** Fila del reporte final: una persona con lo que quedó en sistema y reloj. */
export interface EmployeeSyncResultRow {
  key: string;
  userId: string;
  name: string;
  employeeNumber?: string | null;
  kind: "created" | "deactivated" | "updated";
  /** El reloj se toca solo en altas y bajas (los cambios son solo del sistema). */
  clockApplies: boolean;
  clock?: EmployeeSyncClockResult;
}

/** Códigos de error por fila con texto propio; el resto se muestra crudo. */
const FIELD_ERROR_KEYS = {
  USERNAME_TAKEN: "sync.fieldErrors.USERNAME_TAKEN",
  USERNAME_MIN_LENGTH: "sync.fieldErrors.USERNAME_MIN_LENGTH",
  PASSWORD_MIN_LENGTH: "sync.fieldErrors.PASSWORD_MIN_LENGTH",
  EMPLOYEE_NUMBER_TAKEN: "sync.fieldErrors.EMPLOYEE_NUMBER_TAKEN",
  INVALID_EMPLOYEE_NUMBER: "sync.fieldErrors.INVALID_EMPLOYEE_NUMBER",
  MISSING_EMPLOYEE_NUMBER: "sync.fieldErrors.MISSING_EMPLOYEE_NUMBER",
  DUPLICATE_EMPLOYEE_NUMBER: "sync.fieldErrors.DUPLICATE_EMPLOYEE_NUMBER",
  MISSING_NAME: "sync.fieldErrors.MISSING_NAME",
  DEPARTMENT_NOT_FOUND: "sync.fieldErrors.DEPARTMENT_NOT_FOUND",
  INVALID_SCHEDULE: "sync.fieldErrors.INVALID_SCHEDULE",
  USER_NOT_FOUND: "sync.fieldErrors.USER_NOT_FOUND",
  USER_ALREADY_DEACTIVATED: "sync.fieldErrors.USER_ALREADY_DEACTIVATED",
  USER_SYNC_ADMIN_PROTECTED: "sync.fieldErrors.USER_SYNC_ADMIN_PROTECTED",
  CANNOT_DEACTIVATE_SELF: "sync.fieldErrors.CANNOT_DEACTIVATE_SELF",
  DUPLICATE_RECORD: "sync.fieldErrors.DUPLICATE_RECORD",
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

/** Nombre comparable sin importar el orden ("APELLIDOS NOMBRE" vs "Nombre Apellidos"). */
const nameWordsKey = (value: string): string =>
  normalizeName(value).split(" ").filter(Boolean).sort().join(" ");

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
  /** Sube con cada preview cargado: fuerza a las tablas client-side a re-pedir datos. */
  const [previewVersion, setPreviewVersion] = useState(0);
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
  /** Filas por resolver vinculadas a una persona del sistema (rowKey → userId). */
  const [linkedPending, setLinkedPending] = useState<Record<string, string>>({});
  /** Filas por resolver convertidas en alta (por `rowKey`). */
  const [convertedRows, setConvertedRows] = useState<Set<string>>(new Set());
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

  const departmentOptions = useMemo(
    () => [
      { value: "", label: tt("sync.altas.chooseDepartment") },
      ...departments
        .filter((department) => department.active)
        .map((department) => ({ value: department.id, label: department.name })),
    ],
    [departments, tt]
  );

  /** Filas por resolver que todavía no se resolvieron en pantalla. */
  const pendingRows = useMemo<EmployeeSyncPendingRow[]>(
    () =>
      (preview?.porResolver ?? []).filter(
        (row) => !convertedRows.has(row.rowKey) && linkedPending[row.rowKey] === undefined
      ),
    [preview, convertedRows, linkedPending]
  );

  /**
   * Altas de la pantalla: las del Excel más las filas de "Por resolver" que RH
   * convirtió en alta. Se ordenan por la posición de nómina del archivo.
   */
  const altas = useMemo<EmployeeSyncAltaRow[]>(() => {
    const converted = (preview?.porResolver ?? [])
      .filter((row) => convertedRows.has(row.rowKey))
      .map((row) => {
        const draft = drafts[row.rowKey];
        const department = departments.find(
          (item) => item.id === (draft?.departmentId ?? row.departmentId)
        );
        return {
          rowKey: row.rowKey,
          row: row.row,
          employeeNumber: draft?.employeeNumber ?? "",
          employeeNumberGenerated: true,
          name: row.name ?? "",
          departmentName: department?.name ?? row.departmentName ?? "",
          departmentId: department?.id ?? row.departmentId ?? null,
          jobTitle: null,
          payrollType: null,
          scheduleName: null,
          scheduleId: null,
          scheduleWarning: null,
          payrollOrder: row.payrollOrder,
          proposedUsername: row.proposedUsername,
          proposedPassword: row.proposedPassword,
        } satisfies EmployeeSyncAltaRow;
      });
    return [...(preview?.altas ?? []), ...converted].sort(
      (a, b) => a.payrollOrder - b.payrollOrder
    );
  }, [preview, convertedRows, drafts, departments]);

  /** Filas resueltas, con lo necesario para mostrarlas y poder deshacer. */
  const resolvedPending = useMemo<EmployeeSyncResolvedPending[]>(() => {
    const resolved: EmployeeSyncResolvedPending[] = [];
    for (const row of preview?.porResolver ?? []) {
      const candidates = row.candidates ?? [];
      const userId = linkedPending[row.rowKey];
      if (userId) {
        const candidate = candidates.find((item) => item.userId === userId);
        resolved.push({
          rowKey: row.rowKey,
          row: row.row,
          name: row.name,
          employeeNumber: row.employeeNumber,
          kind: "linked",
          userId,
          userName: candidate?.name ?? "",
          candidates,
        });
        continue;
      }
      if (convertedRows.has(row.rowKey)) {
        const draft = drafts[row.rowKey];
        const department = departments.find((item) => item.id === draft?.departmentId);
        resolved.push({
          rowKey: row.rowKey,
          row: row.row,
          name: row.name,
          employeeNumber: row.employeeNumber,
          kind: "converted",
          departmentName: department?.name ?? row.departmentName ?? "",
          candidates,
        });
      }
    }
    return resolved;
  }, [preview, linkedPending, convertedRows, drafts, departments]);

  /**
   * Vincula una fila por resolver con una persona del sistema. Esa persona
   * aparece en el Excel, así que se excluye de las bajas propuestas (no tiene
   * sentido darla de baja y a la vez marcar su orden de nómina).
   */
  const linkPending = useCallback((rowKey: string, userId: string) => {
    if (!userId) return;
    setLinkedPending((current) => ({ ...current, [rowKey]: userId }));
    setExcludedBajas((current) => new Set(current).add(userId));
  }, []);

  /** Deshace la resolución de una fila (vinculación o paso a altas). */
  const undoPending = useCallback((rowKey: string) => {
    setLinkedPending((current) => {
      if (current[rowKey] === undefined) return current;
      const next = { ...current };
      delete next[rowKey];
      return next;
    });
    setConvertedRows((current) => {
      if (!current.has(rowKey)) return current;
      const next = new Set(current);
      next.delete(rowKey);
      return next;
    });
    setDrafts((current) => {
      if (current[rowKey] === undefined) return current;
      const next = { ...current };
      delete next[rowKey];
      return next;
    });
  }, []);

  /**
   * Convierte una fila por resolver en alta (persona nueva): crea su borrador
   * con usuario/contraseña propuestos y el departamento elegido, y la deja en
   * la pestaña Altas con número vacío (la API lo genera).
   */
  const convertPendingToAlta = useCallback(
    (rowKey: string, departmentId: string) => {
      const target = preview?.porResolver.find((item) => item.rowKey === rowKey);
      if (!target || !departmentId) return;
      setLinkedPending((current) => {
        if (current[rowKey] === undefined) return current;
        const next = { ...current };
        delete next[rowKey];
        return next;
      });
      setConvertedRows((current) => {
        const next = new Set(current);
        next.add(rowKey);
        return next;
      });
      setDrafts((current) => ({
        ...current,
        [rowKey]: {
          employeeNumber: "",
          departmentId,
          username: target.proposedUsername ?? "",
          password: target.proposedPassword ?? "",
          jobTitle: "",
          scheduleId: "",
        },
      }));
      setStep2Tab("altas");
    },
    [preview]
  );

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
    setLinkedPending({});
    setConvertedRows(new Set());
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
    setLinkedPending({});
    setConvertedRows(new Set());
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
      setPreviewVersion((version) => version + 1);
      setStep("review");
      setStep2Tab("altas");
      setExcludedBajas(new Set());
      setIncludeChanges(false);
      setLinkedPending({});
      setConvertedRows(new Set());
      setDrafts(
        Object.fromEntries(
          data.altas.map((alta: EmployeeSyncAltaRow) => [
            alta.rowKey,
            {
              employeeNumber: alta.employeeNumber ?? "",
              departmentId: alta.departmentId ?? "",
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

  /** Quita los errores por fila del último intento. */
  const clearRowErrors = useCallback(() => setRowErrors([]), []);

  /** Edita un campo de una alta (por `rowKey`, no por número de renglón). */
  const setDraft = useCallback((rowKey: string, patch: Partial<AltaDraft>) => {
    setDrafts((current) => ({
      ...current,
      [rowKey]: {
        employeeNumber: current[rowKey]?.employeeNumber ?? "",
        departmentId: current[rowKey]?.departmentId ?? "",
        username: current[rowKey]?.username ?? "",
        password: current[rowKey]?.password ?? "",
        jobTitle: current[rowKey]?.jobTitle ?? "",
        scheduleId: current[rowKey]?.scheduleId ?? "",
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
    const created = altas.length;
    const deactivated = Math.max((preview?.bajas.length ?? 0) - excludedBajas.size, 0);
    const updated = includeChanges ? preview?.cambios.length ?? 0 : 0;
    return { created, deactivated, updated, total: created + deactivated + updated };
  }, [altas, preview, excludedBajas, includeChanges]);

  /**
   * Ninguna alta puede quedar sin usuario, contraseña o departamento. El número
   * no hace falta: si va vacío, la API lo genera.
   */
  const altasIncomplete = useMemo(
    () =>
      altas.some((alta) => {
        const draft = drafts[alta.rowKey];
        return !draft || !draft.username.trim() || !draft.password || !draft.departmentId;
      }),
    [altas, drafts]
  );

  const canConfirm =
    canEdit && !!preview && !confirming && !loading && selection.total > 0 && !altasIncomplete;

  /** Cuerpo de la confirmación: exactamente lo revisado en pantalla. */
  const buildPayload = useCallback(() => {
    if (!preview) return null;
    const altasPayload = altas.map((alta) => {
      const draft = drafts[alta.rowKey];
      const employeeNumber = draft?.employeeNumber.trim() ?? "";
      return {
        rowKey: alta.rowKey,
        row: alta.row,
        // Vacío = la API genera el número (altas convertidas desde pendientes).
        ...(employeeNumber ? { employeeNumber } : {}),
        name: alta.name,
        departmentId: draft?.departmentId ?? alta.departmentId ?? "",
        jobTitle: draft?.jobTitle.trim() || undefined,
        username: draft?.username.trim() ?? "",
        password: draft?.password ?? "",
        scheduleId: draft?.scheduleId || undefined,
        // Orden de nómina del Excel: la API lo usa para la pre-nómina.
        payrollOrder: alta.payrollOrder,
      };
    });
    // Orden de nómina: el del sistema más las vinculaciones hechas en pantalla.
    const orderByUser = new Map((preview.order ?? []).map((entry) => [entry.userId, entry.payrollOrder]));
    for (const [rowKey, userId] of Object.entries(linkedPending)) {
      const row = preview.porResolver.find((item) => item.rowKey === rowKey);
      if (row) orderByUser.set(userId, row.payrollOrder);
    }
    const order = [...orderByUser.entries()].map(([userId, payrollOrder]) => ({ userId, payrollOrder }));
    const bajas = preview.bajas
      .filter((baja) => !excludedBajas.has(baja.userId))
      .map((baja) => ({ userId: baja.userId }));
    const cambios = includeChanges
      ? preview.cambios.map((cambio) => {
          // El nombre del Excel viene "APELLIDOS NOMBRE(S)" y el del sistema en
          // orden de la app: si solo cambia el orden, NO se reescribe (mismo
          // juego de palabras). Solo se manda cuando de verdad cambió.
          const nameChanged =
            nameWordsKey(cambio.excelName) !== nameWordsKey(cambio.currentName);
          return {
            userId: cambio.userId,
            ...(nameChanged ? { name: cambio.excelName } : {}),
            // El preview trae el nombre del departamento, no su id: se resuelve
            // contra el catálogo. Si no se resuelve, el departamento no cambia.
            departmentId:
              departmentIdByName.get(normalizeName(cambio.excelDepartmentName ?? "")) ?? undefined,
          };
        })
      : undefined;
    return { altas: altasPayload, bajas, cambios, order };
  }, [preview, altas, drafts, excludedBajas, includeChanges, departmentIdByName, linkedPending]);

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
      // El cliente HTTP guarda el cuerpo completo del error en `details`; el
      // detalle por fila del 422 viaja dentro de `details.rows` a su vez.
      const apiError = caught as {
        message?: string;
        code?: string;
        details?: {
          rows?: EmployeeSyncInvalidRow[];
          details?: { rows?: EmployeeSyncInvalidRow[] };
        };
      };
      const rows = apiError.details?.details?.rows ?? apiError.details?.rows ?? [];
      if (apiError.code === "USER_SYNC_INVALID_ROWS" && rows.length > 0) {
        // El detalle se pinta una sola vez (en el aviso del paso y en la fila).
        setRowErrors(rows);
        // Abre la pestaña donde está la primera fila con error.
        const bajaWithError = rows.some(
          (row) => row.userId && preview?.bajas.some((baja) => baja.userId === row.userId)
        );
        const cambioWithError = rows.some(
          (row) => row.userId && preview?.cambios.some((cambio) => cambio.userId === row.userId)
        );
        if (rows.some((row) => row.rowKey !== undefined || row.row !== undefined)) {
          setStep2Tab("altas");
        }
        else if (bajaWithError) setStep2Tab("bajas");
        else if (cambioWithError) setStep2Tab("cambios");
      } else {
        setError(messageOf(caught, tt("sync.errors.confirm")));
      }
    } finally {
      setConfirming(false);
    }
  }, [buildPayload, canConfirm, preview, tt]);

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
    /** Departamento revisado en la pantalla (el resultado no lo repite). */
    const departmentOf = (row: EmployeeSyncResultRow): string | undefined => {
      if (!preview) return undefined;
      if (row.kind === "created") {
        // El alta sin número se localiza por nombre (puede haber varias sin número).
        const alta = altas.find(
          (candidate) =>
            (row.employeeNumber && candidate.employeeNumber === row.employeeNumber) ||
            (!row.employeeNumber && !candidate.employeeNumber && candidate.name === row.name)
        );
        if (!alta) return undefined;
        // Vale el departamento que RH eligió en pantalla, no solo el del Excel.
        const chosen = departments.find(
          (department) => department.id === drafts[alta.rowKey]?.departmentId
        );
        if (chosen) return chosen.name;
        const excelName = alta.departmentName ?? "";
        const excelId = departmentIdByName.get(normalizeName(excelName));
        const fromCatalog = departments.find((department) => department.id === excelId);
        return fromCatalog?.name ?? (excelName || undefined);
      }
      if (row.kind === "deactivated") {
        return (
          preview.bajas.find((baja) => baja.userId === row.userId)?.departmentName ??
          undefined
        );
      }
      return (
        preview.cambios.find((cambio) => cambio.userId === row.userId)
          ?.currentDepartmentName ?? undefined
      );
    };
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
        employeeNumber: row.employeeNumber ?? undefined,
        name: row.name,
        department: departmentOf(row),
        system,
        clock,
      };
    });
  }, [result, resultRows, clockStateOf, tt, preview, altas, drafts, departments, departmentIdByName]);

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
    previewVersion,
    counts,
    altas,
    pendingRows,
    resolvedPending,
    result,
    loading,
    confirming,
    exporting,
    retrying,
    error,
    setError,
    rowErrors,
    clearRowErrors,
    step2Tab,
    setStep2Tab,
    drafts,
    setDraft,
    scheduleOptions,
    departmentOptions,
    excludedBajas,
    toggleBaja,
    includeChanges,
    setIncludeChanges,
    linkPending,
    undoPending,
    convertPendingToAlta,
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
