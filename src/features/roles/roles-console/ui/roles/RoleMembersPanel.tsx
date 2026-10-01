import { useMemo, useState } from "react";
import { ITButton, ITConfirmDialog, ITInput, ITSearchSelect } from "@axzydev/axzy_ui_system";
import { FaSearch, FaShieldAlt, FaUserMinus, FaUserPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { AccessMember } from "@entities/permission";
import { roleLabel } from "@entities/user";
import { initialsOfName, matchesMember, type AccessMembersState } from "../../model/useAccessMembers";
import { RoleChip } from "../shared/RoleAvatar";

interface Props {
  role: string;
  roleActive: boolean;
  members: AccessMembersState;
  onViewAccess: (userId: string) => void;
  notify: (message: string, type: "success" | "error") => void;
}

/**
 * Personas con el rol (principal o adicional). Desde aquí se agrega el rol a
 * alguien como **adicional** y se quita un adicional; el principal se cambia
 * en la ficha del usuario.
 */
export default function RoleMembersPanel({ role, roleActive, members, onViewAccess, notify }: Props) {
  const { t } = useTranslation("roles");
  const [query, setQuery] = useState("");
  const [candidate, setCandidate] = useState<string>("");
  const [removing, setRemoving] = useState<AccessMember | null>(null);

  const withRole = members.membersOf(role);
  const rows = withRole.filter((member) => matchesMember(member, query));

  const candidates = useMemo(
    () =>
      members.members
        .filter((member) => member.active && member.role !== role && !member.extraRoles.includes(role))
        .map((member) => ({
          value: member.id,
          label: `${member.name} · @${member.username}${member.department ? ` · ${member.department}` : ""}`,
        })),
    [members.members, role]
  );

  const add = async () => {
    if (!candidate) return;
    const result = await members.addToRole(role, candidate);
    if (result.ok) {
      setCandidate("");
      notify(t("members.added", { role: roleLabel(role) }), "success");
    } else {
      notify(result.error ?? t("errors.addMember"), "error");
    }
  };

  const confirmRemove = async () => {
    if (!removing) return;
    const result = await members.removeFromRole(role, removing.id);
    notify(
      result.ok ? t("members.removed", { name: removing.name }) : result.error ?? t("errors.removeMember"),
      result.ok ? "success" : "error"
    );
    setRemoving(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-2">
        <div className="min-w-[240px] max-w-md flex-1">
          <ITSearchSelect
            name="role_member_candidate"
            size="sm"
            label={t("members.addLabel")}
            placeholder={roleActive ? t("members.addPlaceholder") : t("members.roleInactive")}
            options={candidates}
            value={candidate}
            disabled={!roleActive || members.busy}
            onChange={(value) => setCandidate(String(value ?? ""))}
            onClear={() => setCandidate("")}
          />
        </div>
        <ITButton variant="filled" color="primary" size="sm" disabled={!candidate || members.busy} onClick={add}>
          <span className="flex items-center gap-1.5 text-[11px] font-bold">
            <FaUserPlus size={11} /> {t("members.add")}
          </span>
        </ITButton>
        <div className="ml-auto w-full max-w-[220px]">
          <ITInput
            name="role_member_search"
            size="sm"
            placeholder={t("members.search")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            iconLeft={<FaSearch size={11} />}
          />
        </div>
        <p className="w-full text-[10px] text-slate-400">{t("members.addHint")}</p>
      </div>

      {rows.length === 0 ? (
        <p className="py-8 text-center text-[12px] italic text-slate-400">
          {withRole.length === 0 ? t("members.empty") : t("matrix.noResults")}
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
          {rows.map((member, index) => {
            const primary = member.role === role;
            const otherRoles = [member.role, ...member.extraRoles].filter((key) => key !== role);
            return (
              <div
                key={member.id}
                className={`flex flex-wrap items-center gap-2 px-3 py-1.5 ${index > 0 ? "border-t border-slate-100" : ""} ${
                  member.active ? "" : "opacity-60"
                }`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#0D5777]/10 text-[10px] font-black text-[#0D5777]">
                  {initialsOfName(member.name)}
                </span>
                <div className="min-w-[180px] flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-[12px] font-bold text-slate-800">{member.name}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                        primary ? "bg-[#0D5777] text-white" : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {primary ? t("members.primary") : t("members.extra")}
                    </span>
                    {!member.active && (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[9px] font-black uppercase text-rose-600">
                        {t("members.inactive")}
                      </span>
                    )}
                    {member.exceptions > 0 && (
                      <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[9px] font-black uppercase text-violet-600">
                        {t("members.exceptions", { count: member.exceptions })}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    @{member.username}
                    {member.employeeNumber && <> · #{member.employeeNumber}</>}
                    {member.department && <> · {member.department}</>}
                  </p>
                </div>
                {otherRoles.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {otherRoles.map((key) => (
                      <RoleChip key={key} role={key} />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <ITButton variant="outlined" color="primary" size="sm" onClick={() => onViewAccess(member.id)}>
                    <span className="flex items-center gap-1 text-[11px] font-bold">
                      <FaShieldAlt size={10} /> {t("members.viewAccess")}
                    </span>
                  </ITButton>
                  {!primary && (
                    <ITButton
                      variant="outlined"
                      color="danger"
                      size="sm"
                      disabled={members.busy}
                      onClick={() => setRemoving(member)}
                    >
                      <span className="flex items-center gap-1 text-[11px] font-bold">
                        <FaUserMinus size={10} /> {t("members.remove")}
                      </span>
                    </ITButton>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ITConfirmDialog
        isOpen={removing !== null}
        onClose={() => setRemoving(null)}
        onConfirm={confirmRemove}
        loading={members.busy}
        variant="danger"
        title={t("members.removeTitle")}
        message={t("members.removeConfirm", { name: removing?.name ?? "", role: roleLabel(role) })}
        confirmLabel={t("members.remove")}
      />
    </div>
  );
}
