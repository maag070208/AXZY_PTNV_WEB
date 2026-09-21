export type EstadoInventario = "DISPONIBLE" | "PRESTADO" | "DANADO" | "MANTENIMIENTO" | "BAJA";

export type TipoMovimiento =
  | "ENTRADA"
  | "PRESTAMO"
  | "DEVOLUCION"
  | "BAJA"
  | "TRASPASO"
  | "AJUSTE_ENTRADA"
  | "AJUSTE_SALIDA"
  | "MANTENIMIENTO_ENTRADA"
  | "MANTENIMIENTO_SALIDA"
  | "REVERSION";

export type Condicion = "BUENO" | "ACEPTABLE" | "MALO" | "ROTO";

export type EstadoPrestamo = "ACTIVO" | "PARCIAL" | "DEVUELTO" | "CANCELADO";

export interface TipoDispositivo {
  id: string;
  code: string;
  name: string;
  folioPrefix: string;
  contador: number;
  active: boolean;
  useSerie: boolean;
  useMac: boolean;
  useIp: boolean;
  useEquipo: boolean;
  _count?: { dispositivos: number };
}

export interface Dispositivo {
  id: string;
  tipoId: string;
  tipo?: TipoDispositivo;
  nombre: string;
  marca: string;
  modelo: string;
  descripcion?: string | null;
  observaciones?: string | null;
  existencias?: {
    total: number;
    DISPONIBLE: number;
    PRESTADO: number;
    DANADO: number;
    MANTENIMIENTO: number;
    BAJA: number;
  };
}

export interface UnidadFisica {
  id: string;
  dispositivoId: string;
  activoFijo: string;
  numeroSerie?: string | null;
  macAddress?: string | null;
  ip?: string | null;
  nombreEquipo?: string | null;
  area: string;
  estado: EstadoInventario;
  departamentoId?: string | null;
}

export interface Existencias {
  DISPONIBLE: number;
  PRESTADO: number;
  DANADO: number;
  MANTENIMIENTO: number;
  BAJA: number;
  activa: number;
  historica: number;
}

export interface MovimientoDetalle {
  id: string;
  dispositivoId: string;
  dispositivo?: Dispositivo;
  cantidad: number;
  condicion?: Condicion | null;
  observaciones?: string | null;
  unidades?: { id: string; unidadFisica: UnidadFisica }[];
}

export interface Movimiento {
  id: string;
  tipo: TipoMovimiento;
  fecha: string;
  usuarioId: string;
  usuario?: { id: string; name: string } | null;
  responsable?: { id: string; name: string } | null;
  departamentoId?: string | null;
  motivo?: string | null;
  observaciones?: string | null;
  status: "ACTIVO" | "CANCELADO";
  reversaDeId?: string | null;
  prestamoId?: string | null;
  detalles: MovimientoDetalle[];
}

export interface PrestamoDetalle {
  id: string;
  dispositivoId: string;
  dispositivo?: Dispositivo;
  cantidad: number;
  devuelto: number;
  pendiente?: number;
  unidades?: { id: string; devuelto?: boolean; unidadFisica: UnidadFisica }[];
}

export interface Prestamo {
  id: string;
  responsableId?: string | null;
  responsable?: { id: string; name: string; username: string; numeroEmpleado?: string | null } | null;
  departamentoId?: string | null;
  departamento?: { id: string; name: string } | null;
  subareaId?: string | null;
  subarea?: { id: string; name: string } | null;
  fecha: string;
  status: EstadoPrestamo;
  consecutivo: string;
  observaciones?: string | null;
  detalles: PrestamoDetalle[];
  devoluciones?: Devolucion[];
}

export interface DevolucionDetalle {
  id: string;
  dispositivoId: string;
  dispositivo?: Dispositivo;
  cantidad: number;
  condicion: Condicion;
  observaciones?: string | null;
  unidades?: { id: string; unidadFisica: UnidadFisica }[];
}

export interface Devolucion {
  id: string;
  prestamoId: string;
  prestamo?: {
    id: string;
    consecutivo: string;
    responsable?: { name: string } | null;
    departamento?: { name: string } | null;
  } | null;
  fecha: string;
  consecutivo: string;
  observaciones?: string | null;
  responsable?: { id: string; name: string } | null;
  detalles: DevolucionDetalle[];
}

export interface KardexRow {
  fecha: string;
  tipo: TipoMovimiento;
  entrada: number;
  salida: number;
  saldo: number;
  condicion?: Condicion | null;
  motivo?: string | null;
  observaciones?: string | null;
  usuario?: string | null;
}

export interface DashboardStat {
  tipos: number;
  dispositivos: number;
  unidadesActivas: number;
  disponible: number;
  prestado: number;
  danado: number;
  mantenimiento: number;
  baja: number;
}

export interface DashboardPorTipo {
  id: string;
  code: string;
  name: string;
  dispositivos: {
    id: string;
    nombre: string;
    marca: string;
    modelo: string;
    disponible: number;
    prestado: number;
    danado: number;
    mantenimiento: number;
    baja: number;
    total: number;
  }[];
}

export interface Dashboard {
  stats: DashboardStat;
  porTipo: DashboardPorTipo[];
}