import { useEffect, useRef, useState, type ReactNode } from "react";
import type { IconType } from "react-icons";
import {
  FaArrowRight,
  FaBarcode,
  FaBars,
  FaBell,
  FaBoxes,
  FaChartPie,
  FaCheckCircle,
  FaChevronDown,
  FaClipboardCheck,
  FaClipboardList,
  FaClock,
  FaDesktop,
  FaEnvelope,
  FaExchangeAlt,
  FaGlobeAmericas,
  FaHistory,
  FaHome,
  FaIdCard,
  FaLaptop,
  FaLayerGroup,
  FaLock,
  FaMobileAlt,
  FaMoon,
  FaQrcode,
  FaQuestionCircle,
  FaRobot,
  FaRocket,
  FaSearchPlus,
  FaServer,
  FaShieldAlt,
  FaSyncAlt,
  FaTicketAlt,
  FaTimes,
  FaTimesCircle,
  FaTools,
  FaUserFriends,
  FaUsers,
  FaUserTie,
  FaUtensils,
  FaWarehouse,
} from "react-icons/fa";
import isotipo from "@shared/assets/puerto-nuevo-isotipo.svg";
import Langostin from "@shared/ui/langostin/Langostin";
import GuideAssistant from "./components/GuideAssistant";
import {
  DashboardVisual,
  HeroScene,
  InventoryVisual,
  KitchenVisual,
  PeopleVisual,
  RolesVisual,
  TicketsVisual,
} from "./components/LandingVisuals";
import screenInicio from "./assets/web-inicio.webp";
import screenTickets from "./assets/web-tickets.webp";
import screenInventario from "./assets/web-inventario.webp";
import screenDispositivos from "./assets/web-dispositivos.webp";
import screenCatalogos from "./assets/web-catalogos.webp";
import screenRoles from "./assets/web-roles.webp";
import screenAgenteTicket from "./assets/agente-ticket.webp";
import screenAgenteLangostin from "./assets/agente-langostin.webp";
import "./landing.css";

const CONTACT_EMAIL = "aamaro@axzy.dev";

const demoMailto = (subject = "Demostración · Sistema de Operación") =>
  `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(
    "Hola, me interesa conocer el sistema de operación de Puerto Nuevo.\n\nÁrea de interés: ",
  )}`;

const NAV_LINKS = [
  { id: "beneficios", label: "Plataforma" },
  { id: "modulos", label: "Módulos" },
  { id: "pantallas", label: "Pantallas" },
  { id: "como-funciona", label: "Operación" },
  { id: "para-quien", label: "Equipo" },
  { id: "faq", label: "FAQ" },
];

const PLATFORM_PILLS = [
  "Tickets",
  "Inventario",
  "Cartas responsivas",
  "Expedientes",
  "Reloj checador",
  "Horarios",
  "Portería",
  "Cocina",
  "Compras",
  "Roles",
];

const COMPARE_BAD = [
  "Solicitudes que se pierden entre chats y llamadas.",
  "Equipo prestado sin saber quién lo tiene ni en qué estado.",
  "Expedientes incompletos que nadie reclama.",
  "Horas extra y retardos calculados a mano.",
  "Cocina sin existencias, caducidades ni historial de compra.",
];

const COMPARE_GOOD = [
  "Tickets con responsable, tareas, fechas y evidencia.",
  "Cada pieza con activo fijo, serie y carta firmada.",
  "RH ve a quién le falta qué y lo avisa con un clic.",
  "Asistencia y pre nómina desde las checadas del reloj.",
  "Lotes, caducidades y compras con cotejo de tres vías.",
];

const BENEFITS: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FaLayerGroup,
    title: "Una sola fuente de verdad",
    text: "Tickets, inventario, personas, portería y cocina comparten la misma base, los mismos usuarios y los mismos permisos.",
  },
  {
    icon: FaClipboardCheck,
    title: "Nada se pierde",
    text: "Cada solicitud tiene dueño, prioridad, fecha y evidencia. El historial no se borra: se consulta.",
  },
  {
    icon: FaBarcode,
    title: "Cada pieza con rastro",
    text: "Activo fijo consecutivo por tipo, serie única, préstamo, devolución, mantenimiento y baja, todo con bitácora.",
  },
  {
    icon: FaIdCard,
    title: "Expedientes al día",
    text: "Documentos obligatorios, datos faltantes y avisos automáticos a quien los debe entregar.",
  },
  {
    icon: FaClock,
    title: "Asistencia sin captura",
    text: "Checadas de los relojes, horarios con vigencia, retardos, tiempo extra aprobado y pre nómina en Excel.",
  },
  {
    icon: FaWarehouse,
    title: "Cocina bajo control",
    text: "Lotes con caducidad, consumo FEFO, mermas, mínimos y el ciclo completo de compra, recepción y factura.",
  },
];

type ModuleItem = {
  id: string;
  label: string;
  icon: IconType;
  eyebrow: string;
  title: string;
  description: string;
  bullets: string[];
  visual: ReactNode;
};

