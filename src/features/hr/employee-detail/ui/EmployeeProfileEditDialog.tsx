import { useEffect, useState } from "react";
import {
  ITButton,
  ITCheckbox,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITInput,
  ITSelect,
  ITTabs,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import type {
  PersonalProfile,
  PersonalProfileUpdateInput,
  EmployeeDiscount,
  TipoDescuento,
  Genero,
  TipoSangre,
} from "@entities/personal";
import {
  validateCurp,
  validateEmail,
  validateNss,
  validatePhone,
  validatePostal,
  validateRfc,
} from "@shared/validation";

const DISCOUNT_TYPES: TipoDescuento[] = ["INFONAVIT", "IMSS", "DEUDOR_ALIMENTICIO"];

/** "YYYY-MM-DD" <-> Date local (sin pasar por UTC, para no correr el día). */
const dateStrToLocal = (value?: string | null): Date | undefined => {
  if (!value) return undefined;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
};
const localToDateStr = (value: Date): string => {
  const y = value.getFullYear();
  const m = String(value.getMonth() + 1).padStart(2, "0");
  const d = String(value.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

type FormState = PersonalProfileUpdateInput;

const emptyForm = (): FormState => ({});

const formFromProfile = (p: PersonalProfile): FormState => ({
  segundoNombre: p.segundoNombre ?? "",
  apellidoPaterno: p.apellidoPaterno ?? "",
  apellidoMaterno: p.apellidoMaterno ?? "",
  email: p.email ?? "",
  generoId: p.genero?.id ?? "",
  tipoSangreId: p.tipoSangre?.id ?? "",
  padecimiento: p.padecimiento ?? "",
  alergias: p.alergias ?? "",
  fechaNacimiento: p.fechaNacimiento ?? "",
  fechaIngreso: p.fechaIngreso ?? "",
  rfc: p.rfc ?? "",
  curp: p.curp ?? "",
  nss: p.nss ?? "",
  calleNumero: p.calleNumero ?? "",
  colonia: p.colonia ?? "",
  codigoPostal: p.codigoPostal ?? "",
  ciudad: p.ciudad ?? "",
  estadoDireccion: p.estadoDireccion ?? "",
  pais: p.pais ?? "México",
  celularPersonal: p.celularPersonal ?? "",
  celularEmpresa: p.celularEmpresa ?? "",
  contactoEmergenciaNombre: p.contactoEmergenciaNombre ?? "",
  contactoEmergenciaTelefono: p.contactoEmergenciaTelefono ?? "",
  contactoEmergenciaParentesco: p.contactoEmergenciaParentesco ?? "",
});

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PersonalProfile | null;
  generos: Genero[];
  tiposSangre: TipoSangre[];
  saving: boolean;
  onSave: (data: PersonalProfileUpdateInput, discounts: EmployeeDiscount[]) => Promise<boolean>;
}

export default function EmployeeProfileEditDialog({
  isOpen,
  onClose,
  profile,
  generos,
  tiposSangre,
  saving,
  onSave,
}: Props) {
  const { t: tt } = useTranslation(["employees", "common"]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [discounts, setDiscounts] = useState<Record<TipoDescuento, string | null>>({
    INFONAVIT: null,
    IMSS: null,
    DEUDOR_ALIMENTICIO: null,
  });

  useEffect(() => {
    if (!isOpen || !profile) return;
    setForm(formFromProfile(profile));
    const next: Record<TipoDescuento, string | null> = {
      INFONAVIT: null,
      IMSS: null,
      DEUDOR_ALIMENTICIO: null,
    };
    for (const d of profile.discounts) next[d.tipo] = d.nota ?? "";
    setDiscounts(next);
  }, [isOpen, profile]);

  const field = (name: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [name]: e.target.value }));

  const dateField = (name: "fechaNacimiento" | "fechaIngreso") => (
    e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: Date | [Date | null, Date | null] } }
  ) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [name]: value instanceof Date ? localToDateStr(value) : "" }));
  };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    const rfcErr = validateRfc(form.rfc);
    if (rfcErr) e.rfc = rfcErr;
    const curpErr = validateCurp(form.curp);
    if (curpErr) e.curp = curpErr;
    const nssErr = validateNss(form.nss);
    if (nssErr) e.nss = nssErr;
    const postalErr = validatePostal(form.codigoPostal);
    if (postalErr) e.codigoPostal = postalErr;
    const personalPhoneErr = validatePhone(form.celularPersonal);
    if (personalPhoneErr) e.celularPersonal = personalPhoneErr;
    const companyPhoneErr = validatePhone(form.celularEmpresa);
    if (companyPhoneErr) e.celularEmpresa = companyPhoneErr;
    const emergencyPhoneErr = validatePhone(form.contactoEmergenciaTelefono);
    if (emergencyPhoneErr) e.contactoEmergenciaTelefono = emergencyPhoneErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    // Campos de texto vacíos se normalizan a null (en vez de "") para que
    // limpien el valor en vez de fallar validaciones de formato (p.ej. email).
    const normalized: FormState = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" && value.trim() === "" ? null : value])
    ) as FormState;
    const discountList: EmployeeDiscount[] = DISCOUNT_TYPES.filter((t) => discounts[t] !== null).map((t) => ({
      tipo: t,
      nota: discounts[t] || undefined,
    }));
    await onSave(normalized, discountList);
  };

  const personalTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[200px]">
          <ITInput name="segundoNombre" label={tt("detail.fields.secondName")} value={form.segundoNombre ?? ""} onChange={field("segundoNombre")} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="apellidoPaterno" label={tt("detail.fields.apellidoPaterno")} value={form.apellidoPaterno ?? ""} onChange={field("apellidoPaterno")} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="apellidoMaterno" label={tt("detail.fields.apellidoMaterno")} value={form.apellidoMaterno ?? ""} onChange={field("apellidoMaterno")} />
        </div>
      </ITFlex>
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[200px]">
          <ITSelect
            name="generoId"
            label={tt("detail.fields.gender")}
            value={form.generoId ?? ""}
            onChange={(e) => setForm((f) => ({ ...f, generoId: e.target.value }))}
            options={[{ value: "", label: "—" }, ...generos.map((g) => ({ value: g.id, label: g.nombre }))]}
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITDatePicker name="fechaNacimiento" label={tt("detail.fields.birthDate")} value={dateStrToLocal(form.fechaNacimiento)} onChange={dateField("fechaNacimiento")} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITDatePicker name="fechaIngreso" label={tt("detail.fields.hireDate")} value={dateStrToLocal(form.fechaIngreso)} onChange={dateField("fechaIngreso")} />
        </div>
      </ITFlex>
    </ITFlex>
  );

  const oficialTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[200px]">
          <ITInput name="rfc" label={tt("detail.fields.rfc")} value={form.rfc ?? ""} onChange={field("rfc")} aria-invalid={!!errors.rfc} />
          {errors.rfc && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.rfc}</span>}
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="curp" label={tt("detail.fields.curp")} value={form.curp ?? ""} onChange={field("curp")} aria-invalid={!!errors.curp} />
          {errors.curp && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.curp}</span>}
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="nss" label={tt("detail.fields.nss")} value={form.nss ?? ""} onChange={field("nss")} aria-invalid={!!errors.nss} />
          {errors.nss && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.nss}</span>}
        </div>
      </ITFlex>
    </ITFlex>
  );

  const direccionTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      <ITInput name="calleNumero" label={tt("detail.fields.street")} value={form.calleNumero ?? ""} onChange={field("calleNumero")} />
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[160px]">
          <ITInput name="colonia" label={tt("detail.fields.colony")} value={form.colonia ?? ""} onChange={field("colonia")} />
        </div>
        <div className="flex-1 min-w-[120px]">
          <ITInput name="codigoPostal" label={tt("detail.fields.zip")} value={form.codigoPostal ?? ""} onChange={field("codigoPostal")} aria-invalid={!!errors.codigoPostal} />
          {errors.codigoPostal && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.codigoPostal}</span>}
        </div>
      </ITFlex>
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[160px]">
          <ITInput name="ciudad" label={tt("detail.fields.city")} value={form.ciudad ?? ""} onChange={field("ciudad")} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <ITInput name="estadoDireccion" label={tt("detail.fields.state")} value={form.estadoDireccion ?? ""} onChange={field("estadoDireccion")} />
        </div>
        <div className="flex-1 min-w-[160px]">
          <ITInput name="pais" label={tt("detail.fields.country")} value={form.pais ?? ""} onChange={field("pais")} />
        </div>
      </ITFlex>
    </ITFlex>
  );

  const contactoTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[200px]">
          <ITInput name="celularPersonal" label={tt("detail.fields.personalCell")} value={form.celularPersonal ?? ""} onChange={field("celularPersonal")} aria-invalid={!!errors.celularPersonal} />
          {errors.celularPersonal && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.celularPersonal}</span>}
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="celularEmpresa" label={tt("detail.fields.companyCell")} value={form.celularEmpresa ?? ""} onChange={field("celularEmpresa")} aria-invalid={!!errors.celularEmpresa} />
          {errors.celularEmpresa && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.celularEmpresa}</span>}
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="email" type="email" label={tt("detail.fields.email")} value={form.email ?? ""} onChange={field("email")} aria-invalid={!!errors.email} />
          {errors.email && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
        </div>
      </ITFlex>
      <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">
        {tt("detail.emergencyContactTitle")}
      </ITText>
      <ITFlex gap={4} wrap="wrap">
        <div className="flex-1 min-w-[200px]">
          <ITInput name="contactoEmergenciaNombre" label={tt("detail.fields.emergencyContact")} value={form.contactoEmergenciaNombre ?? ""} onChange={field("contactoEmergenciaNombre")} />
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="contactoEmergenciaTelefono" label={tt("detail.fields.emergencyPhone")} value={form.contactoEmergenciaTelefono ?? ""} onChange={field("contactoEmergenciaTelefono")} aria-invalid={!!errors.contactoEmergenciaTelefono} />
          {errors.contactoEmergenciaTelefono && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.contactoEmergenciaTelefono}</span>}
        </div>
        <div className="flex-1 min-w-[200px]">
          <ITInput name="contactoEmergenciaParentesco" label={tt("detail.fields.emergencyRelation")} value={form.contactoEmergenciaParentesco ?? ""} onChange={field("contactoEmergenciaParentesco")} />
        </div>
      </ITFlex>
    </ITFlex>
  );

  const medicaTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      <div className="max-w-xs">
        <ITSelect
          name="tipoSangreId"
          label={tt("detail.fields.bloodType")}
          value={form.tipoSangreId ?? ""}
          onChange={(e) => setForm((f) => ({ ...f, tipoSangreId: e.target.value }))}
          options={[{ value: "", label: "—" }, ...tiposSangre.map((b) => ({ value: b.id, label: b.nombre }))]}
        />
      </div>
      <ITTextarea
        name="padecimiento"
        label={tt("detail.fields.condition")}
        value={form.padecimiento ?? ""}
        onChange={(value) => setForm((f) => ({ ...f, padecimiento: value }))}
        rows={2}
      />
      <ITTextarea
        name="alergias"
        label={tt("detail.fields.allergies")}
        value={form.alergias ?? ""}
        onChange={(value) => setForm((f) => ({ ...f, alergias: value }))}
        rows={2}
      />
    </ITFlex>
  );

  const descuentosTab = (
    <ITFlex direction="column" gap={4} className="pt-4">
      {DISCOUNT_TYPES.map((type) => {
        const checked = discounts[type] !== null;
        return (
          <div key={type} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
            <ITCheckbox
              name={`discount_${type}`}
              checked={checked}
              onChange={(value) =>
                setDiscounts((d) => ({ ...d, [type]: value ? "" : null }))
              }
              label={<ITText className="text-[12px] font-bold text-slate-700">{tt(`detail.discountTypes.${type}`)}</ITText>}
            />
            {checked && (
              <div className="mt-2">
                <ITInput
                  name={`discount_note_${type}`}
                  label={tt("detail.discountNote")}
                  value={discounts[type] ?? ""}
                  onChange={(e) => setDiscounts((d) => ({ ...d, [type]: e.target.value }))}
                />
              </div>
            )}
          </div>
        );
      })}
    </ITFlex>
  );

  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={tt("detail.editInfo")} className="max-w-3xl">
      <ITTabs
        variant="line"
        items={[
          { id: "personal", label: tt("detail.tabs.personal"), content: personalTab },
          { id: "oficial", label: tt("detail.tabs.official"), content: oficialTab },
          { id: "direccion", label: tt("detail.tabs.address"), content: direccionTab },
          { id: "contacto", label: tt("detail.tabs.contact"), content: contactoTab },
          { id: "medica", label: tt("detail.tabs.medical"), content: medicaTab },
          { id: "descuentos", label: tt("detail.tabs.discounts"), content: descuentosTab },
        ]}
      />
      <ITFlex justify="end" gap={2} className="mt-6 pt-4 border-t border-slate-100">
        <ITButton variant="outlined" color="secondary" onClick={onClose} disabled={saving}>
          <ITText className="font-bold text-[11px]">{tt("common:actions.cancel")}</ITText>
        </ITButton>
        <ITButton variant="filled" color="primary" onClick={handleSave} disabled={saving}>
          <ITText className="font-bold text-[11px]">{saving ? tt("detail.saving") : tt("common:actions.save")}</ITText>
        </ITButton>
      </ITFlex>
    </ITDialog>
  );
}
