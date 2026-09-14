import { FaArrowDown, FaArrowRight, FaArrowUp, FaHandshake, FaReply, FaTimesCircle } from "react-icons/fa";
import type { CondicionType, MovementType } from "./types";

export const TIPO_ICONS: Record<MovementType, React.ReactNode> = {
  ENTRADA: <FaArrowDown size={10} />,
  SALIDA: <FaArrowUp size={10} />,
  TRASLADO: <FaArrowRight size={10} />,
  BAJA: <FaTimesCircle size={10} />,
  PRESTAMO: <FaHandshake size={10} />,
  DEVOLUCION: <FaReply size={10} />,
};

export const TIPO_COLORS: Record<MovementType, string> = {
  ENTRADA: "bg-emerald-500",
  SALIDA: "bg-amber-500",
  TRASLADO: "bg-blue-500",
  BAJA: "bg-red-500",
  PRESTAMO: "bg-purple-500",
  DEVOLUCION: "bg-teal-500",
};

export const CONDICION_COLORS: Record<
  CondicionType,
  "success" | "warning" | "danger"
> = {
  BUENO: "success",
  ACEPTABLE: "warning",
  MALO: "danger",
  ROTO: "danger",
};

export const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};