import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { roleLabel, type User } from "@entities/user";
import { ProfileAvatar } from "@shared/ui/profile-avatar";

interface Props {
  user: User;
}

/** Chip traslúcido sobre el tono `sea` (mismo patrón del héroe de inventario). */
function HeroChip({ children, dot }: { children: ReactNode; dot?: "success" | "danger" }) {
  return (
    <span className="inline-flex max-w-full items-center gap-1.5 rounded-full bg-[color-mix(in_srgb,currentColor_12%,transparent)] px-2.5 py-1 text-[11.5px]">
      {dot && <i className="h-[7px] w-[7px] shrink-0 rounded-full" style={{ background: `var(--color-${dot})` }} />}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * Identidad de la cuenta dentro del mosaico héroe del historial: avatar, nombre,
 * usuario y los datos que la pantalla ya tiene (rol, estado, departamento,
 * puesto y número de empleado). Todo sale de `GET /users/:id`.
 */
export default function UserHeaderCard({ user }: Props) {
  const { t } = useTranslation("users");

  return (
    <div className="mt-1 flex min-h-0 flex-1 flex-col justify-center gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <ProfileAvatar name={user.name} photoUrl={user.photoUrl} size="lg" />
        <div className="min-w-0">
          <p className="m-0 truncate text-[15px] font-bold leading-tight">{user.name}</p>
          <p className="m-0 truncate text-[12px]" style={{ color: "var(--it-bento-muted)" }}>
            @{user.username}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <HeroChip>{roleLabel(user.role)}</HeroChip>
        <HeroChip dot={user.active ? "success" : "danger"}>
          {user.active ? t("table.statusActive") : t("table.statusInactive")}
        </HeroChip>
        {user.department?.name && <HeroChip>{user.department.name}</HeroChip>}
        {user.employeeNumber && <HeroChip>#{user.employeeNumber}</HeroChip>}
      </div>

      {user.jobTitle && (
        <p className="m-0 truncate text-[11.5px]" style={{ color: "var(--it-bento-muted)" }}>
          {user.jobTitle}
        </p>
      )}
    </div>
  );
}
