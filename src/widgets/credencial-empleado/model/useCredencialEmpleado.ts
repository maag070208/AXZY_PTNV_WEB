import { useEffect, useState } from "react";
import type { PersonalProfile } from "@entities/personal";
import { generarCredencialQR, fotoComoDataUrl, inicialesDe } from "./credencial";
import { credencialDataUrl } from "./imagen";

const ERROR_CREDENCIAL_DEFAULT = "No se pudo generar la credencial";

interface CredencialEmpleadoEstado {
  qrDataUrl: string | null;
  fotoDataUrl: string | null;
  imagenDataUrl: string | null;
  iniciales: string;
  loading: boolean;
  error: string | null;
}

export const useCredencialEmpleado = (
  profile: PersonalProfile | null
): CredencialEmpleadoEstado => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null);
  const [imagenDataUrl, setImagenDataUrl] = useState<string | null>(null);
  const [iniciales, setIniciales] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setQrDataUrl(null);
      setFotoDataUrl(null);
      setImagenDataUrl(null);
      setIniciales("—");
      setError(null);
      setLoading(false);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setError(null);

    const ejecutar = async () => {
      try {
        const [qr, foto] = await Promise.all([
          generarCredencialQR(profile),
          fotoComoDataUrl(profile.fotoUrl),
        ]);
        if (cancelado) return;
        const inicialesValor = inicialesDe(profile.name);
        setQrDataUrl(qr);
        setFotoDataUrl(foto);
        setIniciales(inicialesValor);

        const imagen = await credencialDataUrl({
          profile,
          qrDataUrl: qr,
          fotoDataUrl: foto,
          iniciales: inicialesValor,
        });
        if (cancelado) return;
        setImagenDataUrl(imagen);
        setError(null);
      } catch {
        if (cancelado) return;
        setError(ERROR_CREDENCIAL_DEFAULT);
      } finally {
        if (!cancelado) setLoading(false);
      }
    };

    void ejecutar();
    return () => {
      cancelado = true;
      setImagenDataUrl(null);
    };
  }, [profile?.id, profile]);

  return { qrDataUrl, fotoDataUrl, imagenDataUrl, iniciales, loading, error };
};
