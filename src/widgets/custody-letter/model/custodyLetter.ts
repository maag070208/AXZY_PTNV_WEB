import type { Loan } from "@entities/inventory";

/**
 * Área que se imprime en el bloque "Recurso TIC:" de la carta responsiva.
 *
 * Deriva, en orden de precedencia: el departamento del préstamo (modo
 * DEPARTAMENTO), el departamento del responsable (modo PERSONAL) y, si el
 * empleado no tiene departamento, "Sistemas". Se quita el prefijo
 * "Departamento de " y no se fuerzan mayúsculas (el estilo de cada plantilla
 * se encarga).
 */
export const resolveAreaName = (loan: Loan): string =>
  (loan.department?.name || loan.custodian?.department?.name || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );
