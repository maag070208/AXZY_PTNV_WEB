import {
  ITBadget,
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
import { downloadReportPDF } from "../utils/pdf";
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
  const [filters, setFilters] = useState<ReportFilters & { dateRange?: [Date | null, Date | null] }>({
    dateRange: [new Date(), null],
  });
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

  const [exporting, setExporting] = useState(false);

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      const { data } = await reportsApi.get(filters);
      await downloadReportPDF(data, filters);
    } catch (e) {
      console.error("Error al exportar PDF", e);
    } finally {
      setExporting(false);
    }
  };

  const estadoBadge = (estado: string) => (
    <ITBadget color={estado === "DEVUELTO" ? "default" : "success"} size="small">
      {estado}
    </ITBadget>
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
      backAction={() => navigate(-1)}
      icon={<FaChartBar size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Reportes" },
      ]}
    >
      <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 mb-6" direction="column" gap={4}>
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITDatePicker
              name="dateRange"
              label="Rango de fechas"
              range={true}
              value={filters.dateRange ?? [null, null]}
              onChange={(e) => {
                const range = e.target.value as [Date | null, Date | null];
                setFilters((f) => ({
                  ...f,
                  dateRange: range,
                  start: range[0] ? localDateString(range[0]) : undefined,
                  end: range[1] ? localDateString(range[1]) : undefined,
                }));
              }}
              placeholder="Fecha inicio - Fecha fin"
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
            onClick={handleDownloadPdf}
            disabled={exporting}
          >
            <ITFlex align="center" gap={1}>
              <FaDownload size={12} />
              <ITText className="font-bold text-[11px]">{exporting ? "Exportando..." : "Exportar PDF"}</ITText>
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