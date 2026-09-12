/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de MaterialOutput/salidasApi ahora vive en
 * `@entities/salida` (arquitectura Feature-Sliced Design). Este archivo sólo
 * re-exporta los mismos símbolos bajo sus nombres originales para no romper
 * a los módulos que aún no se migraron. Código nuevo debe importar directo
 * de "@entities/salida", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/salida";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { salidasApi } from "@entities/salida";