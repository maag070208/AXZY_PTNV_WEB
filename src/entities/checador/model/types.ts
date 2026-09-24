/** Cómo se identificó el empleado en el reloj (derivado del `minor` ISAPI). */
export type MetodoChecada = "ROSTRO" | "HUELLA" | "TARJETA" | "OTRO";

/**
 * Checada copiada del reloj Hikvision (ver CHECADOR.md). La API solo LEE del
 * reloj: estas filas llegan por la sincronización periódica y son inmutables.
 */
export interface Checada {
  id: string;
  dispositivoSerie: string;
  /** Consecutivo del evento en el reloj. */
  serialNo: number;
  numeroEmpleado: string;
  nombre: string;
  metodo: MetodoChecada;
  /** Código `minor` ISAPI (75 rostro, 38 huella, 1 tarjeta; 104 = intento no válido). */
  minor: number;
  /** Instante de la checada según el reloj. */
  occurredAt: string;
  createdAt: string;
}

/** Una corrida de sincronización (`POST /checador/sync` y `ultimaCorrida`). */
export interface ChecadorCorrida {
  ok: boolean;
  dispositivoSerie: string | null;
  startedAt: string;
  finishedAt: string;
  /** Eventos leídos del reloj (de cualquier tipo, no solo checadas). */
  leidos: number;
  /** Checadas nuevas guardadas. */
  nuevas: number;
  ultimoSerialNo: number | null;
  error: string | null;
}

/** Avance de la corrida en curso (p. ej. la carga inicial del historial). */
export interface ChecadorProgreso {
  startedAt: string;
  leidos: number;
  nuevas: number;
  /**
   * Eventos que reportó la última búsqueda. Baja a medida que se avanza, así que
   * no promete cuánto queda.
   */
  restantes: number | null;
  /** Eventos totales de la corrida; se fija con la primera búsqueda del reloj. */
  total: number | null;
}

/**
 * Importación manual por rango de fechas (`POST /checador/import`): la que está
 * en curso o la última. En curso mientras `finishedAt` es null; terminó bien si
 * además `error` es null.
 */
export interface ChecadorImportacion {
  /** Días `YYYY-MM-DD` del rango, inclusive. */
  desde: string;
  hasta: string;
  startedAt: string;
  finishedAt: string | null;
  /** Eventos del rango en el reloj (se conoce con la primera página). */
  total: number | null;
  leidos: number;
  nuevas: number;
  error: string | null;
}

export interface ChecadorDispositivo {
  dispositivoSerie: string;
  modelo: string | null;
  ultimoSerialNo: number;
  sincronizadoEn: string | null;
  checadas: number;
  ultimaChecada: string | null;
}

/** Estado de la sincronización con el reloj (`GET /checador/status`). */
export interface ChecadorStatus {
  /** `false` si la API no tiene `CHECADOR_URL`: no se sincroniza. */
  configurado: boolean;
  enCurso: ChecadorProgreso | null;
  /** El reloj rechazó la contraseña: la sincronización automática se detuvo. */
  pausadoPorCredenciales: boolean;
  ultimaCorrida: ChecadorCorrida | null;
  /** Importación manual en curso o la última. */
  importacion: ChecadorImportacion | null;
  dispositivos: ChecadorDispositivo[];
}

// ---------------------------------------------------------------------------
// Vinculación número del reloj ↔ usuario (POST /checador/empleados/query …)
// ---------------------------------------------------------------------------

/** Usuario del sistema al que apunta (o podría apuntar) un número del reloj. */
export interface ChecadorUsuarioRef {
  userId: string;
  name: string;
  numeroEmpleado: string | null;
  active: boolean;
}

/**
 * `ALTA`: coinciden el nombre y el número de nómina (sin el prefijo de área del
 * reloj). `MEDIA`: solo el nombre; conviene revisar el número.
 */
export type ChecadorConfianza = "ALTA" | "MEDIA";

export type ChecadorEmpleadoEstado = "VINCULADO" | "SIN_VINCULAR" | "SUGERIDO";

/** Empleado dado de alta en el reloj (visto en sus checadas) y su vínculo. */
export interface ChecadorEmpleado {
  /** Número del empleado en el reloj (la llave del vínculo). */
  numeroEmpleado: string;
  /** Nombre como está en el reloj. */
  nombre: string;
  checadas: number;
  ultimaChecada: string;
  vinculo: ChecadorUsuarioRef | null;
  sugerencia: (ChecadorUsuarioRef & { confianza: ChecadorConfianza }) | null;
}

export interface ChecadorEmpleadosSummary {
  total: number;
  vinculados: number;
  sinVincular: number;
  /** Sin vincular con sugerencia `ALTA` (las que vincula el botón masivo). */
  sugeridosAlta: number;
}

export interface ChecadorEmpleadosResponse {
  data: ChecadorEmpleado[];
  total: number;
  summary: ChecadorEmpleadosSummary;
}
