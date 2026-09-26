import { useEffect, useRef, useState } from "react";
import {
  ITAlert,
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
import { useEmployeeDetail } from "@features/hr/employee-detail";
import type { PersonalProfile, PersonalProfileUpdateInput } from "@entities/hr";
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
  middleName: p.middleName ?? "",
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
  const { t: tt } = useTranslation(["employees", "common"]);

  const detail = useEmployeeDetail(id);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (detail.profile) setForm(formFromProfile(detail.profile));
  }, [detail.profile]);

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

  const validate = (): boolean => {
    const e: Record<string, string> = {};
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
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFinish = async () => {
    if (!validate()) {
      // Surface a generic alert; per-field messages are inline.
      detail.setError("Por favor revisa los campos marcados");
      return;
    }
    const normalized: FormState = Object.fromEntries(
      Object.entries(form).map(([key, value]) => [key, typeof value === "string" && value.trim() === "" ? null : value])
    ) as FormState;
    const ok = await detail.saveProfile(normalized, detail.profile?.discounts ?? []);
    if (ok) navigate(`/employees/${id}`);
  };

  if (detail.loading || !detail.profile) {
    return (
      <ITPage
        title={tt("detail.editInfo")}
        backAction={() => navigate(-1)}
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

  return (
    <ITPage
      title={tt("detail.editInfo")}
      description={profile.name}
      backAction={() => navigate(-1)}
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