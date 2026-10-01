import { useMemo, useState } from "react";
import { ITAlert, ITButton, ITCheckbox, ITInput, ITSegmentedControl, ITSelect } from "@axzydev/axzy_ui_system";
import { FaChevronDown, FaChevronRight, FaExternalLinkAlt, FaSearch, FaUserSecret, FaVial } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AccessPermissionView, PermissionCatalog, PermissionMap } from "@entities/permission";
import { roleLabel } from "@entities/user";
import { LottieLoader } from "@shared/ui/lottie-loader";
import { formatDate } from "@shared/i18n/format";
import { groupByModule, isScopedPermission, moduleCoverage, moduleLevel } from "../../model/access-levels";
import { initialsOfName, matchesMember, memberRoles, type AccessMembersState } from "../../model/useAccessMembers";
import { useUserAccess } from "../../model/useUserAccess";
import { AccessLevelBadge, CoverageBar } from "../shared/AccessLevel";
import { RoleChip } from "../shared/RoleAvatar";
import { ScopeChip } from "../shared/Scope";
import ScreensAccessList from "../shared/ScreensAccessList";
import SidebarPreview from "../shared/SidebarPreview";
import VerbIcon from "../shared/VerbIcon";

interface Props {
  members: AccessMembersState;
  catalog: readonly PermissionCatalog[];
  roles: readonly string[];
  userId: string | null;
  onSelectUser: (userId: string) => void;
  /** Abre el probador con esta persona. */
  onTest: (userId: string) => void;
  /** Cambia cuando se guarda la matriz o los roles de alguien: vuelve a pedir el acceso. */
  refreshKey: number;
  /** Hay cambios sin guardar en la matriz (el acceso mostrado es el guardado). */
  draftDirty: boolean;
  onOpenRole: (role: string) => void;
}

type View = "permissions" | "screens";

/**
 * Visor de acceso por persona: sus roles, lo que puede hacer en cada módulo y
 * de dónde le viene (rol o excepción), y las pantallas que ve. Lo calcula la
 * API con el mismo resolvedor de las rutas.
 */
