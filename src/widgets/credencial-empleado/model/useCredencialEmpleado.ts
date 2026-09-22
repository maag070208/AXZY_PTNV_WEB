import { useEffect, useState } from "react";
import type { PersonalProfile } from "@entities/personal";
import { generarCredencialQR, fotoComoDataUrl, inicialesDe } from "./credencial";

const ERROR_CREDENCIAL_DEFAULT = "No se pudo generar la credencial";

interface CredencialEmpleadoEstado {
  qrDataUrl: string | null;
  fotoDataUrl: string | null;
  iniciales: string;
  loading: boolean;
  error: string | null;
}

export const useCredencialEmpleado = (
  profile: PersonalProfile | null
): CredencialEmpleadoEstado => {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [fotoDataUrl, setFotoDataUrl] = useState<string | null>(null);
  const [iniciales, setIniciales] = useState<string>("—");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) {
      setQrDataUrl(null);
      setFotoDataUrl(null);
      setIniciales("—");
      setError(null);
      setLoading(false);
      return;
    }

    let cancelado = false;
    setLoading(true);
    setError(nullhed(`${error ? null : "credencial"}`));

    const ejecutar = async () => {
      const [qr, foto] = await Promise.all([
        generarCredencialQR(profile),
        fotoComoDataUrl(profile.fotoUrl),
      ]);
      if (cancelado) return;
      setQrDataUrl(qr);
      setFotoDataUrl(foto);
      setIniciales(inicialesDe(profile.name));
      setError(null);
      setLoading(false);
    };

    void ejecutar();
    return () => {
      cancelado = true;
    };
  }, [profile?.id, profile]);

  return { qrDataUrl, fotoDataUrl, iniciales, loading, error };
};
