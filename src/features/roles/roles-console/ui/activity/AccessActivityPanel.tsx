import { useMemo, type ReactNode } from "react";
import { ITButton, ITDataTable, ITSegmentedControl } from "@axzydev/axzy_ui_system";
import type { Column, ColumnFilters, ITDataTableFetchParams, ITDataTableResponse } from "@axzydev/axzy_ui_system";
import { FaShieldAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  ACCESS_ACTIVITY_ACTIONS,
  type AccessActivityRow,
  type AccessMember,
  type PermissionCatalog,
  type PolicyAdmin,
} from "@entities/permission";
import { roleLabel, type PermissionScope } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { dateLocale } from "@shared/i18n/format";
import { fetchAccessActivity } from "../../model/useAccessActivity";
import type { ActivityQuickFilter } from "../../model/useRolesWorkspace";

interface Props {
  catalog: readonly PermissionCatalog[];
  members: readonly AccessMember[];
  policies: readonly PolicyAdmin[];
  quickFilter: ActivityQuickFilter;
  onQuickFilterChange: (value: ActivityQuickFilter) => void;
  onViewAccess: (userId: string, permission?: string) => void;
}

const ACTION_TONE: Record<string, string> = {
  ACCESS_DENIED: "bg-rose-50 text-rose-700",
  ROLE_PERMISSIONS_UPDATED: "bg-[#0D5777]/10 text-[#0D5777]",
  PERMISSION_EXCEPTION_SET: "bg-violet-50 text-violet-700",
  PERMISSION_EXCEPTION_REMOVED: "bg-violet-50 text-violet-700",
  USER_ROLE_ADDED: "bg-emerald-50 text-emerald-700",
  USER_ROLE_REMOVED: "bg-amber-50 text-amber-700",
};

const scopeOfState = (state: Record<string, unknown> | null): PermissionScope | null => {
  const scope = state?.scope;
  return scope === "NONE" || scope === "OWN" || scope === "AREA" || scope === "ALL" ? scope : null;
};

/** Persona y permiso afectados por un renglón (para "Ver acceso"). */
const subjectOf = (row: AccessActivityRow): { userId: string; permission?: string } | null => {
  if (row.action === "ACCESS_DENIED" && row.actor.id) {
    const permission = row.entityId.split("|")[0];
    return { userId: row.actor.id, permission };
  }
  if (row.entityType === "UserPermission" || row.entityType === "UserRole") {
    const [userId, other] = row.entityId.split("|");
    return { userId, permission: row.entityType === "UserPermission" ? other : undefined };
  }
  return null;
};

/**
 * Bitácora del control de acceso: cambios de roles, matriz, catálogo,
 * políticas, excepciones, asignación de roles y accesos denegados.
 */
