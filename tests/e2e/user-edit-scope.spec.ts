import { test, expect, type Page } from "./support/fixtures";
import { goToRoute } from "./support/pages/components";
import { E2E, route } from "./support/env";
import type { ApiInventory, User } from "./support/api";

/**
 * Reparto de la edición de una persona entre sus DOS pantallas.
 *
 * El sistema guarda a la persona y su cuenta en la misma tabla, así que había
 * dos formularios editando los mismos campos (nombre, apellidos, correo, número
 * de empleado, puesto) y no se sabía cuál mandaba. El contrato ahora es:
 *
 *  - `/employees/:id/edit` (Personal) es el dueño de los datos de la PERSONA:
 *    nombre completo, correo, nº de empleado, puesto, domicilio, fiscales y
 *    médicos.
 *  - `/users/:id/edit` (Usuarios) edita la CUENTA en un DIÁLOGO sobre la lista:
 *    usuario, contraseña, roles, departamento y subárea.
 *  - Una cuenta de personal (rol `staff`) no vuelve a pedir aquí los datos de la
 *    persona: el diálogo lo dice y ofrece el atajo a su expediente.
 *  - Una cuenta que no está en Personal (rol no `staff`) sí los edita aquí,
 *    porque no tiene otro lugar (y así no se queda sin poder corregirlos).
 */

const userByUsername = async (api: ApiInventory, username: string): Promise<User> => {
  const users = await api.users();
  const user = users.find((u) => u.username === username);
  expect(user, `el usuario ${username} debe existir (auth.setup lo provisiona)`).toBeDefined();
  return user!;
};

/** El asistente pide recorrer los pasos antes de que aparezca "Finalizar". */
const saveStepper = async (page: Page): Promise<void> => {
  for (let i = 0; i < 5; i++) {
    const next = page.getByRole("button", { name: "Siguiente" });
    if ((await next.count()) === 0) break;
    await next.click();
  }
  await page.getByRole("button", { name: "Finalizar" }).click();
};