export default function UserAccessExplorer({
  members,
  catalog,
  roles,
  userId,
  onSelectUser,
  onTest,
  refreshKey,
  draftDirty,
  onOpenRole,
}: Props) {
  const { t } = useTranslation("roles");
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [showInactive, setShowInactive] = useState(false);
  const [view, setView] = useState<View>("permissions");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const { access, loading, error } = useUserAccess(userId, refreshKey);

  const list = members.members.filter(
    (member) =>
      (showInactive || member.active) &&
      (!roleFilter || memberRoles(member).includes(roleFilter)) &&
      matchesMember(member, query)
  );

  const byKey = useMemo(() => new Map((access?.permissions ?? []).map((row) => [row.key, row])), [access]);
  const effective = useMemo<PermissionMap>(() => {
    const map: PermissionMap = {};
    for (const row of access?.permissions ?? []) if (row.effective !== "NONE") map[row.key] = row.effective;
    return map;
  }, [access]);
  const groups = useMemo(() => groupByModule(catalog.filter((permission) => permission.active)), [catalog]);

  const toggleModule = (module: string) =>
    setExpanded((previous) => {
      const next = new Set(previous);
      if (next.has(module)) next.delete(module);
      else next.add(module);
      return next;
    });

  const sources = (row: AccessPermissionView, permission: PermissionCatalog) => {
    const scoped = isScopedPermission(permission);
    const entries = Object.entries(row.byRole);
    return (
      <div className="flex flex-wrap items-center justify-end gap-1">
        {row.exception && (
          <span
            className="inline-flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700"
            title={row.exception.reason ?? undefined}
          >
            {t("explorer.exception")} ·{" "}
            {row.exception.scope === "NONE"
              ? t("explorer.removed")
              : scoped
                ? t(`scope.${row.exception.scope}`)
                : t("matrix.granted")}
            {row.exception.expiresAt && <> · {t("explorer.until", { date: formatDate(row.exception.expiresAt) })}</>}
          </span>
        )}
        {entries.map(([role, scope]) => (
          <RoleChip key={role} role={role} muted={row.exception !== null} suffix={scoped ? t(`scope.${scope}`) : undefined} />
        ))}
      </div>
    );
  };

  return (
    <div className="grid items-start gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
      {/* Personas */}
      <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 lg:sticky lg:top-4">
        <ITInput
          name="explorer_search"
          size="sm"
          placeholder={t("explorer.search")}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          iconLeft={<FaSearch size={11} />}
        />
        <ITSelect
          name="explorer_role"
          size="sm"
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          options={[{ value: "", label: t("explorer.allRoles") }, ...roles.map((role) => ({ value: role, label: roleLabel(role) }))]}
        />
        <ITCheckbox
          name="explorer_inactive"
          checked={showInactive}
          onChange={(checked) => setShowInactive(checked)}
          label={t("explorer.showInactive")}
        />
        <div className="flex max-h-[62vh] flex-col gap-0.5 overflow-y-auto">
          {list.map((member) => {
            const selected = member.id === userId;
            return (
              <button
                key={member.id}
                type="button"
                onClick={() => onSelectUser(member.id)}
                className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                  selected ? "border-[#0D5777]/40 !bg-[#0D5777]/5" : "border-transparent !bg-transparent hover:!bg-slate-50"
                } ${member.active ? "" : "opacity-60"}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D5777]/10 text-[10px] font-black text-[#0D5777]">
                  {initialsOfName(member.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate text-[12px] font-bold ${selected ? "text-[#0D5777]" : "text-slate-800"}`}>
                    {member.name}
                  </span>
                  <span className="block truncate text-[10px] text-slate-400">{memberRoles(member).map(roleLabel).join(" · ")}</span>
                </span>
                {member.exceptions > 0 && (
                  <span
                    className="h-2 w-2 shrink-0 rounded-full bg-violet-500"
                    title={t("members.exceptions", { count: member.exceptions })}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Acceso de la persona */}
      <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
        {!userId && (
          <div className="flex flex-col items-center gap-2 py-14 text-center">
            <FaUserSecret size={28} className="text-slate-300" />
            <p className="text-[13px] font-bold text-slate-700">{t("explorer.emptyTitle")}</p>
            <p className="max-w-md text-[11px] text-slate-500">{t("explorer.emptyBody")}</p>
          </div>
        )}

        {userId && loading && !access && (
          <div className="flex justify-center py-14">
            <LottieLoader />
          </div>
        )}

        {userId && error && (
          <ITAlert variant="error" dismissible={false}>
            {error}
          </ITAlert>
        )}

        {userId && access && (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0D5777] text-[12px] font-black text-white">
                {initialsOfName(access.user.name)}
              </span>
              <div className="min-w-[200px] flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <h2 className="text-[15px] font-black text-slate-900">{access.user.name}</h2>
                  {!access.user.active && (
                    <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600">
                      {t("members.inactive")}
                    </span>
                  )}
                </div>
                <p className="truncate text-[11px] text-slate-500">
                  @{access.user.username}
                  {access.user.employeeNumber && <> · #{access.user.employeeNumber}</>}
                  {access.user.department && <> · {access.user.department}</>}
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <ITButton variant="filled" color="primary" size="sm" onClick={() => onTest(access.user.id)}>
                  <span className="flex items-center gap-1 text-[11px] font-bold">
                    <FaVial size={9} /> {t("explorer.test")}
                  </span>
                </ITButton>
                <ITButton variant="outlined" color="primary" size="sm" onClick={() => navigate(`/users/${access.user.id}/edit`)}>
                  <span className="flex items-center gap-1 text-[11px] font-bold">
                    <FaExternalLinkAlt size={8} /> {t("explorer.openProfile")}
                  </span>
                </ITButton>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {access.roles.map((role) => (
                <RoleChip
                  key={role.key}
                  role={role.key}
                  muted={!role.active}
                  suffix={role.primary ? t("members.primary") : !role.active ? t("access.inactiveRole") : undefined}
                  onClick={() => onOpenRole(role.key)}
                />
              ))}
              {access.user.exceptions > 0 && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                  {t("members.exceptions", { count: access.user.exceptions })}
                </span>
              )}
              <span className="ml-auto">
                <ITSegmentedControl
                  size="sm"
                  value={view}
                  onChange={(value) => setView(value as View)}
                  options={[
                    { value: "permissions", label: t("explorer.view.permissions") },
                    { value: "screens", label: t("explorer.view.screens") },
                  ]}
                />
              </span>
            </div>

            {draftDirty && <p className="rounded-lg bg-amber-50 px-3 py-1.5 text-[11px] text-amber-800">{t("explorer.draftNote")}</p>}

            {view === "permissions" && (
              <div className="overflow-hidden rounded-lg border border-slate-200">
                {groups.map(([module, permissions], groupIndex) => {
                  const scope = (key: string) => byKey.get(key)?.effective ?? "NONE";
                  const level = moduleLevel(permissions, scope);
                  const coverage = moduleCoverage(permissions, scope);
                  const open = expanded.has(module);
                  return (
                    <div key={module} className={groupIndex > 0 ? "border-t border-slate-200" : ""}>
                      <button
                        type="button"
                        onClick={() => toggleModule(module)}
                        className={`flex w-full items-center gap-2 px-3 py-2 text-left ${open ? "!bg-slate-50" : "!bg-white hover:!bg-slate-50/70"}`}
                      >
                        {open ? <FaChevronDown size={9} className="text-slate-400" /> : <FaChevronRight size={9} className="text-slate-400" />}
                        <span className={`flex-1 text-[12px] font-bold ${level === "NONE" ? "text-slate-400" : "text-slate-800"}`}>{module}</span>
                        <span className="w-28">
                          <AccessLevelBadge level={level} />
                        </span>
                        <CoverageBar granted={coverage.granted} total={coverage.total} level={level} className="w-24" />
                      </button>
                      {open &&
                        permissions.map((permission) => {
                          const row = byKey.get(permission.key);
                          if (!row) return null;
                          const granted = row.effective !== "NONE";
                          return (
                            <div key={permission.key} className="flex flex-wrap items-center gap-2 border-t border-slate-100 py-1.5 pl-8 pr-3">
                              <VerbIcon permissionKey={permission.key} />
                              <span className={`min-w-[160px] flex-1 text-[12px] font-semibold ${granted ? "text-slate-800" : "text-slate-400"}`}>
                                {permission.name}
                              </span>
                              <ScopeChip scope={row.effective} scoped={isScopedPermission(permission)} />
                              <div className="min-w-[140px]">{sources(row, permission)}</div>
                            </div>
                          );
                        })}
                    </div>
                  );
                })}
              </div>
            )}

            {view === "screens" && (
              <div className="grid items-start gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
                <SidebarPreview permissions={effective} role={access.user.role} title={access.user.name} />
                <ScreensAccessList permissions={effective} role={access.user.role} catalog={catalog} />
              </div>
            )}

            <p className="text-[10px] text-slate-400">{t("explorer.howResolved")}</p>
          </>
        )}
      </div>
    </div>
  );
}
