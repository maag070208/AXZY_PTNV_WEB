import * as QRCode from "qrcode";
import type { PersonalProfile } from "@entities/personal";
import { buildQrPayload } from "./buildQrPayload";

export const generarCredencialQR = async (profile: PersonalProfile): Promise<string> => {
  const payload = buildQrPayload(profile);
  return QRCode.toDataURL(JSON.stringify(payload), {
    width: 320,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#0a4560", light: "#ffffff" },
  });
};

export const fotoComoDataUrl = async (
  fotoUrl?: string | null
): Promise<string | null> => {
  if (!fotoUrl) return null;
  try {
    const res = await fetch(fotoUrl);
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

export const inicialesDe = (name: string): string => {
  const parts = name.split(/\s+/).filter(Boolean);
  const prefix = parts.slice(0, 2);
  if (!prefix.length) return "—";
  return prefix
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
};
