import { ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { AppPage } from "@shared/ui/app-page";
import { LuBaby, LuFileText, LuTriangleAlert } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { HrFormatKind } from "@widgets/hr-formats";
import { useGoBack } from "@shared/lib/useGoBack";

/** Plantillas originales (.docx) que se sirven desde `public/formats`. */
const FORMATS: { kind: HrFormatKind; file: string; path: string; icon: React.ReactNode }[] = [
  { kind: "laboral", file: "carta-laboral.docx", path: "/hr/formats/employment-letter", icon: <LuFileText size={22} /> },
  { kind: "apercibimiento", file: "carta-apercibimiento.docx", path: "/hr/formats/warning-letter", icon: <LuTriangleAlert size={22} /> },
  { kind: "daycare", file: "carta-guarderia.docx", path: "/hr/formats/daycare-letter", icon: <LuBaby size={22} /> },
];

/** Formatos de RH: genera cada carta en PDF o descarga la plantilla original. */
export default function HrFormatsPage() {
  const { t } = useTranslation(["hr-formats", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();

  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("title")}
      description={t("description")}
      backAction={() => goBack("/hr")}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("hr"), onClick: () => navigate("/hr") },
        { label: t("breadcrumb") },
      ]}
    >
      <div className="grid gap-4 md:grid-cols-2">
        {FORMATS.map(({ kind, file, path, icon }) => (
          <div key={kind} className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-5">
            <ITFlex align="center" gap={3}>
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">{icon}</span>
              <ITText as="h2" className="m-0 !text-[16px] font-extrabold">{t(`${kind}.title`)}</ITText>
            </ITFlex>
            <ITText muted className="!text-[13px] leading-relaxed">{t(`${kind}.description`)}</ITText>
            <ITFlex gap={2} wrap="wrap" className="mt-auto">
              <ITButton variant="filled" color="primary" onClick={() => navigate(path)}>
                {t("generate")}
              </ITButton>
              <a href={`${import.meta.env.BASE_URL}formats/${file}`} download={file}>
                <ITButton variant="outlined" color="secondary" type="button">
                  {t("downloadTemplate")}
                </ITButton>
              </a>
            </ITFlex>
          </div>
        ))}
      </div>
    </AppPage>
  );
}
