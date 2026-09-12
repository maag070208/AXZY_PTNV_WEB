export interface MaterialOutput {
  id: string;
  fecha: string;
  descripcion: string;
  modelo?: string | null;
  marca?: string | null;
  proyecto?: string | null;
  cantidad: number;
  departamento: string;
  usuario: string;
  observaciones?: string | null;
  area: string;
  deviceId?: string | null;
  device?: { id: string; controlActivos: string } | null;
  registradoPorId?: string | null;
  registradoPor?: { id: string; name: string; username: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialOutputInput {
  fecha?: string;
  descripcion: string;
  modelo?: string;
  marca?: string;
  proyecto?: string;
  cantidad?: number;
  departamento: string;
  usuario: string;
  observaciones?: string;
  area?: string;
  deviceId?: string;
}

export interface SalidaFilters {
  start?: string;
  end?: string;
  departamento?: string;
  usuario?: string;
  area?: string;
  proyecto?: string;
  q?: string;
}

export interface SalidaSuggestions {
  departamento: string[];
  usuario: string[];
  proyecto: string[];
  marca: string[];
  modelo: string[];
  descripcion: string[];
}