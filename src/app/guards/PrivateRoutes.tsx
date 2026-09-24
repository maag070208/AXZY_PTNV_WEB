import { ITLayout, ITSidebarProps, ITToast } from "@axzydev/axzy_ui_system";
import { useEffect, useState, useCallback } from "react";
import {
  FaBoxes,
  FaChartBar,
  FaDoorOpen,
  FaHouseUser,
  FaMapMarkerAlt,
  FaTasks,
  FaTicketAlt,
  FaUserShield,
  FaUserTie,
  FaCog,
  FaClipboardList,
  FaRegClock,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "@app/store";
import { logout, meThunk } from "@entities/user";
import { fetchUnreadCount } from "@entities/notification";
import { useAblyNotifications } from "./useAblyNotifications";

export default function PrivateRoutes() {
  const { t: tt } = useTranslation(["common"]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const unreadCount = useSelector((s: RootState) => s.notifications.unreadCount);
  const [toast, setToast] = useState<string | null>(null);

  const handleNewNotification = useCallback((title: string) => {
    setToast(title);
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    if (token && !user) {
      dispatch(meThunk());
    }
    if (token) {
      dispatch(fetchUnreadCount());
    }
  }, [token, user, dispatch]);

  useAblyNotifications(user?.id, handleNewNotification);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = user?.role === "ADMIN" || user?.role === "GERENTE";
  const isJefeArea = user?.role === "JEFE_DE_AREA";
  const isEmpleado = user?.role === "EMPLEADO";
  const canManage = isAdmin || isJefeArea;
  // Personal/RH: expediente completo (médico, oficial, contacto de emergencia,
  // documentos) es exclusivo de ADMIN y RECURSOS_HUMANOS — no de GERENTE.
  const canManageHR = user?.role === "ADMIN" || user?.role === "RECURSOS_HUMANOS";
  // Bitácora de accesos: ADMIN, GERENTE y RECURSOS_HUMANOS. JEFE_DE_AREA y
  // EMPLEADO quedan fuera (ver ENTRADAS_SALIDAS.md §4).
  const canViewAccess =
    user?.role === "ADMIN" || user?.role === "GERENTE" || user?.role === "RECURSOS_HUMANOS";

  const active = (to: string) => location.pathname.startsWith(to);

  const navigationItems = [
    {
      id: "inicio",
      label: tt("nav.home"),
      icon: <FaHouseUser size={14} />,
      action: () => navigate("/"),
      isActive: active("/") && location.pathname === "/",
    },
    // TAREAS (Tickets, Admin Tareas, Mis Tareas)
    {
      id: "tareas",
      label: "Tareas",
      icon: <FaTicketAlt size={14} />,
      isActive: active("/tickets"),
      subitems: [
        {
          id: "tickets",
          label: tt("nav.tickets"),
          action: () => navigate("/tickets"),
          isActive: active("/tickets") && !active("/tickets/tareas") && !active("/tickets/mis-tareas"),
        },
        ...(user?.role === "ADMIN" || user?.role === "GERENTE"
          ? [
            {
              id: "adminTareas",
              label: tt("nav.adminTasks"),
              action: () => navigate("/tickets/tareas"),
              isActive: active("/tickets/tareas"),
            },
          ]
          : []),
        ...(!canManage && isEmpleado
          ? [
            {
              id: "misTareas",
              label: tt("nav.myTasks"),
              action: () => navigate("/tickets/mis-tareas"),
              isActive: active("/tickets/mis-tareas"),
            },
          ]
          : []),
      ],
    },
    // INVENTARIO (solo ADMIN)
    ...(isAdmin
      ? [
        {
          id: "inventario",
          label: tt("nav.inventory"),
          icon: <FaBoxes size={14} />,
          isActive: active("/inventario"),
          subitems: [
            {
              id: "dashboard",
              label: tt("nav.inventory"),
              action: () => navigate("/inventario"),
              isActive: active("/inventario") && location.pathname === "/inventario",
            },
            {
              id: "dispositivos",
              label: tt("nav.devices"),
              action: () => navigate("/inventario/dispositivos"),
              isActive: active("/inventario/dispositivos"),
            },
            {
              id: "movimientos",
              label: tt("nav.movimientos"),
              action: () => navigate("/inventario/movimientos"),
              isActive: active("/inventario/movimientos"),
            },
            {
              id: "prestamos",
              label: tt("nav.prestamos"),
              action: () => navigate("/inventario/prestamos"),
              isActive: active("/inventario/prestamos"),
            },
            {
              id: "devoluciones",
              label: tt("nav.devoluciones"),
              action: () => navigate("/inventario/devoluciones"),
              isActive: active("/inventario/devoluciones"),
            },
          ],
        },
      ]
      : []),
    // REPORTES (solo ADMIN)
    ...(isAdmin
      ? [
        {
          id: "reportes",
          label: tt("nav.reports"),
          icon: <FaChartBar size={14} />,
          action: () => navigate("/reportes"),
          isActive: active("/reportes"),
        },
      ]
      : []),
    // CONTROL DE ACCESO (ADMIN, GERENTE y RECURSOS_HUMANOS — bitácora de entradas/salidas)
    ...(canViewAccess
      ? [
        {
          id: "accesos",
          label: tt("nav.access"),
          icon: <FaDoorOpen size={14} />,
          isActive: active("/access"),
          subitems: [
            {
              id: "accessLog",
              label: tt("nav.accessLog"),
              action: () => navigate("/access"),
              isActive:
                active("/access") && !active("/access/report") && !active("/access/checador"),
            },
            {
              id: "accessReport",
              label: tt("nav.accessReport"),
              action: () => navigate("/access/report"),
              isActive: active("/access/report"),
            },
            {
              id: "accessChecador",
              label: tt("nav.accessChecador"),
              action: () => navigate("/access/checador"),
              isActive: location.pathname === "/access/checador",
            },
            {
              id: "accessChecadorReport",
              label: tt("nav.accessChecadorReport"),
              action: () => navigate("/access/checador/entradas-salidas"),
              isActive: active("/access/checador/entradas-salidas"),
            },
            {
              id: "accessChecadorEmpleados",
              label: tt("nav.accessChecadorEmpleados"),
              action: () => navigate("/access/checador/empleados"),
              isActive: active("/access/checador/empleados"),
            },
          ],
        },
      ]
      : []),
    // HORARIOS (ADMIN, GERENTE, RECURSOS_HUMANOS — administración, asignación y horas extra)
    ...(canViewAccess
      ? [
        {
          id: "horarios",
          label: tt("nav.schedules"),
          icon: <FaRegClock size={14} />,
          isActive: active("/horarios"),
          subitems: [
            {
              id: "schedulesAdmin",
              label: tt("nav.schedulesAdmin"),
              action: () => navigate("/horarios"),
              isActive: active("/horarios") && location.pathname === "/horarios",
            },
            {
              id: "schedulesAssign",
              label: tt("nav.schedulesAssign"),
              action: () => navigate("/horarios/asignar"),
              isActive: active("/horarios/asignar"),
            },
            {
              id: "overtime",
              label: tt("nav.overtime"),
              action: () => navigate("/horarios/horas-extra"),
              isActive:
                active("/horarios/horas-extra") &&
                !active("/horarios/horas-extra/aprobacion"),
            },
            ...(isAdmin
              ? [
                {
                  id: "overtimeApproval",
                  label: tt("nav.overtimeApproval"),
                  action: () => navigate("/horarios/horas-extra/aprobacion"),
                  isActive: active("/horarios/horas-extra/aprobacion"),
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    // RECURSOS HUMANOS (ADMIN y RECURSOS_HUMANOS — expediente completo del personal)
    ...(canManageHR
      ? [
        {
          id: "recursosHumanos",
          label: tt("nav.hr"),
          icon: <FaUserTie size={14} />,
          isActive: active("/empleados"),
          subitems: [
            {
              id: "personal",
              label: tt("nav.employees"),
              action: () => navigate("/empleados"),
              isActive: active("/empleados") && !active("/empleados/reportes"),
            },
            {
              id: "reportesPersonal",
              label: tt("nav.hrReports"),
              action: () => navigate("/empleados/reportes"),
              isActive: active("/empleados/reportes"),
            },
          ],
        },
      ]
      : []),
    // CONFIGURACIÓN (solo ADMIN)
    ...(isAdmin
      ? [
        {
          id: "configuracion",
          label: "Configuración",
          icon: <FaCog size={14} />,
          isActive: active("/catalogos") || active("/usuarios"),
          subitems: [
            {
              id: "catalogos",
              label: tt("nav.catalogs"),
              action: () => navigate("/catalogos"),
              isActive: active("/catalogos"),
            },
            {
              id: "usuarios",
              label: tt("nav.users"),
              action: () => navigate("/usuarios"),
              isActive: active("/usuarios"),
            },
          ],
        },
      ]
      : []),
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const sidebar:ITSidebarProps = {
    navigationItems,
    isCollapsed:true,
  };

  const topBar = {
    logo: (
      <img
        src="/logo-puerto-nuevo.png"
        alt="Puerto Nuevo Hotel y Villas"
        className="h-12 w-auto object-contain"
      />
    ),
    logoText: "Puerto Nuevo",
    userMenu: user
      ? {
        userName: user.name ?? "—",
        userEmail: user.username,
        menuItems: [
          {
            label: unreadCount > 0 ? tt('nav.notifications', { count: unreadCount }) : tt('nav.notifications'),
            onClick: () => navigate("/notificaciones"),
          },
          { label: tt("nav.logout"), onClick: handleLogout },
        ],
      }
      : undefined,
  };

  return (
    <>
      <ITLayout topBar={topBar} sidebar={sidebar} contentClassName="max-w-full! m-0! !px-2">
        <Outlet />
      </ITLayout>
      {toast && (
        <ITToast
          message={toast}
          type="info"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
}
