import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cartasApi, type CartaResponsiva } from "@entities/carta";

type Download = (carta: CartaResponsiva) => Promise<void> | void;

export const useCartaDetail = (id?: string, download?: Download) => {
  const { t } = useTranslation("cartas");

  const [carta, setCarta] = useState<CartaResponsiva | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    cartasApi
      .get(id)
      .then(setCarta)
      .catch(() => setCarta(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const handleDownload = async () => {
    if (!carta || !download) return;
    setDownloading(true);
    try {
      await download(carta);
      setToastType("success");
      setToast(t("editor.pdfDownloaded"));
    } catch {
      setToastType("error");
      setToast(t("editor.errorGeneratingPdf"));
    } finally {
      setDownloading(false);
    }
  };

  return {
    carta,
    loading,
    downloading,
    toast,
    toastType,
    dismissToast: () => setToast(null),
    handleDownload,
  };
};