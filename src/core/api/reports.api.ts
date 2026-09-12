/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de los reportes ahora vive en `@entities/report`
 * (arquitectura Feature-Sliced Design). Este archivo sólo re-exporta los
 * mismos símbolos bajo sus nombres originales para no romper a los módulos
 * que aún no se migraron. Código nuevo debe importar directo de
 * "@entities/report", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/report";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { reportsApi } from "@entities/report";