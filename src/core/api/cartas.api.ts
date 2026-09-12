/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de CartaResponsiva/TICItem/cartasApi ahora vive en
 * `@entities/carta` (arquitectura Feature-Sliced Design). Este archivo sólo
 * re-exporta los mismos símbolos bajo sus nombres originales para no romper
 * a los módulos que aún no se migraron. Código nuevo debe importar directo
 * de "@entities/carta", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/carta";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { cartasApi } from "@entities/carta";