const MODULES: ModuleItem[] = [
  {
    id: "inicio",
    label: "Inicio",
    icon: FaHome,
    eyebrow: "Tablero por rol",
    title: "Cada quien entra directo a lo suyo",
    description:
      "El inicio se arma con widgets: operación, asistencia de hoy, horas extra, expedientes, tickets, tareas, equipo a cargo, accesos, cocina y salud del sistema. Cada widget pide su permiso y el servidor recorta los datos según el alcance de la persona.",
    bullets: [
      "Gerencia: operación, horas extra de la semana y tickets urgentes.",
      "RH: expedientes, plantilla, altas y bajas, pendientes de configuración.",
      "Chef: bajo mínimo, por caducar y qué reabastecer.",
      "Guardia: entradas, salidas y quién sigue dentro del hotel.",
      "Administrador: auditoría de inventario, relojes y correos.",
    ],
    visual: <DashboardVisual />,
  },
  {
    id: "tickets",
    label: "Tickets",
    icon: FaTicketAlt,
    eyebrow: "Solicitudes entre áreas",
    title: "Una solicitud, un dueño, una evidencia",
    description:
      "El canal formal para pedir, asignar y cerrar trabajo entre áreas. Se ve como lista o tablero, con filtros por columna, vista de tarjetas y avisos en tiempo real.",
    bullets: [
      "Alta conversando con Langostin: pregunta lo necesario y arma el ticket.",
      "Prioridad, categoría, departamento, responsable y adjuntos.",
      "Tareas con fecha, estado y evidencia; el jefe revisa y cierra.",
      "Comentarios, historial de cambios y PDF del ticket.",
      "Alta a nombre de otra persona, con la traza de quién lo capturó.",
      "Visibilidad por alcance: propio, área o todo.",
    ],
    visual: <TicketsVisual />,
  },
  {
    id: "inventario",
    label: "Inventario",
    icon: FaBoxes,
    eyebrow: "Equipo de Sistemas",
    title: "El inventario se cuenta pieza por pieza",
    description:
      "Tipos de dispositivo, modelos y unidades físicas con activo fijo consecutivo y serie única. Del alta a la baja, cada movimiento deja rastro y se puede revertir sin borrar.",
    bullets: [
      "Préstamos por pieza exacta y carta responsiva en PDF.",
      "Devoluciones con condición; lo roto se da de baja solo.",
      "Mantenimiento, traspaso, baja y reversión.",
      "Auditor de 8 reglas de integridad, cada 24 horas.",
      "Carga masiva por Excel con previsualización y plantilla.",
      "Reportes, salidas de material y baja automática de la pieza.",
    ],
    visual: <InventoryVisual />,
  },
  {
    id: "personas",
    label: "Personas",
    icon: FaUsers,
    eyebrow: "Recursos Humanos y asistencia",
    title: "Del expediente a la pre nómina",
    description:
      "El expediente digital, los documentos obligatorios y la asistencia real convergen en una sola ficha por persona, con sus checadas, horarios y actas.",
    bullets: [
      "Datos personales, médicos, fiscales, descuentos y foto.",
      "INE y comprobante de domicilio obligatorios, con aviso de faltantes.",
      "Actas administrativas con PDF con membrete.",
      "Relojes Hikvision en solo lectura y sincronización incremental.",
      "Horarios con vigencia, retardos, tiempo extra y pre nómina.",
      "Portería con QR, foto y sitio; reporte de entradas y salidas.",
    ],
    visual: <PeopleVisual />,
  },
  {
    id: "cocina",
    label: "Cocina",
    icon: FaUtensils,
    eyebrow: "Almacén y compras",
    title: "El almacén que sabe qué caduca y qué pedir",
    description:
      "Artículos con mínimo y máximo, lotes con caducidad, consumo FEFO y el ciclo completo de compra, recepción y factura. Artículos es el centro: desde ahí se mueve todo.",
    bullets: [
      "Consumibles y duraderos; secos, refrigerados y congelados.",
      "Cada entrada crea lote; el consumo toma lo que caduca antes.",
      "Mermas con motivo y conteo físico con ajuste.",
      "Kardex por lote y alertas de mínimo, caducidad y sobre stock.",
      "Reabastecimiento que resta lo que ya está en tránsito.",
      "Órdenes de compra con presentaciones e IVA, y PDF firmable.",
      "Proveedores con RFC, contactos y facturas con cotejo.",
    ],
    visual: <KitchenVisual />,
  },
  {
    id: "seguridad",
    label: "Seguridad",
    icon: FaShieldAlt,
    eyebrow: "Roles y permisos",
    title: "El servidor decide qué puede hacer cada quien",
    description:
      "Roles, permisos y alcances se administran desde la aplicación. La interfaz solo oculta; cada petición se valida otra vez en el servidor, incluso si alguien intenta saltarse la pantalla.",
    bullets: [
      "59 permisos en 18 módulos, con alcance propio, área o todo.",
      "7 roles base y roles a la medida, con más de un rol por persona.",
      "Excepciones por persona con motivo y vencimiento.",
      "Políticas por acción: sin autoaprobación, límites y excepción de administrador.",
      "Simulador ¿Puede…? con la traza completa de la decisión.",
      "Bitácora de cada cambio y de cada acceso denegado.",
      "Ningún cambio puede dejar el sistema sin administrador.",
    ],
    visual: <RolesVisual />,
  },
];

const SCREEN_MAP: { id: string; title: string; icon: IconType; items: string[] }[] = [
  {
    id: "inicio",
    title: "Inicio",
    icon: FaHome,
    items: ["Tablero por rol", "Widgets por permiso", "Notificaciones"],
  },
  {
    id: "tickets",
    title: "Tickets",
    icon: FaTicketAlt,
    items: ["Listado", "Tablero Kanban", "Detalle", "Mis tareas", "Administrar tareas"],
  },
  {
    id: "inventario",
    title: "Inventario",
    icon: FaBoxes,
    items: [
      "Resumen",
      "Dispositivos",
      "Tipos",
      "Movimientos",
      "Cartas responsivas",
      "Devoluciones",
      "Reportes",
      "Salidas de material",
    ],
  },
  {
    id: "personas",
    title: "Recursos Humanos",
    icon: FaIdCard,
    items: [
      "Personal",
      "Expedientes",
      "Actas",
      "Bitácora de asistencias",
      "Entradas y salidas",
      "Checadas del reloj",
      "Empleados del reloj",
      "Calendario de horarios",
      "Asignar horarios",
      "Tiempo extra",
      "Pre nómina",
    ],
  },
  {
    id: "cocina",
    title: "Almacén de cocina",
    icon: FaUtensils,
    items: [
      "Resumen",
      "Artículos",
      "Existencias por lote",
      "Kardex",
      "Reabastecimiento",
      "Órdenes de compra",
      "Facturas",
      "Proveedores",
      "Catálogos",
    ],
  },
  {
    id: "config",
    title: "Configuración",
    icon: FaTools,
    items: [
      "Catálogos",
      "Usuarios",
      "Departamentos y subáreas",
      "Administrar relojes",
      "Roles y permisos",
      "Configuración del sistema",
      "Bitácora de correos",
    ],
  },
];

