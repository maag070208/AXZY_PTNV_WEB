import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { FaBuilding, FaCamera, FaIdBadge } from "react-icons/fa";
import { ITBadget } from "@axzydev/axzy_ui_system";
import type { PersonalProfile } from "@entities/hr";
import { roleLabel } from "@entities/user";
import { ProfileAvatar } from "@shared/ui/profile-avatar";

const ROLE_COLOR: Record<string, string> = { MANAGER: "purple", AREA_HEAD: "info", EMPLOYEE: "gray" };

/** Fechas guardadas como "YYYY-MM-DD": formatear sin pasar por Date/huso horario. */
const formatDateOnly = (iso?: string | null): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="min-w-0">
      <dt className="text-[12px] font-bold text-slate-400">{label}</dt>
      <dd className="truncate text-sm font-semibold text-slate-800">{value?.trim() ? value : "—"}</dd>
    </div>
  );
}

interface Props {
  profile: PersonalProfile;
  onPhotoUpload: (file: File) => Promise<void>;
}

/** Encabezado de la ficha: foto, nombre, puesto y los datos laborales que más se consultan. */
export default function EmployeeHero({ profile, onPhotoUpload }: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Solo se muestran los datos que existen: una fila de guiones no aporta nada.
  const facts = [
    { label: tt("detail.fields.hireDate"), value: profile.hireDate ? formatDateOnly(profile.hireDate) : null },
    { label: tt("detail.fields.subarea"), value: profile.subarea?.name },
    { label: tt("detail.fields.company"), value: profile.company },
  ].filter((f) => f.value?.trim());

  return (
    <section className="flex flex-col gap-6 rounded-3xl border border-slate-200 bg-[var(--it-card-bg)] p-6 shadow-sm md:flex-row md:items-center">
      <div className="relative w-fit shrink-0">
        <ProfileAvatar photoUrl={profile.photoUrl} name={profile.name} size="xl" className="h-28! w-28! ring-4 ring-slate-100" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          title={tt("detail.changePhoto")}
          className="absolute bottom-0 right-0 flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-white shadow-md ring-2 ring-white transition hover:bg-slate-700"
        >
          <FaCamera size={11} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void onPhotoUpload(file);
            e.target.value = "";
          }}
        />
      </div>

      <div className="min-w-0 flex-1">
        <h2 className="truncate text-3xl font-black leading-tight text-slate-900">{profile.name}</h2>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5"><FaIdBadge size={12} />{profile.jobTitle?.trim() || "—"}</span>
          <span className="text-slate-300">·</span>
          <span className="inline-flex items-center gap-1.5"><FaBuilding size={12} />{profile.department?.name ?? "—"}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <ITBadget color={(ROLE_COLOR[profile.role] as any) ?? "gray"} size="lg">{roleLabel(profile.role)}</ITBadget>
          <ITBadget color={profile.active ? "success" : "danger"} size="lg">
            {profile.active ? tt("detail.active") : tt("detail.inactive")}
          </ITBadget>
          {profile.employeeNumber && (
            <span className="rounded-full border border-slate-200 px-3 py-1 font-mono text-xs font-semibold text-slate-600">
              #{profile.employeeNumber}
            </span>
          )}
        </div>
      </div>

      {facts.length > 0 && (
        <dl className="grid shrink-0 grid-cols-2 gap-x-8 gap-y-3 md:!grid-cols-1 lg:!grid-cols-3">
          {facts.map((f) => (
            <Fact key={f.label} label={f.label} value={f.value} />
          ))}
        </dl>
      )}
    </section>
  );
}
