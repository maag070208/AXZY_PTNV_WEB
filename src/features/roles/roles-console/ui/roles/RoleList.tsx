import { useMemo, useState } from "react";
import { ITInput } from "@axzydev/axzy_ui_system";
import { FaSearch, FaUsers } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { RoleAdmin } from "@entities/permission";
import { roleLabel } from "@entities/user";
import { normalizeText } from "../../model/access-levels";
import type { RolesAdminState } from "../../model/useRolesAdmin";
import RoleAvatar from "../shared/RoleAvatar";

interface Props {
  admin: RolesAdminState;
  selectedRole: string | null;
  onSelect: (role: string) => void;
}

/** Lista de roles agrupada por módulo, con permisos, personas y cambios sin guardar. */
export default function RoleList({ admin, selectedRole, onSelect }: Props) {
  const { t } = useTranslation("roles");
  const [query, setQuery] = useState("");
  const { data, rolesMeta, permissionsByRole, changeDetails } = admin;

  const metaOf = (key: string): RoleAdmin | undefined => rolesMeta.find((role) => role.key === key);
  const pendingByRole = useMemo(() => {
    const map = new Map<string, number>();
    for (const change of changeDetails) map.set(change.role, (map.get(change.role) ?? 0) + 1);
    return map;
  }, [changeDetails]);

  const groups = useMemo(() => {
    const needle = normalizeText(query.trim());
    const map = new Map<string, string[]>();
    for (const key of data?.roles ?? []) {
      const meta = rolesMeta.find((role) => role.key === key);
      const label = roleLabel(key);
      if (needle && !normalizeText(label).includes(needle) && !key.toLowerCase().includes(needle)) continue;
      const module = meta?.module?.trim() || t("roleList.noModule");
      map.set(module, [...(map.get(module) ?? []), key]);
    }
    return [...map.entries()];
  }, [data, rolesMeta, query, t]);

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-2 lg:sticky lg:top-4">
      <ITInput
        name="role_list_search"
        size="sm"
        placeholder={t("roleList.search")}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        iconLeft={<FaSearch size={12} />}
      />
      <div className="flex max-h-[70vh] flex-col gap-2 overflow-y-auto">
        {groups.length === 0 && (
          <p className="py-6 text-center text-[11px] italic text-slate-400">{t("matrix.noResults")}</p>
        )}
        {groups.map(([module, roles]) => (
          <div key={module} className="flex flex-col gap-0.5">
            <p className="px-2 text-[9px] font-black uppercase tracking-widest text-slate-400">{module}</p>
            {roles.map((key) => {
              const meta = metaOf(key);
              const selected = key === selectedRole;
              const pending = pendingByRole.get(key) ?? 0;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onSelect(key)}
                  className={`flex w-full items-center gap-2 rounded-lg border px-2 py-1.5 text-left transition ${
                    selected
                      ? "border-[#0D5777]/40 !bg-[#0D5777]/5 shadow-sm"
                      : "border-transparent !bg-transparent hover:!bg-slate-50"
                  } ${meta && !meta.active ? "opacity-60" : ""}`}
                >
                  <RoleAvatar role={key} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className={`truncate text-[12px] font-bold ${selected ? "text-[#0D5777]" : "text-slate-800"}`}>
                        {roleLabel(key)}
                      </span>
                      {pending > 0 && (
                        <span
                          className="h-2 w-2 shrink-0 rounded-full bg-amber-500"
                          title={t("matrix.changeCount", { count: pending })}
                        />
                      )}
                    </span>
                    <span className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{t("roleList.permissions", { count: Object.keys(permissionsByRole[key] ?? {}).length })}</span>
                      <span className="inline-flex items-center gap-1">
                        <FaUsers size={9} /> {meta?.userCount ?? 0}
                      </span>
                      {meta && !meta.active && <span className="font-bold text-rose-500">{t("access.inactiveRole")}</span>}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
