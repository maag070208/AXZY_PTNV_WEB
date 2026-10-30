import { useRef } from "react";
import { useTranslation } from "react-i18next";
import { LuBuilding2, LuBriefcase, LuCamera, LuCalendarClock, LuFolderCheck } from "react-icons/lu";
import { ITBadget, ITBentoGrid, ITBentoTile, useITBentoCountUp, ITText, ITFlex } from "@axzydev/axzy_ui_system";
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

/** Meses completos entre la fecha de ingreso ("YYYY-MM-DD") y hoy; null si no hay fecha válida. */
const monthsSince = (iso?: string | null): number | null => {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const now = new Date();
  let months = (now.getFullYear() - y) * 12 + (now.getMonth() + 1 - m);
  if (now.getDate() < d) months -= 1;
  return Math.max(0, months);
};

function Fact({ label, value }: { label: string; value?: string | null }) {
  return (
    <ITFlex className="min-w-0">
      <dt className="text-[12px] opacity-60">{label}</dt>
      <dd className="m-0 truncate text-[13px] font-semibold">{value?.trim() ? value : "—"}</dd>
    </ITFlex>
  );
}

interface Props {
  profile: PersonalProfile;
  onPhotoUpload: (file: File) => Promise<void>;
  /** Tipos de documento con al menos un archivo y total de tipos (del expediente). */
  documents: { done: number; total: number };
}

/**
 * Encabezado de la ficha (plantilla P3): mosaico de identidad con foto o Blobatar,
 * puesto y estado, más dos mosaicos con datos reales: antigüedad y documentos.
 */
export default function EmployeeHero({ profile, onPhotoUpload, documents }: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const months = monthsSince(profile.hireDate);
  const years = months === null ? 0 : Math.floor(months / 12);
  const restMonths = months === null ? 0 : months % 12;
  // Menos de un año: el número grande son los meses.
  const tenureBig = months !== null && years === 0 ? restMonths : years;
  const tenureUnit = months !== null && years === 0 ? "months" : "years";
  const tenureShown = useITBentoCountUp(tenureBig);
  const docsShown = useITBentoCountUp(documents.done);

  // Solo se muestran los datos que existen: una fila de guiones no aporta nada.
  const facts = [
    { label: tt("detail.fields.hireDate"), value: profile.hireDate ? formatDateOnly(profile.hireDate) : null },
    { label: tt("detail.fields.subarea"), value: profile.subarea?.name },
    { label: tt("detail.fields.company"), value: profile.company },
  ].filter((f) => f.value?.trim());

  return (
    <ITBentoGrid>
      <ITBentoTile cols={6} rows={3} wide tone="plain">
        <div className="flex h-full min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative w-fit shrink-0">
            <ProfileAvatar photoUrl={profile.photoUrl} name={profile.name} size="xl" className="h-24! w-24!" />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              title={tt("detail.changePhoto")}
              aria-label={tt("detail.changePhoto")}
              style={{ backgroundColor: "var(--it-bento-ink-bg, var(--color-primary))", color: "var(--it-bento-ink-text, white)" }}
              className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full !border-0 transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-primary)] focus-visible:ring-offset-2"
            >
              <LuCamera size={14} />
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

          <ITFlex className="min-w-0 flex-1">
            <ITText as="h2" className="m-0 truncate text-2xl font-extrabold leading-tight">{profile.name}</ITText>
            <ITText className="m-0 mt-1 flex flex-wrap items-center gap-x-2 text-[13px] opacity-70">
              <ITText as="span" className="inline-flex items-center gap-1.5"><LuBriefcase size={13} />{profile.jobTitle?.trim() || "—"}</ITText>
              <ITText as="span" aria-hidden>·</ITText>
              <ITText as="span" className="inline-flex items-center gap-1.5"><LuBuilding2 size={13} />{profile.department?.name ?? "—"}</ITText>
            </ITText>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <ITBadget color={(ROLE_COLOR[profile.role] as any) ?? "gray"} size="lg">{roleLabel(profile.role)}</ITBadget>
              <ITBadget color={profile.active ? "success" : "danger"} size="lg">
                {profile.active ? tt("detail.active") : tt("detail.inactive")}
              </ITBadget>
              {profile.employeeNumber && (
                <ITText as="span" className="rounded-full px-3 py-1 font-mono text-xs font-semibold" style={{ background: "var(--color-secondary-100)" }}>
                  #{profile.employeeNumber}
                </ITText>
              )}
            </div>
            {facts.length > 0 && (
              <dl className="m-0 mt-4 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
                {facts.map((f) => (
                  <Fact key={f.label} label={f.label} value={f.value} />
                ))}
              </dl>
            )}
          </ITFlex>
        </div>
      </ITBentoTile>

      <ITBentoTile
        cols={3}
        rows={3}
        wide
        tone="mint"
        icon={<LuCalendarClock size={15} />}
        label={tt("detail.tenure.label")}
        value={months === null ? "—" : tenureShown}
        caption={
          months === null
            ? tt("detail.tenure.none")
            : tt(`detail.tenure.${tenureUnit}`, { count: tenureBig })
        }
        aside={
          months !== null && years > 0 && restMonths > 0
            ? tt("detail.tenure.plusMonths", { count: restMonths })
            : undefined
        }
      />

      <ITBentoTile
        cols={3}
        rows={3}
        wide
        tone={documents.total > 0 && documents.done === documents.total ? "mint" : "sun"}
        icon={<LuFolderCheck size={15} />}
        label={tt("detail.documentsTile.label")}
        value={docsShown}
        aside={tt("detail.documentsTile.ofTotal", { total: documents.total })}
        caption={
          documents.total === 0
            ? tt("detail.noDocumentTypes")
            : documents.done === documents.total
              ? tt("detail.documentsTile.complete")
              : tt("detail.documentsTile.missing", { count: documents.total - documents.done })
        }
      />
    </ITBentoGrid>
  );
}
