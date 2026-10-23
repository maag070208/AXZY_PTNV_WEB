import type { ReactNode } from "react";
import {
  FaBars,
  FaBell,
  FaBoxes,
  FaCheck,
  FaChevronRight,
  FaClipboardCheck,
  FaClock,
  FaEllipsisH,
  FaExchangeAlt,
  FaFileSignature,
  FaHome,
  FaLaptop,
  FaLock,
  FaMapMarkerAlt,
  FaPlus,
  FaQrcode,
  FaSearch,
  FaShieldAlt,
  FaTicketAlt,
  FaTruck,
  FaUserCheck,
  FaUsers,
  FaUtensils,
} from "react-icons/fa";
import isotipo from "@shared/assets/puerto-nuevo-isotipo.svg";
import inicioShot from "../assets/web-inicio.webp";

/* Los visuales son maquetas dibujadas con HTML y CSS: la landing no depende
 * de capturas de la aplicación y se mantiene igual de nítida en cualquier
 * tamaño de pantalla. */

const SIDE_NAV = [
  { icon: FaHome, label: "Inicio", active: true },
  { icon: FaTicketAlt, label: "Tickets" },
  { icon: FaBoxes, label: "Inventario" },
  { icon: FaUtensils, label: "Cocina" },
  { icon: FaUsers, label: "Personas" },
  { icon: FaShieldAlt, label: "Roles" },
];

