import { useMemo, useState } from "react";
import { ITButton, ITConfirmDialog, ITDropdownMenu } from "@axzydev/axzy_ui_system";
import { FaClone, FaDesktop, FaGavel, FaKey, FaLock, FaPen, FaPowerOff, FaTrash, FaUsers } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { isScreenVisibleInGroup, screenLeaves, type RoleAdmin } from "@entities/permission";
import { roleLabel } from "@entities/user";
import type { AccessMembersState } from "../../model/useAccessMembers";
import type { PoliciesState } from "../../model/usePolicies";
import type { RolesAdminState } from "../../model/useRolesAdmin";
import RoleAvatar from "../shared/RoleAvatar";
import ScreensAccessList from "../shared/ScreensAccessList";
import SidebarPreview from "../shared/SidebarPreview";
import { TabBar } from "@shared/ui/tab-bar";
import RoleMembersPanel from "./RoleMembersPanel";
import RolePermissionsEditor from "./RolePermissionsEditor";
import RolePoliciesList from "./RolePoliciesList";

type DetailTab = "permissions" | "members" | "screens" | "policies";

interface Props {
  role: string;
  admin: RolesAdminState;
  members: AccessMembersState;
  policies: PoliciesState;
  onEdit: (meta: RoleAdmin) => void;
  onDuplicate: (meta: RoleAdmin) => void;
  onViewAccess: (userId: string) => void;
  onTestPolicy: (permission: string) => void;
  notify: (message: string, type: "success" | "error") => void;
}

/**
 * Detalle de un rol: encabezado compacto y, en pestañas, sus permisos por
 * módulo, las personas que lo tienen, las pantallas que ve y sus políticas.
 */
export default function RoleDetail({
  role,
  admin,
  members,
  policies,
  onEdit,
  onDuplicate,
  onViewAccess,
  onTestPolicy,
  notify,
}: Props) {
  const { t } = useTranslation("roles");
  const [tab, setTab] = useState<DetailTab>("permissions");
  const [confirm, setConfirm] = useState<"delete" | "toggle" | null>(null);
  const { data, rolesMeta, permissionsByRole, scopeOf, updateRole, deleteRole, roleSaving, changeDetails } = admin;

  const meta = rolesMeta.find((item) => item.key === role);
  const permissions = permissionsByRole[role];
  const catalog = useMemo(() => data?.catalog ?? [], [data]);
  const leaves = useMemo(() => screenLeaves(), []);
  const screens = leaves.filter((leaf) => isScreenVisibleInGroup(permissions, leaf.screen, leaf.parent, role)).length;
  const rolePolicies = (policies.data?.policies ?? []).filter(
    (policy) => policy.roles.length === 0 || policy.roles.includes(role)
  ).length;
  const memberCount = members.membersOf(role).length;
  const permissionCount = Object.keys(permissions ?? {}).length;

  if (!meta) return null;

  const runConfirm = async () => {
    if (confirm === "delete") {
      const result = await deleteRole(role);
      notify(result.ok ? t("roleDialog.deleted") : result.error ?? t("errors.deleteRole"), result.ok ? "success" : "error");
    } else if (confirm === "toggle") {
      const result = await updateRole(role, { active: !meta.active });
      notify(
        result.ok ? (meta.active ? t("roleDetail.deactivated") : t("roleDetail.activated")) : result.error ?? t("errors.updateRole"),
        result.ok ? "success" : "error"
      );
    }
    setConfirm(null);
  };

  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4">
      {/* Encabezado */}
      <div className="flex flex-wrap items-center gap-3">
        <RoleAvatar role={role} />
        <div className="min-w-[200px] flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h2 className="text-[15px] font-black text-slate-900">{roleLabel(role)}</h2>
            {meta.system && (
              <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase text-slate-500">
                <FaLock size={7} /> {t("access.systemRole")}
              </span>
            )}
            {!meta.active && (
              <span className="rounded bg-rose-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-rose-600">
                {t("access.inactiveRole")}
              </span>
            )}
            {meta.staff && (
              <span className="rounded bg-sky-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-sky-700">{t("roleDialog.staff")}</span>
            )}
          </div>
          <p className="truncate text-[11px] text-slate-500">
            {meta.description || t("roleDetail.noDescription")}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <ITButton variant="outlined" color="primary" size="sm" onClick={() => onEdit(meta)}>
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <FaPen size={9} /> {t("roleDetail.edit")}
            </span>
          </ITButton>
          <ITButton variant="outlined" color="secondary" size="sm" onClick={() => onDuplicate(meta)}>
            <span className="flex items-center gap-1 text-[11px] font-bold">
              <FaClone size={9} /> {t("roleDetail.duplicate")}
            </span>
          </ITButton>
          {!meta.system && (
            <ITDropdownMenu
              triggerLabel={t("roleDetail.more")}
              items={[
                {
                  id: "toggle",
                  label: meta.active ? t("roleDetail.deactivate") : t("roleDetail.activate"),
                  icon: <FaPowerOff size={11} />,
                  onClick: () => setConfirm("toggle"),
                },
                {
                  id: "delete",
                  label: meta.userCount > 0 ? t("roleDetail.deleteBlocked", { count: meta.userCount }) : t("roleDialog.deleteTitle"),
                  icon: <FaTrash size={11} />,
                  danger: true,
                  divider: true,
                  disabled: meta.userCount > 0,
                  onClick: () => setConfirm("delete"),
                },
              ]}
            />
          )}
        </div>
      </div>

      <TabBar
        size="sm"
        value={tab}
        onChange={setTab}
        items={[
          {
            id: "permissions",
            label: t("roleDetail.tabs.permissions"),
            icon: <FaKey size={10} />,
            count: permissionCount,
            dot: changeDetails.some((change) => change.role === role),
          },
          { id: "members", label: t("roleDetail.tabs.members"), icon: <FaUsers size={10} />, count: memberCount },
          { id: "screens", label: t("roleDetail.tabs.screens"), icon: <FaDesktop size={10} />, count: screens },
          { id: "policies", label: t("roleDetail.tabs.policies"), icon: <FaGavel size={10} />, count: rolePolicies },
        ]}
      />

      {tab === "permissions" && <RolePermissionsEditor admin={admin} role={role} />}
      {tab === "members" && (
        <RoleMembersPanel role={role} roleActive={meta.active} members={members} onViewAccess={onViewAccess} notify={notify} />
      )}
      {tab === "screens" && (
        <div className="grid items-start gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
          <SidebarPreview permissions={permissions} role={role} title={t("screens.menuOf", { role: roleLabel(role) })} />
          <ScreensAccessList permissions={permissions} role={role} catalog={catalog} />
        </div>
      )}
      {tab === "policies" && (
        <RolePoliciesList
          role={role}
          policies={policies.data}
          hasPermission={(permission) => scopeOf(role, permission) !== "NONE"}
          onTest={onTestPolicy}
        />
      )}

      <ITConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={runConfirm}
        loading={roleSaving}
        variant={confirm === "delete" || meta.active ? "danger" : "primary"}
        title={
          confirm === "delete"
            ? t("roleDialog.deleteTitle")
            : meta.active
              ? t("roleDetail.deactivate")
              : t("roleDetail.activate")
        }
        message={
          confirm === "delete"
            ? t("roleDialog.deleteConfirm", { role: roleLabel(role) })
            : meta.active
              ? t("roleDetail.deactivateConfirm", { role: roleLabel(role), count: meta.userCount })
              : t("roleDetail.activateConfirm", { role: roleLabel(role) })
        }
      />
    </div>
  );
}
