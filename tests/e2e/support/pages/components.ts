import { expect, type Locator, type Page } from "@playwright/test";
import { route } from "../env";

/**
 * Helpers de los controles del kit `@axzydev/axzy_ui_system`.
 *
 * Aquí viven todos los selectores frágiles. `ITSearchSelect` no liga su
 * `<label>` con el input (no emite `htmlFor`/`id`), así que no hay
 * `getByLabel` que valga: se localiza por placeholder, que sí es único por
 * campo porque sale de i18n. Si algún día el kit expone `data-testid`, se
 * cambia aquí y ningún test se entera.
 */

/** Resuelve el `Page` dueño del ámbito (acepta `Page` o `Locator`). */
const pageOf = (scope: Page | Locator): Page =>
  typeof (scope as Locator).page === "function" ? (scope as Locator).page() : (scope as Page);

/**
 * Panel desplegable de `ITSearchSelect` / `ITMultiSelect`.
 *
 * Desde el kit 1.3.0 el panel se monta por **portal** en `document.body` (con
 * `position: fixed`), no dentro del control. Su scroller es `div.max-h-60`.
 * El locator se ancla a la raíz del documento para no depender de la
 * profundidad del input; `.last()` toma el panel más reciente si hubiera más de
 * uno abierto (p. ej. dos buscadores en la misma pantalla).
 */
export const searchPanel = (scope: Page | Locator): Locator =>
  pageOf(scope).locator("body > div:has(> div.max-h-60)").last();

/** Opciones clickeables del panel de un buscador (ya sin el `role` que no expone el kit). */
export const searchOptions = (scope: Page | Locator): Locator =>
  searchPanel(scope).locator("div.max-h-60 > div[class*='cursor-pointer']");

/**
 * Combobox con búsqueda: enfoca, filtra y elige una opción del desplegable.
 *
 * `opcion` acota cuál tomar cuando el filtro deja varias; si se omite, toma la
 * primera, que es lo natural cuando la búsqueda ya es única.
 */
export const selectInSearch = async (
  scope: Page | Locator,
  placeholder: string,
  search: string,
  option?: string | RegExp
): Promise<void> => {
  const input = scope.getByPlaceholder(placeholder);
  await input.click();
  await input.fill(search);

  const panel = searchPanel(scope);
  const candidate = option
    ? panel.getByText(option).first()
    : searchOptions(scope).first();

  await expect(candidate).toBeVisible();
  await candidate.click();

  // Al elegir, el control cierra y DESMONTA el panel portado.
  await expect(panel).toHaveCount(0);
};

const escapeRegex = (text: string): string => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Campo de `ITInput`, que sí liga label e id por `name`.
 *
 * El match es exacto a propósito: "Modelo" y "Nombre / Modelo" conviven en el
 * mismo formulario. El `*` de los campos requeridos vive dentro del `<label>`,
 * así que se contempla al final.
 */
export const field = (scope: Page | Locator, label: string | RegExp): Locator =>
  scope.getByLabel(
    typeof label === "string" ? new RegExp(`^\\s*${escapeRegex(label)}\\s*\\*?\\s*$`) : label
  );

/** Chips y badges que funcionan como botón (tipo de movimiento, condición). */
export const chip = (scope: Page | Locator, text: string | RegExp): Locator =>
  scope.getByRole("button").filter({ hasText: text });

/** Botón por su texto visible. */
export const button = (scope: Page | Locator, text: string | RegExp): Locator =>
  scope.getByRole("button", { name: text });

/** Espera el toast de confirmación de la app. */
export const waitForToast = async (page: Page, text: string | RegExp): Promise<void> => {
  await expect(page.getByText(text).first()).toBeVisible({ timeout: 15_000 });
};

/**
 * Navega a una ruta de la app con montaje limpio.
 *
 * La app usa `HashRouter`, así que ir de `#/a` a `#/b` es una navegación de
 * fragmento: no recarga el documento. Eso deja vivos los temporizadores de la
 * vista anterior —tras guardar, las pantallas hacen `setTimeout(navigate, 1s)`
 * para que se alcance a ver el toast— y ese `navigate` tardío desmontaría el
 * formulario al que acabamos de llegar. El `reload` corta esa herencia.
 */
export const goToRoute = async (page: Page, path: string): Promise<void> => {
  await page.goto(route(path));
  await page.reload();
};
