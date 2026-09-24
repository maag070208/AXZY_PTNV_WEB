/** Cómo se identificó el empleado en el reloj (derivado del `minor` ISAPI). */
export type MetodoChecada = "ROSTRO" | "HUELLA" | "TARJETA" | "OTRO";

/**
 * Checada copiada de un reloj Hikvision (ver CHECADOR.md). La API solo LEE de
 * los relojes: estas filas llegan por la sincronización periódica y son
 * inmutables.
 */
export interface Checada {
  id: string;
  dispositivoSerie: string;
  /** Nombre del reloj donde se checó (`null` si el reloj no tiene nombre). */
  reloj: string | null;
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
  /** Eventos del reloj revisados (por consecutivo); de ellos solo se leen las checadas. */
  leidos: number;
  /** Checadas nuevas guardadas. */
  nuevas: number;
  ultimoSerialNo: number | null;
  error: string | null;
}

/**
 * Avance de la corrida en curso (p. ej. la carga inicial del historial), en
 * eventos del reloj (consecutivos); de ellos solo se leen las checadas.
 */
export interface ChecadorProgreso {
  startedAt: string;
  /** Eventos del reloj ya revisados. */
  leidos: number;
  nuevas: number;
  /** Eventos del reloj que faltan; `null` hasta que el reloj da la cota. */
  restantes: number | null;
  /** Eventos del reloj a revisar en la corrida. */
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
  /** Checadas del rango en los relojes (se conoce al empezar a leer cada uno). */
  total: number | null;
  /** Checadas leídas del rango. */
  leidos: number;
  nuevas: number;
  error: string | null;
}

/** Un reloj dado de alta y el estado de su sincronización. */
export interface ChecadorDispositivo {
  dispositivoSerie: string;
  nombre: string;
  /** Dirección con la que la API se conecta (`https://192.168.1.132`). */
  url: string;
  /**
   * Si sus checadas arman las entradas/salidas (y las horas extra). Los relojes
   * de puertas de oficina, que se checan varias veces por turno, no.
   */
  asistencia: boolean;
  modelo: string | null;
  ultimoSerialNo: number;
  sincronizadoEn: string | null;
  checadas: number;
  ultimaChecada: string | null;
  /** Corrida en curso de este reloj (p. ej. la carga inicial de su historial). */
  enCurso: ChecadorProgreso | null;
  ultimaCorrida: ChecadorCorrida | null;
  /** El reloj rechazó la contraseña: su sincronización automática se detuvo. */
  pausadoPorCredenciales: boolean;
}

/** Estado de la sincronización con los relojes (`GET /checador/status`). */
export interface ChecadorStatus {
  /** `false` si la API no tiene `CHECADOR_USER`: no se conecta a los relojes. */
  configurado: boolean;
  /** Suma de las corridas en curso de todos los relojes. */
  enCurso: ChecadorProgreso | null;
  /** Importación manual en curso o la última (de todos los relojes). */
  importacion: ChecadorImportacion | null;
  /** Relojes dados de alta. */
  dispositivos: ChecadorDispositivo[];
}

/**
 * Configuración de un reloj leída en vivo del equipo
 * (`GET /checador/relojes/:serie/configuracion`). Solo lectura. `hora` y
 * `personas` quedan en `null` si el reloj no las pudo dar.
 */
export interface ChecadorRelojConfig {
  dispositivoSerie: string;
  leidoEn: string;
  dispositivo: {
    /** Nombre configurado en el propio reloj. */
    nombre: string | null;
    modelo: string | null;
    firmware: string | null;
    mac: string | null;
  };
  hora: {
    /** Hora del reloj con su offset, como la reporta (`2026-09-24T13:39:19-07:00`). */
    horaLocal: string;
    /** `manual` o `NTP`. */
    modo: string | null;
    /** Zona POSIX del reloj (`CST+7:00:00` = UTC−7). */
    zona: string | null;
    /** Reloj − servidor, en segundos (positivo = el reloj va adelantado). */
    desfaseSegundos: number;
  } | null;
  personas: {
    total: number;
    conRostro: number;
    conHuella: number;
    conTarjeta: number;
  } | null;
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
