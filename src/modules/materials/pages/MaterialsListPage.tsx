import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSelect,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import {
  FaBoxes,
  FaEdit,
  FaFileExcel,
  FaLayerGroup,
  FaPlus,
  FaTags,
  FaTrash,
} from "react-icons/fa";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  materialsApi,
  type Material,
  type MaterialSummary,
} from "@core/api/materials.api";

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const [categorias, setCategorias] = useState<string[]>([]);
  const [filterCategoria, setFilterCategoria] = useState("");
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);
  const [summary, setSummary] = useState<MaterialSummary | null>(null);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const loadSummary = useCallback(() => {
    materialsApi
      .summary()
      .then(setSummary)
      .catch(() => setSummary(null));
  }, []);

  useEffect(() => {
    loadSummary();
  }, [loadSummary, reloadKey]);

  useEffect(() => {
    materialsApi
      .categorias()
      .then(setCategorias)
      .catch(() => setCategorias([]));
  }, [reloadKey]);

  const confirmDelete = async () => {
    if (!materialToDelete) return;
    try {
      await materialsApi.remove(materialToDelete.id);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setDeleteError(e.message);
    }
    setMaterialToDelete(null);
  };

  const externalFilters: Record<string, string | number | boolean> = useMemo(() => {
    const out: Record<string, string | number | boolean> = {};
    if (filterCategoria) out.categoria = filterCategoria;
    if (search) out.q = search;
    return out;
  }, [filterCategoria, search]);

  const fetchTableData = useCallback(async (params: ITDataTableFetchParams) => {
    const res = await materialsApi.table({
      page: params.page,
      limit: params.limit,
      filters: params.filters as Record<string, string | number | boolean>,
      sort: params.sort,
    });
    setTotal(res.total);
    return {
      data: res.data as unknown as Record<string, unknown>[],
      total: res.total,
    };
  }, []);

  const columns: any[] = useMemo(
    () => [
      {
        type: "string",
        key: "modelo",
        label: "MODELO",
        sortable: true,
        filter: true,
        render: (row: Material) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-black text-slate-800">{row.modelo}</ITText>
            <ITText className="text-[10px] font-bold text-slate-400">{row.descripcion}</ITText>
          </ITFlex>
        ),
      },
      {
        type: "string",
        key: "categoria",
        label: "CATEGORÍA",
        sortable: true,
        render: (row: Material) => (
          <ITBadget color="secondary" size="small">
            {row.categoria}
          </ITBadget>
        ),
      },
      {
        type: "string",
        key: "marca",
        label: "MARCA",
        sortable: false,
        render: (row: Material) => (
          <ITText className="text-[11px] font-bold text-slate-500">{row.marca || "—"}</ITText>
        ),
      },
      {
        type: "string",
        key: "stock",
        label: "STOCK",
        sortable: true,
        render: (row: Material) => (
          <ITFlex align="center" gap={1}>
            <ITText
              className={`text-[14px] font-black ${
                row.stock <= 0 ? "text-red-500" : "text-emerald-700"
              }`}
            >
              {row.stock}
            </ITText>
            <ITText className="text-[9px] font-bold uppercase text-slate-400">
              {row.unidad}
            </ITText>
          </ITFlex>
        ),
      },
      {
        type: "actions",
        key: "actions",
        label: "",
        align: "right",
        render: (row: Material) => (
          <ITFlex gap={1}>
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => navigate(`/materiales/${row.id}/editar`)}
              title="Editar / ajustar stock"
            >
              <FaEdit size={14} />
            </ITButton>
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => setMaterialToDelete(row)}
              title={row.active ? "Dar de baja" : "Eliminar definitivamente"}
            >
              <FaTrash size={12} />
            </ITButton>
          </ITFlex>
        ),
      },
    ],
    [navigate]
  );

  return (
    <ITPage
      title="Materiales"
      description={`${total} material(es) en catálogo`}
      backAction={() => navigate(-1)}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Materiales" },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="outlined"
            color="secondary"
            onClick={() => navigate("/materiales/importar")}
          >
            <ITFlex align="center" gap={1}>
              <FaFileExcel size={12} />
              <ITText className="font-bold text-[11px]">Cargar Excel</ITText>
            </ITFlex>
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            onClick={() => navigate("/materiales/nuevo")}
          >
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">Nuevo</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
      error={null}
      icon={<FaBoxes size={20} />}
    >
      <ITGrid container columns={12} spacing={3} className="mb-4">
        <ITGrid item xs={6} md={4}>
          <ITCard className="!p-3 border border-slate-200">
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-slate-100 text-slate-600">
                <FaBoxes size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-slate-800 leading-none">
                  {summary?.total ?? "–"}
                </ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Materiales
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <ITCard className="!p-3 border border-slate-200">
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-emerald-50 text-emerald-600">
                <FaLayerGroup size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-emerald-700 leading-none">
                  {summary?.stockTotal ?? "–"}
                </ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Piezas en stock
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
        <ITGrid item xs={12} md={4}>
          <ITCard className="!p-3 border border-slate-200">
            <ITFlex align="center" gap={2}>
              <ITFlex align="center" justify="center" className="w-9 h-9 shrink-0 rounded-xl bg-amber-50 text-amber-600">
                <FaTags size={14} />
              </ITFlex>
              <ITFlex direction="column" gap={0}>
                <ITText className="text-[18px] font-black text-amber-700 leading-none">
                  {summary?.categorias ?? "–"}
                </ITText>
                <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
                  Categorías
                </ITText>
              </ITFlex>
            </ITFlex>
          </ITCard>
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={3} className="mb-4">
        <ITGrid item xs={12} md={4}>
          <ITSelect
            name="filterCategoria"
            options={categorias.map((c) => ({ value: c, label: c }))}
            value={filterCategoria}
            onChange={(e) => setFilterCategoria(e.target.value)}
            placeholder="Todas las categorías"
          />
        </ITGrid>
        <ITGrid item xs={12} md={8}>
          <ITInput
            name="search"
            placeholder="Buscar por modelo, descripción o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </ITGrid>
      </ITGrid>

      <ITDataTable
        columns={columns as any}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        defaultItemsPerPage={20}
        size="sm"
        reloadTrigger={reloadKey}
      />

      {deleteError && (
        <ITAlert variant="error" dismissible onDismiss={() => setDeleteError(null)}>
          {deleteError}
        </ITAlert>
      )}

      <ITConfirmDialog
        isOpen={!!materialToDelete}
        onClose={() => setMaterialToDelete(null)}
        onConfirm={confirmDelete}
        title={materialToDelete?.active ? "Dar de baja" : "Eliminar definitivamente"}
        message={
          materialToDelete?.active
            ? `¿Dar de baja "${materialToDelete?.modelo}"? Dejará de aparecer en el catálogo activo. Podrás eliminarlo definitivamente después.`
            : `¿Eliminar definitivamente "${materialToDelete?.modelo}"? Esta acción no se puede deshacer.`
        }
        confirmLabel={materialToDelete?.active ? "Dar de baja" : "Eliminar definitivamente"}
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}
