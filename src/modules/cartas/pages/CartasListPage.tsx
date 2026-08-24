import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITPage,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useCallback, useMemo, useState } from "react";
import { FaEye, FaFileSignature, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch } from "@core/store/store";
import { cartasApi } from "@core/api/cartas.api";
import {
  deleteCartaThunk,
  loadCartaIntoDraft,
  resetDraft,
} from "@core/store/cartas/cartas.slice";
import { formatFecha, type CartaResponsiva } from "@core/store/cartas/types";
import { useIsMobile } from "../hooks/useIsMobile";
import CartaResponsivaCard from "../components/CartaResponsivaCard";

export default function CartasListPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleNew = () => {
    dispatch(resetDraft());
    navigate("/cartas/nueva");
  };

  const handleLoad = (id: string) => {
    dispatch(loadCartaIntoDraft(id));
    navigate("/cartas/nueva");
  };

  const handleDelete = (id: string) => {
    setToDelete(id);
  };

  const confirmDelete = () => {
    if (!toDelete) return;
    dispatch(deleteCartaThunk(toDelete));
    setToDelete(null);
    setReloadKey((k) => k + 1);
  };

  const fetchTableData = useCallback(
    async (params: ITDataTableFetchParams) => {
      const res = await cartasApi.table({
        page: params.page,
        limit: params.limit,
        filters: params.filters as Record<string, string | number | boolean>,
        sort: params.sort,
      });
      return {
        data: res.data as unknown as Record<string, unknown>[],
        total: res.total,
      };
    },
    []
  );

  const columns = useMemo(
    () => [
      {
        key: "consecutivo",
        label: "FOLIO",
        filter: true,
        sortable: false,
        render: (row: CartaResponsiva) => (
          <ITFlex align="center" gap={3}>
            <ITStack direction="column" spacing={0.5}>
              <ITText className="font-black text-slate-800 text-[11px] uppercase tracking-tight">
                {row.consecutivo}
              </ITText>
              <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                {formatFecha(row.fecha)}
              </ITText>
            </ITStack>
          </ITFlex>
        ),
      },
      {
        key: "numeroEmpleado",
        label: "NO. EMPLEADO",
        type: "string",
        filter: true,
        sortable: false,
        render: (row: CartaResponsiva) => (
          <ITText className="font-black text-slate-700 text-[11px] uppercase">
            {row.numeroEmpleado || "—"}
          </ITText>
        ),
      },
      {
        key: "items",
        label: "RECURSO",
        filter: true,
        render: (row: CartaResponsiva) => (
          <ITBadget color="primary" size="small">
            {row.items[0]?.descripcion?.slice(0, 28).toUpperCase() || "—"}
          </ITBadget>
        ),
      },
      {
        key: "departamento",
        label: "DEPARTAMENTO",
        type: "string",
        filter: true,
        sortable: false,
        render: (row: CartaResponsiva) => (
          <ITText className="text-[10px] font-black text-slate-600 uppercase">
            {row.departamento}
          </ITText>
        ),
      },
      {
        key: "actions",
        label: "ACCIONES",
        type: "actions",
        render: (row: CartaResponsiva) => (
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => handleLoad(row.id)}
              title="Ver / Editar"
            >
              <FaEye size={14} />
            </ITButton>
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => handleDelete(row.id)}
              title="Eliminar"
            >
              <FaTrash size={14} />
            </ITButton>
          </ITFlex>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const renderCard = useCallback(
    (row: Record<string, unknown>) => (
      <CartaResponsivaCard
        row={row as unknown as CartaResponsiva}
        onView={handleLoad}
        onDelete={handleDelete}
      />
    ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ITPage
      title="Cartas Responsivas"
      backAction={() => navigate(-1)}
      description="Genera y administra cartas responsivas del Departamento de Mantenimiento"
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: "Inicio", onClick: () => navigate("/") },
        { label: "Cartas" },
      ]}
      actions={
        <ITFlex gap={2}>
          <ITButton
            variant="filled"
            color="primary"
            onClick={handleNew}
          >
            <ITFlex align="center" gap={1}>
              <FaFileSignature size={14} />
              <ITText className="font-bold text-[11px]">Nueva Carta</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchTableData as unknown as (p: ITDataTableFetchParams) => Promise<ITDataTableResponse<Record<string, unknown>>>}
        defaultItemsPerPage={isMobile ? 5 : 10}
        defaultView={isMobile ? "cards" : "table"}
        renderCard={renderCard}
        reloadTrigger={reloadKey}
        size="sm"
      />

      <ITConfirmDialog
        isOpen={!!toDelete}
        onClose={() => setToDelete(null)}
        onConfirm={confirmDelete}
        title="Eliminar carta"
        message="¿Eliminar esta carta del historial? Esta acción no se puede deshacer."
        confirmLabel="Eliminar"
        cancelLabel="Cancelar"
        variant="danger"
      />
    </ITPage>
  );
}