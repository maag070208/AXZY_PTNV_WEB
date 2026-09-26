import { useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITFlex,
  ITLoader,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaInfoCircle, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PermissionCatalog } from "@entities/permission";
import type { PermissionScope } from "@entities/user";
import { useRolesAdmin } from "@features/roles";

const SCOPE_ORDER: PermissionScope[] = ["NONE", "OWN", "AREA", "ALL"];

interface ToastState {
  message: string;
  type: "success" | "error";
}

export default function RoleMatrixPanel() {
  const { t } = useTranslation(["roles", "common"]);
  const {
    data,
    draft,
    changes,
    dirty,
    loading,
    saving,
    error,
    saveError,
    setScope,
    save,
    discard,
  } = useRolesAdmin();
  const [toast, setToast] = useState<ToastState | null>(null);

  const modules = useMemo<Array<[string, PermissionCatalog[]]>>(() => {
    if (!data) return [];
    const map = new Map<string, PermissionCatalog[]>();
    for (const permission of data.catalog) {
      const list = map.get(permission.module) ?? [];
      list.push(permission);
      map.set(permission.module, list);
    }
    return [...map.entries()];
  }, [data]);

  const hasInactive = data?.catalog.some((permission) => !permission.active) ?? false;

  const optionsFor = (permission: PermissionCatalog) => {
    const allowed = new Set<PermissionScope>(["NONE", ...permission.scopes]);
    return SCOPE_ORDER.filter((scope) => allowed.has(scope)).map(
      (scope) => ({ value: scope, label: t(`scope.${scope}`) })
    );
  };

  const roleLabel = (role: string) =>
    t(`role.${role}`, { defaultValue: role.replace(/_/g, " ") });

  const handleSave = async () => {
    const ok = await save();
    if (ok) setToast({ message: t("matrix.saved"), type: "success" });
  };

  const handleDiscard = () => {
    discard();
    setToast(null);
  };

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" gap={3} wrap="wrap">
        <ITFlex direction="column" gap={1}>
          <ITText className="text-sm font-bold text-slate-800">
            {t("matrix.title")}
          </ITText>
          <ITText className="text-xs text-slate-500">
            {t("matrix.subtitle")}
          </ITText>
        </ITFlex>

        <ITFlex align="center" gap={2}>
          <ITBadget
            color={dirty ? "warning" : "gray"}
            variant={dirty ? "filled" : "outlined"}
            size="lg"
          >
            {t("matrix.changeCount", { count: changes.length })}
          </ITBadget>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={handleDiscard}
            disabled={!dirty || saving}
          >
            <ITFlex align="center" gap={1}>
              <FaUndo size={12} />
              <ITText className="font-bold text-[11px]">
                {t("matrix.discard")}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handleSave}
            disabled={!dirty || saving}
          >
            <ITFlex align="center" gap={1}>
              <FaCheck size={12} />
              <ITText className="font-bold text-[11px]">
                {saving ? t("matrix.saving") : t("matrix.save")}
              </ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {error}
        </ITAlert>
      )}
      {saveError && (
        <ITAlert variant="error" dismissible onDismiss={() => undefined}>
          {saveError}
        </ITAlert>
      )}
      {hasInactive && (
        <ITAlert variant="warning" icon={<FaInfoCircle />}>
          {t("matrix.inactiveWarning")}
        </ITAlert>
      )}

      {loading ? (
        <ITFlex align="center" justify="center" className="py-16">
          <ITLoader />
        </ITFlex>
      ) : !data || data.catalog.length === 0 ? (
        <ITText className="py-10 text-center text-xs italic text-slate-400">
          {t("matrix.empty")}
        </ITText>
      ) : (
        <ITFlex direction="column" gap={4}>
          {modules.map(([module, permissions]) => (
            <ITCard
              key={module}
              className="!p-0 overflow-hidden border border-slate-200"
            >
              <ITFlex
                align="center"
                gap={2}
                className="border-b border-slate-100 bg-slate-50/60 px-4 py-2.5"
              >
                <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
                  {module}
                </ITText>
              </ITFlex>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                      <th className="sticky left-0 z-10 bg-slate-50 px-3 py-2.5">
                        {t("matrix.permission")}
                      </th>
                      {data.roles.map((role) => (
                        <th key={role} className="px-3 py-2.5 text-center">
                          {roleLabel(role)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {permissions.map((permission, index) => (
                      <tr
                        key={permission.key}
                        className={`border-b border-slate-100 ${
                          index % 2 === 1 ? "bg-slate-50/40" : ""
                        } ${permission.active ? "" : "opacity-60"}`}
                      >
                        <td className="sticky left-0 z-10 bg-inherit px-3 py-2 align-middle">
                          <ITFlex direction="column" gap={1}>
                            <ITFlex align="center" gap={2} wrap="wrap">
                              <ITText className="text-[12px] font-bold text-slate-800">
                                {permission.name}
                              </ITText>
                              {permission.sensitive && (
                                <ITBadget color="warning" size="sm">
                                  {t("matrix.sensitive")}
                                </ITBadget>
                              )}
                              {!permission.active && (
                                <ITBadget color="danger" size="sm">
                                  {t("matrix.inactive")}
                                </ITBadget>
                              )}
                            </ITFlex>
                            <ITText className="font-mono text-[10px] text-slate-400">
                              {permission.key}
                            </ITText>
                          </ITFlex>
                        </td>
                        {data.roles.map((role) => {
                          const key = `${permission.key}|${role}`;
                          return (
                            <td
                              key={role}
                              className="px-3 py-2 align-middle"
                            >
                              <ITSelect
                                name={`matrix_${permission.key}_${role}`}
                                size="sm"
                                options={optionsFor(permission)}
                                value={draft[key] ?? "NONE"}
                                disabled={!permission.active || saving}
                                onChange={(event) =>
                                  setScope(
                                    role,
                                    permission.key,
                                    event.target.value as PermissionScope
                                  )
                                }
                              />
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </ITCard>
          ))}
        </ITFlex>
      )}

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
