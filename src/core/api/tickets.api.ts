/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de Ticket/ticketsApi ahora vive en `@entities/ticket`
 * (arquitectura Feature-Sliced Design). Este archivo sólo re-exporta los
 * mismos símbolos bajo sus nombres originales para no romper a los módulos
 * que aún no se migraron. Código nuevo debe importar directo de
 * "@entities/ticket", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/ticket";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { ticketsApi } from "@entities/ticket";