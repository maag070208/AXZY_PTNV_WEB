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
import { logout, meThunk, can } from "@entities/user";
import { fetchUnreadCount } from "@entities/notification";
import { useAblyNotifications } from "./useAblyNotifications";

export default function PrivateRoutes() {
  const { t: tt, i18n } = useTranslation(["common"]);
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

  // Al abrir la app (o iniciar sesión) se refresca `/auth/me`: el usuario
  // guardado puede traer permisos o idioma viejos. Al volver a la ventana se
  // refresca otra vez para que un cambio aplique sin relogin.
  useEffect(() => {
    if (token) dispatch(meThunk());
  }, [token, dispatch]);

  // La interfaz sigue el idioma del sistema que trae la sesión.
  useEffect(() => {
    if (user?.language && user.language !== i18n.language) {
      void i18n.changeLanguage(user.language);
    }
  }, [user, i18n]);

  useEffect(() => {
    if (token) {
      dispatch(fetchUnreadCount());
    }
    if (!token) return undefined;
    const refreshSession = () => dispatch(meThunk());
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") dispatch(meThunk());
    };
    window.addEventListener("focus", refreshSession);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      window.removeEventListener("focus", refreshSession);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [token, user, dispatch]);

  useAblyNotifications(user?.id, handleNewNotification);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // El menú se arma por permisos efectivos (`GET /auth/me`); la web no
  // reimplementa la matriz de roles.
  const permissions = user?.permissions;
  const canViewDevices = can(permissions, "devices.view");
  const canViewLoans = can(permissions, "loans.view");
  const canViewInventory = canViewDevices || canViewLoans;
  const canViewReports = can(permissions, "reports.view");
  const canViewAccess = can(permissions, "access.log");
  const canViewTimeClock = can(permissions, "time_clock.view");
  const canViewSchedules = can(permissions, "schedules.view");
  const canViewOvertime = can(permissions, "overtime.view");
  const canViewHR = can(permissions, "hr.records");
  const canAdminCatalogs = can(permissions, "catalogs.manage");
  const canViewUsers = can(permissions, "users.view");
  const canAdminClocks = can(permissions, "time_clocks.manage");
  const canAdminRoles = can(permissions, "roles.manage");
  const canManageTasks = can(permissions, "tasks.complete");
  const isEmployee = user?.role === "EMPLOYEE";

  const active = (to: string) => location.pathname.startsWith(to);

  const navigationItems = [
    {
      id: "start",
      label: tt("nav.home"),
      icon: <FaHouseUser size={14} />,
      action: () => navigate("/"),
      isActive: active("/") && location.pathname === "/",
    },
    // TAREAS (Tickets, Admin Tareas, Mis Tareas)
    {
      id: "tasks",
      label: tt("nav.tasks"),
      icon: <FaTicketAlt size={14} />,
      isActive: active("/tickets"),
      subitems: [
        {
          id: "tickets",
          label: tt("nav.tickets"),
          action: () => navigate("/tickets"),
          isActive: active("/tickets") && !active("/tickets/tasks") && !active("/tickets/my-tasks"),
        },
        ...(canManageTasks
          ? [
            {
              id: "adminTasks",
              label: tt("nav.adminTasks"),
              action: () => navigate("/tickets/tasks"),
              isActive: active("/tickets/tasks"),
            },
          ]
          : []),
        ...(isEmployee
          ? [
            {
              id: "myTasks",
              label: tt("nav.myTasks"),
              action: () => navigate("/tickets/my-tasks"),
              isActive: active("/tickets/my-tasks"),
            },
          ]
          : []),
      ],
    },
    // INVENTARIO (dispositivos.ver / prestamos.ver)
    ...(canViewInventory
      ? [
        {
          id: "inventory",
          label: tt("nav.inventory"),
          icon: <FaBoxes size={14} />,
          isActive: active("/inventory"),
          subitems: [
            ...(canViewDevices
              ? [
                {
                  id: "dashboard",
                  label: tt("nav.inventory"),
                  action: () => navigate("/inventory"),
                  isActive: active("/inventory") && location.pathname === "/inventory",
                },
                {
                  id: "devices",
                  label: tt("nav.devices"),
                  action: () => navigate("/inventory/devices"),
                  isActive: active("/inventory/devices"),
                },
                {
                  id: "movements",
                  label: tt("nav.movements"),
                  action: () => navigate("/inventory/movements"),
                  isActive: active("/inventory/movements"),
                },
              ]
              : []),
            ...(canViewLoans
              ? [
                {
                  id: "loans",
                  label: tt("nav.loans"),
                  action: () => navigate("/inventory/loans"),
                  isActive: active("/inventory/loans"),
                },
                {
                  id: "returns",
                  label: tt("nav.returns"),
                  action: () => navigate("/inventory/returns"),
                  isActive: active("/inventory/returns"),
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    // REPORTES (reportes.ver)
    ...(canViewReports
      ? [
        {
          id: "reports",
          label: tt("nav.reports"),
          icon: <FaChartBar size={14} />,
          action: () => navigate("/reports"),
          isActive: active("/reports"),
        },
      ]
      : []),
    // CONTROL DE ACCESO (acceso.bitacora / checador.ver)
    ...(canViewAccess || canViewTimeClock
      ? [
        {
          id: "access",
          label: tt("nav.access"),
          icon: <FaDoorOpen size={14} />,
          isActive: active("/access"),
          subitems: [
            ...(canViewAccess
              ? [
                {
                  id: "accessLog",
                  label: tt("nav.accessLog"),
                  action: () => navigate("/access"),
                  isActive:
                    active("/access") && !active("/access/report") && !active("/access/time-clock"),
                },
                {
                  id: "accessReport",
                  label: tt("nav.accessReport"),
                  action: () => navigate("/access/report"),
                  isActive: active("/access/report"),
                },
              ]
              : []),
            ...(canViewTimeClock
              ? [
                {
                  id: "accessTimeClock",
                  label: tt("nav.accessTimeClock"),
                  action: () => navigate("/access/time-clock"),
                  isActive: location.pathname === "/access/time-clock",
                },
                {
                  id: "accessTimeClockReport",
                  label: tt("nav.accessTimeClockReport"),
                  action: () => navigate("/access/time-clock/entries-exits"),
                  isActive: active("/access/time-clock/entries-exits"),
                },
                {
                  id: "accessTimeClockEmployees",
                  label: tt("nav.accessTimeClockEmployees"),
                  action: () => navigate("/access/time-clock/employees"),
                  isActive: active("/access/time-clock/employees"),
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    // HORARIOS (horarios.ver; horas extra con horas_extra.ver)
    ...(canViewSchedules
      ? [
        {
          id: "schedules",
          label: tt("nav.schedules"),
          icon: <FaRegClock size={14} />,
          isActive: active("/schedules"),
          subitems: [
            {
              id: "schedulesAdmin",
              label: tt("nav.schedulesAdmin"),
              action: () => navigate("/schedules"),
              isActive: active("/schedules") && location.pathname === "/schedules",
            },
            {
              id: "schedulesAssign",
              label: tt("nav.schedulesAssign"),
              action: () => navigate("/schedules/assign"),
              isActive: active("/schedules/assign"),
            },
            ...(canViewOvertime
              ? [
                {
                  id: "overtime",
                  label: tt("nav.overtime"),
                  action: () => navigate("/schedules/overtime/approval"),
                  isActive: active("/schedules/overtime/approval"),
                },
              ]
              : []),
          ],
        },
      ]
      : []),
    // RECURSOS HUMANOS (personal.expediente — expediente completo del personal)
    ...(canViewHR
      ? [
        {
          id: "hr",
          label: tt("nav.hr"),
          icon: <FaUserTie size={14} />,
          isActive: active("/employees"),
          subitems: [
            {
              id: "employees",
              label: tt("nav.employees"),
              action: () => navigate("/employees"),
              isActive: active("/employees") && !active("/employees/disciplinary-reports"),
            },
            {
              id: "hrReports",
              label: tt("nav.hrReports"),
              action: () => navigate("/employees/disciplinary-reports"),
              isActive: active("/employees/disciplinary-reports"),
            },
          ],
        },
      ]
      : []),
    // CONFIGURACIÓN (catalogos.administrar / usuarios.ver / relojes.administrar / roles.administrar)
    ...(canAdminCatalogs || canViewUsers || canAdminClocks || canAdminRoles
      ? [
        {
          id: "settings",
          label: tt("nav.settings"),
          icon: <FaCog size={14} />,
          isActive:
            active("/catalogs") ||
            active("/users") ||
            active("/time-clocks") ||
            active("/roles"),
          subitems: [
            ...(canAdminCatalogs
              ? [
                {
                  id: "catalogs",
                  label: tt("nav.catalogs"),
                  action: () => navigate("/catalogs"),
                  isActive: active("/catalogs"),
                },
              ]
              : []),
            ...(canViewUsers
              ? [
                {
                  id: "users",
                  label: tt("nav.users"),
                  action: () => navigate("/users"),
                  isActive: active("/users"),
                },
              ]
              : []),
            // Alta/baja de relojes checadores: solo ADMIN (relojes.administrar).
            ...(canAdminClocks
              ? [
                {
                  id: "clocks",
                  label: tt("nav.clocks"),
                  action: () => navigate("/time-clocks"),
                  isActive: active("/time-clocks"),
                },
              ]
              : []),
            // Matriz de roles y catálogo de permisos: solo ADMIN (roles.administrar).
            ...(canAdminRoles
              ? [
                {
                  id: "roles",
                  label: tt("nav.roles"),
                  action: () => navigate("/roles"),
                  isActive: active("/roles"),
                },
              ]
              : []),
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
            onClick: () => navigate("/notifications"),
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
