export interface ReportFilters {
  start?: string;
  end?: string;
  department?: string;
  employee?: string;
}

export interface ReportRow {
  id: string;
  date: string;
  document_code: string;
  employee_no: string | null;
  responsible: string;
  department: string;
  subarea: string | null;
  area_boss: string | null;
  delivery_by: string;
  return_date: string | null;
  returned_by: string | null;
  return_condition: string | null;
  asset_code: string;
  description: string;
  quantity: number;
  brand: string | null;
  model: string | null;
  serial: string | null;
  equipment_name: string | null;
  status: string;
}

export interface AssignedDeviceRow {
  deviceId: string;
  assetTag: string;
  description: string;
  brand: string;
  model: string;
  type: string;
  custodian: string;
  employeeNumber: string | null;
  department: string | null;
  date: string | null;
  daysAssigned: number | null;
  source: "CUSTODY_LETTER" | "MOVEMENT" | "UNKNOWN";
  folio: string | null;
}

export interface DeviceReportRow {
  deviceId: string;
  assetTag: string;
  description: string;
  brand: string;
  model: string;
  type: string;
  serialNumber: string | null;
  hostname: string | null;
  ip: string | null;
  macAddress: string | null;
  area: string;
  departmentName: string | null;
  status: string;
  batchId: string | null;
  quantity: number;
  custodian: string | null;
  employeeNumber: string | null;
  department: string | null;
  date: string | null;
  daysAssigned: number | null;
  source: "CUSTODY_LETTER" | "MOVEMENT" | "UNKNOWN" | null;
  folio: string | null;
}