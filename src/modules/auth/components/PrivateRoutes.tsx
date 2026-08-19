import { ITLayout } from "@axzydev/axzy_ui_system";
import { useEffect } from "react";
import {
  FaBuilding,
  FaChartBar,
  FaFileSignature,
  FaHouseUser,
  FaUserShield,
  FaUserTie,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { logout, meThunk } from "@core/store/auth/auth.slice";

export default function PrivateRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (token && !user) {
      dispatch(meThunk());
    }
  }, [token, user, dispatch]);

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const isAdmin = user?.role === "ADMIN";
  const isUser = isAdmin || user?.role === "USER";

  const active = (to: string) => location.pathname.startsWith(to);

  const navigationItems = [
    {
      id: "inicio",
      label: "Inicio",
      icon: <FaHouseUser size={14} />,
      action: () => navigate("/"),
      isActive: active("/") && location.pathname === "/",
    },
    ...(isUser
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
    ...(isUser
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
          menuItems: [{ label: "Cerrar sesión", onClick: handleLogout }],
        }
      : undefined,
  };

  return (
    <ITLayout topBar={topBar} sidebar={sidebar}>
      <Outlet />
    </ITLayout>
  );
}