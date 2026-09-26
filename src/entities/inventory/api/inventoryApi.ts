import { api } from "@shared/api/client";
import type {
  Condicion,
  Dashboard,
  Devolucion,
  Dispositivo,
  EstadoInventario,
  Existencias,
  KardexRow,
  Movimiento,
  Prestamo,
  TipoDispositivo,
  TipoMovimiento,
  UnidadFisica,
} from "../model/types";

export interface MovimientoDetalleInput {
  dispositivoId: string;
  cantidad: number;
  condicion?: Condicion;
  prestamoDetalleId?: string;
  unidadId?: string;
  observaciones?: string;
}

export const inventarioApi = {
  // Tipos
  tipos: () => api.get<TipoDispositivo[]>(`/inventario/tipos`),
  crearTipo: (data: { code: string; name: string; folioPrefix: string; useSerie?: boolean; useMac?: boolean; useIp?: boolean; useEquipo?: boolean }) =>
    api.post<TipoDispositivo>(`/inventario/tipos`, data),
  actualizarTipo: (id: string, data: { name?: string; folioPrefix?: string; active?: boolean; useSerie?: boolean; useMac?: boolean; useIp?: boolean; useEquipo?: boolean }) =>
    api.put<TipoDispositivo>(`/inventario/tipos/${id}`, data),
  eliminarTipo: (id: string) => api.delete<TipoDispositivo>(`/inventario/tipos/${id}`),

  // Dispositivos
  dispositivos: (filters: { tipoId?: string; q?: string; existencias?: boolean } = {}) => {
    const params = new URLSearchParams();
    if (filters.tipoId) params.set("tipoId", filters.tipoId);
    if (filters.q) params.set("q", filters.q);
    if (filters.existencias) params.set("existencias", "true");
    const qs = params.toString();
    return api.get<Dispositivo[]>(`/inventario/dispositivos${qs ? `?${qs}` : ""}`);
  },
  crearDispositivo: (data: {
    tipoId: string;
    nombre: string;
    marca: string;
    modelo: string;
    descripcion?: string;
    observaciones?: string;
    cantidadInicial?: number;
    unidades?: { numeroSerie?: string; macAddress?: string; ip?: string; nombreEquipo?: string }[];
  }) => api.post<Dispositivo>(`/inventario/dispositivos`, data),
  getDispositivo: (id: string) => api.get<Dispositivo>(`/inventario/dispositivos/${id}`),
  actualizarDispositivo: (
    id: string,
    data: { nombre?: string; marca?: string; modelo?: string; descripcion?: string; observaciones?: string }
  ) => api.put<Dispositivo>(`/inventario/dispositivos/${id}`, data),
  eliminarDispositivo: (id: string) => api.delete<Dispositivo>(`/inventario/dispositivos/${id}`),
  existencias: (id: string) => api.get<Existencias>(`/inventario/dispositivos/${id}/existencias`),
  unidades: (id: string) => api.get<UnidadFisica[]>(`/inventario/dispositivos/${id}/unidades`),
  actualizarUnidad: (id: string, data: { numeroSerie?: string; macAddress?: string; ip?: string; nombreEquipo?: string; area?: string; departamentoId?: string }) =>
    api.put<UnidadFisica>(`/inventario/unidades-fisicas/${id}`, data),
  kardex: (id: string) =>
    api.get<{ dispositivo: Dispositivo; existencias: Existencias; rows: KardexRow[] }>(
      `/inventario/dispositivos/${id}/kardex`
    ),

  // Movimientos
  movimientos: (filters: { tipo?: string; dispositivoId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.tipo) params.set("tipo", filters.tipo);
    if (filters.dispositivoId) params.set("dispositivoId", filters.dispositivoId);
    const qs = params.toString();
    return api.get<Movimiento[]>(`/inventario/movimientos${qs ? `?${qs}` : ""}`);
  },
  getMovimiento: (id: string) => api.get<Movimiento>(`/inventario/movimientos/${id}`),
  registrarMovimiento: (data: {
    tipo: TipoMovimiento;
    responsableId?: string;
    departamentoId?: string;
    motivo?: string;
    observaciones?: string;
    prestamoId?: string;
    detalles: MovimientoDetalleInput[];
  }) => api.post<Movimiento>(`/inventario/movimientos`, data),
  revertir: (id: string) => api.post<Movimiento>(`/inventario/movimientos/${id}/revertir`),

  // Préstamos
  prestamos: (filters: { status?: string; responsableId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.responsableId) params.set("responsableId", filters.responsableId);
    const qs = params.toString();
    return api.get<Prestamo[]>(`/inventario/prestamos${qs ? `?${qs}` : ""}`);
  },
  getPrestamo: (id: string) => api.get<Prestamo>(`/inventario/prestamos/${id}`),
  crearPrestamo: (data: {
    responsableId?: string;
    departamentoId?: string;
    subareaId?: string;
    observaciones?: string;
    detalles: { dispositivoId: string; cantidad: number }[];
  }) => api.post<Movimiento>(`/inventario/prestamos`, data),
  cancelarPrestamo: (id: string) => api.post<Prestamo>(`/inventario/prestamos/${id}/cancelar`),
  actualizarPrestamo: (id: string, data: {
    responsableId?: string;
    departamentoId?: string;
    subareaId?: string;
    observaciones?: string;
    dispositivoId?: string;
    cantidad?: number;
  }) => api.put<Prestamo>(`/inventario/prestamos/${id}`, data),

  // Devoluciones
  devoluciones: (filters: { prestamoId?: string } = {}) => {
    const params = new URLSearchParams();
    if (filters.prestamoId) params.set("prestamoId", filters.prestamoId);
    const qs = params.toString();
    return api.get<Devolucion[]>(`/inventario/devoluciones${qs ? `?${qs}` : ""}`);
  },
  crearDevolucion: (data: {
    prestamoId: string;
    responsableId?: string;
    observaciones?: string;
    detalles: { prestamoDetalleId: string; cantidad: number; condicion: Condicion }[];
  }) => api.post<Movimiento>(`/inventario/devoluciones`, data),

  // Dashboard
  dashboard: () => api.get<Dashboard>(`/inventario/dashboard`),
};

export type EstadoInventarioType = EstadoInventario;