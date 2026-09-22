import { test, expect } from "./support/fixtures";
import { esperarToast } from "./support/pages/componentes";
import { ruta } from "./support/env";

/**
 * Flujo PRÉSTAMOS por pantalla — `/inventario/prestamos/nuevo` y
 * `/inventario/devoluciones/nueva`.
 *
 * El dispositivo se siembra por API (dar de alta ya tiene su propio spec) y a
 * partir de ahí todo se opera como usuario.
 */
test.describe("PRÉSTAMOS desde la web", () => {
  test("presta a un departamento y descuenta las existencias", async ({
    page,
    prestamoPage,
    escenario,
    departamento,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(10);

    await prestamoPage.ir();
    await prestamoPage.asignarADepartamento(departamento.name);
    await prestamoPage.elegirRecurso(escenario.tipo.name, dispositivo.nombreVisible);
    await prestamoPage.fijarCantidad(4);
    await prestamoPage.escribirObservaciones("Entrega para proyecto X");
    await prestamoPage.guardar();

    await esperarToast(page, "Carta responsiva registrada");
    await page.waitForURL(`**${ruta("/inventario/prestamos")}`);

    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 6, PRESTADO: 4 });

    const prestamos = await api.prestamos();
    const creado = prestamos.find((p) =>
      p.detalles.some((d) => d.dispositivoId === dispositivo.id)
    );
    expect(creado?.status).toBe("ACTIVO");
    expect(creado?.consecutivo).toMatch(/^CARTA-\d{4}$/);
  });

  test("muestra el disponible real del dispositivo elegido", async ({
    prestamoPage,
    escenario,
    departamento,
  }) => {
    const dispositivo = await escenario.dispositivo(7);

    await prestamoPage.ir();
    await prestamoPage.asignarADepartamento(departamento.name);
    await prestamoPage.elegirRecurso(escenario.tipo.name, dispositivo.nombreVisible);

    await expect(prestamoPage.disponible).toContainText("7");
  });

  test("no deja prestar más de lo disponible", async ({
    prestamoPage,
    escenario,
    departamento,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(3);

    await prestamoPage.ir();
    await prestamoPage.asignarADepartamento(departamento.name);
    await prestamoPage.elegirRecurso(escenario.tipo.name, dispositivo.nombreVisible);
    await prestamoPage.fijarCantidad(5);

    await expect(prestamoPage.alertaSobreStock).toBeVisible();
    await expect(prestamoPage.botonGuardar).toBeDisabled();

    // Y al corregir, la pantalla vuelve a habilitar el guardado.
    await prestamoPage.fijarCantidad(3);
    await expect(prestamoPage.alertaSobreStock).toBeHidden();
    await expect(prestamoPage.botonGuardar).toBeEnabled();

    // Nada se movió por haberlo intentado.
    expect(await api.existencias(dispositivo.id)).toMatchObject({ DISPONIBLE: 3, PRESTADO: 0 });
  });

  test("presta a un empleado", async ({ page, prestamoPage, escenario, api }) => {
    const dispositivo = await escenario.dispositivo(5);

    await prestamoPage.ir();
    await prestamoPage.asignarAEmpleado("E2E Empleado");
    await prestamoPage.elegirRecurso(escenario.tipo.name, dispositivo.nombreVisible);
    await prestamoPage.fijarCantidad(2);
    await prestamoPage.guardar();

    await esperarToast(page, "Carta responsiva registrada");
    await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 3, PRESTADO: 2 });
  });

  test("la carta recién creada aparece en el listado con su folio y estado", async ({
    page,
    prestamoPage,
    escenario,
    departamento,
    api,
  }) => {
    const dispositivo = await escenario.dispositivo(4);

    await prestamoPage.ir();
    await prestamoPage.asignarADepartamento(departamento.name);
    await prestamoPage.elegirRecurso(escenario.tipo.name, dispositivo.nombreVisible);
    await prestamoPage.fijarCantidad(1);
    await prestamoPage.guardar();
    await esperarToast(page, "Carta responsiva registrada");

    const creado = (await api.prestamos()).find((p) =>
      p.detalles.some((d) => d.dispositivoId === dispositivo.id)
    )!;

    await page.goto(ruta("/inventario/prestamos"));
    await expect(page.getByText(creado.consecutivo)).toBeVisible();
    await expect(page.getByText("ACTIVO").first()).toBeVisible();
  });

  test.describe("devoluciones", () => {
    test("la devolución parcial deja la carta en PARCIAL", async ({
      page,
      devolucionPage,
      escenario,
      departamento,
      api,
    }) => {
      const dispositivo = await escenario.dispositivo(10);
      const prestamo = await api.prestar({
        departamentoId: departamento.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 6 }],
      });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await expect(devolucionPage.contador(dispositivo.nombreVisible, "Pendiente")).toContainText("6");

      await devolucionPage.devolver(dispositivo.nombreVisible, 2, "BUENO");
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 6, PRESTADO: 4 });
      const actualizado = await api.prestamo(prestamo.id);
      expect(actualizado.status).toBe("PARCIAL");
      expect(actualizado.detalles[0]).toMatchObject({ cantidad: 6, devuelto: 2 });
    });

    test("la devolución total deja la carta en DEVUELTO", async ({
      page,
      devolucionPage,
      escenario,
      departamento,
      api,
    }) => {
      const dispositivo = await escenario.dispositivo(6);
      const prestamo = await api.prestar({
        departamentoId: departamento.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 3 }],
      });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(dispositivo.nombreVisible, 3, "BUENO");
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 6, PRESTADO: 0 });
      expect((await api.prestamo(prestamo.id)).status).toBe("DEVUELTO");
    });

    test("devolver en mal estado deja la unidad como dañada", async ({
      page,
      devolucionPage,
      escenario,
      departamento,
      api,
    }) => {
      const dispositivo = await escenario.dispositivo(5);
      const prestamo = await api.prestar({
        departamentoId: departamento.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 3 }],
      });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(dispositivo.nombreVisible, 2, "MALO", "Carcasa rota");
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 2, PRESTADO: 1, DANADO: 2 });
    });

    test("devolver como ROTO avisa la baja automática y la aplica", async ({
      page,
      devolucionPage,
      escenario,
      departamento,
      api,
    }) => {
      const dispositivo = await escenario.dispositivo(5);
      const prestamo = await api.prestar({
        departamentoId: departamento.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 2 }],
      });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(dispositivo.nombreVisible, 1, "ROTO", "Sin reparación");

      // La pantalla advierte antes de guardar.
      await expect(devolucionPage.avisoBajaAutomatica).toBeVisible();

      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      await api.esperarExistencias(dispositivo.id, { DISPONIBLE: 3, PRESTADO: 1, BAJA: 1 });
      const bajas = await api.movimientos({ dispositivoId: dispositivo.id, tipo: "BAJA" });
      expect(bajas).toHaveLength(1);
      expect(bajas[0].motivo).toBe("Baja automática por estado ROTO");
    });

    test("el tope a devolver es lo que queda pendiente", async ({
      devolucionPage,
      escenario,
      departamento,
      api,
    }) => {
      const dispositivo = await escenario.dispositivo(8);
      const prestamo = await api.prestar({
        departamentoId: departamento.id,
        detalles: [{ dispositivoId: dispositivo.id, cantidad: 5 }],
      });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);

      const campoDevolver = devolucionPage
        .bloque(dispositivo.nombreVisible)
        .getByLabel(/^\s*Devolver\s*\*?\s*$/);
      await expect(campoDevolver).toHaveAttribute("max", "5");
    });
  });
});
