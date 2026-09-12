/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de User/Auth ahora vive en `@entities/user`
 * (arquitectura Feature-Sliced Design). Este archivo sólo re-exporta
 * los mismos símbolos bajo sus nombres originales para no romper a los
 * módulos que aún no se migraron. Código nuevo debe importar directo de
 * "@entities/user", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/user";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { authApi } from "@entities/user";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { usersApi } from "@entities/user";