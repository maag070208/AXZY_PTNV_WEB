import { FaBoxOpen, FaCheckCircle, FaComment, FaEdit, FaExclamationTriangle, FaUserCog } from "react-icons/fa";

export const ESTADO_BADGE: Record<string, { color: string }> = {
  DISPONIBLE: { color: "success" },
  ASIGNADO: { color: "warning" },
  BAJA: { color: "default" },
};

export const FIELD_LABELS = {
  numeroSerie: "form.serialNo",
  nombreEquipo: "form.equipmentName",
  ip: "form.ipAddress",
  macAddress: "form.macAddress",
  sistemaOp: "form.os",
  ram: "form.ram",
  almacenamiento: "form.storage",
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
  CREATED: "history.CREATED",
  ASSIGNED: "history.ASSIGNED",
  RETURNED: "history.RETURNED",
  RETIRED: "history.RETIRED",
  UPDATED: "history.UPDATED",
  COMMENT: "history.COMMENT",
};