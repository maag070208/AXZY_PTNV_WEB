import { FaBoxOpen, FaCheckCircle, FaClock, FaComment, FaEdit, FaExclamationTriangle, FaUserCog } from "react-icons/fa";

export const ESTADO_BADGE: Record<string, { color: string; label: string }> = {
  DISPONIBLE: { color: "success", label: "Disponible" },
  ASIGNADO: { color: "warning", label: "Asignado" },
  BAJA: { color: "default", label: "Baja" },
};

export const FIELD_LABELS = {
  numeroSerie: "Número de serie",
  nombreEquipo: "Nombre de equipo",
  ip: "Dirección IP",
  macAddress: "MAC Address",
  sistemaOp: "Sistema operativo",
  ram: "RAM",
  almacenamiento: "Almacenamiento",
} as const;

export const HISTORY_ICONS: Record<string, { icon: React.ReactNode; bg: string }> = {
  CREATED: { icon: <FaBoxOpen size={9} />, bg: "bg-emerald-500" },
  ASSIGNED: { icon: <FaUserCog size={9} />, bg: "bg-amber-500" },
  RETURNED: { icon: <FaCheckCircle size={9} />, bg: "bg-blue-500" },
  RETIRED: { icon: <FaExclamationTriangle size={9} />, bg: "bg-red-500" },
  UPDATED: { icon: <FaEdit size={9} />, bg: "bg-purple-500" },
  COMMENT: { icon: <FaComment size={9} />, bg: "bg-slate-400" },
};

export const TYPE_LABELS: Record<string, string> = {
  CREATED: "Dispositivo registrado",
  ASSIGNED: "Dispositivo asignado",
  RETURNED: "Dispositivo devuelto",
  RETIRED: "Dispositivo retirado",
  UPDATED: "Información actualizada",
  COMMENT: "Comentario",
};