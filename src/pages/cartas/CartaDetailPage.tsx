import {
  ITButton,
  ITFlex,
  ITLoader,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaDownload, FaFileSignature } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCartaDetail } from "@features/carta/carta-detail";
import { CartaPreview } from "@widgets/carta/carta-preview";
import { downloadCartaPDF } from "@widgets/carta/carta-pdf";

export default function CartaDetailPage() {
  const { t } = useTranslation("cartas");
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const detail = useCartaDetail(id, (carta) =>
    downloadCartaPDF(null, {
      consecutivo: carta.consecutivo,
      fecha: carta.fecha,
      carta,
    })
  );

  if (detail.loading) {
    return (
      <ITPage title={t("detail.title")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!detail.carta) {
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

  const carta = detail.carta;

  const descripcion =
    carta.ubicacion
      ? `Ubicación: ${carta.ubicacion.lugar}`
      : carta.numeroEmpleado
        ? `Empleado ${carta.numeroEmpleado}`
        : undefined;

  return (
    <ITPage
      title={`Carta ${carta.consecutivo}`}
      description={descripcion}
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
          onClick={detail.handleDownload}
          disabled={detail.downloading}
        >
          <ITFlex align="center" gap={1}>
            <FaDownload size={12} />
            <ITText className="font-bold text-[11px]">
              {detail.downloading ? t("editor.generating") : t("editor.downloadPdf")}
            </ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex justify="center">
        <CartaPreview carta={carta} pageIndex={1} totalPages={1} />
      </ITFlex>

      {detail.toast && (
        <ITToast
          message={detail.toast}
          type={detail.toastType}
          position="bottom-center"
          duration={2500}
          onClose={detail.dismissToast}
        />
      )}
    </ITPage>
  );
}