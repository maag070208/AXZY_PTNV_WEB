import type { Prestamo } from "@entities/inventario";

/**
 * Área que se imprime en el bloque "Recurso TIC:" de la carta responsiva.
 *
 * Deriva, en orden de precedencia: el departamento del préstamo (modo
 * DEPARTAMENTO), el departamento del responsable (modo PERSONAL) y, si el
 * empleado no tiene departamento, "Sistemas". Se quita el prefijo
 * "Departamento de " y no se fuerzan mayúsculas (el estilo de cada plantilla
 * se encarga).
 */
export const resolveAreaName = (prestamo: Prestamo): string =>
  (prestamo.departamento?.name || prestamo.responsable?.department?.name || "Sistemas").replace(
    /^Departamento de /i,
    ""
  );