type ScreenGroupId = "web" | "agente";

type RealScreen = { id: string; image: string; title: string; caption: string; route: string };

type RealScreenGroup = {
  id: ScreenGroupId;
  label: string;
  icon: IconType;
  kicker: string;
  title: string;
  description: string;
  highlights: string[];
  items: RealScreen[];
};

const REAL_SCREENS: Record<ScreenGroupId, RealScreenGroup> = {
  web: {
    id: "web",
    label: "Web",
    icon: FaDesktop,
    kicker: "Consola web",
    title: "La operación real, sin maquetas.",
    description:
      "Capturas de la consola que usa el equipo del hotel: tablas, permisos, inventario y catálogos. Cada pantalla respeta el rol de quien la abre.",
    highlights: [
      "Tablas con filtros por columna, orden y exportación.",
      "Inventario y cartas responsivas pieza por pieza.",
      "Permisos y alcance por rol en cada acción.",
    ],
    items: [
      {
        id: "inicio",
        image: screenInicio,
        title: "Inicio",
        caption: "El tablero de operación con indicadores y actividad en vivo.",
        route: "inicio",
      },
      {
        id: "tickets",
        image: screenTickets,
        title: "Tickets",
        caption: "Tablero de tareas con prioridad, fechas y evidencia.",
        route: "tickets / tablero",
      },
      {
        id: "inventario",
        image: screenInventario,
        title: "Inventario",
        caption: "Resumen, auditoría y movimientos de las piezas.",
        route: "inventario / resumen",
      },
      {
        id: "dispositivos",
        image: screenDispositivos,
        title: "Dispositivos",
        caption: "Modelos, existencias, préstamos y bajas.",
        route: "inventario / dispositivos",
      },
      {
        id: "catalogos",
        image: screenCatalogos,
        title: "Catálogos",
        caption: "Departamentos, áreas y tipos que ordenan el sistema.",
        route: "catálogos",
      },
      {
        id: "roles",
        image: screenRoles,
        title: "Roles y permisos",
        caption: "Qué puede hacer cada rol y con qué alcance.",
        route: "roles / permisos",
      },
    ],
  },
  agente: {
    id: "agente",
    label: "Agente",
    icon: FaRobot,
    kicker: "Langostin · Bot de ayuda",
    title: "Langostin te acompaña.",
    description:
      "El mismo bot que flota en esta página también vive dentro del sistema: arma tickets conversando, guía tareas y ayuda a llenar formularios.",
    highlights: [
      "Arma el ticket preguntando paso a paso.",
      "Propone categoría, urgencia y resumen.",
      "Guía tareas y formularios sin formularios largos.",
    ],
    items: [
      {
        id: "agente-ticket",
        image: screenAgenteTicket,
        title: "Nuevo ticket",
        caption: "Langostin pregunta, propone y arma el ticket contigo.",
        route: "tickets / nuevo",
      },
      {
        id: "agente-langostin",
        image: screenAgenteLangostin,
        title: "Langostin",
        caption: "La mascota y sus escenarios; el mismo bot de ayuda.",
        route: "langostin",
      },
    ],
  },
};

const STEPS: { icon: IconType; title: string; text: string }[] = [
  {
    icon: FaTicketAlt,
    title: "Levanta la solicitud",
    text: "Con foto, prioridad y categoría. Langostin guía el alta si hace falta.",
  },
  {
    icon: FaUserFriends,
    title: "Asigna y reparte",
    text: "El jefe del área define responsables, tareas y fechas límite.",
  },
  {
    icon: FaClipboardList,
    title: "Avanza con evidencia",
    text: "Cada tarea cambia de estado con comentarios y adjuntos.",
  },
  {
    icon: FaCheckCircle,
    title: "Cierra y consulta",
    text: "Historial completo, PDF y aviso a todos los involucrados.",
  },
];

const AGENTS: { icon: IconType; title: string; when: string; text: string }[] = [
  {
    icon: FaSyncAlt,
    title: "Relojes checadores",
    when: "Cada pocos minutos",
    text: "Pide solo las checadas nuevas, sin duplicar y sin escribir nunca en el reloj.",
  },
  {
    icon: FaShieldAlt,
    title: "Auditor de inventario",
    when: "Cada 24 horas",
    text: "Corre 8 reglas de integridad y avisa solo si el resultado cambió.",
  },
  {
    icon: FaUtensils,
    title: "Alertas de cocina",
    when: "Cada 24 horas",
    text: "Revisa bajo mínimo, por caducar y caducado; avisa a quien administra.",
  },
  {
    icon: FaEnvelope,
    title: "Cola de correo",
    when: "Continuo",
    text: "Envía con reintentos y deja cada intento en la bitácora de correos.",
  },
  {
    icon: FaBell,
    title: "Tiempo real",
    when: "Siempre",
    text: "Publica tickets, tareas y notificaciones al instante en web y escritorio.",
  },
  {
    icon: FaServer,
    title: "Permisos al arrancar",
    when: "Al iniciar",
    text: "Carga catálogo y matriz, y agrega permisos nuevos sin pisar cambios.",
  },
];

const NUMBERS = [
  { value: "238", label: "endpoints de API" },
  { value: "75", label: "pantallas web" },
  { value: "59", label: "tablas en la base" },
  { value: "59", label: "permisos configurables" },
  { value: "7", label: "roles base" },
  { value: "6", label: "agentes automáticos" },
  { value: "2", label: "idiomas: español e inglés" },
  { value: "3", label: "plataformas: web, escritorio y móvil" },
];

