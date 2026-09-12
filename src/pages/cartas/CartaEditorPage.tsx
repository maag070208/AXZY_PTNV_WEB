import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaDownload, FaFileSignature, FaRedo, FaSave } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppDispatch, RootState } from "@core/store/store";
import { resetDraft, saveCarta, type CartaResponsiva } from "@entities/carta";
import { CartaForm, validateCartaDraft } from "@features/carta/create-carta";
import { downloadCartaPDF } from "@widgets/carta/carta-pdf";
import { CartaPreview } from "@widgets/carta/carta-preview";

export default function CartaEditorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["cartas", "common"]);
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [downloading, setDownloading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const totalPages = 1;

  const handleSave = async () => {
    const errors = validateCartaDraft(draft);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setToastType("error");
      setToast(firstError);
      return;
    }
    try {
      const action = await dispatch(saveCarta());
      if (saveCarta.fulfilled.match(action)) {
        const saved: any = action.payload;
        setToastType("success");
        setToast(t("editor.savedGeneratingPdf"));

        // Normalizar el shape: el backend devuelve `consecutive` mientras que
        // el front y el PDF esperan `consecutivo`.
        const consecutivoFinal: string = saved.consecutive ?? saved.consecutivo;
        const cartaParaPdf: CartaResponsiva = {
          ...draft,
          id: saved.id,
          consecutivo: consecutivoFinal,
          responsable: saved.responsable ?? draft.responsable,
          encargado: saved.encargado ?? draft.encargado,
          items:
            saved.items?.map((it: any, idx: number) => ({
              ...(draft.items[idx] ?? {}),
              ...it,
              device: it.device ?? draft.items[idx]?.device,
            })) ?? draft.items,
        };

        try {
          await downloadCartaPDF(null, {
            consecutivo: consecutivoFinal,
            fecha: cartaParaPdf.fecha,
            carta: cartaParaPdf,
          });
        } catch (err) {
          console.error("Error generando PDF:", err);
          setToastType("error");
          setToast(t("editor.errorPdfAfterSave"));
        }
        dispatch(resetDraft());
        navigate("/cartas");
      } else {
        setToastType("error");
        setToast(t("editor.errorSaving"));
      }
    } catch {
      setToastType("error");
      setToast(t("editor.errorSaving"));
    }
  };

  const handleDownload = async () => {
    const errors = validateCartaDraft(draft);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setToastType("error");
      setToast(t("editor.fillRequiredToDownload"));
      return;
    }
    setDownloading(true);
    setToastType("success");
    setToast(t("editor.generatingPdf"));
    try {
      await downloadCartaPDF(null, {
        consecutivo: draft.consecutivo,
        fecha: draft.fecha,
        carta: draft,
      });
      setToast(t("editor.pdfDownloaded"));
    } catch (err) {
      console.error(err);
      setToast(t("editor.errorGeneratingPdf"));
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    dispatch(resetDraft());
    setToastType("success");
    setToast(t("editor.draftReset"));
    setConfirmReset(false);
  };

  const formSection = (
    <CartaForm errors={validateCartaDraft(draft)} />
  );

  const actions = (
    <ITFlex gap={2} className="no-print">
      <ITButton
        variant="outlined"
        size="small"
        color="warning"
        onClick={() => setConfirmReset(true)}
      >
        <ITFlex align="center" gap={1}>
          <FaRedo size={12} />
          <ITText className="font-bold text-[11px]">{t("editor.reset")}</ITText>
        </ITFlex>
      </ITButton>
      <ITButton
        variant="outlined"
        size="small"
        color="secondary"
        onClick={handleSave}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">{t("editor.save")}</ITText>
        </ITFlex>
      </ITButton>
      <ITButton
        variant="filled"
        size="small"
        color="primary"
        onClick={handleDownload}
        disabled={downloading || !!Object.values(validateCartaDraft(draft)).find(Boolean)}
      >
        <ITFlex align="center" gap={1}>
          <FaDownload size={12} />
          <ITText className="font-bold text-[11px]">
            {downloading ? t("editor.generating") : t("editor.downloadPdf")}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={t("editor.title")}
      description={
        draft.consecutivo
          ? `Folio ${draft.consecutivo} · Mantenimiento`
          : "Folio — · Mantenimiento"
      }
      backAction={() => navigate(-1)}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: t("editor.breadcrumb") },
      ]}
      actions={actions}
      className="print-area"
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} md={5}>
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8 sticky top-24">
            {formSection}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={7}>
          <ITFlex justify="end" className="mb-3 no-print">
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("editor.previewNotice")}
            </ITText>
          </ITFlex>
          <CartaPreview carta={draft} pageIndex={1} totalPages={totalPages} />
        </ITGrid>
      </ITGrid>

      <ITConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title={t("editor.resetDialogTitle")}
        message={t("editor.resetDialogMessage")}
        confirmLabel={t("editor.reset")}
        cancelLabel={t("common:actions.cancel")}
        variant="warning"
      />

      {toast && (
        <ITToast
          message={toast}
          type={toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}