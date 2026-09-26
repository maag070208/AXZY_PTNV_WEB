import { test, expect } from "./support/fixtures";
import { irARuta } from "./support/pages/componentes";
import { E2E } from "./support/env";
import type { ApiInventario, Usuario } from "./support/api";

/**
 * Duplicación visual en el card "Información Personal" del detalle de empleado.
 *
 * `CollapsibleCard` ya pinta el título en su encabezado; los `SectionBlock`
 * internos lo repetían junto con un ícono. La corrección fue eliminar el
 * `SectionBlock` y dejar solo los `ITGrid` de cada grupo, separados por
 * `ITDivider`. Aquí blindamos el contrato:
 *
 *  - el texto del encabezado aparece UNA sola vez dentro del card,
 *  - hay 3 separadores entre los 4 grupos,
 *  - hay 4 grupos de campos (`ITGrid` containers).
 */

const empleadoPorUsername = async (api: ApiInventario, username: string): Promise<Usuario> => {
  const usuarios = await api.usuarios();
  const usuario = usuarios.find((u) => u.username === username);
  expect(usuario, `el usuario ${username} debe existir (auth.setup lo provisiona)`).toBeDefined();
  return usuario!;
};

test.describe("Detalle de empleado — card de Información Personal", () => {
  test("no duplica el título del card: encabezado único + 3 separadores + 4 grupos", async ({
    page,
    api,
  }) => {
    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);

    // Localiza el card por el botón-encabezado de "Información Personal".
    const encabezado = page.getByRole("button", {
      name: /Información Personal/i,
    });
    await expect(encabezado).toBeVisible();

    // Sube al card raíz (la `CollapsibleCard` envuelve todo en un <div> con
    // clases de card). El header es el botón clickeable; su padre directo es
    // el contenedor del card completo.
    const card = encabezado.locator("xpath=..");

    // El título debe aparecer UNA sola vez dentro del card (solo el encabezado,
    // no debe quedar el duplicado del antiguo `SectionBlock`).
    await expect(card.getByText(/Información Personal/i)).toHaveCount(1);

    // 3 separadores (`ITDivider` por defecto = `div.h-px.bg-slate-200`).
    // El componente renderiza uno entre cada par de grupos; con 4 grupos hay
    // 3 separadores.
    await expect(card.locator("div.h-px.bg-slate-200")).toHaveCount(3);

    // 4 grupos = 4 `ITGrid` containers con `grid grid-cols-12`.
    await expect(card.locator("div.grid.grid-cols-12")).toHaveCount(4);
  });

  test("regresión: los 4 grupos siguen exponiendo al menos un campo esperado", async ({
    page,
    api,
  }) => {
    const admin = await empleadoPorUsername(api, E2E.admin.username);

    await irARuta(page, `/empleados/${admin.id}`);

    const encabezado = page.getByRole("button", { name: /Información Personal/i });
    const card = encabezado.locator("xpath=..");
    await expect(encabezado).toBeVisible();

    // Un campo representante de cada grupo debe seguir visible.
    // Las etiquetas salen de i18n (`detail.fields.<key>`); los nombres usados
    // abajo son las que pinta la versión `es` por defecto del seed.
    await expect(card.getByText("Número de empleado")).toBeVisible();
    await expect(card.getByText("RFC")).toBeVisible();
    await expect(card.getByText("Celular personal")).toBeVisible();
    await expect(card.getByText("Calle y número")).toBeVisible();
  });
});