const PERSONAS: { icon: IconType; role: string; title: string; bullets: string[] }[] = [
  {
    icon: FaUserTie,
    role: "Dirección y administración",
    title: "Gerencia",
    bullets: [
      "Ve la operación completa sin pedir reportes.",
      "Aprueba tiempo extra, órdenes y facturas.",
      "Recibe avisos de lo que se sale de rango.",
    ],
  },
  {
    icon: FaIdCard,
    role: "Recursos Humanos",
    title: "RH",
    bullets: [
      "Expedientes y documentos al día.",
      "Horarios, relojes y pre nómina.",
      "Actas y avisos de faltantes.",
    ],
  },
  {
    icon: FaUtensils,
    role: "Almacén de cocina",
    title: "Chef",
    bullets: [
      "Existencias, lotes y caducidades.",
      "Mermas, conteo y reabastecimiento.",
      "Órdenes de compra y proveedores.",
    ],
  },
  {
    icon: FaShieldAlt,
    role: "Administración del sistema",
    title: "Administrador",
    bullets: [
      "Inventario y cartas responsivas.",
      "Usuarios, roles y catálogos.",
      "Auditoría y configuración.",
    ],
  },
  {
    icon: FaClipboardCheck,
    role: "Jefaturas de área",
    title: "Jefe de área",
    bullets: [
      "Tickets y tareas de su departamento.",
      "Asistencia de su gente.",
      "Seguimiento con evidencia.",
    ],
  },
  {
    icon: FaQrcode,
    role: "Portería",
    title: "Guardia",
    bullets: [
      "Escanea la credencial con QR.",
      "Confirma entrada o salida.",
      "Registra sitio, foto y ubicación.",
    ],
  },
];

const FAQS: { q: string; a: string }[] = [
  {
    q: "¿Qué incluye el sistema?",
    a: "Tickets y tareas, inventario de activos con cartas responsivas, expedientes de personal, actas, portería, relojes checadores, horarios, tiempo extra, pre nómina, almacén de cocina, compras, proveedores, facturas, notificaciones, reportes y control de acceso por roles.",
  },
  {
    q: "¿Quién puede usarlo?",
    a: "Cualquier persona del hotel con una cuenta y un rol: Administrador, Gerencia, RH, Chef, Jefe de área, Guardia o Empleado. Los roles se pueden crear a la medida y una persona puede tener más de uno.",
  },
  {
    q: "¿Cómo se entra?",
    a: "Desde el navegador, con la aplicación de escritorio para Mac, Windows o Linux, y desde la app móvil para portería. El acceso es con usuario y contraseña; cada petición vuelve a validar el rol y el estado de la cuenta.",
  },
  {
    q: "¿Se conecta con los relojes que ya tenemos?",
    a: "Sí, con los relojes Hikvision por ISAPI. El sistema solo lee: nunca escribe configuración, usuarios ni contraseñas. Pide las checadas nuevas desde el último consecutivo y también permite importar por fechas.",
  },
  {
    q: "¿Puedo importar lo que ya tengo?",
    a: "Usuarios, inventario y artículos de cocina se cargan desde Excel, con plantilla y previsualización antes de escribir. El respaldo del cliente se puede restaurar completo y los reportes salen en PDF, CSV o Excel.",
  },
  {
    q: "¿Qué pasa si dos personas modifican lo mismo?",
    a: "Las operaciones de inventario y cocina corren en transacciones protegidas y con candado por pieza. Si dos chocan, el sistema reintenta y, si no puede, avisa con claridad en lugar de dejar datos a medias. Repetir una operación no la duplica.",
  },
  {
    q: "¿Se puede auditar lo que pasó?",
    a: "Sí. La bitácora registra quién hizo qué y cuándo, con el estado anterior y el nuevo. También quedan los accesos denegados, los correos enviados o fallidos y el resultado del auditor de inventario.",
  },
  {
    q: "¿El sistema incluye inteligencia artificial?",
    a: "Sí. Langostin acompaña el alta de tickets y la creación de tareas: pregunta lo necesario, propone y crea el registro. También es el bot de ayuda que flota en esta página. La validación y la decisión final siguen en el servidor y en quien autoriza.",
  },
  {
    q: "¿En qué idiomas y dispositivos funciona?",
    a: "En español e inglés, con modo oscuro y diseño adaptable. La consola web y la app de escritorio comparten la misma operación; la app móvil se usa hoy en portería.",
  },
  {
    q: "¿Cómo se implanta en el hotel?",
    a: "Se instala en el servidor del hotel, se cargan los datos reales y se configuran roles, catálogos y relojes. El equipo de cada área empieza con las pantallas que le tocan y el acompañamiento del equipo de sistemas.",
  },
];

