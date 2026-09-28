import { ITLayout, ITSidebarProps, ITToast, type ITNavigationItem } from "@axzydev/axzy_ui_system";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import {
  FaBoxes,
  FaHouseUser,
  FaTicketAlt,
  FaUserTie,
  FaCog,
} from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "@app/store";
import { logout, meThunk } from "@entities/user";
import { APP_SCREENS, isScreenVisible, type AppScreen } from "@entities/permission";
import { fetchUnreadCount, markNotificationRead, notificationRoute } from "@entities/notification";
import { desktop } from "@shared/lib/desktop";
import { useAblyNotifications, type LiveNotification } from "./useAblyNotifications";
import logoUrl from "@shared/assets/puerto-nuevo-logo.svg";

/** Icono del menú por pantalla (el catálogo vive en `@entities/permission`). */
const NAV_ICONS: Record<string, ReactNode> = {
  start: <FaHouseUser size={14} />,
  tasks: <FaTicketAlt size={14} />,
  inventory: <FaBoxes size={14} />,
  hr: <FaUserTie size={14} />,
  settings: <FaCog size={14} />,
};

export default function PrivateRoutes() {
  const { t: tt, i18n } = useTranslation(["common"]);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch<AppDispatch>();
  const { token, user } = useSelector((s: RootState) => s.auth);
  const unreadCount = useSelector((s: RootState) => s.notifications.unreadCount);
  const [toast, setToast] = useState<string | null>(null);

  // En la app de escritorio llega como notificación nativa del sistema; en el
  // navegador, como aviso dentro de la página.
  const handleNewNotification = useCallback(
    (n: LiveNotification) => {
      const title = n.title ?? i18n.t("notifications:newNotification");
      if (desktop) {
        desktop.notify({
          id: n.id,
          title,
          body: n.detail ?? undefined,
          route: notificationRoute(n) ?? "/notifications",
        });
        return;
      }
      setToast(title);
      setTimeout(() => setToast(null), 3000);
    },
    [i18n]
  );

  // Clic en una notificación nativa: la app ya se trajo al frente; se abre su
  // pantalla y se marca leída.
  useEffect(
    () =>
      desktop?.onNotificationClick(({ id, route }) => {
        if (id) void dispatch(markNotificationRead(id));
        if (route) navigate(route);
      }),
    [dispatch, navigate]
  );

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

  // El menú se arma desde el catálogo de pantallas (`APP_SCREENS`) y los
  // permisos efectivos (`GET /auth/me`); la web no reimplementa la matriz.
  const permissions = user?.permissions;

  const matchesPath = (
    path: string,
    match: "exact" | "prefix" | undefined,
    excludes: readonly string[] | undefined
  ): boolean => {
    const hit =
      match === "exact"
        ? location.pathname === path
        : location.pathname === path || location.pathname.startsWith(`${path}/`);
    if (!hit) return false;
    return !(excludes ?? []).some(
      (excluded) =>
        location.pathname === excluded || location.pathname.startsWith(`${excluded}/`)
    );
  };

  const isScreenActive = (screen: AppScreen): boolean => {
    if (screen.path && matchesPath(screen.path, screen.match, screen.excludes)) return true;
    return screen.children?.some((child) => isScreenActive(child)) ?? false;
  };

  const canView = (screen: AppScreen): boolean =>
    isScreenVisible(permissions, screen, user?.role);

  const toSubItem = (screen: AppScreen) => ({
    id: screen.id,
    label: tt(screen.labelKey),
    action: () => {
      if (screen.path) navigate(screen.path);
    },
    isActive: isScreenActive(screen),
  });

  const toNavigationItem = (screen: AppScreen): ITNavigationItem | null => {
    if (!canView(screen)) return null;
    const children = (screen.children ?? []).filter((child) => canView(child));
    return {
      id: screen.id,
      label: tt(screen.labelKey),
      icon: NAV_ICONS[screen.id],
      ...(screen.path ? { action: () => navigate(screen.path!) } : {}),
      isActive: isScreenActive(screen),
      ...(children.length > 0
        ? {
            // Una sección (hijo con hijos) va como grupo con título del ITSidebar.
            subitems: children.map((child) =>
              child.children?.length
                ? {
                    id: child.id,
                    label: tt(child.labelKey),
                    items: child.children.filter((leaf) => canView(leaf)).map(toSubItem),
                  }
                : toSubItem(child)
            ),
          }
        : {}),
    };
  };

  const navigationItems = APP_SCREENS.map(toNavigationItem).filter(
    (item): item is ITNavigationItem => item !== null
  );

  const handleLogout = () => {
    dispatch(logout());
    navigate("/login");
  };

  const sidebar: ITSidebarProps = {
    navigationItems,
    isCollapsed: true,
  };

  const topBar = {
    logo: (
      <img
        src={logoUrl}
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
              label:
                unreadCount > 0
                  ? tt("nav.notifications", { count: unreadCount })
                  : tt("nav.notifications"),
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
