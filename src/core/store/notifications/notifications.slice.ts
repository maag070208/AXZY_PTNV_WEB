/**
 * @deprecated Shim de compatibilidad.
 *
 * El slice de notifications ahora vive en
 * `@entities/notification/model/notification.slice` (arquitectura
 * Feature-Sliced Design). Este archivo sólo re-exporta los mismos símbolos
 * bajo sus rutas originales para no romper los módulos que aún no se
 * migraron. Código nuevo debe importar directo de la entity, nunca de aquí.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/notification/model/notification.slice";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { default } from "@entities/notification/model/notification.slice";