export default function AccessActivityPanel({
  catalog,
  members,
  policies,
  quickFilter,
  onQuickFilterChange,
  onViewAccess,
}: Props) {
  const { t } = useTranslation("roles");
  const tt = dyn(t);

  const permissionName = (key: string) => catalog.find((item) => item.key === key)?.name ?? key;
  const memberName = (id: string) => members.find((member) => member.id === id)?.name ?? id.slice(0, 8);
  const scopeText = (scope: PermissionScope | null) => (scope ? t(`scope.${scope}`) : "—");

  const describe = (row: AccessActivityRow): ReactNode => {
    const [first, second] = row.entityId.split("|");
    switch (row.entityType) {
      case "RolePermission":
        return (
          <>
            <b>{roleLabel(first)}</b> · {permissionName(second)}:{" "}
            <span className="text-slate-400">{scopeText(scopeOfState(row.previousState) ?? "NONE")}</span> →{" "}
            <b>{scopeText(scopeOfState(row.newState))}</b>
          </>
        );
      case "Role":
        return (
          <>
            <b>{roleLabel(first)}</b>
            {typeof row.metadata?.copiedFrom === "string" && (
              <span className="text-slate-400"> · {t("activity.copiedFrom", { role: roleLabel(row.metadata.copiedFrom) })}</span>
            )}
          </>
        );
      case "Permission":
        if (row.action === "ACCESS_DENIED") {
          const method = typeof row.metadata?.method === "string" ? row.metadata.method : "";
          const path = typeof row.metadata?.path === "string" ? row.metadata.path : "";
          return (
            <>
              <b>{row.entityId.split("|").map(permissionName).join(" / ")}</b>
              {path && <span className="font-mono text-[10px] text-slate-400"> · {method} {path}</span>}
            </>
          );
        }
        return <b>{permissionName(first)}</b>;
      case "Policy": {
        const policy = policies.find((item) => item.id === first);
        return <b>{policy?.name ?? t("activity.deletedPolicy")}</b>;
      }
      case "UserPermission":
        return (
          <>
            <b>{memberName(first)}</b> · {permissionName(second)}:{" "}
            <span className="text-slate-400">{scopeText(scopeOfState(row.previousState))}</span> →{" "}
            <b>{row.action === "PERMISSION_EXCEPTION_REMOVED" ? t("activity.followsRole") : scopeText(scopeOfState(row.newState))}</b>
          </>
        );
      case "UserRole":
        return (
          <>
            <b>{typeof row.metadata?.user === "string" ? row.metadata.user : memberName(first)}</b> · {roleLabel(second)}
          </>
        );
      default:
        return row.entityId;
    }
  };

  const columns: Column<AccessActivityRow>[] = [
    {
      key: "createdAt",
      label: t("activity.columns.date"),
      type: "date",
      width: 150,
      filter: "date-range",
      sortable: true,
      render: (row) => (
        <span className="text-[11px] tabular-nums text-slate-600">
          {new Date(row.createdAt).toLocaleString(dateLocale(), { dateStyle: "short", timeStyle: "short" })}
        </span>
      ),
    },
    {
      key: "action",
      label: t("activity.columns.action"),
      type: "catalog",
      width: 190,
      filter: "catalog",
      sortable: true,
      catalogOptions: {
        data: ACCESS_ACTIVITY_ACTIONS.map((action) => ({ id: action, name: tt(`activity.action.${action}`) })),
      },
      render: (row) => (
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${ACTION_TONE[row.action] ?? "bg-slate-100 text-slate-600"}`}>
          {tt(`activity.action.${row.action}`)}
        </span>
      ),
    },
    {
      key: "actor",
      label: t("activity.columns.actor"),
      type: "string",
      width: 180,
      filter: true,
      sortable: true,
      render: (row) => (
        <span className="flex flex-col">
          <span className="text-[12px] font-bold text-slate-700">{row.actor.name ?? row.actor.username ?? "—"}</span>
          {row.actor.username && <span className="text-[10px] text-slate-400">@{row.actor.username}</span>}
        </span>
      ),
    },
    {
      key: "entityId",
      label: t("activity.columns.detail"),
      type: "string",
      filter: true,
      sortable: true,
      render: (row) => <span className="text-[12px] text-slate-600">{describe(row)}</span>,
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 120,
      render: (row) => {
        const subject = subjectOf(row);
        if (!subject) return null;
        return (
          <ITButton variant="outlined" color="primary" size="sm" onClick={() => onViewAccess(subject.userId, subject.permission)}>
            <span className="flex items-center gap-1 text-[10px] font-bold">
              <FaShieldAlt size={9} /> {t("members.viewAccess")}
            </span>
          </ITButton>
        );
      },
    },
  ];

  const externalFilters = useMemo<ColumnFilters | undefined>(
    () => (quickFilter === "denied" ? { action: "ACCESS_DENIED" } : undefined),
    [quickFilter]
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[12px] text-slate-500">{t("activity.subtitle")}</p>
        <ITSegmentedControl
          size="sm"
          value={quickFilter}
          onChange={(value) => onQuickFilterChange(value as ActivityQuickFilter)}
          options={[
            { value: "all", label: t("activity.quick.all") },
            { value: "denied", label: t("activity.quick.denied") },
          ]}
        />
      </div>
      <ITDataTable
        key={quickFilter}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchAccessActivity as unknown as (
            params: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        defaultItemsPerPage={20}
        itemsPerPageOptions={[20, 50, 100]}
      />
    </div>
  );
}
