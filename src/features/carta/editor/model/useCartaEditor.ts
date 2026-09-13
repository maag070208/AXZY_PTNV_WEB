import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import { dyn } from "@shared/i18n";
import type { AppDispatch, RootState } from "@app/store";
import {
  resetDraft,
  saveCarta,
  validateCartaDraft,
  type CartaFormErrors,
  type CartaResponsiva,
} from "@entities/carta";

type Download = (carta: CartaResponsiva) => Promise<void> | void;

interface Options {
  download: Download;
  onSaved: () => void;
}

export const useCartaEditor = ({ download, onSaved }: Options) => {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation(["cartas", "common"]);
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

  const errors: CartaFormErrors = validateCartaDraft(draft);
  const firstError = Object.values(errors).find(Boolean);

  const showToast = (type: "success" | "error", message: string) => {
    setToastType(type);
    setToast(message);
  };

  const handleSave = async () => {
    if (firstError) {
      showToast("error", dyn(t)(firstError));
      return;
    }
    try {
      const action = await dispatch(saveCarta());
      if (saveCarta.fulfilled.match(action)) {
        const saved: any = action.payload;
        showToast("success", t("editor.savedGeneratingPdf"));

        // Normalizar el shape: el backend devuelve `consecutive` mientras que
        // el front y el PDF esperan `consecutivo`.
        const consecutivoFinal: string = saved.consecutive ?? saved.consecutivo;
        const cartaParaPdf: CartaResponsiva = {
          ...draft,
          id: saved.id,
          consecutivo: consecutivoFinal,
          responsable: saved.responsable ?? draft.responsable,
          encargado: saved.encargado ?? draft.encargado,
          ubicacion: saved.ubicacion ?? draft.ubicacion,
          items:
            saved.items?.map((it: any, idx: number) => ({
              ...(draft.items[idx] ?? {}),
              ...it,
              device: it.device ?? draft.items[idx]?.device,
            })) ?? draft.items,
        };

        try {
          await download(cartaParaPdf);
        } catch (err) {
          console.error("Error generando PDF:", err);
          showToast("error", t("editor.errorPdfAfterSave"));
        }
        dispatch(resetDraft());
        onSaved();
      } else {
        showToast("error", t("editor.errorSaving"));
      }
    } catch {
      showToast("error", t("editor.errorSaving"));
    }
  };

  const handleDownload = async () => {
    if (firstError) {
      showToast("error", t("editor.fillRequiredToDownload"));
      return;
    }
    setDownloading(true);
    showToast("success", t("editor.generatingPdf"));
    try {
      await download(draft);
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
    showToast("success", t("editor.draftReset"));
    setConfirmReset(false);
  };

  return {
    draft,
    errors,
    firstError,
    totalPages: 1,
    downloading,
    confirmReset,
    setConfirmReset,
    toast,
    toastType,
    dismissToast: () => setToast(null),
    handleSave,
    handleDownload,
    handleReset,
  };
};