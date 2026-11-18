import { useEffect, useMemo, useState } from "react";
import {
  ITButton,
  ITDatePicker,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { PDFViewer } from "@react-pdf/renderer";
import { LuFileText, LuPencilLine, LuUser } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { personalApi } from "@entities/hr";
import { personLabel, useCan, usersApi, type User } from "@entities/user";
import { emitAppEvent } from "@shared/lib/appEvents";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { useGoBack } from "@shared/lib/useGoBack";
import { AppPage } from "@shared/ui/app-page";
import { FormSection } from "@shared/ui/form-section";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { PanelCard } from "@shared/ui/panel-card";
import { StickyActions } from "@shared/ui/sticky-actions";
import { formatLongDateEs, parseLocalDay, toDayString } from "@shared/utils/dates";
import {
  emptyApercibimiento,
  emptyDaycare,
  emptyLaboral,
  type ApercibimientoLetterData,
  type DaycareLetterData,
  type HrFormatKind,
  type LaboralLetterData,
} from "../model/types";
import { downloadApercibimientoPdf, downloadDaycarePdf, downloadLaboralPdf } from "../model/pdf";
import ApercibimientoLetterPdf from "./ApercibimientoLetterPdf";
import DaycareLetterPdf from "./DaycareLetterPdf";
import LaboralLetterPdf from "./LaboralLetterPdf";

const BACK = "/hr/formats";

/**
 * Nombre completo sin duplicar apellidos: `name` ya puede traerlos, así que
 * solo se agregan las partes que no estén contenidas en él.
 */
const fullNameOf = (p: {
  name: string;
  middleName?: string | null;
  paternalSurname?: string | null;
  maternalSurname?: string | null;
}): string => {
  let result = p.name.trim();
  for (const part of [p.middleName, p.paternalSurname, p.maternalSurname]) {
    const v = (part ?? "").trim();
    if (v && !result.toLowerCase().includes(v.toLowerCase())) result = `${result} ${v}`;
  }
  return result;
};

/** Página completa para generar una carta de RH: formulario, resumen y PDF en vivo. */
export default function HrFormatEditor({ kind }: { kind: HrFormatKind }) {
  const { t } = useTranslation(["hr-formats", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const canSave = useCan("hr.disciplinary_reports");
  const today = toDayString(new Date());

  const [people, setPeople] = useState<User[]>([]);
  const [userId, setUserId] = useState("");
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [laboral, setLaboral] = useState<LaboralLetterData>(() => emptyLaboral(today));
  const [aperc, setAperc] = useState<ApercibimientoLetterData>(() => emptyApercibimiento(today));
  const [daycare, setDaycare] = useState<DaycareLetterData>(() => emptyDaycare(today));
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    usersApi
      .employees()
      .then(setPeople)
      .catch(() => setError(t("errors.loadPeople")));
  }, [t]);

  const options = useMemo(() => people.map((p) => ({ value: p.id, label: personLabel(p) })), [people]);

  /** Al elegir empleado se precarga desde su expediente de RH; todo sigue editable. */
  const selectEmployee = async (id: string) => {
    setUserId(id);
    if (!id) return;
    setLoadingProfile(true);
    setError(null);
    try {
      const p = await personalApi.get(id);
      const fullName = fullNameOf(p);
      let headName = "";
      if (p.department?.id) {
        try {
          const heads = await usersApi.employeesByRoles(["AREA_HEAD"], p.department.id);
          headName = heads.find((h) => h.id !== p.id)?.name ?? "";
        } catch {
          // Sin jefe resoluble: queda vacío y RH lo captura.
        }
      }
      const genderName = (p.gender?.name ?? "").toLowerCase();
      const identity = {
        treatment: /^(m$|masc|hombre|varon|varón|male)/.test(genderName) ? ("el" as const) : ("la" as const),
        name: fullName,
        nss: p.nss ?? "",
        curp: p.curp ?? "",
        rfc: p.rfc ?? "",
        jobTitle: p.jobTitle ?? "",
        hireDate: p.hireDate ? p.hireDate.slice(0, 10) : "",
      };
      setLaboral((l) => ({ ...l, ...identity }));
      setDaycare((d) => ({ ...d, ...identity }));
      setAperc((a) => ({ ...a, name: fullName, jobTitle: p.jobTitle ?? "", headName }));
    } catch {
      setError(t("errors.loadProfile"));
    } finally {
      setLoadingProfile(false);
    }
  };

  const isLaboral = kind === "laboral";
  const isDaycare = kind === "daycare";
  const isWarning = kind === "apercibimiento";
  const data = isLaboral ? laboral : isDaycare ? daycare : aperc;
  const previewData = useDebouncedValue(data, 500);

  const valid = isLaboral
    ? !!laboral.name.trim() && (laboral.salary ?? 0) > 0
    : isDaycare
      ? !!daycare.name.trim()
      : !!aperc.name.trim() && !!aperc.irregularities.trim();

  const run = async (save: boolean) => {
    setTouched(true);
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      if (isLaboral) {
        await downloadLaboralPdf(laboral);
      } else if (isDaycare) {
        await downloadDaycarePdf(daycare);
      } else {
        if (save) {
          if (!userId) {
            setError(t("errors.needEmployee"));
            return;
          }
          // Se guarda en el expediente como acta administrativa (incumplimiento).
          await personalApi.createDisciplinaryReport({
            userId,
            reason: "NONCOMPLIANCE",
            incidentDate: aperc.date,
            description: aperc.irregularities.trim(),
            sanction: "Apercibimiento",
          });
          emitAppEvent("disciplinary:created", {});
        }
        await downloadApercibimientoPdf(aperc);
      }
      goBack(BACK);
    } catch {
      setError(save ? t("errors.save") : t("errors.generate"));
    } finally {
      setBusy(false);
    }
  };

  const onDate = (e: { target: { value: unknown } }) => {
    const v = e.target.value;
    if (!(v instanceof Date)) return;
    const s = toDayString(v);
    if (isLaboral) setLaboral((l) => ({ ...l, date: s }));
    else if (isDaycare) setDaycare((d) => ({ ...d, date: s }));
    else setAperc((a) => ({ ...a, date: s }));
  };

  const text = <K extends keyof LaboralLetterData>(key: K) => ({
    name: `fmt-${key}`,
    value: laboral[key] as string,
    onChange: (e: { target: { value: string } }) => setLaboral((l) => ({ ...l, [key]: e.target.value })),
  });
  const apText = <K extends keyof ApercibimientoLetterData>(key: K) => ({
    name: `fmt-ap-${key}`,
    value: aperc[key] as string,
    onChange: (e: { target: { value: string } }) => setAperc((a) => ({ ...a, [key]: e.target.value })),
  });

  const dcText = <K extends keyof DaycareLetterData>(key: K) => ({
    name: `fmt-dc-${key}`,
    value: daycare[key] as string,
    onChange: (e: { target: { value: string } }) => setDaycare((d) => ({ ...d, [key]: e.target.value })),
  });
  /** Fecha opcional de la constancia (vacía = sin fecha). */
  const dcDate = (key: "hireDate" | "vacationFrom" | "vacationTo") => ({
    name: `fmt-dc-${key}`,
    value: parseLocalDay(daycare[key]),
    onChange: (e: { target: { value: unknown } }) => {
      const v = e.target.value;
      setDaycare((d) => ({ ...d, [key]: v instanceof Date ? toDayString(v) : "" }));
    },
  });

  const whoDone = !!userId && !!data.name.trim();
  const dataDone = valid;
  const required = (bad: boolean) => (touched && bad ? t("required") : undefined);

  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t(`${kind}.title`)}
      description={t(`${kind}.description`)}
      icon={<LuFileText size={20} />}
      backAction={() => goBack(BACK)}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("hr"), onClick: () => navigate("/hr") },
        { label: t("breadcrumb"), onClick: () => navigate(BACK) },
        { label: t(`${kind}.title`) },
      ]}
    >
      {/* Mitad formulario, mitad formato: la vista previa queda fija mientras se captura. */}
      <div className="grid grid-cols-1 items-start gap-4 lg:!grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <FormSection
            number={1}
            icon={<LuUser size={16} />}
            title={t("sectionEmployee")}
            description={t("sectionEmployeeHint")}
            complete={whoDone}
          >
            <ITStack spacing={4}>
              <ITSearchSelect
                name="fmt-employee"
                label={t("employee")}
                placeholder={t("employeePlaceholder")}
                options={options}
                value={userId}
                onChange={(v) => void selectEmployee(String(v))}
                onClear={() => setUserId("")}
                isLoading={loadingProfile}
              />
              <ITDatePicker
                name="fmt-date"
                label={t("date")}
                value={parseLocalDay(data.date)}
                onChange={onDate}
              />
            </ITStack>
          </FormSection>

          <FormSection
            number={2}
            icon={<LuPencilLine size={16} />}
            title={t("sectionData")}
            description={t("sectionDataHint")}
            complete={dataDone}
          >
            <ITStack spacing={4}>
              {isLaboral ? (
                <>
                  <ITInput {...text("addressee")} label={t("laboral.addressee")} placeholder={t("laboral.addresseeHint")} />
                  <ITSelect
                    name="fmt-treatment"
                    label={t("laboral.treatment")}
                    value={laboral.treatment}
                    options={[
                      { value: "la", label: t("laboral.treatmentFemale") },
                      { value: "el", label: t("laboral.treatmentMale") },
                    ]}
                    onChange={(e: { target: { value: string } }) =>
                      setLaboral((l) => ({ ...l, treatment: e.target.value === "el" ? "el" : "la" }))
                    }
                  />
                  <ITInput {...text("name")} label={t("fullName")} required error={required(!laboral.name.trim())} />
                  <ITInput {...text("nss")} label={t("nss")} />
                  <ITInput {...text("curp")} label={t("curp")} />
                  <ITInput {...text("rfc")} label={t("rfc")} />
                  <ITInput {...text("jobTitle")} label={t("jobTitle")} />
                  <ITDatePicker
                    name="fmt-hire"
                    label={t("hireDate")}
                    value={parseLocalDay(laboral.hireDate)}
                    onChange={(e: { target: { value: unknown } }) => {
                      const v = e.target.value;
                      setLaboral((l) => ({ ...l, hireDate: v instanceof Date ? toDayString(v) : "" }));
                    }}
                  />
                  <ITInputNumber
                    name="fmt-salary"
                    label={t("laboral.salary")}
                    decimals={2}
                    prefix="$"
                    min={0}
                    value={laboral.salary}
                    onChange={(v) => setLaboral((l) => ({ ...l, salary: v ?? null }))}
                    required
                    error={required(!(laboral.salary && laboral.salary > 0))}
                  />
                  <ITText muted className="!text-[11px]">{t("laboral.salaryNotStored")}</ITText>
                  <ITInput {...text("signerName")} label={t("signerName")} />
                  <ITInput {...text("signerTitle")} label={t("signerTitle")} />
                </>
              ) : isDaycare ? (
                <>
                  <ITSelect
                    name="fmt-dc-treatment"
                    label={t("laboral.treatment")}
                    value={daycare.treatment}
                    options={[
                      { value: "la", label: t("laboral.treatmentFemale") },
                      { value: "el", label: t("laboral.treatmentMale") },
                    ]}
                    onChange={(e: { target: { value: string } }) =>
                      setDaycare((d) => ({ ...d, treatment: e.target.value === "el" ? "el" : "la" }))
                    }
                  />
                  <ITInput {...dcText("name")} label={t("fullName")} required error={required(!daycare.name.trim())} />
                  <ITInput {...dcText("rfc")} label={t("rfc")} />
                  <ITInput {...dcText("nss")} label={t("nss")} />
                  <ITInput {...dcText("curp")} label={t("curp")} />
                  <ITInput {...dcText("jobTitle")} label={t("jobTitle")} />
                  <ITDatePicker {...dcDate("hireDate")} label={t("hireDate")} />
                  <ITInput {...dcText("schedule")} label={t("daycare.schedule")} placeholder={t("daycare.scheduleHint")} />
                  <ITInput {...dcText("workDays")} label={t("daycare.workDays")} placeholder={t("daycare.workDaysHint")} />
                  <ITInput {...dcText("restDays")} label={t("daycare.restDays")} placeholder={t("daycare.restDaysHint")} />
                  <ITInputNumber
                    name="fmt-dc-vacationDays"
                    label={t("daycare.vacationDays")}
                    min={0}
                    value={daycare.vacationDays}
                    onChange={(v) => setDaycare((d) => ({ ...d, vacationDays: v ?? null }))}
                  />
                  <ITDatePicker {...dcDate("vacationFrom")} label={t("daycare.vacationFrom")} />
                  <ITDatePicker {...dcDate("vacationTo")} label={t("daycare.vacationTo")} />
                  <ITText muted className="!text-[11px]">{t("daycare.vacationHint")}</ITText>
                  <ITInput {...dcText("signerName")} label={t("signerName")} />
                  <ITInput {...dcText("signerTitle")} label={t("signerTitle")} />
                </>
              ) : (
                <>
                  <ITInput {...apText("name")} label={t("fullName")} required error={required(!aperc.name.trim())} />
                  <ITInput {...apText("jobTitle")} label={t("jobTitle")} />
                  <ITTextarea
                    name="fmt-irregularities"
                    label={`${t("apercibimiento.irregularities")} *`}
                    placeholder={t("apercibimiento.irregularitiesHint")}
                    rows={6}
                    value={aperc.irregularities}
                    onChange={(v) => setAperc((a) => ({ ...a, irregularities: v }))}
                    error={required(!aperc.irregularities.trim())}
                  />
                  <ITInput {...apText("headName")} label={t("apercibimiento.headName")} />
                  <ITInput {...apText("signerName")} label={t("signerName")} />
                  <ITInput {...apText("signerTitle")} label={t("signerTitle")} />
                </>
              )}
              {error && <ITText className="!text-[12px] text-red-600">{error}</ITText>}
            </ITStack>
          </FormSection>

          <LiveSummary title={t("summaryTitle")} total={2} done={(whoDone ? 1 : 0) + (dataDone ? 1 : 0)}>
            <LiveSummaryRow label={t("employee")} value={data.name || undefined} />
            <LiveSummaryRow label={t("date")} value={formatLongDateEs(parseLocalDay(data.date))} />
            <LiveSummaryRow label={t("jobTitle")} value={data.jobTitle || undefined} />
          </LiveSummary>
        </div>

        <div className="min-w-0 lg:sticky lg:top-4">
          <PanelCard title={t("preview")} icon={<LuFileText size={16} />}>
            <PDFViewer
              style={{ width: "100%", height: "calc(100vh - 220px)", minHeight: 560, border: "none", borderRadius: 16 }}
              showToolbar={false}
            >
              {isLaboral ? (
                <LaboralLetterPdf data={previewData as LaboralLetterData} />
              ) : isDaycare ? (
                <DaycareLetterPdf data={previewData as DaycareLetterData} />
              ) : (
                <ApercibimientoLetterPdf data={previewData as ApercibimientoLetterData} />
              )}
            </PDFViewer>
          </PanelCard>
        </div>
      </div>

      <StickyActions>
        <ITButton
          label={t("cancel")}
          variant="outlined"
          color="gray"
          size="sm"
          className="!rounded-full"
          onClick={() => goBack(BACK)}
          disabled={busy}
        />
        <ITButton
          label={t("downloadPdf")}
          variant={isWarning && canSave ? "outlined" : "rounded"}
          color="primary"
          size="sm"
          className={isWarning && canSave ? "!rounded-full" : undefined}
          onClick={() => void run(false)}
          disabled={busy}
        />
        {isWarning && canSave && (
          <ITButton
            label={t("apercibimiento.generateAndSave")}
            variant="rounded"
            color="primary"
            size="sm"
            onClick={() => void run(true)}
            disabled={busy}
          />
        )}
      </StickyActions>
    </AppPage>
  );
}
