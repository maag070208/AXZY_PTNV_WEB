import { test, expect } from "./support/fixtures";
import { esperarToast } from "./support/pages/componentes";
import type { ApiInventario, Existencias } from "./support/api";

/**
 * Ciclo de vida completo operado **sólo por pantalla**:
 * alta → préstamo → devolución → mantenimiento → baja.
 *
 * En cada paso se contrasta contra la API y se verifica la regla de
 * consistencia del inventario (DISPOSITIVOS.md §26):
 *
 *     activa    = DISPONIBLE + PRESTADO + DANADO + MANTENIMIENTO
 *     histórica = activa + BAJA
 */
const verificar = async (
  api: ApiInventario,
  dispositivoId: string,
  esperado: Partial<Existencias>
): Promise<Existencias> => {
  const ex = await api.esperarExistencias(dispositivoId, esperado);
  expect(ex.activa).toBe(ex.DISPONIBLE + ex.PRESTADO + ex.DANADO + ex.MANTENIMIENTO);
  expect(ex.historica).toBe(ex.activa + ex.BAJA);
  return ex;
};

test.describe("Ciclo completo desde la web", () => {
  test("alta → préstamo → devolución → mantenimiento → baja", async ({
    page,
    altaPage,
    prestamoPage,
    devolucionPage,
    movimientoPage,
    escenario,
    departamento,
    api,
  }) => {
    test.setTimeout(120_000);

    const nombre = escenario.nombreNuevo("Ciclo");
    let dispositivoId = "";

    await test.step("1. Alta de 8 unidades desde el formulario", async () => {
      await altaPage.ir();
      await altaPage.elegirTipo(escenario.tipo.name);
      await altaPage.llenar({ nombre, marca: "Samsung", modelo: "A9", cantidad: 8 });
      await altaPage.guardar();
      await esperarToast(page, "Dispositivo dado de alta");

      const dispositivo = await api.buscarDispositivo(escenario.tipo.id, nombre);
      dispositivoId = dispositivo.id;
      await verificar(api, dispositivoId, { DISPONIBLE: 8, activa: 8, historica: 8 });
    });

    await test.step("2. Préstamo de 5 piezas a un departamento", async () => {
      await prestamoPage.ir();
      await prestamoPage.asignarADepartamento(departamento.name);
      await prestamoPage.elegirRecurso(escenario.tipo.name, nombre);
      await prestamoPage.fijarCantidad(5);
      await prestamoPage.guardar();
      await esperarToast(page, "Carta responsiva registrada");

      await verificar(api, dispositivoId, { DISPONIBLE: 3, PRESTADO: 5, activa: 8 });
    });

    await test.step("3. Devolución parcial: 2 buenas", async () => {
      const prestamo = (await api.prestamos()).find((p) =>
        p.detalles.some((d) => d.dispositivoId === dispositivoId)
      )!;

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(nombre, 2, "BUENO");
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      expect((await api.prestamo(prestamo.id)).status).toBe("PARCIAL");
      await verificar(api, dispositivoId, { DISPONIBLE: 5, PRESTADO: 3, activa: 8 });
    });

    await test.step("4. Devolución del resto: 2 buenas y 1 rota", async () => {
      const prestamo = (await api.prestamos()).find((p) =>
        p.detalles.some((d) => d.dispositivoId === dispositivoId)
      )!;

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(nombre, 2, "BUENO");
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");
      await verificar(api, dispositivoId, { DISPONIBLE: 7, PRESTADO: 1 });

      await devolucionPage.ir();
      await devolucionPage.elegirPrestamo(prestamo.consecutivo);
      await devolucionPage.devolver(nombre, 1, "ROTO", "Pantalla destrozada");
      await expect(devolucionPage.avisoBajaAutomatica).toBeVisible();
      await devolucionPage.registrar();
      await esperarToast(page, "Devolución registrada");

      expect((await api.prestamo(prestamo.id)).status).toBe("DEVUELTO");
      await verificar(api, dispositivoId, {
        DISPONIBLE: 7,
        PRESTADO: 0,
        BAJA: 1,
        activa: 7,
        historica: 8,
      });
    });

    await test.step("5. Mantenimiento: una pieza va al taller y vuelve dañada", async () => {
      const disponible = (await api.unidades(dispositivoId)).find((u) => u.estado === "DISPONIBLE")!;

      await movimientoPage.ir();
      await movimientoPage.elegirDispositivo(nombre);
      await movimientoPage.elegirUnidad(disponible.activoFijo);
      await movimientoPage.elegirTipo("A mantenimiento");
      await movimientoPage.escribirMotivo("Revisión de batería");
      await movimientoPage.registrar();
      await esperarToast(page, "Movimiento registrado");
      await verificar(api, dispositivoId, { DISPONIBLE: 6, MANTENIMIENTO: 1, activa: 7 });

      await movimientoPage.ir();
      await movimientoPage.elegirDispositivo(nombre);
      await movimientoPage.elegirUnidad(disponible.activoFijo);
      await movimientoPage.elegirTipo("De mantenimiento");
      await movimientoPage.elegirCondicion("MALO");
      await movimientoPage.registrar();
      await esperarToast(page, "Movimiento registrado");

      await verificar(api, dispositivoId, {
        DISPONIBLE: 6,
        MANTENIMIENTO: 0,
        DANADO: 1,
        activa: 7,
        historica: 8,
      });
    });

    await test.step("6. Baja de una pieza disponible", async () => {
      const disponible = (await api.unidades(dispositivoId)).find((u) => u.estado === "DISPONIBLE")!;

      await movimientoPage.ir();
      await movimientoPage.elegirDispositivo(nombre);
      await movimientoPage.elegirUnidad(disponible.activoFijo);
      await movimientoPage.elegirTipo("Baja");
      await movimientoPage.escribirMotivo("Daño irreparable");
      await movimientoPage.registrar();
      await esperarToast(page, "Movimiento registrado");

      await verificar(api, dispositivoId, {
        DISPONIBLE: 5,
        PRESTADO: 0,
        DANADO: 1,
        MANTENIMIENTO: 0,
        BAJA: 2,
        activa: 6,
        historica: 8,
      });
    });

    await test.step("7. El historial conserva cada paso", async () => {
      const movimientos = await api.movimientos({ dispositivoId });
      const tipos = movimientos.map((m) => m.tipo);

      expect(tipos).toContain("ENTRADA");
      expect(tipos).toContain("PRESTAMO");
      expect(tipos).toContain("DEVOLUCION");
      expect(tipos).toContain("MANTENIMIENTO_ENTRADA");
      expect(tipos).toContain("MANTENIMIENTO_SALIDA");
      expect(tipos.filter((t) => t === "BAJA")).toHaveLength(2); // la automática y la manual
      expect(movimientos.every((m) => m.status === "ACTIVO")).toBe(true);
    });
  });
});
