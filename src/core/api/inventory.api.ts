/**
 * @deprecated Shim de compatibilidad.
 *
 * La fuente de verdad de InventoryMovement/inventoryApi ahora vive en
 * `@entities/inventory-movement` (arquitectura Feature-Sliced Design). Este
 * archivo sólo re-exporta los mismos símbolos bajo sus nombres originales
 * para no romper a los módulos que aún no se migraron. Código nuevo debe
 * importar directo de "@entities/inventory-movement", nunca de este archivo.
 */
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export * from "@entities/inventory-movement";
// eslint-disable-next-line boundaries/dependencies -- shim legacy, ver comentario del archivo
export { inventoryApi } from "@entities/inventory-movement";