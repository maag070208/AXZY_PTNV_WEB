import type { Loan } from "@entities/inventory";
import { i18n } from "@shared/i18n";

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
  (loan.department?.name || loan.custodian?.department?.name || i18n.t("custody-letters:doc.defaultArea")).replace(
    /^Departamento de /i,
    ""
  );

const joinDistinct = (values: Array<string | null | undefined>): string =>
  [...new Set(values.map((v) => v?.trim()).filter((v): v is string => !!v))].join(", ");

/**
 * Datos de las unidades físicas de la carta: TODAS las piezas de todos sus
 * renglones (también las ya devueltas: la carta documenta lo que se entregó).
 * Cada campo junta los valores distintos separados por coma; vacío si ninguna
 * unidad lo tiene. El número de serie sale siempre que la unidad lo tenga,
 * sin importar la configuración del tipo.
 */
export const letterUnitDetails = (loan: Loan) => {
  const units = (loan.items ?? [])
    .flatMap((item) => item.units ?? [])
    .map((u) => u.deviceUnit)
    .filter(Boolean)
    .sort((a, b) => a.assetTag.localeCompare(b.assetTag));
  return {
    /** Unidades en orden de activo fijo: con más de una, la carta imprime la relación. */
    units,
    assetTags: joinDistinct(units.map((u) => u.assetTag)),
    serialNumbers: joinDistinct(units.map((u) => u.serialNumber)),
    hostnames: joinDistinct(units.map((u) => u.hostname)),
    /** Si alguna unidad tiene nombre de equipo (la relación agrega esa columna). */
    anyHostname: units.some((u) => !!u.hostname?.trim()),
  };
};
