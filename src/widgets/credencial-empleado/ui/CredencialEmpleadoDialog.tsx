import { ITAlert, ITButton, ITDialog, ITFlex, ITLoader, ITText } from "@axzydev/axzy_ui_system";
import { FaDownload } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PersonalProfile } from "@entities/personal";
import { useCredencialEmpleado } from "../model/useCredencialEmpleado";
import { descargarCredencialImagen } from "../model/imagen";
import CredencialEmpleadoPreview from "./CredencialEmpleadoPreview";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  profile: PersonalProfile | null;
}

/** Diálogo con la previsualización de la credencial y la descarga de la imagen. */
export default function CredencialEmpleadoDialog({ isOpen, onClose, profile }: Props) {
  const { t: tt } = useTranslation(["employees"]);
  const { imagenDataUrl, loading, error } = useCredencialEmpleado(profile);

  const descargar = () => {
    if (!profile || !imagenDataUrl) return;
    void descargarCredencialImagen({ profile, imagenDataUrl });
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={onClose}
      title={tt("employees:detail.credentialTitle")}
      className="max-w-3xl"
    >
      <div className="max-h-[75vh] overflow-y-auto">
        {loading ? (
          <ITFlex justify="center" className="py-12">
            <ITLoader variant="spinner" size="lg" color="primary" />
          </ITFlex>
        ) : error ? (
          <ITAlert variant="error">{error}</ITAlert>
        ) : profile && imagenDataUrl ? (
          <ITFlex direction="column" gap={4}>
            <CredencialEmpleadoPreview imagenDataUrl={imagenDataUrl} />
            <ITFlex justify="end" gap={2}>
              <ITButton
                variant="filled"
                color="primary"
                onClick={descargar}
                disabled={loading || !imagenDataUrl}
              >
                <ITFlex align="center" gap={1}>
                  <FaDownload size={13} />
                  <ITText className="font-bold text-[11px]">{tt("employees:detail.download")}</ITText>
                </ITFlex>
              </ITButton>
            </ITFlex>
          </ITFlex>
        ) : null}
      </div>
    </ITDialog>
  );
}
