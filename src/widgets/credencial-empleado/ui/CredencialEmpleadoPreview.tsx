import { useTranslation } from "react-i18next";

/** Vista previa de la credencial ya renderizada como PNG. */
export default function CredencialEmpleadoPreview({
  imagenDataUrl,
}: {
  imagenDataUrl: string | null;
}) {
  const { t: tt } = useTranslation(["employees"]);
  if (!imagenDataUrl) return null;

  return (
    <img
      src={imagenDataUrl}
      alt={tt("employees:detail.credentialTitle")}
      className="w-full max-w-3xl h-auto rounded-2xl border border-slate-200"
      style={{ aspectRatio: "1016 / 638" }}
    />
  );
}
