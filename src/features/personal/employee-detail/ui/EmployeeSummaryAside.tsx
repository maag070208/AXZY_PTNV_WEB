import { useRef, useState } from "react";
import { ITAvatar, ITBadget, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaBriefcase, FaCamera, FaChevronDown, FaChevronUp, FaHeartbeat } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PersonalProfile } from "@entities/personal";

const ROLE_COLOR: Record<string, string> = {
  GERENTE: "purple",
  JEFE_DE_AREA: "info",
  EMPLEADO: "gray",
};

const ROLE_LABEL: Record<string, string> = {
  GERENTE: "GERENTE",
  JEFE_DE_AREA: "JEFE DE ÁREA",
  EMPLEADO: "EMPLEADO",
};

/** Fechas guardadas como "YYYY-MM-DD": formatear sin pasar por Date/huso horario. */
const formatDateOnly = (iso?: string | null): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <ITFlex justify="between" align="center" gap={2}>
      <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</ITText>
      <ITText className="text-[11px] font-bold text-slate-700 text-right">{value ?? "—"}</ITText>
    </ITFlex>
  );
}

function AsideCard({
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
  const [open, setOpen] = useState(true);

  return (
    <div className="w-full min-w-0 bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-4 sm:p-5">
      <button type="button" className="w-full text-left" onClick={() => setOpen((o) => !o)}>
        <ITFlex align="center" justify="between" gap={2}>
          <ITFlex align="center" gap={2}>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm shrink-0 ${iconBg}`}>
              {icon}
            </div>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">{title}</ITText>
          </ITFlex>
          <span className="shrink-0 text-slate-400">
            {open ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
          </span>
        </ITFlex>
      </button>
      {open && (
        <ITFlex direction="column" gap={2.5} className="mt-4">
          {children}
        </ITFlex>
      )}
    </div>
  );
}

interface Props {
  profile: PersonalProfile;
  onPhotoUpload: (file: File) => Promise<void>;
}

export default function EmployeeSummaryAside({ profile, onPhotoUpload }: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  return (
    <div className="w-full min-w-0 flex flex-col gap-5 md:sticky md:top-24">
      <div className="w-full min-w-0 bg-white rounded-2xl md:rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-5 sm:p-6 text-center">
        <div className="relative inline-block">
          <ITAvatar src={profile.fotoUrl ?? undefined} initials={initials} alt={profile.name} size="xl" />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title={tt("detail.changePhoto")}
            className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-700"
          >
            <FaCamera size={10} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhotoUpload(file);
              e.target.value = "";
            }}
          />
        </div>

        <ITText className="mt-3 text-[15px] font-black text-slate-800 leading-snug">{profile.name}</ITText>

        <ITFlex justify="center" gap={1.5} className="mt-2 flex-wrap">
          <ITBadget color={(ROLE_COLOR[profile.role] as any) ?? "gray"} size="lg">
            {ROLE_LABEL[profile.role] ?? profile.role}
          </ITBadget>
          <ITBadget color={profile.active ? "success" : "danger"} size="lg">
            {profile.active ? tt("detail.active") : tt("detail.inactive")}
          </ITBadget>
        </ITFlex>

        {profile.numeroEmpleado && (
          <ITText className="mt-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {tt("detail.employeeNo")} {profile.numeroEmpleado}
          </ITText>
        )}
      </div>

      <AsideCard
        icon={<FaBriefcase size={12} className="text-white" />}
        iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
        title={tt("detail.laboralTitle")}
      >
        <InfoRow label={tt("detail.fields.employeeType")} value={ROLE_LABEL[profile.role] ?? profile.role} />
        <InfoRow label={tt("detail.fields.hireDate")} value={formatDateOnly(profile.fechaIngreso)} />
        <InfoRow label={tt("detail.fields.department")} value={profile.department?.name} />
        <InfoRow label={tt("detail.fields.subarea")} value={profile.subarea?.name} />
        <InfoRow label={tt("detail.fields.position")} value={profile.puesto} />
        <InfoRow label={tt("detail.fields.company")} value={profile.empresa} />
      </AsideCard>

      <AsideCard
        icon={<FaHeartbeat size={12} className="text-white" />}
        iconBg="bg-gradient-to-br from-rose-500 to-red-600"
        title={tt("detail.medicalTitle")}
      >
        <InfoRow label={tt("detail.fields.bloodType")} value={profile.tipoSangre?.nombre} />
        <InfoRow label={tt("detail.fields.condition")} value={profile.padecimiento} />
        <InfoRow label={tt("detail.fields.allergies")} value={profile.alergias} />
      </AsideCard>
    </div>
  );
}
