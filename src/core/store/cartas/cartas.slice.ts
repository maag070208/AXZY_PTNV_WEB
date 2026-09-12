/**
 * @deprecated Shim de compatibilidad.
 *
 * El slice de cartas ahora vive en
 * `@entities/carta/model/carta.slice` (arquitectura Feature-Sliced Design).
 * Este archivo sólo re-exporta los mismos símbolos bajo sus rutas originales
 * para no romper los módulos que aún no se migraron. Código nuevo debe
 * importar directo de la entity, nunca de aquí.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/carta/model/carta.slice";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { default } from "@entities/carta/model/carta.slice";