const scrollToId = (id: string) => {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

const Brand = ({ light = false }: { light?: boolean }) => (
  <span className={`lp-brand${light ? " is-light" : ""}`}>
    <img src={isotipo} alt="" className="lp-brand-mark" />
    <span className="lp-brand-word">
      <strong>PUERTO NUEVO</strong>
      <small>HOTEL &amp; VILLAS</small>
    </span>
  </span>
);

const LandingPage = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [activeModuleId, setActiveModuleId] = useState(MODULES[0].id);
  const [screenGroupId, setScreenGroupId] = useState<ScreenGroupId>("web");
  const [screenId, setScreenId] = useState(REAL_SCREENS.web.items[0].id);
  const [zoomScreen, setZoomScreen] = useState<RealScreen | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement | null>(null);

  const activeModule = MODULES.find((module) => module.id === activeModuleId) ?? MODULES[0];
  const activeScreenGroup = REAL_SCREENS[screenGroupId];
  const activeScreen =
    activeScreenGroup.items.find((item) => item.id === screenId) ?? activeScreenGroup.items[0];

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Puerto Nuevo · Sistema de Operación";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight;
      const value = height > 0 ? Math.min(1, Math.max(0, window.scrollY / height)) : 0;
      if (progressRef.current) progressRef.current.style.transform = `scaleX(${value})`;
      setScrolled(window.scrollY > 12);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    if (!zoomScreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setZoomScreen(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [zoomScreen]);

  const openModule = (id: string) => {
    if (MODULES.some((module) => module.id === id)) setActiveModuleId(id);
    scrollToId("modulos");
  };

  return (
    <div className="pnv-landing">
      <div className="lp-progress" aria-hidden="true">
        <span ref={progressRef} />
      </div>

      <header className={`lp-nav${scrolled ? " is-scrolled" : ""}`}>
        <div className="lp-container lp-nav-inner">
          <button
            type="button"
            className="lp-brand-button"
            aria-label="Puerto Nuevo, ir al inicio"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          >
            <Brand />
          </button>

          <nav className="lp-nav-links" aria-label="Navegación principal">
            {NAV_LINKS.map((link) => (
              <button key={link.id} type="button" className="lp-nav-link" onClick={() => scrollToId(link.id)}>
                {link.label}
              </button>
            ))}
          </nav>

          <div className="lp-nav-actions">
            <a className="lp-nav-cta" href={demoMailto()}>
              Solicitar demo <FaArrowRight size={9} />
            </a>
            <button
              type="button"
              className="lp-mobile-toggle"
              aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((open) => !open)}
            >
              {menuOpen ? <FaTimes /> : <FaBars />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="lp-mobile-panel">
            <div className="lp-container">
              {NAV_LINKS.map((link) => (
                <button
                  key={link.id}
                  type="button"
                  className="lp-mobile-link"
                  onClick={() => {
                    scrollToId(link.id);
                    setMenuOpen(false);
                  }}
                >
                  {link.label}
                </button>
              ))}
              <a className="lp-mobile-cta" href={demoMailto()}>
                Solicitar una demostración <FaArrowRight size={9} />
              </a>
            </div>
          </div>
        )}
      </header>

      <main>
        <section className="lp-hero">
          <span className="lp-hero-wave lp-hero-wave--a" aria-hidden="true" />
          <span className="lp-hero-wave lp-hero-wave--b" aria-hidden="true" />

          <div className="lp-container lp-hero-grid">
            <div className="lp-hero-copy">
              <div className="lp-hero-head">
                <span className="lp-hero-badge">
                  <span className="lp-live-dot" />
                  Sistema de operación · Puerto Nuevo Hotel &amp; Villas
                </span>

                <h1>
                  Todo el hotel.
                  <br />
                  <em>Un solo sistema.</em>
                </h1>
              </div>

              <div className="lp-hero-body">
                <p>
                  Tickets, inventario, cartas responsivas, expedientes, asistencia, relojes
                  checadores, portería y almacén de cocina. El sistema que usa Puerto Nuevo para que
                  cada proceso tenga responsable, fecha y evidencia.
                </p>

                <div className="lp-hero-actions">
                  <button
                    type="button"
                    className="lp-btn lp-btn-primary"
                    onClick={() => scrollToId("modulos")}
                  >
                    Conocer los módulos <FaArrowRight size={10} />
                  </button>
                  <button
                    type="button"
                    className="lp-btn lp-btn-ghost"
                    onClick={() => scrollToId("como-funciona")}
                  >
                    Ver cómo funciona
                  </button>
                </div>

                <ul className="lp-hero-points">
                  <li>
                    <FaCheckCircle size={11} /> Web, escritorio y móvil
                  </li>
                  <li>
                    <FaCheckCircle size={11} /> Roles y permisos por persona
                  </li>
                  <li>
                    <FaCheckCircle size={11} /> Todo queda en bitácora
                  </li>
                </ul>

                <p className="lp-hero-meta">
                  75 pantallas · 59 permisos · 6 agentes automáticos
                  <button type="button" onClick={() => scrollToId("numeros")}>
                    Ver el sistema en números <FaArrowRight size={9} />
                  </button>
                </p>
              </div>
            </div>

            <div className="lp-hero-visual">
              <HeroScene />
              <p className="lp-hero-caption">
                <span>Captura real de tu consola · Inicio</span>
                <button
                  type="button"
                  onClick={() => setZoomScreen(REAL_SCREENS.web.items[0])}
                >
                  <FaSearchPlus size={10} /> Ver en grande
                </button>
              </p>
            </div>
          </div>
        </section>

        <section className="lp-trust">
          <div className="lp-container">
            <div className="lp-trust-inner" data-reveal>
              <div className="lp-trust-copy">
                <span className="lp-trust-label">Un sistema para cada área del hotel</span>
                <div className="lp-trust-pills" aria-label="Áreas cubiertas">
                  {PLATFORM_PILLS.map((pill) => (
                    <span key={pill}>{pill}</span>
                  ))}
                </div>
              </div>
              <div className="lp-trust-stats">
                <div>
                  <strong>7</strong>
                  <span>roles base</span>
                </div>
                <div>
                  <strong>59</strong>
                  <span>permisos con alcance</span>
                </div>
                <div>
                  <strong>8</strong>
                  <span>reglas de auditoría</span>
                </div>
                <div>
                  <strong>6</strong>
                  <span>agentes automáticos</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="problema" className="lp-section lp-compare-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaExchangeAlt size={10} /> Antes y después
              </span>
              <h2>Cuando cada área lleva su propio control, nadie tiene la foto completa.</h2>
              <p>
                Solicitudes por WhatsApp, equipo sin rastro, expedientes en carpetas y horas extra en
                hojas de cálculo. El sistema cambia eso sin cambiar cómo trabaja tu gente.
              </p>
            </div>

            <div className="lp-shift" data-reveal>
              <article className="lp-shift-side lp-shift-before">
                <div className="lp-shift-top">
                  <span className="lp-shift-tag">Antes</span>
                  <FaTimesCircle size={22} />
                </div>
                <h3>Cada área por su lado</h3>
                <p className="lp-shift-sub">La operación se sostiene con mensajes y memoria.</p>
                <ul>
                  {COMPARE_BAD.map((item) => (
                    <li key={item}>
                      <FaTimes size={10} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="lp-shift-metric">
                  <span>La información</span>
                  <strong>Se pide</strong>
                </div>
              </article>

              <div className="lp-shift-mid" aria-hidden="true">
                <span>
                  <FaArrowRight size={16} />
                </span>
              </div>

              <article className="lp-shift-side lp-shift-after">
                <div className="lp-shift-top">
                  <span className="lp-shift-tag">Después</span>
                  <FaCheckCircle size={22} />
                </div>
                <h3>Una operación conectada</h3>
                <p className="lp-shift-sub">La operación se sostiene con datos y evidencia.</p>
                <ul>
                  {COMPARE_GOOD.map((item) => (
                    <li key={item}>
                      <FaCheckCircle size={10} /> {item}
                    </li>
                  ))}
                </ul>
                <div className="lp-shift-metric">
                  <span>La información</span>
                  <strong>Se ve</strong>
                </div>
              </article>
            </div>

            <div className="lp-shift-footer" data-reveal>
              <p>
                <strong>No es otro tablero. Es la misma operación, con memoria.</strong>
              </p>
              <button type="button" className="lp-text-link" onClick={() => scrollToId("modulos")}>
                Ver los módulos <FaArrowRight size={9} />
              </button>
            </div>
          </div>
        </section>

        <section id="beneficios" className="lp-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaLayerGroup size={10} /> Lo que cambia
              </span>
              <h2>Menos perseguir información. Más operar el hotel.</h2>
              <p>
                Cada módulo resuelve una parte del día y todos comparten la misma base, los mismos
                usuarios y la misma bitácora.
              </p>
            </div>

            <div className="lp-benefits-grid">
              {BENEFITS.map(({ icon: Icon, title, text }, index) => (
                <article className="lp-benefit" key={title} data-reveal>
                  <div className="lp-benefit-icon">
                    <Icon size={19} />
                  </div>
                  <span className="lp-benefit-num">{String(index + 1).padStart(2, "0")}</span>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="modulos" className="lp-section lp-modules">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaDesktop size={10} /> Los módulos
              </span>
              <h2>Seis formas de mirar la misma operación.</h2>
              <p>
                Elige un módulo para ver qué resuelve, quién lo usa y qué información deja
                registrada.
              </p>
            </div>

            <div className="lp-tabs" role="tablist" aria-label="Módulos del sistema">
              {MODULES.map((module) => {
                const Icon = module.icon;
                return (
                  <button
                    key={module.id}
                    type="button"
                    role="tab"
                    id={`lp-tab-${module.id}`}
                    aria-selected={activeModule.id === module.id}
                    aria-controls={`lp-panel-${module.id}`}
                    className={activeModule.id === module.id ? "is-active" : ""}
                    onClick={() => setActiveModuleId(module.id)}
                  >
                    <Icon size={13} />
                    {module.label}
                  </button>
                );
              })}
            </div>

            <div
              className="lp-module"
              role="tabpanel"
              id={`lp-panel-${activeModule.id}`}
              aria-labelledby={`lp-tab-${activeModule.id}`}
              key={activeModule.id}
            >
              <div className="lp-module-copy">
                <span className="lp-eyebrow">{activeModule.eyebrow}</span>
                <h3>{activeModule.title}</h3>
                <p>{activeModule.description}</p>
                <ul className="lp-module-list">
                  {activeModule.bullets.map((bullet) => (
                    <li key={bullet}>
                      <FaCheckCircle size={11} /> {bullet}
                    </li>
                  ))}
                </ul>
                <a className="lp-btn lp-btn-primary lp-btn-sm" href={demoMailto(`Demostración · ${activeModule.label}`)}>
                  Verlo en una demostración <FaArrowRight size={9} />
                </a>
              </div>
              <div className="lp-module-visual">{activeModule.visual}</div>
            </div>
          </div>
        </section>

        <section id="pantallas" className="lp-section lp-screens-section">
          <div className="lp-container">
            <div className="lp-section-head is-light" data-reveal>
              <span className="lp-eyebrow is-light">
                <FaDesktop size={10} /> Pantallas reales
              </span>
              <h2>Así se ve por dentro.</h2>
              <p>
                Capturas reales de la consola web y de Langostin, el bot de ayuda. Lo que ves es lo
                que usa el equipo, no una maqueta.
              </p>
            </div>

            <div className="lp-realscreens" data-reveal>
              <div className="lp-realscreens-tabs" role="tablist" aria-label="Tipo de pantalla">
                {(Object.keys(REAL_SCREENS) as ScreenGroupId[]).map((id) => {
                  const group = REAL_SCREENS[id];
                  const Icon = group.icon;
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={screenGroupId === id}
                      className={screenGroupId === id ? "is-active" : ""}
                      onClick={() => {
                        setScreenGroupId(id);
                        setScreenId(REAL_SCREENS[id].items[0].id);
                      }}
                    >
                      {id === "agente" ? <Langostin anim="wave" size={20} /> : <Icon size={13} />}
                      <span>{group.label}</span>
                      <small>{group.items.length} pantallas</small>
                    </button>
                  );
                })}
              </div>

              <div className="lp-realscreens-stage" role="tabpanel" aria-label={activeScreenGroup.label}>
                <figure className="lp-shot">
                  <div className="lp-shot-bar">
                    <span />
                    <span />
                    <span />
                    <span className="lp-shot-url">puerto-nuevo / {activeScreen.route}</span>
                    <span className="lp-shot-real">
                      <i /> Real
                    </span>
                  </div>
                  <button
                    type="button"
                    className="lp-shot-image"
                    aria-label={`Ampliar ${activeScreen.title}`}
                    onClick={() => setZoomScreen(activeScreen)}
                  >
                    <img
                      src={activeScreen.image}
                      alt={`Pantalla real de ${activeScreen.title} en el sistema de Puerto Nuevo`}
                      loading="lazy"
                    />
                    <span className="lp-shot-zoom">
                      <FaSearchPlus /> Ampliar
                    </span>
                  </button>
                </figure>

                <aside className="lp-realscreens-copy">
                  <div className="lp-realscreens-intro">
                    <span className="lp-realscreens-kicker">{activeScreenGroup.kicker}</span>
                    <h3>{activeScreenGroup.title}</h3>
                    <p>{activeScreenGroup.description}</p>
                    <p className="lp-realscreens-caption">
                      <FaCheckCircle size={10} /> {activeScreen.caption}
                    </p>
                    <div className="lp-realscreens-actions">
                      <button
                        type="button"
                        className="lp-realscreens-zoom"
                        onClick={() => setZoomScreen(activeScreen)}
                      >
                        <FaSearchPlus size={10} /> Ver pantalla completa
                      </button>
                    </div>
                  </div>

                  <div className="lp-realscreens-details">
                    <ul>
                      {activeScreenGroup.highlights.map((highlight) => (
                        <li key={highlight}>
                          <FaCheckCircle size={10} /> {highlight}
                        </li>
                      ))}
                    </ul>

                    <div
                      className={`lp-realscreens-thumbs${
                        activeScreenGroup.items.length === 2 ? " is-two" : ""
                      }`}
                    >
                      {activeScreenGroup.items.map((item) => (
                        <button
                          key={item.id}
                          type="button"
                          className={activeScreen.id === item.id ? "is-active" : ""}
                          aria-label={`Ver ${item.title}`}
                          aria-pressed={activeScreen.id === item.id}
                          onClick={() => setScreenId(item.id)}
                        >
                          <img src={item.image} alt="" loading="lazy" />
                          <span>{item.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>
            </div>

            <div className="lp-screens-platforms" data-reveal>
              <span>
                <FaDesktop size={11} /> Web
              </span>
              <span>
                <FaLaptop size={11} /> Escritorio
              </span>
              <span>
                <FaMobileAlt size={11} /> Móvil
              </span>
              <span>
                <FaMoon size={11} /> Modo oscuro
              </span>
              <span>
                <FaGlobeAmericas size={11} /> Español e inglés
              </span>
              <span>
                <FaLock size={11} /> Sesión validada
              </span>
            </div>
          </div>
        </section>

        <section id="mapa" className="lp-section lp-map-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaClipboardList size={10} /> Mapa de pantallas
              </span>
              <h2>El mapa completo de la operación</h2>
              <p>
                Estas son las pantallas principales del sistema. Cada tabla con filtros por columna,
                orden y paginación en el servidor, y exportación donde aplica.
              </p>
            </div>

            <div className="lp-map-grid">
              {SCREEN_MAP.map((section) => {
                const Icon = section.icon;
                return (
                  <article className="lp-map-card" key={section.id} data-reveal>
                    <header>
                      <span className="lp-map-icon">
                        <Icon size={15} />
                      </span>
                      <h3>{section.title}</h3>
                    </header>
                    <ul>
                      {section.items.map((item) => (
                        <li key={item}>
                          <span /> {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                );
              })}
            </div>

            <p className="lp-map-note" data-reveal>
              <FaClipboardCheck size={12} /> 75 rutas en total. Cada pantalla respeta el rol de quien
              la abre y el alcance de sus permisos.
            </p>
          </div>
        </section>

        <section id="como-funciona" className="lp-section lp-steps-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaRocket size={10} /> Así se mueve el trabajo
              </span>
              <h2>Del ticket a la evidencia, en cuatro pasos</h2>
              <p>
                El mismo patrón se repite en inventario, expedientes y cocina: una acción, un
                responsable, un rastro.
              </p>
            </div>

            <div className="lp-steps" data-reveal>
              {STEPS.map(({ icon: Icon, title, text }, index) => (
                <div className="lp-step" key={title}>
                  <div className="lp-step-icon">
                    <Icon size={21} />
                    <span>{String(index + 1).padStart(2, "0")}</span>
                  </div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>

            <p className="lp-steps-note" data-reveal>
              <FaHistory size={13} /> Cada paso queda en el historial. Los avisos llegan en tiempo
              real y el cierre se puede imprimir en PDF.
            </p>
          </div>
        </section>

        <section id="agentes" className="lp-section lp-agents-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaSyncAlt size={10} /> Lo que pasa solo
              </span>
              <h2>Seis procesos que trabajan sin que nadie los dispare</h2>
              <p>
                Corren dentro del servidor del hotel. Mantienen la asistencia al día, vigilan el
                inventario y avisan solo cuando hay algo que atender.
              </p>
            </div>

            <div className="lp-agents-grid">
              {AGENTS.map(({ icon: Icon, title, when, text }) => (
                <article className="lp-agent" key={title} data-reveal>
                  <header>
                    <span className="lp-agent-icon">
                      <Icon size={16} />
                    </span>
                    <span className="lp-agent-when">{when}</span>
                  </header>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="numeros" className="lp-numbers">
          <div className="lp-container">
            <div className="lp-numbers-head" data-reveal>
              <span className="lp-eyebrow is-light">
                <FaChartPie size={10} /> El sistema en números
              </span>
              <h2>Una plataforma, toda la operación.</h2>
              <p>Lo que hay detrás de cada pantalla que usa el equipo del hotel.</p>
            </div>

            <div className="lp-numbers-grid">
              {NUMBERS.map((number) => (
                <div className="lp-number" key={number.label} data-reveal>
                  <strong>{number.value}</strong>
                  <span>{number.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="para-quien" className="lp-section lp-personas-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaUserFriends size={10} /> Tu equipo
              </span>
              <h2>Una operación, siete roles, la misma verdad.</h2>
              <p>
                El sistema no reemplaza a tu gente: le da a cada rol la información que necesita para
                decidir mejor.
              </p>
            </div>

            <div className="lp-personas-grid">
              {PERSONAS.map(({ icon: Icon, role, title, bullets }) => (
                <article className="lp-persona" key={title} data-reveal>
                  <div className="lp-persona-top">
                    <span className="lp-persona-icon">
                      <Icon size={18} />
                    </span>
                    <span className="lp-persona-role">{role}</span>
                  </div>
                  <h3>{title}</h3>
                  <ul>
                    {bullets.map((bullet) => (
                      <li key={bullet}>
                        <FaCheckCircle size={10} /> {bullet}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>

            <p className="lp-personas-note" data-reveal>
              <FaShieldAlt size={12} /> Además: Empleado, con sus tickets, tareas, asistencia y
              equipo a cargo.
            </p>
          </div>
        </section>

        <section id="faq" className="lp-section lp-faq-section">
          <div className="lp-container">
            <div className="lp-section-head" data-reveal>
              <span className="lp-eyebrow">
                <FaQuestionCircle size={10} /> Dudas frecuentes
              </span>
              <h2>Lo que suelen preguntarnos antes de empezar</h2>
              <p>Si tu duda no está aquí, escríbenos y la respondemos con gusto.</p>
            </div>

            <div className="lp-faq-list" data-reveal>
              {FAQS.map(({ q, a }) => (
                <details className="lp-faq-item" key={q}>
                  <summary>
                    {q} <FaChevronDown size={12} />
                  </summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>

            <p className="lp-faq-cta">
              ¿Otra duda?{" "}
              <a className="lp-text-link" href={`mailto:${CONTACT_EMAIL}`}>
                Escríbenos <FaArrowRight size={9} />
              </a>
            </p>
          </div>
        </section>

        <section id="contacto" className="lp-cta-section">
          <div className="lp-container">
            <div className="lp-cta" data-reveal>
              <span className="lp-cta-eyebrow">
                <FaRocket size={10} /> Siguiente paso
              </span>
              <h2>Ordena la operación sin cambiar cómo trabaja tu gente.</h2>
              <p>
                Te mostramos el sistema con las áreas que más te interesan y vemos cómo encaja con lo
                que ya usas hoy.
              </p>
              <div className="lp-cta-actions">
                <a className="lp-btn lp-btn-light" href={demoMailto()}>
                  Solicitar una demostración <FaArrowRight size={10} />
                </a>
                <button type="button" className="lp-btn lp-btn-ghost-light" onClick={() => scrollToId("modulos")}>
                  Ver los módulos
                </button>
              </div>
              <span className="lp-cta-note">
                <FaEnvelope size={11} /> Respuesta por correo · {CONTACT_EMAIL}
              </span>
            </div>
          </div>
        </section>
      </main>

      <footer className="lp-footer">
        <div className="lp-container lp-footer-grid">
          <div className="lp-footer-brand">
            <Brand light />
            <p>
              Sistema de operación de Puerto Nuevo Hotel &amp; Villas: tickets, inventario,
              personas, asistencia, portería y cocina en un solo lugar.
            </p>
            <div className="lp-footer-points">
              <span>
                <FaCheckCircle size={9} /> Web
              </span>
              <span>
                <FaCheckCircle size={9} /> Escritorio
              </span>
              <span>
                <FaCheckCircle size={9} /> Móvil
              </span>
            </div>
          </div>

          <div className="lp-footer-col">
            <h4>Sistema</h4>
            <button type="button" onClick={() => openModule("inicio")}>
              Inicio
            </button>
            <button type="button" onClick={() => openModule("tickets")}>
              Tickets
            </button>
            <button type="button" onClick={() => openModule("inventario")}>
              Inventario
            </button>
            <button type="button" onClick={() => openModule("personas")}>
              Personas
            </button>
            <button type="button" onClick={() => openModule("cocina")}>
              Cocina
            </button>
          </div>

          <div className="lp-footer-col">
            <h4>Operación</h4>
            <button type="button" onClick={() => scrollToId("como-funciona")}>
              Cómo funciona
            </button>
            <button type="button" onClick={() => scrollToId("agentes")}>
              Agentes automáticos
            </button>
            <button type="button" onClick={() => scrollToId("pantallas")}>
              Pantallas reales
            </button>
            <button type="button" onClick={() => scrollToId("mapa")}>
              Mapa del sistema
            </button>
            <button type="button" onClick={() => scrollToId("faq")}>
              Preguntas frecuentes
            </button>
          </div>

          <div className="lp-footer-col">
            <h4>Contacto</h4>
            <a className="lp-footer-link" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
            <a className="lp-footer-link" href="https://axzy.dev" target="_blank" rel="noreferrer">
              axzy.dev
            </a>
            <a className="lp-footer-cta" href={demoMailto()}>
              Solicitar una demostración
            </a>
          </div>
        </div>

        <div className="lp-container lp-footer-bottom">
          <span>© 2026 Puerto Nuevo Hotel &amp; Villas. Todos los derechos reservados.</span>
          <span>
            Desarrollado por{" "}
            <a href="https://axzy.dev" target="_blank" rel="noreferrer">
              axzydev
            </a>{" "}
            &amp;{" "}
            <a href="https://isstech.mx" target="_blank" rel="noreferrer">
              ISST
            </a>
          </span>
        </div>
      </footer>

      {zoomScreen && (
        <div
          className="lp-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`Pantalla ampliada: ${zoomScreen.title}`}
          onClick={() => setZoomScreen(null)}
        >
          <button
            type="button"
            className="lp-lightbox-close"
            aria-label="Cerrar pantalla ampliada"
            onClick={(event) => {
              event.stopPropagation();
              setZoomScreen(null);
            }}
          >
            <FaTimes />
          </button>
          <img
            src={zoomScreen.image}
            alt={`Pantalla real de ${zoomScreen.title} en el sistema de Puerto Nuevo`}
            onClick={(event) => event.stopPropagation()}
          />
          <span className="lp-lightbox-hint">Desliza para ver toda la pantalla</span>
        </div>
      )}

      <GuideAssistant
        open={guideOpen}
        onOpenChange={setGuideOpen}
        onExplore={openModule}
        contactEmail={CONTACT_EMAIL}
      />
    </div>
  );
};

export default LandingPage;
