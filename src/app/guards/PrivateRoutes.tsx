import { ITCard, ITLayout, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { useEffect, useState, useCallback } from "react";
import {
  FaBuilding,
  FaChartBar,
  FaFileSignature,
  FaHouseUser,
  FaTasks,
  FaTicketAlt,
  FaUserShield,
  FaUserTie,
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

  const active = (to: string) => location.pathname.startsWith(to);

  const navigationItems = [
    {
      id: "inicio",
      label: tt("nav.home"),
      icon: <FaHouseUser size={14} />,
      action: () => navigate("/"),
      isActive: active("/") && location.pathname === "/",
    },
    {
      id: "tickets",
      label: tt("nav.tickets"),
      icon: <FaTicketAlt size={14} />,
      action: () => navigate("/tickets"),
      isActive: active("/tickets"),
    },
    ...(user?.role === "ADMIN" || user?.role === "GERENTE"
      ? [
        {
          id: "adminTareas",
          label: tt("nav.adminTasks"),
          icon: <FaTasks size={14} />,
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
          icon: <FaTasks size={14} />,
          action: () => navigate("/tickets/mis-tareas"),
          isActive: active("/tickets/mis-tareas"),
        },
        {
          id: "misCartas",
          label: tt("nav.myCartas"),
          icon: <FaFileSignature size={14} />,
          action: () => navigate("/cartas"),
          isActive: active("/cartas"),
        },
      ]
      : []),
    ...(isJefeArea
      ? [
        {
          id: "misCartas",
          label: "Mis Cartas",
          icon: <FaFileSignature size={14} />,
          action: () => navigate("/cartas"),
          isActive: active("/cartas"),
        },
      ]
      : []),
    ...(isAdmin
      ? [
        {
          id: "cartas",
          label: tt("nav.cartas"),
          icon: <FaFileSignature size={14} />,
          action: () => navigate("/cartas"),
          isActive: active("/cartas"),
        },
      ]
      : []),
    ...(isAdmin
      ? [
        {
          id: "dispositivos",
          label: tt("nav.devices"),
          icon: <FaChartBar size={14} />,
          action: () => navigate("/dispositivos"),
          isActive: active("/dispositivos"),
        },
      ]
      : []),
    ...(isAdmin
      ? [
        {
          id: "reportes",
          label: tt("nav.reports"),
          icon: <FaChartBar size={14} />,
          action: () => navigate("/reportes"),
          isActive: active("/reportes"),
        },
        {
          id: "empleados",
          label: tt("nav.employees"),
          icon: <FaUserTie size={14} />,
          action: () => navigate("/empleados"),
          isActive: active("/empleados"),
        },
      ]
      : []),
    ...(isAdmin
      ? [
        {
          id: "departamentos",
          label: tt("nav.departments"),
          icon: <FaBuilding size={14} />,
          action: () => navigate("/departamentos"),
          isActive: active("/departamentos"),
        },
        {
          id: "usuarios",
          label: tt("nav.users"),
          icon: <FaUserShield size={14} />,
          action: () => navigate("/usuarios"),
          isActive: active("/usuarios"),
        },
      ]
      : []),
  ];

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const sidebar = {
    navigationItems,
  };

  const topBar = {
    logo: (
      <img
        src="/logo-puerto-nuevo.png"
        alt="Puerto Nuevo Hotel y Villas"
        className="h-9 w-auto object-contain"
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
      <ITLayout topBar={topBar} sidebar={sidebar} contentClassName="max-w-full">
        <ITCard>
          <Outlet />
        </ITCard>
      </ITLayout>
      <div className="w-full py-3 flex justify-center items-center bg-slate-50 border-t border-slate-200">
        <ITText className="text-[10px] text-slate-400">
          powered by <span className="font-bold text-slate-500">axzy.dev</span>
        </ITText>
      </div>
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
