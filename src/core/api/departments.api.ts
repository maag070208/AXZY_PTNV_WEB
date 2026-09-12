/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de Department/Subarea ahora vive en
 * `@entities/department` (arquitectura Feature-Sliced Design). Este
 * archivo sólo re-exporta los mismos símbolos bajo sus nombres originales
 * para no romper a los módulos que aún no se migraron. Código nuevo debe
 * importar directo de "@entities/department", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/department";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { departmentsApi } from "@entities/department";