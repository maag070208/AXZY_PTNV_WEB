import { test, expect } from "./support/fixtures";
import { nuevoRunId, ruta } from "./support/env";

/**
 * Requerimiento del Área en la carta responsiva:
 *
 *  - REQ-B: el Área de la carta sale del departamento del responsable; si no
 *    tiene, cae a "Sistemas".
 *
 * Los usuarios se siembran por API y se borran al final; el inventario E2E lo
 * recoge el teardown de `api/`.
 */

const escaparRegex = (texto: string): string => texto.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** El `Área:` de la carta imprime el departamento sin el prefijo "Departamento de ". */
const areaEsperada = (nombreDepartamento: string): string =>
  nombreDepartamento.replace(/^Departamento de /i, "");

const coincidenciaInsensible = (texto: string): RegExp =>
  new RegExp(escaparRegex(texto), "i");

test.describe("Responsable de la carta responsiva", () => {
  test("REQ-B: un empleado con departamento imprime su Área en la carta", async ({
    prestamoPage,
    api,
    departamento,
  }) => {
    const id = nuevoRunId();
    const usuario = await api.crearUsuario({
      username: `e2e_web_dept_${id}`.toLowerCase(),
      name: `E2E Depto UI ${id}`,
      departmentId: departamento.id,
    });
    try {
      await prestamoPage.ir();
      await prestamoPage.asignarAEmpleado(usuario.name);
      await expect(prestamoPage.areaPreview).toHaveText(
        coincidenciaInsensible(areaEsperada(departamento.name))
      );
    } finally {
      await api.eliminarUsuario(usuario.id);
    }
  });

  test("REQ-B: un empleado sin departamento imprime Sistemas", async ({ prestamoPage, api }) => {
    const id = nuevoRunId();
    const usuario = await api.crearUsuario({
      username: `e2e_web_nodept_${id}`.toLowerCase(),
      name: `E2E SinDepto UI ${id}`,
    });
    try {
      await prestamoPage.ir();
      await prestamoPage.asignarAEmpleado(usuario.name);
      await expect(prestamoPage.areaPreview).toHaveText(coincidenciaInsensible("Sistemas"));
    } finally {
      await api.eliminarUsuario(usuario.id);
    }
  });

  test("REQ-B detalle: la carta del préstamo muestra el Área del responsable", async ({
    page,
    escenario,
    api,
    departamento,
  }) => {
    const id = nuevoRunId();
    const usuario = await api.crearUsuario({
      username: `e2e_web_det_${id}`.toLowerCase(),
      name: `E2E Detalle UI ${id}`,
      departmentId: departamento.id,
    });
    try {
      const dispositivo = await escenario.dispositivo(2);
      const prestamo = await api.prestar({
        responsableId: usuario.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 1 }],
      });

      await page.goto(ruta(`/inventario/prestamos/${prestamo.id}`));
      await expect(page.getByTestId("carta-area")).toHaveText(
        coincidenciaInsensible(areaEsperada(departamento.name))
      );
    } finally {
      await api.eliminarUsuario(usuario.id);
    }
  });
});
