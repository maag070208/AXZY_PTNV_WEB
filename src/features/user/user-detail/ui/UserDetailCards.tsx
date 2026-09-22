import {
  ITBadget,
  ITCard,
  ITFlex,
  ITGrid,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaBuilding, FaIdCard, FaUserCog } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { User } from "@entities/user";

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <ITGrid item xs={12} sm={6}>
      <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
        {label}
      </ITText>
      <ITText className="text-[12px] font-bold text-slate-700 mt-0.5">
        {value?.trim() ? value : "—"}
      </ITText>
    </ITGrid>
  );
}

const roleBadge = (role: string) => (
  <ITBadget
    color={
      role === "ADMIN"
        ? "danger"
        : role === "GERENTE"
        ? "info"
        : role === "JEFE_DE_AREA"
        ? "warning"
        : "success"
    }
    size="lg"
  >
    {role === "JEFE_DE_AREA"
      ? "JEFE DE AREA"
      : role === "RECURSOS_HUMANOS"
      ? "RECURSOS HUMANOS"
      : role}
  </ITBadget>
);

function SectionCard({
  icon,
  iconBg,
  title,
  children,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <ITCard className="p-5 sm:p-6 shadow-xl shadow-slate-200/35 border border-slate-100 rounded-[24px]">
      <ITFlex align="center" gap={3} className="mb-5">
        <ITFlex
          align="center"
          justify="center"
          className={`h-9 w-9 rounded-xl shrink-0 ${iconBg}`}
        >
          {icon}
        </ITFlex>
        <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">
          {title}
        </ITText>
      </ITFlex>
      <ITGrid container columns={12} spacing={4}>
        {children}
      </ITGrid>
    </ITCard>
  );
}

interface Props {
  user: User;
}

export default function UserDetailCards({ user }: Props) {
  const { t: tt } = useTranslation(["users"]);

  return (
    <ITFlex direction="column" gap={5}>
      <SectionCard
        icon={<FaUserCog size={14} className="text-blue-600" />}
        iconBg="bg-blue-50"
        title={tt("detail.account")}
      >
        <Field label={tt("form.username")} value={user.username} />
        <ITGrid item xs={12} sm={6}>
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {tt("form.role")}
          </ITText>
          <div className="mt-0.5">{roleBadge(user.role)}</div>
        </ITGrid>
        <ITGrid item xs={12} sm={6}>
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
            {tt("detail.status")}
          </ITText>
          <div className="mt-0.5">
            <ITBadget color={user.active ? "success" : "danger"} size="lg">
              {user.active ? tt("detail.active") : tt("detail.inactive")}
            </ITBadget>
          </div>
        </ITGrid>
      </SectionCard>

      <SectionCard
        icon={<FaIdCard size={14} className="text-violet-600" />}
        iconBg="bg-violet-50"
        title={tt("detail.personal")}
      >
        <Field label={tt("detail.fullName")} value={user.name} />
        <Field label={tt("form.secondName")} value={user.segundoNombre} />
        <Field label={tt("form.apellidoPaterno")} value={user.apellidoPaterno} />
        <Field label={tt("form.apellidoMaterno")} value={user.apellidoMaterno} />
        <Field label={tt("form.employeeNo")} value={user.numeroEmpleado} />
        <Field label={tt("form.email")} value={user.email} />
        <Field label={tt("form.position")} value={user.puesto} />
      </SectionCard>

      <SectionCard
        icon={<FaBuilding size={14} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
        title={tt("detail.organization")}
      >
        <Field label={tt("form.department")} value={user.department?.name} />
        <Field label={tt("form.subarea")} value={user.subarea?.name} />
      </SectionCard>
    </ITFlex>
  );
}