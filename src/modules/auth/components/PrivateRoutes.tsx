import { ITCard, ITLayout, ITToast } from "@axzydev/axzy_ui_system";
import { useEffect, useState, useCallback } from "react";
import {
  FaBuilding,
  FaChartBar,
  FaFileSignature,
  FaHouseUser,
  FaTicketAlt,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { logout, meThunk } from "@core/store/auth/auth.slice";
import {
  fetchUnreadCount,
} from "@core/store/notifications/notifications.slice";
import { useAblyNotifications } from "@core/hooks/useAbly";

export default function PrivateRoutes() {
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
      label: "Inicio",
      icon: <FaHouseUser size={14} />,
      action: () => navigate("/"),
      isActive: active("/") && location.pathname === "/",
    },
    {
      id: "tickets",
      label: "Tickets",
      icon: <FaTicketAlt size={14} />,
      action: () => navigate("/tickets"),
      isActive: active("/tickets"),
    },
    ...(canManage
      ? [
        {
          id: "cartas",
          label: "Cartas",
          icon: <FaFileSignature size={14} />,
          action: () => navigate("/cartas"),
          isActive: active("/cartas"),
        },
      ]
      : []),
    ...(!canManage && isEmpleado
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
          id: "dispositivos",
          label: "Dispositivos",
          icon: <FaChartBar size={14} />,
          action: () => navigate("/dispositivos"),
          isActive: active("/dispositivos"),
        },
      ]
      : []),
    ...(canManage
      ? [
        {
          id: "reportes",
          label: "Reportes",
          icon: <FaChartBar size={14} />,
          action: () => navigate("/reportes"),
          isActive: active("/reportes"),
        },
        {
          id: "empleados",
          label: "Empleados",
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
          label: "Departamentos",
          icon: <FaBuilding size={14} />,
          action: () => navigate("/departamentos"),
          isActive: active("/departamentos"),
        },
        {
          id: "usuarios",
          label: "Usuarios",
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
    logoText: "Cartas Responsivas",
    userMenu: user
      ? {
        userName: user.name ?? "—",
        userEmail: user.username,
        menuItems: [
          {
            label: unreadCount > 0 ? `Notificaciones (${unreadCount})` : "Notificaciones",
            onClick: () => navigate("/notificaciones"),
          },
          { label: "Cerrar sesión", onClick: handleLogout },
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