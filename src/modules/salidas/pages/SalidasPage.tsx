import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaClipboardList, FaDownload, FaEdit, FaPlus, FaTrash } from "react-icons/fa";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { salidasApi, type MaterialOutput, type SalidaFilters } from "@core/api/salidas.api";
import { downloadSalidasPDF } from "../utils/pdf";

const localDateString = (d: Date): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

export default function SalidasPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SalidaFilters & { dateRange?: [Date | null, Date | null] }>({});
  const [total, setTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [toDelete, setToDelete] = useState<MaterialOutput | null>(null);
  const [exporting, setExporting] = useState(false);

  const externalFilters: Record<string, string | number | boolean> = useMemo(() => {
    const out: Record<string, string | number | boolean> = {};
    if (filters.start) out.start = filters.start;
    if (filters.end) out.end = filters.end;
    if (filters.departamento) out.departamento = filters.departamento;
    if (filters.usuario) out.usuario = filters.usuario;
    if (filters.area) out.area = filters.area;
    if (filters.q) out.q = filters.q;
    return out;
  }, [filters]);

  const refetch = () => setReloadKey((k) => k + 1);

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await salidasApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      setTotal(res.total);
      return { data: res.data as unknown as Record<string, unknown>[], total: res.total };
    },
    []
  );

  const handleDownloadPdf = async () => {
    setExporting(true);
    try {
      const { data } = await salidasApi.list(filters);
      await downloadSalidasPDF(data, filters);
    } catch (e) {
      console.error("Error al exportar bitácora", e);
    } finally {
      setExporting(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;
    await salidasApi.remove(toDelete.id);
    setToDelete(null);
    refetch();
  };

  const columns: Column<MaterialOutput>[] = [
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
      key: "descripcion",
      label: "Descripción",
      type: "string",
      sortable: false,
      filter: true,
      render: (r) => (
        <ITFlex direction="column" gap={0.5}>
          <ITText className="text-[12px] font-black text-slate-800">{r.descripcion}</ITText>
          <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {[r.marca, r.modelo].filter(Boolean).join(" · ")}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "proyecto",
      label: "Proyecto",
      type: "string",
      sortable: false,
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.proyecto ?? "—"}</ITText>,
    },
    {
      key: "cantidad",
      label: "Cant.",
      type: "number",
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-bold text-slate-700">{r.cantidad}</ITText>,
    },
    {
      key: "departamento",
      label: "Departamento",
      type: "string",
      sortable: false,
      filter: true,
      render: (r) => (
        <ITText className="text-[10px] uppercase font-bold text-slate-600">{r.departamento}</ITText>
      ),
    },
    {
      key: "usuario",
      label: "Usuario",
      type: "string",
      sortable: false,
      filter: true,
      render: (r) => <ITText className="text-[11px] text-slate-700">{r.usuario}</ITText>,
    },
    {
      key: "area",
      label: "Área",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITBadget color="primary" size="small">
          {r.area}
        </ITBadget>
      ),
    },
    {
      key: "observaciones",
      label: "Observaciones",
      type: "string",
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-500 italic">{r.observaciones ?? "—"}</ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      render: (r) => (
        <ITFlex gap={1}>
          <ITButton
            variant="outlined"
            size="small"
            color="secondary"
            onClick={() => navigate(`/salidas/${r.id}/editar`)}
            title="Editar"
          >
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            size="small"
            color="danger"
            onClick={() => setToDelete(r)}
            title="Eliminar"
          >
            <FaTrash size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title="Salidas de material"
      description={`${total} registro(s) · Bitácora F-SIS-0005`}
      backAction={() => navigate(-1)}
      icon={<FaClipboardList size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Salidas" },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={handleDownloadPdf}
            disabled={exporting}
          >
            <ITFlex align="center" gap={1}>
              <FaDownload size={12} />
              <ITText className="font-bold text-[11px]">
                {exporting ? "Exportando…" : "Exportar bitácora"}
              </ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/salidas/nueva")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nueva salida</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITFlex
        className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 mb-6"
        direction="column"
        gap={4}
      >
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
            <ITInput
              name="departamento"
              label="Departamento"
              value={filters.departamento ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, departamento: e.target.value || undefined }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITInput
              name="usuario"
              label="Usuario"
              value={filters.usuario ?? ""}
              onChange={(e) =>
                setFilters((f) => ({ ...f, usuario: e.target.value || undefined }))
              }
            />
          </ITGrid>
          <ITGrid item xs={12} md={2}>
            <ITInput
              name="q"
              label="Buscar"
              value={filters.q ?? ""}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined }))}
            />
          </ITGrid>
        </ITGrid>
        <ITFlex justify="end">
          <ITButton variant="outlined" onClick={refetch}>
            Consultar
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
        defaultItemsPerPage={20}
        size="sm"
      />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar registro"
        message="¿Eliminar este renglón de la bitácora de salida? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}
