export interface ITDeviceSummary {
  id: string;
  controlActivos: string;
  descripcion: string;
  marca: string;
  modelo: string;
  ip?: string | null;
  macAddress?: string | null;
  sistemaOp?: string | null;
  ram?: string | null;
  almacenamiento?: string | null;
  type?: { code: string; name: string; prefix: string };
}

export interface TICItem {
  id: string;
  descripcion: string;
  marca: string;
  modelo: string;
  numeroSerie: string;
  nombreEquipo: string;
  controlActivos: string;
  area: string;
  deviceId?: string;
  device?: ITDeviceSummary | null;
}

export interface Firmante {
  id: string;
  name: string;
  puesto?: string | null;
  area?: string | null;
  numeroEmpleado?: string | null;
}

export interface CartaResponsiva {
  id: string;
  consecutivo: string;
  fecha: string;
  numeroEmpleado: string;
  empresa: string;
  departamento: string;
  deviceTypeId?: string;
  responsableId?: string;
  encargadoId?: string;
  areaBoss?: string;
  deliveryBy: string;
  responsable?: Firmante | null;
  encargado?: Firmante | null;
  creadoPorId?: string;
  creadoPor?: { id: string; username: string; name: string } | null;
  returnDate?: string | null;
  returnedBy?: string | null;
  returnCondition?: string | null;
  items: TICItem[];
  creadoEn: string;
}

export const emptyTICItem = (): TICItem => ({
  id:
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `it_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
  descripcion: "",
  marca: "",
  modelo: "",
  numeroSerie: "",
  nombreEquipo: "",
  controlActivos: "",
  area: "MANTENIMIENTO",
});

export const formatFecha = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}/${mm}/${yy}`;
};

export const formatFechaHora = (iso: string): string => {
  if (!iso) return "";
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yy} ${hh}:${mi}`;
};
