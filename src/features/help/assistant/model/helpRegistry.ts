import type { ReactNode } from "react";

/**
 * Registro de ayuda por pantalla (nivel 1: sin IA, todo declarado aquí).
 *
 * Reglas:
 * - Cada pantalla se registra una sola vez y Langostín **solo** ofrece lo que
 *   está aquí: nunca inventa rutas, datos ni pasos.
 * - `permission` es el permiso que el usuario necesita para ver la acción; si no
 *   lo tiene, la opción ni se muestra (el API lo vuelve a validar igual).
 * - Los textos son cortos, en segunda persona y sin prometer lo que el sistema
 *   no hace.
 */
export interface HelpAction {
  /** Texto del botón (también sirve de pregunta). */
  label: string;
  /** Respuesta corta cuando la opción es informativa. */
  answer?: string;
  /** Ruta a la que lleva, si la opción navega. */
  to?: string;
  /** Permiso necesario para mostrarla (se evalúa en el cliente). */
  permission?: string;
  /** Palabras extra para la búsqueda del campo de texto. */
  keywords?: string;
}

export interface HelpScreen {
  /** Identificador estable de la pantalla. */
  screenId: string;
  /** Título que ve la persona. */
  title: string;
  /** Dónde está (ruta de ejemplo, informativa). */
  route: string;
  /** Explicación de una o dos frases. */
  explain: string;
  /** ¿Aplica a esta ruta? Se evalúa en orden; la primera que casa gana. */
  match: (pathname: string) => boolean;
  /** Opciones de la pantalla (acciones informativas o de navegación). */
  actions: HelpAction[];
  /** Términos que explica esta pantalla. */
  glossary?: Record<string, string>;
}

/** Rutas que nunca muestran el FAB (tienen su propio flujo de chat). */
export const HELP_HIDDEN_ROUTES = ["/tickets/new", "/login"];

