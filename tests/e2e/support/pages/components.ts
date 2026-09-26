import { expect, type Locator, type Page } from "@playwright/test";
import { ruta } from "../env";

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
const paginaDe = (ambito: Page | Locator): Page =>
  typeof (ambito as Locator).page === "function" ? (ambito as Locator).page() : (ambito as Page);

/**
 * Panel desplegable de `ITSearchSelect` / `ITMultiSelect`.
 *
 * Desde el kit 1.3.0 el panel se monta por **portal** en `document.body` (con
 * `position: fixed`), no dentro del control. Su scroller es `div.max-h-60`.
 * El locator se ancla a la raíz del documento para no depender de la
 * profundidad del input; `.last()` toma el panel más reciente si hubiera más de
 * uno abierto (p. ej. dos buscadores en la misma pantalla).
 */
export const panelBuscador = (ambito: Page | Locator): Locator =>
  paginaDe(ambito).locator("body > div:has(> div.max-h-60)").last();

/** Opciones clickeables del panel de un buscador (ya sin el `role` que no expone el kit). */
export const opcionesBuscador = (ambito: Page | Locator): Locator =>
  panelBuscador(ambito).locator("div.max-h-60 > div[class*='cursor-pointer']");

/**
 * Combobox con búsqueda: enfoca, filtra y elige una opción del desplegable.
 *
 * `opcion` acota cuál tomar cuando el filtro deja varias; si se omite, toma la
 * primera, que es lo natural cuando la búsqueda ya es única.
 */
export const elegirEnBuscador = async (
  ambito: Page | Locator,
  placeholder: string,
  busqueda: string,
  opcion?: string | RegExp
): Promise<void> => {
  const input = ambito.getByPlaceholder(placeholder);
  await input.click();
  await input.fill(busqueda);

  const panel = panelBuscador(ambito);
  const candidata = opcion
    ? panel.getByText(opcion).first()
    : opcionesBuscador(ambito).first();

  await expect(candidata).toBeVisible();
  await candidata.click();

  // Al elegir, el control cierra y DESMONTA el panel portado.
  await expect(panel).toHaveCount(0);
};

const escaparRegex = (texto: string): string => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Campo de `ITInput`, que sí liga label e id por `name`.
 *
 * El match es exacto a propósito: "Modelo" y "Nombre / Modelo" conviven en el
 * mismo formulario. El `*` de los campos requeridos vive dentro del `<label>`,
 * así que se contempla al final.
 */
export const campo = (ambito: Page | Locator, label: string | RegExp): Locator =>
  ambito.getByLabel(
    typeof label === "string" ? new RegExp(`^\\s*${escaparRegex(label)}\\s*\\*?\\s*$`) : label
  );

/** Chips y badges que funcionan como botón (tipo de movimiento, condición). */
export const chip = (ambito: Page | Locator, texto: string | RegExp): Locator =>
  ambito.getByRole("button").filter({ hasText: texto });

/** Botón por su texto visible. */
export const boton = (ambito: Page | Locator, texto: string | RegExp): Locator =>
  ambito.getByRole("button", { name: texto });

/** Espera el toast de confirmación de la app. */
export const esperarToast = async (page: Page, texto: string | RegExp): Promise<void> => {
  await expect(page.getByText(texto).first()).toBeVisible({ timeout: 15_000 });
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
export const irARuta = async (page: Page, path: string): Promise<void> => {
  await page.goto(ruta(path));
  await page.reload();
};
