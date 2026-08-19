import {
  ITButton,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaChartBar, FaDownload } from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportsApi, type ReportFilters, type ReportRow } from "@core/api/reports.api";
import {
  departmentsApi,
  type Department,
} from "@core/api/departments.api";

const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function ReportesPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<ReportFilters>({});
  const [total, setTotal] = useState(0);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    departmentsApi.list().then(setDepartments).catch(() => setDepartments([]));
  }, []);

  const externalFilters: Record<string, string | number | boolean> =
    useMemo(() => {
      const out: Record<string, string | number | boolean> = {};
      if (filters.start) out.start = filters.start;
      if (filters.end) out.end = filters.end;
      if (filters.department) out.department = filters.department;
      if (filters.employee) out.employee = filters.employee;
      return out;
    }, [filters]);

  const refetch = () => setReloadKey((k) => k + 1);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await reportsApi.table({
        page: params.page,
        limit: params.limit,
        filters: {
          ...(params.filters as Record<string, string | number | boolean>),
        },
        sort: params.sort,
      });
      setTotal(res.total);
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const csvUrl = useMemo(() => reportsApi.csvUrl(filters), [filters]);

  const handleDownloadCsv = () => {
    const token = JSON.parse(localStorage.getItem("cartas_auth_v1") || "{}")?.token;
    if (!token) return;
    window
      .fetch(csvUrl, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "reporte_entregas.csv";
        a.click();
        URL.revokeObjectURL(url);
      });
  };

  const estadoBadge = (estado: string) => (
    <ITText
      className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
        estado === "DEVUELTO"
          ? "bg-slate-100 text-slate-600"
          : "bg-emerald-50 text-emerald-700"
      }`}
    >
      {estado}
    </ITText>
  );

  const columns: Column<ReportRow>[] = [
    {
      key: "fecha",
      label: "Fecha",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-700">
          {new Date(r.fecha).toLocaleDateString("es-MX")}
        </ITText>
      ),
    },
    {
      key: "document_code",
      label: "Folio",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] font-black text-emerald-700">{r.document_code}</ITText>
      ),
    },
    {
      key: "asset_code",
      label: "Activo",
      type: "string",
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-bold text-slate-800">{r.asset_code}</ITText>,
    },
    {
      key: "description",
      label: "Descripción",
      type: "string",
      sortable: false,
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.description}</ITText>,
    },
    {
      key: "cantidad",
      label: "Cant.",
      type: "number",
      sortable: false,
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.cantidad}</ITText>,
    },
    {
      key: "responsible",
      label: "Responsable",
      type: "string",
      sortable: false,
      render: (r) => <ITText className="text-[11px] text-slate-700">{r.responsible}</ITText>,
    },
    {
      key: "department",
      label: "Depto.",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[10px] uppercase text-slate-500">{r.department}</ITText>
      ),
    },
    {
      key: "estado",
      label: "Estado",
      type: "string",
      sortable: false,
      render: (r) => estadoBadge(r.estado),
    },
  ];

  return (
    <ITPage
      title="Reportes"
      description={`${total} entregas encontradas`}
      backAction={() => navigate("/")}
      icon={<FaChartBar size={20} />}
    >
      <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 mb-6" direction="column" gap={4}>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={3}>
            <ITDatePicker
              name="start"
              label="Desde"
              value={filters.start ? new Date(filters.start) : undefined}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  start: e.target.value instanceof Date ? localDateString(e.target.value) : undefined,
                }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITDatePicker
              name="end"
              label="Hasta"
              value={filters.end ? new Date(filters.end) : undefined}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  end: e.target.value instanceof Date ? localDateString(e.target.value) : undefined,
                }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITSelect
              name="department"
              label="Departamento"
              options={departments.map((d) => ({ value: d.name, label: d.name }))}
              value={filters.department ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  department: e.target.value || undefined,
                }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITInput
              name="emp"
              label="Empleado / No."
              value={filters.employee ?? ""}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  employee: e.target.value || undefined,
                }))
              }
            />
          </ITGrid>
        </ITGrid>
        <ITFlex justify="end" wrap="wrap" gap={2}>
          <ITButton variant="outlined" onClick={refetch}>
            Consultar
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handleDownloadCsv}
          >
            <ITFlex align="center" gap={1}>
              <FaDownload size={12} />
              <ITText className="font-bold text-[11px]">Exportar CSV</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        size="sm"
      />
    </ITPage>
  );
}