test.describe("Edición de una persona — cuenta vs expediente", () => {
  test("editar un usuario abre un diálogo sobre la lista, sin los datos de la persona", async ({
    page,
    api,
  }) => {
    const employee = await userByUsername(api, E2E.employee.username);
    await goToRoute(page, `/users/${employee.id}/edit`);

    // Es un diálogo, no una pantalla: la lista sigue detrás.
    const dialog = page.locator('[data-it-dialog="true"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Editar usuario")).toBeVisible();

    // Los datos de la persona y los laborales NO se editan aquí.
    await expect(dialog.getByLabel(/Nombre \(primer\)/)).toHaveCount(0);
    await expect(dialog.getByRole("textbox", { name: /Apellido paterno/ })).toHaveCount(0);
    await expect(dialog.getByLabel(/^\s*Correo/)).toHaveCount(0);
    await expect(dialog.getByLabel(/Número de Empleado/i)).toHaveCount(0);
    await expect(dialog.getByLabel(/^\s*Puesto\s*$/)).toHaveCount(0);

    // Lo que sí es de la cuenta: acceso y organización.
    await expect(dialog.getByText("Acceso y permisos")).toBeVisible();
    await expect(dialog.getByText("Organización")).toBeVisible();
    await expect(dialog.getByLabel(/Username/i)).toBeVisible();

    // Y el atajo a donde viven esos datos.
    await expect(dialog.getByText(/se editan en su expediente de personal/)).toBeVisible();
    await dialog.getByRole("button", { name: "Abrir expediente" }).click();
    await page.waitForURL(`**${route(`/employees/${employee.id}/edit`)}`);
    await expect(page.getByRole("heading", { name: "Editar Información" })).toBeVisible();
  });

  test("el diálogo se cierra y la lista queda utilizable", async ({ page, api }) => {
    const employee = await userByUsername(api, E2E.employee.username);
    await goToRoute(page, `/users/${employee.id}/edit`);
    await expect(page.locator('[data-it-dialog="true"]')).toBeVisible();

    await page.getByRole("button", { name: "Cancelar" }).click();
    await page.waitForURL(`**${route("/users")}`);
    await expect(page.locator('[data-it-dialog="true"]')).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "Usuarios" })).toBeVisible();
  });

  test("una cuenta sin expediente sigue editando aquí sus datos personales", async ({
    page,
    api,
  }) => {
    // El guardia no es rol `staff`: no aparece en Personal.
    const guard = await userByUsername(api, E2E.guard.username);
    await goToRoute(page, `/users/${guard.id}/edit`);

    const dialog = page.locator('[data-it-dialog="true"]');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Información personal")).toBeVisible();
    await expect(dialog.getByRole("textbox", { name: /Apellido paterno/ })).toHaveValue("Guard");
    // Sin expediente no hay nada que mandar a otro lado.
    await expect(dialog.getByText(/se editan en su expediente de personal/)).toHaveCount(0);
  });

  test("el expediente edita nombre, número de empleado y puesto y los guarda", async ({
    page,
    api,
  }) => {
    const employee = await userByUsername(api, E2E.employee.username);
    const original = { name: employee.name, employeeNumber: employee.employeeNumber ?? "" };

    await goToRoute(page, `/employees/${employee.id}/edit`);

    // Paso 1: el nombre.
    const nameInput = page.getByLabel(/^\s*Nombre\(s\)/);
    await expect(nameInput).toHaveValue(original.name);
    const changed = `${original.name} X`;
    await nameInput.fill(changed);

    // Paso 2: los laborales, que también viven aquí ahora.
    await page.getByRole("button", { name: "Siguiente" }).click();
    const numberInput = page.getByLabel(/Número de Empleado/i);
    await expect(numberInput).toBeVisible();
    const changedNumber = `E2E-${Date.now().toString(36).toUpperCase()}`;
    await numberInput.fill(changedNumber);

    await saveStepper(page);
    await page.waitForURL(`**${route(`/employees/${employee.id}`)}`);

    // Verificado contra la API, no contra la pantalla.
    const updated = await userByUsername(api, E2E.employee.username);
    expect(updated.name).toBe(changed);
    expect(updated.employeeNumber).toBe(changedNumber);

    // Se restituye para no dejar cambiado lo que usan los demás tests.
    await goToRoute(page, `/employees/${employee.id}/edit`);
    // Esperar a que el perfil cargue ANTES de escribir: el formulario se llena
    // desde la API y pisaría lo que se escriba antes de tiempo.
    const restoreName = page.getByLabel(/^\s*Nombre\(s\)/);
    await expect(restoreName).toHaveValue(changed);
    await restoreName.fill(original.name);
    await page.getByRole("button", { name: "Siguiente" }).click();
    await page.getByLabel(/Número de Empleado/i).fill(original.employeeNumber);
    await saveStepper(page);
    await page.waitForURL(`**${route(`/employees/${employee.id}`)}`);
    const restored = await userByUsername(api, E2E.employee.username);
    expect(restored.name).toBe(original.name);
    // El formulario guarda vacío como `null`: se compara normalizado.
    expect(restored.employeeNumber ?? "").toBe(original.employeeNumber);
  });

  test("el expediente no deja guardar sin nombre y avisa en su paso", async ({ page, api }) => {
    const employee = await userByUsername(api, E2E.employee.username);
    const before = employee.name;

    await goToRoute(page, `/employees/${employee.id}/edit`);
    await page.getByLabel(/^\s*Nombre\(s\)/).fill("");
    await saveStepper(page);

    // El asistente vuelve al paso del campo con error, así que se ve el aviso.
    await expect(page.getByText(/es obligatorio/)).toBeVisible();
    expect((await userByUsername(api, E2E.employee.username)).name).toBe(before);
  });
});
