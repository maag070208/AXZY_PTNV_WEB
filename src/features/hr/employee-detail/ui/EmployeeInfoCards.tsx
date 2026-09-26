import { ITDivider, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  FaFileInvoiceDollar,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUser,
} from "react-icons/fa";
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

function SubGroupHeader({
  icon,
  iconBg,
  title,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
}) {
  return (
    <ITFlex align="center" gap={2}>
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
        {title}
      </ITText>
    </ITFlex>
  );
}

interface Props {
  profile: PersonalProfile;
}

export default function EmployeeInfoCards({ profile }: Props) {
  const { t: tt } = useTranslation(["employees"]);
  const f = tt("detail.fields", { returnObjects: true }) as Record<string, string>;
  const sg = tt("detail.subGroups", { returnObjects: true }) as Record<string, string>;

  return (
    <ITFlex direction="column" gap={4} className="py-1">
      <SubGroupHeader
        icon={<FaUser size={12} className="text-indigo-600" />}
        iconBg="bg-indigo-50"
        title={sg.identification}
      />
      <ITGrid container columns={12} spacing={4}>
        <Field label={f.employeeNo} value={profile.numeroEmpleado} />
        <Field label={f.apellidoMaterno} value={profile.apellidoMaterno} />
        <Field label={f.firstName} value={profile.name} />
        <Field label={f.birthDate} value={formatDateOnly(profile.fechaNacimiento)} />
        <Field label={f.secondName} value={profile.segundoNombre} />
        <Field label={f.hireDate} value={formatDateOnly(profile.fechaIngreso)} />
        <Field label={f.apellidoPaterno} value={profile.apellidoPaterno} />
        <Field label={f.gender} value={profile.genero?.nombre} />
      </ITGrid>

      <ITDivider className="border-slate-100" />

      <SubGroupHeader
        icon={<FaFileInvoiceDollar size={12} className="text-emerald-600" />}
        iconBg="bg-emerald-50"
        title={sg.fiscal}
      />
      <ITGrid container columns={12} spacing={4}>
        <Field label={f.rfc} value={profile.rfc} />
        <Field label={f.nss} value={profile.nss} />
        <Field label={f.curp} value={profile.curp} />
      </ITGrid>

      <ITDivider className="border-slate-100" />

      <SubGroupHeader
        icon={<FaPhoneAlt size={12} className="text-sky-600" />}
        iconBg="bg-sky-50"
        title={sg.contact}
      />
      <ITGrid container columns={12} spacing={4}>
        <Field label={f.personalCell} value={profile.celularPersonal} />
        <Field label={f.email} value={profile.email} />
        <Field label={f.companyCell} value={profile.celularEmpresa} />
        <Field label={f.emergencyContact} value={profile.contactoEmergenciaNombre} />
        <Field label={f.emergencyPhone} value={profile.contactoEmergenciaTelefono} />
        <Field label={f.emergencyRelation} value={profile.contactoEmergenciaParentesco} />
      </ITGrid>

      <ITDivider className="border-slate-100" />

      <SubGroupHeader
        icon={<FaMapMarkerAlt size={12} className="text-orange-600" />}
        iconBg="bg-orange-50"
        title={sg.address}
      />
      <ITGrid container columns={12} spacing={4}>
        <Field label={f.street} value={profile.calleNumero} />
        <Field label={f.zip} value={profile.codigoPostal} />
        <Field label={f.colony} value={profile.colonia} />
        <Field label={f.state} value={profile.estadoDireccion} />
        <Field label={f.city} value={profile.ciudad} />
        <Field label={f.country} value={profile.pais} />
      </ITGrid>
    </ITFlex>
  );
}
