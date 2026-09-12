/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de los tipos de cartas (CartaResponsiva, TICItem,
 * ITDeviceSummary, Firmante, emptyTICItem) ahora vive en `@entities/carta`
 * (arquitectura Feature-Sliced Design). Este archivo sólo re-exporta esos
 * mismos símbolos para no romper los módulos que aún no se migraron.
 * Código nuevo debe importar directo de "@entities/carta", nunca de aquí.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/carta";