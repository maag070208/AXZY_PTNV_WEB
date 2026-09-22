import { ITDivider, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaAddressCard, FaIdCard, FaMapMarkerAlt, FaPhoneAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PersonalProfile } from "@entities/personal";

const formatDateOnly = (iso?: string | null): string => {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <ITGrid item xs={12} sm={6}>
      <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{label}</ITText>
      <ITText className="text-[12px] font-bold text-slate-700 mt-0.5">{value?.trim() ? value : "—"}</ITText>
    </ITGrid>
  );
}

function SectionBlock({
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
    <div>
      <ITFlex align="center" gap={3} className="mb-3">
        <ITFlex align="center" justify="center" className={`h-9 w-9 rounded-xl shrink-0 ${iconBg}`}>
          {icon}
        </ITFlex>
        <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">{title}</ITText>
      </ITFlex>
      <ITGrid container columns={12} spacing={4}>
        {children}
      </ITGrid>
    </div>
  );
}

interface Props {
  profile: PersonalProfile;
}

export default function EmployeeInfoCards({ profile }: Props) {
  const { t: tt } = useTranslation(["employees"]);
  const f = tt("detail.fields", { returnObjects: true }) as Record<string, string>;

  return (
    <ITFlex direction="column" gap={4} className="py-1">
      <SectionBlock
        icon={<FaIdCard size={14} className="text-blue-600" />}
        iconBg="bg-blue-50"
        title={tt("detail.personalInfoTitle")}
      >
        <Field label={f.employeeNo} value={profile.numeroEmpleado} />
        <Field label={f.apellidoMaterno} value={profile.apellidoMaterno} />
        <Field label={f.firstName} value={profile.name} />
        <Field label={f.birthDate} value={formatDateOnly(profile.fechaNacimiento)} />
        <Field label={f.secondName} value={profile.segundoNombre} />
        <Field label={f.hireDate} value={formatDateOnly(profile.fechaIngreso)} />
        <Field label={f.apellidoPaterno} value={profile.apellidoPaterno} />
        <Field label={f.gender} value={profile.genero?.nombre} />
      </SectionBlock>

      <ITDivider className="border-slate-100" />

      <SectionBlock
        icon={<FaAddressCard size={14} className="text-violet-600" />}
        iconBg="bg-violet-50"
        title={tt("detail.officialDocsTitle")}
      >
        <Field label={f.rfc} value={profile.rfc} />
        <Field label={f.nss} value={profile.nss} />
        <Field label={f.curp} value={profile.curp} />
      </SectionBlock>

      <ITDivider className="border-slate-100" />

      <SectionBlock
        icon={<FaPhoneAlt size={14} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
        title={tt("detail.contactTitle")}
      >
        <Field label={f.personalCell} value={profile.celularPersonal} />
        <Field label={f.email} value={profile.email} />
        <Field label={f.companyCell} value={profile.celularEmpresa} />
        <Field label={f.emergencyContact} value={profile.contactoEmergenciaNombre} />
        <Field label={f.emergencyPhone} value={profile.contactoEmergenciaTelefono} />
        <Field label={f.emergencyRelation} value={profile.contactoEmergenciaParentesco} />
      </SectionBlock>

      <ITDivider className="border-slate-100" />

      <SectionBlock
        icon={<FaMapMarkerAlt size={14} className="text-orange-600" />}
        iconBg="bg-orange-50"
        title={tt("detail.addressTitle")}
      >
        <Field label={f.street} value={profile.calleNumero} />
        <Field label={f.zip} value={profile.codigoPostal} />
        <Field label={f.colony} value={profile.colonia} />
        <Field label={f.state} value={profile.estadoDireccion} />
        <Field label={f.city} value={profile.ciudad} />
        <Field label={f.country} value={profile.pais} />
      </SectionBlock>
    </ITFlex>
  );
}
