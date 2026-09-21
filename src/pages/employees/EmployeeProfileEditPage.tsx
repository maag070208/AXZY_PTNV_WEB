import { useEffect, useRef, useState } from "react";
import {
  ITAlert,
  ITAvatar,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITSelect,
  ITStepper,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaCamera, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaUserTie } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEmployeeDetail } from "@features/personal/employee-detail";
import type { PersonalProfile, PersonalProfileUpdateInput } from "@entities/personal";

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

interface AppStep {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

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

function Row({ children }: { children: React.ReactNode }) {
  return (
    <ITFlex gap={4} wrap="wrap">
      {children}
    </ITFlex>
  );
}

function Cell({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  return <div style={{ flex: 1, minWidth: min }}>{children}</div>;
}

export default function EmployeeProfileEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t: tt } = useTranslation(["employees", "common"]);

  const detail = useEmployeeDetail(id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (detail.profile) setForm(formFromProfile(detail.profile));
  }, [detail.profile]);

  const field =
    (name: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }));

  const dateField =
    (name: "fechaNacimiento" | "fechaIngreso") =>
    (
      e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: Date | [Date | null, Date | null] } }
    ) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [name]: value instanceof Date ? localToDateStr(value) : "" }));
    };

  const handleFinish = async () => {
    const normalized: FormState = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" && value.trim() === "" ? null : value])
    ) as FormState;
    const ok = await detail.saveProfile(normalized, detail.profile?.discounts ?? []);
    if (ok) navigate(`/empleados/${id}`);
  };

  if (detail.loading || !detail.profile) {
    return (
      <ITPage
        title={tt("detail.editInfo")}
        backAction={() => navigate(-1)}
        icon={<FaUserTie size={20} />}
        breadcrumbs={[
          { label: tt("breadcrumb"), onClick: () => navigate("/empleados") },
          { label: tt("detail.title") },
          { label: tt("detail.editInfo") },
        ]}
      >
        {detail.error ? (
          <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
            {detail.error}
          </ITAlert>
        ) : (
          <ITFlex justify="center">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        )}
      </ITPage>
    );
  }

  const profile = detail.profile;
  const initials = profile.name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  const steps: AppStep[] = [
    {
      label: tt("detail.stepper.photoPersonal"),
      icon: <FaUserTie size={13} />,
      content: (
        <ITFlex direction="column" gap={5}>
          <ITFlex align="center" gap={4}>
            <div className="relative inline-block shrink-0">
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
                  if (file) detail.uploadPhoto(file);
                  e.target.value = "";
                }}
              />
            </div>
            <ITButton
              variant="outlined"
              color="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <ITText className="font-bold text-[11px]">{tt("detail.changePhoto")}</ITText>
            </ITButton>
          </ITFlex>

          <Row>
            <Cell>
              <ITInput name="segundoNombre" label={tt("detail.fields.secondName")} value={form.segundoNombre ?? ""} onChange={field("segundoNombre")} />
            </Cell>
            <Cell>
              <ITInput name="apellidoPaterno" label={tt("detail.fields.apellidoPaterno")} value={form.apellidoPaterno ?? ""} onChange={field("apellidoPaterno")} />
            </Cell>
            <Cell>
              <ITInput name="apellidoMaterno" label={tt("detail.fields.apellidoMaterno")} value={form.apellidoMaterno ?? ""} onChange={field("apellidoMaterno")} />
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITSelect
                name="generoId"
                label={tt("detail.fields.gender")}
                value={form.generoId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, generoId: e.target.value }))}
                options={[{ value: "", label: "—" }, ...detail.generos.map((g) => ({ value: g.id, label: g.nombre }))]}
              />
            </Cell>
            <Cell>
              <ITDatePicker name="fechaNacimiento" label={tt("detail.fields.birthDate")} value={dateStrToLocal(form.fechaNacimiento)} onChange={dateField("fechaNacimiento")} />
            </Cell>
            <Cell>
              <ITSelect
                name="tipoSangreId"
                label={tt("detail.fields.bloodType")}
                value={form.tipoSangreId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, tipoSangreId: e.target.value }))}
                options={[{ value: "", label: "—" }, ...detail.tiposSangre.map((b) => ({ value: b.id, label: b.nombre }))]}
              />
            </Cell>
          </Row>
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
      ),
    },
    {
      label: tt("detail.stepper.laboral"),
      icon: <FaIdCard size={13} />,
      content: (
        <ITFlex direction="column" gap={4}>
          <Row>
            <Cell>
              <ITDatePicker name="fechaIngreso" label={tt("detail.fields.hireDate")} value={dateStrToLocal(form.fechaIngreso)} onChange={dateField("fechaIngreso")} />
            </Cell>
            <Cell>
              <ITInput name="rfc" label={tt("detail.fields.rfc")} value={form.rfc ?? ""} onChange={field("rfc")} />
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITInput name="curp" label={tt("detail.fields.curp")} value={form.curp ?? ""} onChange={field("curp")} />
            </Cell>
            <Cell>
              <ITInput name="nss" label={tt("detail.fields.nss")} value={form.nss ?? ""} onChange={field("nss")} />
            </Cell>
          </Row>
        </ITFlex>
      ),
    },
    {
      label: tt("detail.stepper.contact"),
      icon: <FaPhoneAlt size={13} />,
      content: (
        <ITFlex direction="column" gap={4}>
          <Row>
            <Cell>
              <ITInput name="celularPersonal" label={tt("detail.fields.personalCell")} value={form.celularPersonal ?? ""} onChange={field("celularPersonal")} />
            </Cell>
            <Cell>
              <ITInput name="celularEmpresa" label={tt("detail.fields.companyCell")} value={form.celularEmpresa ?? ""} onChange={field("celularEmpresa")} />
            </Cell>
            <Cell>
              <ITInput name="email" type="email" label={tt("detail.fields.email")} value={form.email ?? ""} onChange={field("email")} />
            </Cell>
          </Row>
          <ITFlex align="center" gap={2}>
            <ITFlex align="center" justify="center" className="h-8 w-8 rounded-lg bg-orange-50">
              <FaMapMarkerAlt size={12} className="text-orange-600" />
            </ITFlex>
            <ITText className="text-[11px] font-black uppercase tracking-widest text-slate-500">
              {tt("detail.addressTitle")}
            </ITText>
          </ITFlex>
          <Row>
            <Cell>
              <ITInput name="calleNumero" label={tt("detail.fields.street")} value={form.calleNumero ?? ""} onChange={field("calleNumero")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="colonia" label={tt("detail.fields.colony")} value={form.colonia ?? ""} onChange={field("colonia")} />
            </Cell>
            <Cell min={120}>
              <ITInput name="codigoPostal" label={tt("detail.fields.zip")} value={form.codigoPostal ?? ""} onChange={field("codigoPostal")} />
            </Cell>
          </Row>
          <Row>
            <Cell min={160}>
              <ITInput name="ciudad" label={tt("detail.fields.city")} value={form.ciudad ?? ""} onChange={field("ciudad")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="estadoDireccion" label={tt("detail.fields.state")} value={form.estadoDireccion ?? ""} onChange={field("estadoDireccion")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="pais" label={tt("detail.fields.country")} value={form.pais ?? ""} onChange={field("pais")} />
            </Cell>
          </Row>

          <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">
            {tt("detail.emergencyContactTitle")}
          </ITText>
          <Row>
            <Cell>
              <ITInput name="contactoEmergenciaNombre" label={tt("detail.fields.emergencyContact")} value={form.contactoEmergenciaNombre ?? ""} onChange={field("contactoEmergenciaNombre")} />
            </Cell>
            <Cell>
              <ITInput name="contactoEmergenciaTelefono" label={tt("detail.fields.emergencyPhone")} value={form.contactoEmergenciaTelefono ?? ""} onChange={field("contactoEmergenciaTelefono")} />
            </Cell>
            <Cell>
              <ITInput name="contactoEmergenciaParentesco" label={tt("detail.fields.emergencyRelation")} value={form.contactoEmergenciaParentesco ?? ""} onChange={field("contactoEmergenciaParentesco")} />
            </Cell>
          </Row>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title={tt("detail.editInfo")}
      description={profile.name}
      backAction={() => navigate(-1)}
      icon={<FaUserTie size={20} />}
      breadcrumbs={[
        { label: tt("breadcrumb"), onClick: () => navigate("/empleados") },
        { label: tt("detail.title") },
        { label: tt("detail.editInfo") },
      ]}
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}

      <ITStepper
        steps={steps}
        currentStep={step}
        onStepChange={setStep}
        onFinish={handleFinish}
        allowClickToJump
        useIcons
        scrollableContent
        maxContentHeight="60vh"
        color="primary"
      />
    </ITPage>
  );
}