import type { ClientFields } from "@shared/api/clientTable";
import type {
  EmployeeSyncAltaRow,
  EmployeeSyncBajaRow,
  EmployeeSyncCambioRow,
} from "@entities/user";
import type { AltaDraft } from "./useEmployeeSync";


/**
 * Estado de una alta tal como lo ve la tabla de revisión: ya con lo editado en
 * pantalla (usuario, contraseña, departamento) y con los errores del 422.
 */
export type AltaStatus = "ready" | "missingCredentials" | "missingDepartment" | "error";

/** Fila de altas con lo que la tabla necesita para filtrar y ordenar. */
export interface AltaTableRow extends EmployeeSyncAltaRow {
  /** Borrador vigente de la fila (usuario, contraseña, número, departamento…). */
  draft: AltaDraft | null;
  /** Departamento efectivo: el resuelto del Excel o el que eligió RH. */
  departmentLabel: string;
  /** Horario efectivo (etiqueta del catálogo) para ordenar por nombre. */
  scheduleLabel: string;
  status: AltaStatus;
}

/** Fila de bajas con la casilla "Incluir" y el estado de sus errores. */
export interface BajaTableRow extends EmployeeSyncBajaRow {
  included: boolean;
  status: "ok" | "error";
}

/** Fila de cambios con el estado de sus errores. */
export interface CambioTableRow extends EmployeeSyncCambioRow {
  status: "ok" | "error";
}

/** Estado de una alta a partir del borrador y de los errores del 422. */
export const altaStatusOf = (draft: AltaDraft | null, errorCount: number): AltaStatus => {
  if (errorCount > 0) return "error";
  if (!draft || !draft.username.trim() || !draft.password) return "missingCredentials";
  if (!draft.departmentId) return "missingDepartment";
  return "ready";
};

/**
 * Cómo filtra y ordena cada columna de las tablas del paso de revisión. Lo usan
 * las cuatro pestañas con `makeClientTableFetch`; las columnas calculadas
 * (`status`) y los valores editados en pantalla tienen su `value` propio para
 * que el filtro coincida con lo que se ve.
 */
export const altaFields: ClientFields<AltaTableRow> = {
  row: { value: (row) => row.row },
  employeeNumber: { value: (row) => row.draft?.employeeNumber ?? "" },
  name: { value: (row) => row.name },
  departmentName: { value: (row) => row.departmentLabel, sortValue: (row) => row.departmentLabel },
  jobTitle: { value: (row) => row.draft?.jobTitle ?? "" },
  username: { value: (row) => row.draft?.username ?? "" },
  password: { value: (row) => row.draft?.password ?? "" },
  scheduleId: {
    value: (row) => row.draft?.scheduleId ?? "",
    match: "equals",
    sortValue: (row) => row.scheduleLabel,
  },
  status: { value: (row) => row.status, match: "equals" },
  /** Filtros de la barra: búsqueda general y departamento efectivo. */
  search: {
    value: (row) =>
      [
        row.name,
        row.payrollType ?? "",
        row.departmentLabel,
        row.draft?.employeeNumber ?? "",
        row.draft?.username ?? "",
        row.draft?.jobTitle ?? "",
        `fila ${row.row}`,
      ].join(" "),
  },
  departmentFilter: { value: (row) => row.draft?.departmentId ?? "", match: "equals" },
};

export const bajaFields: ClientFields<BajaTableRow> = {
  employeeNumber: { value: (row) => row.employeeNumber ?? "" },
  name: { value: (row) => row.name },
  departmentName: { value: (row) => row.departmentName ?? "" },
  jobTitle: { value: (row) => row.jobTitle ?? "" },
  linkedToClock: { value: (row) => row.linkedToClock, match: "equals" },
  status: { value: (row) => row.status, match: "equals" },
  search: {
    value: (row) =>
      [row.name, row.employeeNumber ?? "", row.departmentName ?? "", row.jobTitle ?? ""].join(" "),
  },
  departmentFilter: { value: (row) => row.departmentName ?? "", match: "equals" },
};

export const cambioFields: ClientFields<CambioTableRow> = {
  employeeNumber: { value: (row) => row.employeeNumber ?? "" },
  currentEmployeeNumber: { value: (row) => row.currentEmployeeNumber ?? "" },
  excelName: { value: (row) => row.excelName },
  currentName: { value: (row) => row.currentName },
  excelDepartmentName: { value: (row) => row.excelDepartmentName },
  currentDepartmentName: { value: (row) => row.currentDepartmentName ?? "" },
  status: { value: (row) => row.status, match: "equals" },
  search: {
    value: (row) =>
      [
        row.employeeNumber ?? "",
        row.currentEmployeeNumber ?? "",
        row.excelName,
        row.currentName,
        row.excelDepartmentName,
        row.currentDepartmentName ?? "",
      ].join(" "),
  },
  departmentFilter: { value: (row) => row.excelDepartmentName, match: "equals" },
};