const BrowserShell = ({
  url,
  children,
  className = "",
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) => (
  <div className={`lp-browser ${className}`}>
    <div className="lp-browser-bar">
      <span />
      <span />
      <span />
      <span className="lp-browser-url">{url}</span>
      <span className="lp-browser-live">
        <i /> En vivo
      </span>
    </div>
    <div className="lp-browser-body">{children}</div>
  </div>
);

export const MiniDashboard = () => (
  <div className="lp-mini-app">
    <aside className="lp-mini-side">
      <span className="lp-mini-brand">
        <img src={isotipo} alt="" />
      </span>
      <nav aria-hidden="true">
        {SIDE_NAV.map(({ icon: Icon, label, active }) => (
          <span key={label} className={active ? "is-active" : ""}>
            <Icon />
            {label}
          </span>
        ))}
      </nav>
      <span className="lp-mini-user">
        <span className="lp-avatar">MG</span>
        <i />
      </span>
    </aside>

    <div className="lp-mini-main">
      <header className="lp-mini-head">
        <div>
          <small>Inicio · Gerencia</small>
          <strong>Buenos días</strong>
        </div>
        <span className="lp-mini-bell">
          <FaBell />
          <i />
        </span>
      </header>

      <div className="lp-mini-kpis">
        <div>
          <span>
            <FaTicketAlt /> Tickets
          </span>
          <strong>12</strong>
          <small className="is-warn">3 urgentes</small>
        </div>
        <div>
          <span>
            <FaBoxes /> Activos
          </span>
          <strong>338</strong>
          <small>77 modelos</small>
        </div>
        <div>
          <span>
            <FaUserCheck /> Presentes
          </span>
          <strong>142</strong>
          <small>6 retardos</small>
        </div>
        <div>
          <span>
            <FaUtensils /> Bajo mínimo
          </span>
          <strong>5</strong>
          <small className="is-warn">2 por caducar</small>
        </div>
      </div>

      <div className="lp-mini-panels">
        <div className="lp-mini-panel">
          <header>
            <span>Tickets por estado</span>
            <small>7 días</small>
          </header>
          <div className="lp-mini-bars" aria-hidden="true">
            {[38, 54, 44, 70, 58, 78, 64].map((height, index) => (
              <i key={index} style={{ height: `${height}%` }} />
            ))}
          </div>
        </div>
        <div className="lp-mini-panel">
          <header>
            <span>Hoy en el hotel</span>
            <small>En vivo</small>
          </header>
          <ul className="lp-mini-list">
            <li>
              <i className="is-blue" />
              <span>Aire acondicionado · 214</span>
              <small>Urgente</small>
            </li>
            <li>
              <i className="is-amber" />
              <span>Lote de leche por caducar</span>
              <small>2 días</small>
            </li>
            <li>
              <i className="is-green" />
              <span>Carta LAP-0012 firmada</span>
              <small>Hecho</small>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
);

export const HeroScene = () => (
  <div className="lp-hero-scene" aria-hidden="true">
    <BrowserShell url="puerto-nuevo / inicio" className="lp-hero-browser">
      <img className="lp-hero-shot" src={inicioShot} alt="" />
    </BrowserShell>
  </div>
);

export const DashboardVisual = () => (
  <div className="lp-visual-frame" aria-hidden="true">
    <BrowserShell url="puerto-nuevo / inicio" className="lp-visual-browser">
      <img className="lp-hero-shot" src={inicioShot} alt="" />
    </BrowserShell>
  </div>
);

const TICKET_COLUMNS = [
  {
    title: "Abiertos",
    tone: "is-blue",
    cards: [
      {
        title: "Aire acondicionado habitación 214",
        meta: "Mantenimiento",
        priority: "Urgente",
        owner: "MG",
        due: "Hoy",
      },
      {
        title: "Reponer amenities en villas",
        meta: "Ama de llaves",
        priority: "Media",
        owner: "AP",
        due: "Mañana",
      },
    ],
  },
  {
    title: "En progreso",
    tone: "is-amber",
    cards: [
      {
        title: "Cambiar lámparas del lobby",
        meta: "Mantenimiento",
        priority: "Alta",
        owner: "LS",
        due: "Hoy",
      },
      {
        title: "Alta de proveedor de verduras",
        meta: "Compras",
        priority: "Media",
        owner: "JR",
        due: "24 oct",
      },
    ],
  },
  {
    title: "Cerrados",
    tone: "is-green",
    cards: [
      {
        title: "Fuga en la cocina de personal",
        meta: "Mantenimiento",
        priority: "Alta",
        owner: "MG",
        due: "Ayer",
      },
    ],
  },
];

export const TicketsVisual = () => (
  <div className="lp-visual-frame lp-visual-tickets" aria-hidden="true">
    <div className="lp-tickets-bar">
      <span className="lp-segment is-active">Tablero</span>
      <span className="lp-segment">Lista</span>
      <span className="lp-tickets-search">
        <FaSearch /> Buscar ticket…
      </span>
      <span className="lp-tickets-new">
        <FaPlus /> Nuevo
      </span>
    </div>

    <div className="lp-kanban">
      {TICKET_COLUMNS.map((column) => (
        <div className="lp-kanban-col" key={column.title}>
          <header>
            <i className={column.tone} />
            <span>{column.title}</span>
            <small>{column.cards.length}</small>
          </header>
          {column.cards.map((card) => (
            <article className="lp-card" key={card.title}>
              <div className="lp-card-top">
                <span>{card.meta}</span>
                <FaEllipsisH />
              </div>
              <strong>{card.title}</strong>
              <div className="lp-card-foot">
                <span
                  className={`lp-pill ${
                    card.priority === "Urgente"
                      ? "is-red"
                      : card.priority === "Alta"
                        ? "is-amber"
                        : "is-slate"
                  }`}
                >
                  {card.priority}
                </span>
                <span className="lp-card-owner">
                  <span className="lp-avatar">{card.owner}</span>
                  {card.due}
                </span>
              </div>
            </article>
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const InventoryVisual = () => (
  <div className="lp-visual-frame lp-visual-asset" aria-hidden="true">
    <article className="lp-asset-card">
      <header>
        <span className="lp-asset-tag">LAP-0012</span>
        <span className="lp-pill is-blue">Prestada</span>
      </header>
      <div className="lp-asset-body">
        <span className="lp-asset-icon">
          <FaLaptop />
        </span>
        <div>
          <strong>MacBook Pro 14”</strong>
          <span>Apple · M3 Pro</span>
          <small>Serie C02XK0…9K</small>
        </div>
      </div>
      <div className="lp-asset-owner">
        <span className="lp-avatar">MG</span>
        <div>
          <strong>María González</strong>
          <span>Recepción · Carta CR-0042</span>
        </div>
        <FaFileSignature />
      </div>
    </article>

    <div className="lp-asset-timeline">
      <div className="lp-asset-step is-done">
        <FaCheck />
        <div>
          <strong>Alta en inventario</strong>
          <span>Activo fijo y serie</span>
        </div>
      </div>
      <div className="lp-asset-step is-done">
        <FaCheck />
        <div>
          <strong>Carta firmada</strong>
          <span>PDF con el responsable</span>
        </div>
      </div>
      <div className="lp-asset-step is-now">
        <FaClock />
        <div>
          <strong>En uso</strong>
          <span>Prestada a Recepción</span>
        </div>
      </div>
      <div className="lp-asset-step">
        <FaExchangeAlt />
        <div>
          <strong>Devolución</strong>
          <span>Con condición por pieza</span>
        </div>
      </div>
    </div>

    <div className="lp-asset-foot">
      <span>
        <FaShieldAlt /> Auditor de inventario · 8 reglas
      </span>
      <span>
        <FaClipboardCheck /> Kardex por pieza
      </span>
    </div>
  </div>
);

const PEOPLE = [
  { name: "María González", area: "Recepción", time: "07:02", status: "Presente", tone: "is-green" },
  { name: "Jorge Ramírez", area: "Cocina", time: "07:18", status: "Retardo", tone: "is-amber" },
  { name: "Ana Palma", area: "Ama de llaves", time: "—", status: "No llegó", tone: "is-red" },
  { name: "Luis Soto", area: "Mantenimiento", time: "06:58", status: "Presente", tone: "is-green" },
];

export const PeopleVisual = () => (
  <div className="lp-visual-frame lp-visual-people" aria-hidden="true">
    <header className="lp-people-head">
      <div>
        <span className="lp-visual-kicker">Asistencia de hoy</span>
        <strong>Miércoles 22 de octubre</strong>
      </div>
      <span className="lp-pill is-green">142 presentes</span>
    </header>

    <div className="lp-people-list">
      {PEOPLE.map((person) => (
        <div className="lp-people-row" key={person.name}>
          <span className="lp-avatar">
            {person.name
              .split(" ")
              .map((part) => part[0])
              .join("")}
          </span>
          <div>
            <strong>{person.name}</strong>
            <span>{person.area}</span>
          </div>
          <small>{person.time}</small>
          <span className={`lp-pill ${person.tone}`}>{person.status}</span>
        </div>
      ))}
    </div>

    <div className="lp-people-foot">
      <div className="lp-clock-card">
        <span>
          <FaClock /> Reloj checador
        </span>
        <strong>07:02</strong>
        <small>Entrada · Huella</small>
      </div>
      <div className="lp-payroll-card">
        <span>Pre nómina</span>
        <strong>Semana lista</strong>
        <small>3 aprobaciones pendientes</small>
      </div>
    </div>
  </div>
);

const KITCHEN_LOTS = [
  {
    lot: "Lote L-248",
    name: "Leche entera · 12 L",
    meta: "Refrigerado · Caduca 24 oct",
    status: "2 días",
    tone: "is-amber",
    stock: 34,
    low: false,
  },
  {
    lot: "Lote L-251",
    name: "Pechuga de pollo · 18 kg",
    meta: "Congelado · Caduca 30 oct",
    status: "Vigente",
    tone: "is-green",
    stock: 72,
    low: false,
  },
  {
    lot: "Sin lote",
    name: "Harina · 25 kg",
    meta: "Seco · Consumible",
    status: "Bajo mínimo",
    tone: "is-red",
    stock: 18,
    low: true,
  },
];

export const KitchenVisual = () => (
  <div className="lp-visual-frame lp-visual-kitchen" aria-hidden="true">
    <header className="lp-kitchen-head">
      <div>
        <span className="lp-visual-kicker">Almacén de cocina</span>
        <strong>Lo que hay que atender</strong>
      </div>
      <span className="lp-pill is-blue">Usar primero</span>
    </header>

    <div className="lp-lots">
      {KITCHEN_LOTS.map((lot) => (
        <article className={`lp-lot${lot.low ? " is-low" : ""}`} key={lot.name}>
          <header>
            <span>{lot.lot}</span>
            <span className={`lp-pill ${lot.tone}`}>{lot.status}</span>
          </header>
          <strong>{lot.name}</strong>
          <small>{lot.meta}</small>
          <div className="lp-stock">
            <i style={{ width: `${lot.stock}%` }} />
          </div>
        </article>
      ))}
    </div>

    <div className="lp-kitchen-foot">
      <span>
        <FaTruck /> OC-0042 · Aprobada
      </span>
      <span>
        <FaClipboardCheck /> Recepción parcial
      </span>
      <span>
        <FaFileSignature /> Factura cotejada
      </span>
    </div>
  </div>
);

const MATRIX_ROWS = [
  { role: "Empleado", view: "Propio", create: "Propio", edit: "off" },
  { role: "Jefe de área", view: "Área", create: "Área", edit: "Área" },
  { role: "Gerencia", view: "Todo", create: "Todo", edit: "Todo" },
  { role: "Administrador", view: "Todo", create: "Todo", edit: "Todo" },
];

export const RolesVisual = () => (
  <div className="lp-visual-frame lp-visual-roles" aria-hidden="true">
    <header className="lp-roles-head">
      <div>
        <span className="lp-visual-kicker">Matriz de permisos</span>
        <strong>Tickets</strong>
      </div>
      <span className="lp-pill is-blue">58 permisos</span>
    </header>

    <div className="lp-matrix">
      <div className="lp-matrix-row is-head">
        <span>Rol</span>
        <span>Ver</span>
        <span>Crear</span>
        <span>Editar</span>
      </div>
      {MATRIX_ROWS.map((row) => (
        <div className="lp-matrix-row" key={row.role}>
          <span>{row.role}</span>
          <span className="lp-scope">{row.view}</span>
          <span className="lp-scope">{row.create}</span>
          <span className={`lp-scope${row.edit === "off" ? " is-off" : ""}`}>
            {row.edit === "off" ? "—" : row.edit}
          </span>
        </div>
      ))}
    </div>

    <div className="lp-policy">
      <span className="lp-policy-icon">
        <FaLock />
      </span>
      <div>
        <span>Política activa</span>
        <strong>Sin autoaprobación de órdenes</strong>
        <small>Todos los roles · prioridad 1</small>
      </div>
    </div>

    <div className="lp-roles-foot">
      <span>
        <FaShieldAlt /> El servidor valida cada acción
      </span>
      <span>
        <FaChevronRight /> Simulador ¿Puede…?
      </span>
    </div>
  </div>
);

export const WebDevice = () => (
  <div className="lp-device lp-device-web" aria-hidden="true">
    <BrowserShell url="puerto-nuevo / inicio" className="lp-device-browser">
      <MiniDashboard />
    </BrowserShell>
  </div>
);

export const DesktopDevice = () => (
  <div className="lp-device lp-device-desktop" aria-hidden="true">
    <div className="lp-deskbar">
      <span />
      <span />
      <span />
      <i>Puerto Nuevo · Escritorio</i>
    </div>
    <div className="lp-desk-body">
      <aside>
        <span className="lp-desk-brand">
          <img src={isotipo} alt="" />
        </span>
        {[FaHome, FaTicketAlt, FaBoxes, FaUtensils].map((Icon, index) => (
          <span key={index} className={index === 0 ? "is-active" : ""}>
            <Icon />
          </span>
        ))}
      </aside>
      <div className="lp-desk-main">
        <small>Inicio · Gerencia</small>
        <strong>Buenos días</strong>
        <div className="lp-desk-lines">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
    <div className="lp-native-toast">
      <span className="lp-native-icon">
        <FaBell />
      </span>
      <div>
        <strong>Nueva tarea asignada</strong>
        <span>Revisar reporte de cocina · hace 1 min</span>
      </div>
    </div>
  </div>
);

export const PhoneDevice = () => (
  <div className="lp-device lp-device-phone" aria-hidden="true">
    <span className="lp-phone-notch" />
    <div className="lp-phone-screen">
      <header>
        <span className="lp-phone-brand">
          <img src={isotipo} alt="" />
        </span>
        <span>Portería</span>
        <FaBars />
      </header>

      <div className="lp-phone-scan">
        <FaQrcode />
        <i className="lp-scanline" />
      </div>

      <div className="lp-phone-person">
        <span className="lp-avatar">MG</span>
        <div>
          <strong>María González</strong>
          <span>Recepción</span>
        </div>
        <span className="lp-pill is-green">Dentro</span>
      </div>

      <div className="lp-phone-actions">
        <span className="is-primary">
          <FaCheck /> Registrar entrada
        </span>
        <span>Salida</span>
      </div>

      <div className="lp-phone-site">
        <FaMapMarkerAlt /> Portería principal
      </div>
    </div>
  </div>
);
