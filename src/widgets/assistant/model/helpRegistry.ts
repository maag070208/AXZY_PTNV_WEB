import type { ReactNode } from "react";
import type { AppEventMap } from "@shared/lib/appEvents";

/**
 * Aviso que dispara una opción: el texto solo (sin datos) o el objeto con el
 * evento y su carga, tipados contra `AppEventMap`.
 */
export type HelpEmit =
  | "kanban:guide"
  | { event: "attendance:view"; payload: AppEventMap["attendance:view"] };

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
  /**
   * Aviso que se dispara a la pantalla (p. ej. la animación guiada del tablero).
   * El panel se cierra para que la persona vea la animación.
   */
  emit?: HelpEmit;
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
    // Las opciones se ajustan abajo (necesitan el aviso de la guía).
    title: "Tablero de tareas",
    route: "/tickets/kanban",
    explain: "Las tareas en columnas por estado. Se mueven arrastrando la tarjeta a otra columna.",
    match: (p) => p.startsWith("/tickets/kanban"),
    actions: [
      {
        label: "Muéstrame cómo mover una tarea",
        answer: "Mira las columnas: arrastra la tarjeta a la siguiente etapa.",
        emit: "kanban:guide",
      },
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
    screenId: "employees.list",
    title: "Personal",
    route: "/employees",
    explain: "El directorio de personas: quién está activo, su puesto y su departamento. Desde aquí se busca a alguien y se abre su expediente.",
    match: (p) => p === "/employees",
    actions: [
      { label: "¿Cómo doy de baja a una persona?", answer: "Abre su expediente y usa el botón de baja: pide confirmación y queda en la bitácora. Si solo quieres ocultarla de las listas, se marca como inactiva." },
      { label: "¿Qué es el expediente?", answer: "Los documentos y datos de la persona: INE, comprobante, datos fiscales y médicos. Lo que falta se marca en rojo." },
      { label: "Ver expedientes pendientes", to: "/employees/records", permission: "hr.records" },
      { label: "Ver la bitácora de accesos", to: "/access", permission: "access.scan" },
    ],
    glossary: {
      Activo: "Puede entrar al sistema y aparece en las listas.",
      Inactivo: "Su cuenta está suspendida; conserva su expediente e historial.",
    },
  },
  {
    screenId: "employees.edit",
    title: "Editar información del personal",
    route: "/employees/:id/edit",
    explain: "Aquí se corrigen los datos de la persona: nombre, contacto, domicilio, datos fiscales y médicos. Lo que falte o esté mal se marca antes de guardar.",
    match: (p) => /^\/employees\/[^/]+\/edit$/.test(p),
    actions: [
      { label: "¿Qué es obligatorio?", answer: "El nombre y los apellidos. Lo demás se puede completar después; RH marca lo que falta en el expediente." },
      { label: "¿Cómo lleno el formulario con el bot?", answer: "Usa «Rellenar desde aquí»: te pregunto campo por campo y lo escribo en la pantalla. Revisas y guardas." },
      { label: "Ver su expediente", to: "/employees", permission: "hr.records" },
    ],
    glossary: {
      "CURP": "Clave única de registro de población; se valida al guardar.",
      "NSS": "Número de seguridad social, para nómina.",
    },
  },
  {
    screenId: "employees.disciplinary",
    title: "Reportes de personal",
    route: "/employees/disciplinary-reports",
    explain: "Las cartas y actas administrativas de los empleados: motivo, sanción y quién la levantó. Arriba las cifras filtran por tipo.",
    match: (p) => p.startsWith("/employees/disciplinary-reports"),
    actions: [
      { label: "¿Qué es un acta administrativa?", answer: "El registro formal de una falta (inasistencia, retardo, conducta) con su sanción. Queda en la bitácora y en el expediente de la persona." },
      { label: "Ver personal", to: "/employees", permission: "hr.records" },
    ],
    glossary: {
      Inasistencia: "Falta sin justificar en un día laboral.",
      Retardo: "Llegada después de la hora de entrada con la tolerancia del horario.",
    },
  },
  {
    screenId: "employees.disciplinary.detail",
    title: "Vista previa del acta",
    route: "/employees/disciplinary-reports/:id",
    explain: "Aquí se revisa el acta ya levantada y se descarga en PDF con el formato de la empresa.",
    match: (p) => /^\/employees\/disciplinary-reports\/[^/]+$/.test(p),
    actions: [
      { label: "¿Cómo la descargo?", answer: "Con «Descargar PDF», arriba a la derecha. El PDF lleva el formato oficial, con los mismos datos que ves aquí." },
      { label: "¿Puedo corregirla?", answer: "No: un acta levantada no se edita. Si hubo un error, se levanta una nueva con la corrección y se anota la razón." },
      { label: "Volver a Reportes de personal", to: "/employees/disciplinary-reports", permission: "hr.records" },
      { label: "Ver personal", to: "/employees", permission: "hr.records" },
    ],
    glossary: {
      "Descripción del hecho": "Lo que pasó, con hechos y sin adjetivos.",
      "Sanción / medida aplicada": "Lo que se determinó: llamada de atención, suspensión, etc.",
    },
  },
  {
    screenId: "employees.detail",
    title: "Información del personal",
    route: "/employees/:id",
    explain: "La ficha de la persona: puesto y estado, antigüedad, expediente, equipo, cartas, tickets y tareas. Arriba están credencial, baja, editar información y cuenta y acceso.",
    match: (p) => /^\/employees\/[^/]+$/.test(p) && !p.startsWith("/employees/records"),
    actions: [
      { label: "Editar su información", to: "/employees/:id/edit", permission: "hr.records" },
      { label: "Ver su cuenta y acceso", to: "/users/:id/edit", permission: "users.edit" },
      { label: "¿Cómo lo doy de baja?", answer: "Usa «Dar de baja» arriba a la derecha: pide confirmación y queda en la bitácora. La persona deja de poder entrar, pero conserva expediente e historial." },
      { label: "Ver expedientes pendientes", to: "/employees/records", permission: "hr.records" },
    ],
    glossary: {
      Antigüedad: "Tiempo desde la fecha de ingreso; el medidor muestra lo que falta para el siguiente año.",
      Expediente: "Documentos obligatorios y datos personales de la persona. La dona dice qué porcentaje está completo.",
    },
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
      { label: "Nuevo horario", to: "/schedules/new", permission: "schedules.view", keywords: "crear alta turno" },
      { label: "¿Cómo creo un horario?", answer: "Usa «Nuevo horario»: Langostín te pregunta nombre, días, horas y reglas, y te muestra el resumen antes de guardar." },
      { label: "Ver horas extra", to: "/schedules/overtime/approval", permission: "overtime.view" },
      { label: "Asignar horario", to: "/schedules/assign", permission: "schedules.view" },
    ],
    glossary: {
      "Cruza medianoche": "La salida es al día siguiente (turnos nocturnos).",
    },
  },
  {
    screenId: "schedules.assign",
    title: "Asignar horario",
    route: "/schedules/assign",
    explain: "Pones a varias personas el mismo horario, o se lo quitas, filtrando por departamento.",
    match: (p) => p.startsWith("/schedules/assign"),
    actions: [
      { label: "¿Cómo asigno a varias personas?", answer: "Elige el horario arriba, filtra por departamento y busca a quien necesites: toca los renglones para seleccionarlos y pulsa «Asignar (N)». El botón + de cada renglón asigna solo a esa persona." },
      { label: "¿Cómo le quito el horario a alguien?", answer: "En la lista de la derecha (En <horario>) toca a las personas y pulsa «Quitar (N)», o el botón − de su renglón. Se quita a partir de hoy." },
      { label: "Ver horarios", to: "/schedules", permission: "schedules.view" },
      { label: "Ver horas extra", to: "/schedules/overtime/approval", permission: "overtime.view" },
    ],
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
    screenId: "timeclock.entries",
    title: "Entradas y salidas",
    route: "/hr/time-clock/entries-exits",
    explain:
      "Quién checó, a qué hora y cuántas horas lleva cada persona en el periodo. Las cifras de arriba filtran la lista y a la derecha ves el detalle de la persona elegida.",
    match: (p) => p === "/hr/time-clock/entries-exits",
    actions: [
      {
        label: "Muéstrame solo las incidencias",
        answer: "Listo: la lista muestra solo a quienes tienen retardos, faltas o checadas incompletas. Toca la cifra otra vez para quitar el filtro.",
        emit: { event: "attendance:view", payload: { view: "INCIDENTS" } },
        keywords: "incidencia retardo falta problema",
      },
      {
        label: "¿Quién está en sitio ahora?",
        answer: "Listo: la lista muestra a quienes tienen una entrada abierta hoy. Solo tiene sentido en el periodo actual.",
        emit: { event: "attendance:view", payload: { view: "ON_SITE" } },
        keywords: "presente dentro turno",
      },
      {
        label: "¿Quién no tiene registros?",
        answer: "Listo: la lista muestra a quienes no tienen ninguna checada en el periodo.",
        emit: { event: "attendance:view", payload: { view: "WITHOUT_RECORDS" } },
        keywords: "sin checadas ausente",
      },
      {
        label: "¿Cómo se lee la tira de días?",
        answer:
          "Cada cuadro es un día con la hora de entrada y de salida. Verde: asistió; ámbar: retardo; rojo: falta; gris: descanso; con línea punteada: día pendiente. El anillo marca hoy y el punto verde, a quien sigue en sitio. En quincena y mes se ven como cuadritos; pasa el cursor para ver las horas.",
        keywords: "tira dias colores semana",
      },
      {
        label: "¿Qué es «sin salida»?",
        answer:
          "Una entrada que no tiene salida después. Puede ser que la persona siga dentro o que olvidó checar al irse. Si ya se fue, revisa el día en el detalle de la derecha.",
        keywords: "salida incompleta olvido",
      },
      {
        label: "¿Por qué alguien sale sin registros?",
        answer:
          "Casi siempre es porque no está vinculado al reloj: sus checadas no se pueden asociar a una persona. Vincúlalo en «Vincular personas» y vuelve a esta pantalla.",
        keywords: "vinculado reloj checadas",
      },
      {
        label: "¿Cómo exporto el reporte?",
        answer:
          "Usa «PDF» o «Exportar CSV» arriba a la derecha. Salen las sesiones del periodo con los mismos filtros que tienes puestos (departamento, búsqueda e inactivos).",
        keywords: "descargar excel pdf csv",
      },
      { label: "Vincular personas", to: "/hr/time-clock/employees", permission: "time_clock.view", keywords: "reloj numero empleado" },
      { label: "Ver el rol de turnos", to: "/hr/time-clock/roster", permission: "time_clock.view", keywords: "turnos rol" },
      { label: "Ver horas extra", to: "/schedules/overtime/approval", permission: "overtime.view", keywords: "tiempo extra aprobar" },
      { label: "Ver nómina", to: "/schedules/payroll", permission: "payroll.view", keywords: "pago quincena" },
      { label: "Ver horarios", to: "/schedules", permission: "schedules.view", keywords: "jornada" },
    ],
    glossary: {
      Retardo: "Llegada después de la hora de entrada con la tolerancia del horario.",
      Falta: "Día laboral sin ninguna checada.",
      Descanso: "Día que el horario marca como libre.",
      "Sin salida": "Hay entrada pero no una salida después.",
      "Sin entrada": "Hay salida pero no una entrada antes.",
      "En sitio": "Tiene una entrada abierta hoy: sigue dentro.",
      Vinculado: "Su número del reloj está relacionado con una persona del sistema.",
    },
  },
  {
    screenId: "timeclock.home",
    title: "Checadas",
    route: "/hr/time-clock",
    explain: "Los registros crudos de los relojes checadores. Se copian solos cada 5 minutos.",
    match: (p) => p === "/hr/time-clock",
    actions: [
      { label: "¿Qué diferencia hay con Entradas y salidas?", answer: "Aquí ves cada checada tal como la dio el reloj; en Entradas y salidas se arman las jornadas por persona y se comparan con su horario." },
      { label: "Ver entradas y salidas", to: "/hr/time-clock/entries-exits", permission: "time_clock.view" },
      { label: "Vincular personas", to: "/hr/time-clock/employees", permission: "time_clock.view", keywords: "reloj numero empleado" },
    ],
    glossary: {
      Vinculado: "Su número del reloj está relacionado con una persona del sistema.",
    },
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
    screenId: "catalogs",
    title: "Catálogos",
    route: "/catalogs",
    explain: "Los catálogos que alimentan toda la app: departamentos, subáreas, tipos de dispositivo, documentos, géneros, tipos de sangre y categorías de ticket.",
    match: (p) => p.startsWith("/catalogs"),
    actions: [
      { label: "¿Qué catalogo edito para…?", answer: "Departamento y subárea están en Organización; los documentos obligatorios y los datos personales, en Personal; las categorías de ticket, en Tickets." },
      { label: "Ver usuarios", to: "/users", permission: "users.view" },
      { label: "Ver consola de roles", to: "/roles", permission: "roles.manage" },
    ],
    glossary: {
      Subárea: "La parte del departamento a la que pertenece la persona (p. ej. Almacén dentro de Operaciones).",
    },
  },
  {
    screenId: "roles",
    title: "Roles y permisos",
    route: "/roles",
    explain: "La consola de control de acceso: qué puede hacer cada rol, qué ve cada persona y qué reglas se aplican.",
    match: (p) => p.startsWith("/roles"),
    actions: [
      { label: "¿Dónde veo si alguien puede entrar a algo?", answer: "En la pestaña «Acceso por persona» eliges a la persona y ves su acceso efectivo, de dónde viene y el probador «¿Puede…?»." },
      { label: "¿Qué es una política?", answer: "Una regla que se suma al rol: por ejemplo, pedir aprobación de gerencia por encima de cierto monto." },
      { label: "Ver usuarios", to: "/users", permission: "users.view" },
      { label: "Ver catálogos", to: "/catalogs", permission: "catalogs.manage" },
    ],
    glossary: {
      Alcance: "Sobre qué datos aplica un permiso: lo propio, su área o todo.",
      Sensible: "Permiso que solo puede otorgar un administrador.",
    },
  },
  {
    screenId: "timeclock.dashboard",
    title: "Dashboard del reloj",
    route: "/time-clocks/dashboard",
    explain: "El estado de los relojes checadores: en línea, gente registrada, checadas de hoy y alertas.",
    match: (p) => p.startsWith("/time-clocks/dashboard"),
    actions: [
      { label: "¿Por qué hay una alerta?", answer: "Suele ser un reloj sin conexión, con la hora desfasada o con gente sin vincular: entra al reloj para ver el detalle." },
      { label: "Ver entradas y salidas", to: "/hr/time-clock/entries-exits", permission: "time_clock.view" },
      { label: "Vincular personas", to: "/hr/time-clock/employees", permission: "time_clock.view" },
      { label: "Ver relojes", to: "/time-clocks", permission: "time_clocks.manage" },
    ],
  },
  {
    screenId: "langostin",
    title: "Langostin",
    route: "/langostin",
    explain: "La galería de la mascota: sus animaciones y los escenarios donde aparece.",
    match: (p) => p.startsWith("/langostin"),
    actions: [
      { label: "¿De dónde salen sus animaciones?", answer: "Son 36 animaciones de la mascota y 8 escenarios dibujados en canvas; aquí se pueden ver una por una." },
      { label: "Ir al inicio", to: "/" },
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
