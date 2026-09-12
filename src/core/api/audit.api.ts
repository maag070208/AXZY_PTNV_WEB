/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de AuditLog/auditApi ahora vive en `@entities/audit-log`
 * (arquitectura Feature-Sliced Design). Este archivo sólo re-exporta los
 * mismos símbolos bajo sus nombres originales para no romper a los módulos
 * que aún no se migraron. Código nuevo debe importar directo de
 * "@entities/audit-log", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/audit-log";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { auditApi } from "@entities/audit-log";