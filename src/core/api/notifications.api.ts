/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de Notification/notificationsApi ahora vive en
 * `@entities/notification` (arquitectura Feature-Sliced Design). Este
 * archivo sólo re-exporta los mismos símbolos bajo sus nombres originales
 * para no romper a los módulos que aún no se migraron. Código nuevo debe
 * importar directo de "@entities/notification", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/notification";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { notificationsApi } from "@entities/notification";