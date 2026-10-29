import { LottieLoader } from "@shared/ui/lottie-loader";
import { Fragment, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITFlex,
  ITInput,
  ITPage,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaCamera, FaIdCard, FaMapMarkerAlt, FaPhoneAlt, FaUserTie } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useEmployeeDetail } from "@features/hr/employee-detail";
import type { PersonalProfile, PersonalProfileUpdateInput } from "@entities/hr";
import { departmentsApi, type Department } from "@entities/department";
import { DatePickerPortal } from "@shared/ui/date-picker-portal";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import {
  validateCurp,
  validateEmail,
  validateNss,
  validatePhone,
  validatePostal,
  validateRfc,
} from "@shared/validation";
import { dyn, i18n } from "@shared/i18n";
import Langostin from "@shared/ui/langostin/Langostin";
import { useGoBack } from "@shared/lib/useGoBack";

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

/** Campos con guía de Langostin (por el `name` del input). */
const HINT_FIELDS = new Set(["name", "paternalSurname", "maternalSurname", "employeeNumber", "jobTitle", "rfc", "curp", "nss", "personalPhone", "workPhone", "email", "postalCode", "emergencyContactPhone"]);

interface AppStep {
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

type FormState = PersonalProfileUpdateInput;

const emptyForm = (): FormState => ({});

const formFromProfile = (p: PersonalProfile): FormState => ({
  name: p.name ?? "",
  middleName: p.middleName ?? "",
  employeeNumber: p.employeeNumber ?? "",
  jobTitle: p.jobTitle ?? "",
  departmentId: p.department?.id ?? "",
  subareaId: p.subarea?.id ?? "",
  paternalSurname: p.paternalSurname ?? "",
  maternalSurname: p.maternalSurname ?? "",
  email: p.email ?? "",
  genderId: p.gender?.id ?? "",
  bloodTypeId: p.bloodType?.id ?? "",
  medicalConditions: p.medicalConditions ?? "",
  allergies: p.allergies ?? "",
  birthDate: p.birthDate ?? "",
  hireDate: p.hireDate ?? "",
  rfc: p.rfc ?? "",
  curp: p.curp ?? "",
  nss: p.nss ?? "",
  streetAddress: p.streetAddress ?? "",
  neighborhood: p.neighborhood ?? "",
  postalCode: p.postalCode ?? "",
  city: p.city ?? "",
  addressState: p.addressState ?? "",
  country: p.country ?? "México",
  personalPhone: p.personalPhone ?? "",
  workPhone: p.workPhone ?? "",
  emergencyContactName: p.emergencyContactName ?? "",
  emergencyContactPhone: p.emergencyContactPhone ?? "",
  emergencyContactRelationship: p.emergencyContactRelationship ?? "",
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
  const goBack = useGoBack();
  const { t: tt } = useTranslation(["employees", "common"]);

  const detail = useEmployeeDetail(id);
  // Langostin sigue el campo donde está el cursor.
  const [focusedInput, setFocusedInput] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [departments, setDepartments] = useState<Department[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (detail.profile) setForm(formFromProfile(detail.profile));
  }, [detail.profile]);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const field =
    (name: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [name]: e.target.value }));

  const dateField =
    (name: "birthDate" | "hireDate") =>
    (
      e: React.ChangeEvent<HTMLInputElement> | { target: { name: string; value: Date | [Date | null, Date | null] } }
    ) => {
      const value = e.target.value;
      setForm((f) => ({ ...f, [name]: value instanceof Date ? localToDateStr(value) : "" }));
    };

  /** Errores por campo, sin tocar el estado (para poder decidir el paso). */
  const collectErrors = (): Record<string, string> => {
    const e: Record<string, string> = {};
    // El nombre vive SOLO aquí (el formulario de usuario no lo edita cuando hay
    // expediente), así que no puede quedar vacío: `name` es obligatorio.
    if (!form.name?.trim()) e.name = i18n.t("common:validation.required", { label: tt("detail.fields.name") });
    const rfcErr = validateRfc(form.rfc);
    if (rfcErr) e.rfc = rfcErr;
    const curpErr = validateCurp(form.curp);
    if (curpErr) e.curp = curpErr;
    const nssErr = validateNss(form.nss);
    if (nssErr) e.nss = nssErr;
    const postalErr = validatePostal(form.postalCode);
    if (postalErr) e.postalCode = postalErr;
    const personalPhoneErr = validatePhone(form.personalPhone);
    if (personalPhoneErr) e.personalPhone = personalPhoneErr;
    const companyPhoneErr = validatePhone(form.workPhone);
    if (companyPhoneErr) e.workPhone = companyPhoneErr;
    const emergencyPhoneErr = validatePhone(form.emergencyContactPhone);
    if (emergencyPhoneErr) e.emergencyContactPhone = emergencyPhoneErr;
    const emailErr = validateEmail(form.email);
    if (emailErr) e.email = emailErr;
    // Los campos laborales tienen el mismo tope que la API.
    if ((form.employeeNumber ?? "").length > 30) e.employeeNumber = tt("detail.validation.employeeNoMax", { max: 30 });
    if ((form.jobTitle ?? "").length > 100) e.jobTitle = tt("detail.validation.jobTitleMax", { max: 100 });
    return e;
  };

  const handleFinish = async () => {
    const errors = collectErrors();
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      detail.setError(i18n.t("common:validation.reviewFields"));
      // Se lleva al primer campo con error: en una sola página basta enfocarlo.
      document.querySelector<HTMLInputElement>(`[name="${Object.keys(errors)[0]}"]`)?.focus();
      return;
    }
    const normalized: FormState = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [
        key,
        typeof value === "string" && value.trim() === ""
          ? // `name` es obligatorio en el modelo: vacío se omite, no se manda null.
            key === "name"
            ? undefined
            : null
          : value,
      ])
    ) as FormState;
    const ok = await detail.saveProfile(normalized, detail.profile?.discounts ?? []);
    if (ok) goBack(`/employees/${id}`);
  };

  if (detail.loading || !detail.profile) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding
        title={tt("detail.editInfo")}
        backAction={() => goBack(`/employees/${id}`)}
        icon={<FaUserTie size={20} />}
        breadcrumbs={[
          { label: tt("breadcrumb"), onClick: () => navigate("/employees") },
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
            <LottieLoader size="lg" />
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
              <ProfileAvatar photoUrl={profile.photoUrl} initials={initials} alt={profile.name} size="xl" />
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
              <ITInput name="name" label={tt("detail.fields.name")} value={form.name ?? ""} onChange={field("name")} aria-invalid={!!errors.name} required />
              {errors.name && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.name}</span>}
            </Cell>
            <Cell>
              <ITInput name="middleName" label={tt("detail.fields.secondName")} value={form.middleName ?? ""} onChange={field("middleName")} />
            </Cell>
            <Cell>
              <ITInput name="paternalSurname" label={tt("detail.fields.paternalSurname")} value={form.paternalSurname ?? ""} onChange={field("paternalSurname")} />
            </Cell>
            <Cell>
              <ITInput name="maternalSurname" label={tt("detail.fields.maternalSurname")} value={form.maternalSurname ?? ""} onChange={field("maternalSurname")} />
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITSelect
                name="genderId"
                label={tt("detail.fields.gender")}
                value={form.genderId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, genderId: e.target.value }))}
                options={[{ value: "", label: "—" }, ...detail.genders.map((g) => ({ value: g.id, label: g.name }))]}
              />
            </Cell>
            <Cell>
              <DatePickerPortal
                name="birthDate"
                label={tt("detail.fields.birthDate")}
                value={dateStrToLocal(form.birthDate)}
                onChange={dateField("birthDate")}
              />
            </Cell>
            <Cell>
              <ITSelect
                name="bloodTypeId"
                label={tt("detail.fields.bloodType")}
                value={form.bloodTypeId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, bloodTypeId: e.target.value }))}
                options={[{ value: "", label: "—" }, ...detail.bloodTypes.map((b) => ({ value: b.id, label: b.name }))]}
              />
            </Cell>
          </Row>
          <ITTextarea
            name="medicalConditions"
            label={tt("detail.fields.condition")}
            value={form.medicalConditions ?? ""}
            onChange={(value) => setForm((f) => ({ ...f, medicalConditions: value }))}
            rows={2}
          />
          <ITTextarea
            name="allergies"
            label={tt("detail.fields.allergies")}
            value={form.allergies ?? ""}
            onChange={(value) => setForm((f) => ({ ...f, allergies: value }))}
            rows={2}
          />
        </ITFlex>
      ),
    },
    {
      label: tt("detail.stepper.employment"),
      icon: <FaIdCard size={13} />,
      content: (
        <ITFlex direction="column" gap={4}>
          <Row>
            <Cell>
              <ITInput name="employeeNumber" label={tt("detail.fields.employeeNo")} value={form.employeeNumber ?? ""} onChange={field("employeeNumber")} aria-invalid={!!errors.employeeNumber} />
              {errors.employeeNumber && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.employeeNumber}</span>}
            </Cell>
            <Cell>
              <ITInput name="jobTitle" label={tt("detail.fields.position")} value={form.jobTitle ?? ""} onChange={field("jobTitle")} aria-invalid={!!errors.jobTitle} />
              {errors.jobTitle && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.jobTitle}</span>}
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITSelect
                name="departmentId"
                label={tt("detail.fields.department")}
                options={[
                  { value: "", label: tt("common:labels.unassigned") },
                  ...departments.map((d) => ({ value: d.id, label: d.name })),
                ]}
                value={form.departmentId ?? ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, departmentId: e.target.value, subareaId: "" }))
                }
              />
            </Cell>
            <Cell>
              <ITSelect
                name="subareaId"
                label={tt("detail.fields.subarea")}
                disabled={!form.departmentId}
                options={[
                  { value: "", label: tt("common:labels.unassigned") },
                  ...(departments.find((d) => d.id === form.departmentId)?.subareas ?? []).map(
                    (s) => ({ value: s.id, label: s.name })
                  ),
                ]}
                value={form.subareaId ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, subareaId: e.target.value }))}
              />
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITDatePicker
                name="hireDate"
                label={tt("detail.fields.hireDate")}
                value={dateStrToLocal(form.hireDate)}
                onChange={dateField("hireDate")}
              />
            </Cell>
            <Cell>
              <ITInput name="rfc" label={tt("detail.fields.rfc")} value={form.rfc ?? ""} onChange={field("rfc")} aria-invalid={!!errors.rfc} />
              {errors.rfc && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.rfc}</span>}
            </Cell>
          </Row>
          <Row>
            <Cell>
              <ITInput name="curp" label={tt("detail.fields.curp")} value={form.curp ?? ""} onChange={field("curp")} aria-invalid={!!errors.curp} />
              {errors.curp && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.curp}</span>}
            </Cell>
            <Cell>
              <ITInput name="nss" label={tt("detail.fields.nss")} value={form.nss ?? ""} onChange={field("nss")} aria-invalid={!!errors.nss} />
              {errors.nss && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.nss}</span>}
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
              <ITInput name="personalPhone" label={tt("detail.fields.personalCell")} value={form.personalPhone ?? ""} onChange={field("personalPhone")} aria-invalid={!!errors.personalPhone} />
              {errors.personalPhone && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.personalPhone}</span>}
            </Cell>
            <Cell>
              <ITInput name="workPhone" label={tt("detail.fields.companyCell")} value={form.workPhone ?? ""} onChange={field("workPhone")} aria-invalid={!!errors.workPhone} />
              {errors.workPhone && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.workPhone}</span>}
            </Cell>
            <Cell>
              <ITInput name="email" type="email" label={tt("detail.fields.email")} value={form.email ?? ""} onChange={field("email")} aria-invalid={!!errors.email} />
              {errors.email && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.email}</span>}
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
              <ITInput name="streetAddress" label={tt("detail.fields.street")} value={form.streetAddress ?? ""} onChange={field("streetAddress")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="neighborhood" label={tt("detail.fields.colony")} value={form.neighborhood ?? ""} onChange={field("neighborhood")} />
            </Cell>
            <Cell min={120}>
              <ITInput name="postalCode" label={tt("detail.fields.zip")} value={form.postalCode ?? ""} onChange={field("postalCode")} aria-invalid={!!errors.postalCode} />
              {errors.postalCode && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.postalCode}</span>}
            </Cell>
          </Row>
          <Row>
            <Cell min={160}>
              <ITInput name="city" label={tt("detail.fields.city")} value={form.city ?? ""} onChange={field("city")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="addressState" label={tt("detail.fields.state")} value={form.addressState ?? ""} onChange={field("addressState")} />
            </Cell>
            <Cell min={160}>
              <ITInput name="country" label={tt("detail.fields.country")} value={form.country ?? ""} onChange={field("country")} />
            </Cell>
          </Row>

          <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400 pt-2">
            {tt("detail.emergencyContactTitle")}
          </ITText>
          <Row>
            <Cell>
              <ITInput name="emergencyContactName" label={tt("detail.fields.emergencyContact")} value={form.emergencyContactName ?? ""} onChange={field("emergencyContactName")} />
            </Cell>
            <Cell>
              <ITInput name="emergencyContactPhone" label={tt("detail.fields.emergencyPhone")} value={form.emergencyContactPhone ?? ""} onChange={field("emergencyContactPhone")} aria-invalid={!!errors.emergencyContactPhone} />
              {errors.emergencyContactPhone && <span role="alert" className="text-red-500 text-xs mt-1 block">{errors.emergencyContactPhone}</span>}
            </Cell>
            <Cell>
              <ITInput name="emergencyContactRelationship" label={tt("detail.fields.emergencyRelation")} value={form.emergencyContactRelationship ?? ""} onChange={field("emergencyContactRelationship")} />
            </Cell>
          </Row>
        </ITFlex>
      ),
    },
  ];

  const hasErrors = Object.keys(errors).length > 0;
  const hintKey = focusedInput && HINT_FIELDS.has(focusedInput) ? focusedInput : null;
  const guide = detail.saving
    ? tt("detail.guide.saving")
    : hasErrors
      ? tt("detail.guide.fix")
      : hintKey
        ? dyn(tt)(`detail.guide.fields.${hintKey}`)
        : tt("detail.guide.start");

  // Enter pasa al siguiente campo, como en el alta.
  const handleEnter = (event: KeyboardEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    if (event.key !== "Enter" || target.tagName !== "INPUT" || target.getAttribute("role") === "combobox") return;
    const fields = Array.from(event.currentTarget.querySelectorAll<HTMLElement>("input, select, textarea")).filter(
      (el) => !(el as HTMLInputElement).disabled && (el as HTMLInputElement).type !== "hidden" && el.tabIndex !== -1
    );
    const next = fields[fields.indexOf(target) + 1];
    if (!next) return;
    event.preventDefault();
    next.focus();
  };
  const handleFocus = (event: FocusEvent<HTMLDivElement>) => {
    const name = (event.target as HTMLInputElement).name;
    if (name) setFocusedInput(name);
  };

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={tt("detail.editInfo")}
      description={profile.name}
      backAction={() => goBack(`/employees/${id}`)}
      icon={<FaUserTie size={20} />}
      breadcrumbs={[
        { label: tt("breadcrumb"), onClick: () => navigate("/employees") },
        { label: tt("detail.title") },
        { label: tt("detail.editInfo") },
      ]}
    >
      {detail.error && (
        <ITAlert variant="error" dismissible onDismiss={() => detail.setError(null)}>
          {detail.error}
        </ITAlert>
      )}

      <ITFlex justify="end" align="center" gap={3} className="mb-6">
        <ITButton variant="outlined" color="secondary" onClick={() => goBack(`/employees/${id}`)} disabled={detail.saving}>
          {tt("common:actions.cancel")}
        </ITButton>
        <ITButton variant="raised-text" color="primary" onClick={() => void handleFinish()} disabled={detail.saving}>
          {tt("detail.save")}
        </ITButton>
      </ITFlex>

      <div onKeyDown={handleEnter} onFocus={handleFocus}>
        <ITFlex direction="column" gap={6}>
          {steps.map((section) => (
            <Fragment key={section.label}>
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <header className="mb-5 flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600">{section.icon}</span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-700">{section.label}</h3>
                </header>
                {section.content}
              </section>
            </Fragment>
          ))}
        </ITFlex>
      </div>

      {/* Langostin flota abajo a la derecha: guía del campo actual y avisa mientras guarda. */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-50 flex items-end gap-3">
        <div className="pointer-events-auto max-w-xs rounded-2xl rounded-br-sm border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-lg">
          {guide}
        </div>
        <div className="pointer-events-auto drop-shadow-lg">
          <Langostin anim={detail.saving ? "work" : "wave"} size={72} label={tt("detail.guide.label")} />
        </div>
      </div>
    </ITPage>
  );
}