export const HELP_SCREENS: HelpScreen[] = [
  {
    screenId: "home",
    title: "Inicio",
    route: "/",
    explain: "El inicio resume la operación: inventario, tickets, personas y relojes. Cambia de pestaña para ver cada tema.",
    match: (p) => p === "/",
    actions: [
      { label: "¿Qué significa cada tarjeta del inicio?", answer: "Cada tarjeta muestra un número real del sistema; el color dice el tipo: verde bien, ámbar atención, rojo problema. Al hacer clic abre la pantalla de ese dato." },
      { label: "¿Por qué veo unas pestañas y no otras?", answer: "Las pestañas dependen de tu rol y permisos. Si te falta alguna, pídesela a Sistemas o a RH." },
      { label: "Ver préstamos", to: "/inventory/loans", permission: "loans.view", keywords: "prestamo carta responsiva" },
      { label: "Ver tickets", to: "/tickets", permission: "tickets.view", keywords: "solicitudes reportes" },
    ],
    glossary: {
      "En vivo": "Los datos se actualizan solos cuando alguien registra un movimiento.",
      "Carta activa": "Préstamo firmado que todavía no se devuelve.",
    },
  },
  {
    screenId: "tickets.list",
    title: "Tickets",
    route: "/tickets",
    explain: "Aquí se ven y filtran los tickets de soporte. Las cifras de arriba filtran al hacer clic.",
    match: (p) => p === "/tickets",
    actions: [
      { label: "¿Cómo filtro por estado?", answer: "Toca una de las cifras de arriba (Abiertos, En seguimiento, Sin asignar, Cerrados): la tabla se filtra y se vuelve a tocar para quitar el filtro." },
      { label: "¿Qué significa EXCELENTE o REGULAR?", answer: "Es el tiempo en espera de la tarea: EXCELENTE cuando se cerró dentro de los primeros días; REGULAR cuando tardó más." },
      { label: "Crear un ticket", to: "/tickets/new", permission: "tickets.create" },
      { label: "Ver el tablero", to: "/tickets/kanban", permission: "tickets.view" },
    ],
    glossary: {
      "En seguimiento": "Alguien ya tomó el ticket y está trabajando en él.",
      "Sin asignar": "Nadie lo tiene todavía; hace falta asignarlo.",
    },
  },
  {
    screenId: "tickets.tasks",
    title: "Administración de tareas",
    route: "/tickets/tasks",
    explain: "Todas las tareas de todos los tickets, con su fecha de entrega y si se vencieron.",
    match: (p) => p === "/tickets/tasks",
    actions: [
      { label: "¿Qué es una tarea vencida?", answer: "La fecha de entrega ya pasó y la tarea no está completada. Aparece con el chip rojo «Vencida»." },
      { label: "Ver solo vencidas", answer: "Toca la cifra «Vencidas» del resumen para filtrar la tabla." },
      { label: "Ir al tablero", to: "/tickets/kanban", permission: "tickets.view" },
    ],
    glossary: {
      "En revisión": "La persona terminó la tarea y falta que se valide.",
    },
  },
  {
    screenId: "tickets.kanban",
    title: "Tablero de tareas",
    route: "/tickets/kanban",
    explain: "Las tareas en columnas por estado. Se mueven arrastrando la tarjeta a otra columna.",
    match: (p) => p.startsWith("/tickets/kanban"),
    actions: [
      { label: "¿Cómo cambio el estado de una tarea?", answer: "Arrastra la tarjeta a la columna del estado nuevo. El cambio se guarda solo." },
      { label: "Ver la lista de tareas", to: "/tickets/tasks", permission: "tasks.complete" },
    ],
  },
  {
    screenId: "tickets.detail",
    title: "Detalle del ticket",
    route: "/tickets/:id",
    explain: "Aquí se ve el ticket completo: datos, historial, tareas y archivos.",
    match: (p) => /^\/tickets\/[^/]+$/.test(p) && p !== "/tickets/new",
    actions: [
      { label: "¿Cómo agrego una tarea?", answer: "Usa «Nueva tarea» en la sección de tareas: Langostín te pregunta a quién, qué y para cuándo." },
      { label: "¿Cómo adjunto un archivo?", answer: "En «Adjuntos» elige el archivo; se sube al instante y queda en el historial." },
      { label: "Volver a la lista", to: "/tickets", permission: "tickets.view" },
    ],
  },
  {
    screenId: "inventory.device-types",
    title: "Tipos de dispositivo",
    route: "/inventory/device-types",
    explain: "Cada tipo define el prefijo del activo fijo y qué datos lleva cada unidad.",
    match: (p) => p.startsWith("/inventory/device-types"),
    actions: [
      { label: "¿Para qué sirve el prefijo?", answer: "Es el inicio del activo fijo: con prefijo LPT el primer equipo es LPT-0001 y sigue consecutivo por tipo." },
      { label: "Agregar un tipo", answer: "Usa «Nuevo tipo». El código y el prefijo no se pueden repetir ni cambiar después." },
      { label: "Ver dispositivos", to: "/inventory/devices", permission: "devices.view" },
    ],
    glossary: {
      "Siguiente código": "El folio que tendrá la próxima unidad de ese tipo.",
    },
  },
  {
    screenId: "inventory.devices",
    title: "Dispositivos",
    route: "/inventory/devices",
    explain: "El catálogo de equipos y sus piezas físicas, con disponibilidad y estado.",
    match: (p) => p.startsWith("/inventory/devices"),
    actions: [
      { label: "¿Qué es una unidad disponible?", answer: "Una pieza física lista para prestarse. Cuando sale en préstamo deja de estar disponible." },
      { label: "Registrar un movimiento", to: "/inventory/movements/new", permission: "movements.create" },
      { label: "Ver préstamos", to: "/inventory/loans", permission: "loans.view" },
    ],
  },
  {
    screenId: "inventory.movements",
    title: "Movimientos de inventario",
    route: "/inventory/movements",
    explain: "Entradas, bajas, mantenimientos y traspasos; cada pieza queda con su motivo en la bitácora.",
    match: (p) => p.startsWith("/inventory/movements"),
    actions: [
      { label: "¿Qué tipo de movimiento elijo?", answer: "Entrada suma piezas nuevas, baja retira una pieza, a mantenimiento la manda a reparar y el traspaso la cambia de lugar." },
      { label: "¿Se puede deshacer?", answer: "Solo el mantenimiento se revierte. La entrada y la baja no se deshacen; si te equivocas, avisa a Sistemas." },
    ],
  },
  {
    screenId: "employees.records",
    title: "Expedientes",
    route: "/employees/records",
    explain: "Qué documentos y datos personales le faltan a cada persona.",
    match: (p) => p.startsWith("/employees/records"),
    actions: [
      { label: "¿Por qué no se completa el expediente?", answer: "Faltan documentos obligatorios o datos personales. El detalle de la derecha dice exactamente qué." },
      { label: "Avisar a quien le falta", answer: "«Avisar a pendientes» manda un aviso a todos los incompletos; también puedes avisar uno por uno desde su fila." },
      { label: "Ver personal", to: "/employees", permission: "hr.records" },
    ],
  },
  {
    screenId: "schedules",
    title: "Horarios",
    route: "/schedules",
    explain: "Los horarios del personal y las reglas de jornada con las que se calculan horas extra.",
    match: (p) => p === "/schedules",
    actions: [
      { label: "¿Cómo creo un horario?", answer: "Usa «Nuevo horario»: Langostín te pregunta nombre, días, horas y reglas, y te muestra el resumen antes de guardar." },
      { label: "Ver horas extra", to: "/schedules/overtime/approval", permission: "overtime.view" },
      { label: "Asignar horario", to: "/schedules/assign", permission: "schedules.view" },
    ],
    glossary: {
      "Cruza medianoche": "La salida es al día siguiente (turnos nocturnos).",
    },
  },
  {
    screenId: "access",
    title: "Bitácora de accesos",
    route: "/access",
    explain: "Entradas y salidas del personal con credencial, con anomalías y registros anulados.",
    match: (p) => p.startsWith("/access"),
    actions: [
      { label: "¿Qué es un registro anulado?", answer: "Un acceso que se corrigió después: sigue visible para auditoría pero no cuenta." },
      { label: "Ver tiempo extra", to: "/schedules/overtime/approval", permission: "overtime.view" },
    ],
  },
  {
    screenId: "users",
    title: "Usuarios",
    route: "/users",
    explain: "Las cuentas del sistema, su rol y a qué pueden entrar.",
    match: (p) => p.startsWith("/users"),
    actions: [
      { label: "¿Rol o permiso?", answer: "El rol agrupa permisos; los permisos dicen qué puede hacer y sobre qué (lo propio, su área o todo)." },
      { label: "Ver consola de roles", to: "/roles", permission: "roles.manage" },
    ],
  },
  {
    screenId: "default",
    title: "Puerto Nuevo",
    route: "/",
    explain: "Estoy para explicarte cómo usar el sistema. Elige una opción o pregúntame por una pantalla.",
    match: () => true,
    actions: [
      { label: "¿Cómo creo un ticket?", answer: "Con «Nuevo ticket», en Tickets. Langostín te lleva paso a paso y lo deja listo para Sistemas." },
      { label: "Ir a Tickets", to: "/tickets", permission: "tickets.view" },
      { label: "Ir al inicio", to: "/" },
      { label: "Si algo no funciona", answer: "Avisa a Sistemas con el detalle de lo que intentabas hacer; si es urgente, levanta un ticket." },
    ],
  },
];

/** Pantalla de ayuda que corresponde a una ruta (siempre hay una: `default`). */
export const helpScreenFor = (pathname: string): HelpScreen =>
  HELP_SCREENS.find((screen) => screen.screenId !== "default" && screen.match(pathname)) ??
  (HELP_SCREENS.find((screen) => screen.screenId === "default") as HelpScreen);

/** ¿La ruta tiene su propio chat y por eso no debe salir el botón flotante? */
export const isHelpHidden = (pathname: string): boolean => HELP_HIDDEN_ROUTES.some((route) => pathname.startsWith(route));

export type HelpOption = {
  key: string;
  label: string;
  icon?: ReactNode;
  answer?: string;
  to?: string;
};
