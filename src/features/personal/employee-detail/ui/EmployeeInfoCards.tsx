import { ITDivider, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
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

interface Props {
  profile: PersonalProfile;
}

export default function EmployeeInfoCards({ profile }: Props) {
  const { t: tt } = useTranslation(["employees"]);
  const f = tt("detail.fields", { returnObjects: true }) as Record<string, string>;

  return (
    <ITFlex direction="column" gap={4} className="py-1">
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

      <ITGrid container columns={12} spacing={4}>
        <Field label={f.rfc} value={profile.rfc} />
        <Field label={f.nss} value={profile.nss} />
        <Field label={f.curp} value={profile.curp} />
      </ITGrid>

      <ITDivider className="border-slate-100" />

      <ITGrid container columns={12} spacing={4}>
        <Field label={f.personalCell} value={profile.celularPersonal} />
        <Field label={f.email} value={profile.email} />
        <Field label={f.companyCell} value={profile.celularEmpresa} />
        <Field label={f.emergencyContact} value={profile.contactoEmergenciaNombre} />
        <Field label={f.emergencyPhone} value={profile.contactoEmergenciaTelefono} />
        <Field label={f.emergencyRelation} value={profile.contactoEmergenciaParentesco} />
      </ITGrid>

      <ITDivider className="border-slate-100" />

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
