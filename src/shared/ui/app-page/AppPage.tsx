import { ITPage, type ITBreadcrumbItem, type ITPageProps } from "@axzydev/axzy_ui_system";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";
import { fallbackLabel, useNavigationTrail, useRegisterTrailLabel } from "@shared/lib/navigation-trail";

/**
 * `ITPage` con memoria: los breadcrumbs reflejan el camino realmente recorrido
 * y la flecha de regreso vuelve a la pantalla previa del rastro.
 */
export default function AppPage({ breadcrumbs, backAction, title, ...rest }: ITPageProps) {
  const { t } = useTranslation("common");
  const navigate = useNavigate();
  const location = useLocation();
  const { trail } = useNavigationTrail();
  const key = location.pathname + location.search;
  const isHome = location.pathname === "/";
  const homeLabel = t("breadcrumbs.home");

  const ownLabel = isHome
    ? homeLabel
    : (breadcrumbs?.[breadcrumbs.length - 1]?.label ?? (typeof title === "string" ? title : undefined));
  useRegisterTrailLabel(ownLabel);

  const labelOf = (entry: { key: string; label: string }) =>
    entry.key === "/" || entry.key.startsWith("/?") ? homeLabel : entry.label || fallbackLabel(entry.key);

  const hasTrail = trail.length >= 2 && trail[trail.length - 1].key === key;
  const prev = hasTrail ? trail[trail.length - 2] : undefined;

  const trailCrumbs = useMemo<ITBreadcrumbItem[] | undefined>(() => {
    if (!hasTrail) return undefined;
    const crumbs: ITBreadcrumbItem[] = [];
    if (trail[0].key !== "/" && !trail[0].key.startsWith("/?")) {
      crumbs.push({ label: homeLabel, onClick: () => navigate("/", { state: { navRoot: true } }) });
    }
    trail.slice(0, -1).forEach((entry) => {
      crumbs.push({ label: labelOf(entry), onClick: () => navigate(entry.key) });
    });
    crumbs.push({ label: ownLabel ?? labelOf(trail[trail.length - 1]) });
    return crumbs;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasTrail, trail, homeLabel, ownLabel, navigate]);

  const handleBack = backAction ? (prev ? () => navigate(prev.key) : backAction) : undefined;

  return <ITPage {...rest} title={title} breadcrumbs={trailCrumbs ?? breadcrumbs} backAction={handleBack} />;
}
