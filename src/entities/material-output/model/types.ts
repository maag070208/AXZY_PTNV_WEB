export type MaterialOutputReason = "DAMAGED" | "OBSOLETE" | "LOST" | "OTHER";

export interface MaterialOutput {
  id: string;
  date: string;
  description: string;
  model?: string | null;
  brand?: string | null;
  project?: string | null;
  quantity: number;
  departmentName: string;
  userName: string;
  notes?: string | null;
  area: string;
  reason?: MaterialOutputReason | null;
  deviceId?: string | null;
  device?: { id: string; assetTag: string } | null;
  registeredById?: string | null;
  registeredBy?: { id: string; name: string; username: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialOutputInput {
  date?: string;
  description: string;
  model?: string;
  brand?: string;
  project?: string;
  quantity?: number;
  departmentName: string;
  userName: string;
  notes?: string;
  area?: string;
  reason?: MaterialOutputReason;
  deviceId?: string;
}

export interface MaterialOutputFilters {
  start?: string;
  end?: string;
  departmentName?: string;
  userName?: string;
  area?: string;
  project?: string;
  reason?: MaterialOutputReason;
  q?: string;
}

export interface MaterialOutputSuggestions {
  departmentName: string[];
  userName: string[];
  project: string[];
  brand: string[];
  model: string[];
  description: string[];
}