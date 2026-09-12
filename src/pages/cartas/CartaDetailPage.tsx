import {
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaFileSignature } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { cartasApi, type CartaResponsiva } from "@entities/carta";
import { downloadCartaPDF } from "@widgets/carta/carta-pdf";
import { CartaPreview } from "@widgets/carta/carta-preview";

export default function CartaDetailPage() {
  const { t } = useTranslation("cartas");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
    if (!carta) return;
    setDownloading(true);
    try {
      await downloadCartaPDF(null, {
        consecutivo: carta.consecutivo,
        fecha: carta.fecha,
        carta,
      });
      setToastType("success");
      setToast(t("editor.pdfDownloaded"));
    } catch {
      setToastType("error");
      setToast(t("editor.errorGeneratingPdf"));
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("detail.title")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!carta) {
    return (
      <ITPage
        title={t("detail.title")}
        backAction={() => navigate("/cartas")}
        icon={<FaFileSignature size={20} />}
      >
        <ITFlex justify="center" className="py-10">
          <ITText className="text-slate-400">{t("detail.empty")}</ITText>
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={`Carta ${carta.consecutivo}`}
      description={carta.numeroEmpleado ? `Empleado ${carta.numeroEmpleado}` : undefined}
      backAction={() => navigate("/cartas")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: carta.consecutivo },
      ]}
      actions={
        <ITButton
          variant="filled"
          color="primary"
          size="small"
          onClick={handleDownload}
          disabled={downloading}
        >
          <ITFlex align="center" gap={1}>
            <FaDownload size={12} />
            <ITText className="font-bold text-[11px]">
              {downloading ? t("editor.generating") : t("editor.downloadPdf")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="center">
        <CartaPreview carta={carta} pageIndex={1} totalPages={1} />
      </ITFlex>

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