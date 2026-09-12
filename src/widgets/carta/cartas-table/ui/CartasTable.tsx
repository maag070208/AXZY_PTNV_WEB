import {
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITFlex,
  ITStack,
  ITText,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { useCallback, useMemo, useState } from "react";
import { FaEye, FaTrash } from "react-icons/fa";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { AppDispatch } from "@core/store/store";
import { deleteCartaThunk, cartasApi, type CartaResponsiva } from "@entities/carta";
import { formatFecha } from "@core/utils/dates";
import { useIsMobile } from "@core/hooks/useIsMobile";
import { CartaResponsivaCard } from "@widgets/carta/carta-card";

export default function CartasTable() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const isMobile = useIsMobile();
  const { t } = useTranslation("cartas");
  const [toDelete, setToDelete] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const handleLoad = (id: string) => {
    navigate(`/cartas/${id}`);
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
        label: t("table.folio"),
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
        label: t("table.employeeNo"),
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
        label: t("table.resource"),
        filter: true,
        render: (row: CartaResponsiva) => (
          <ITBadget color="primary" size="small">
            {row.items[0]?.descripcion?.slice(0, 28).toUpperCase() || "—"}
          </ITBadget>
        ),
      },
      {
        key: "departamento",
        label: t("table.department"),
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
        label: t("table.actions"),
        type: "actions",
        render: (row: CartaResponsiva) => (
          <ITFlex justify="end" gap={2}>
            <ITButton
              variant="outlined"
              size="small"
              color="secondary"
              onClick={() => handleLoad(row.id)}
              title={t("table.view")}
            >
              <FaEye size={14} />
            </ITButton>
            <ITButton
              variant="outlined"
              size="small"
              color="danger"
              onClick={() => handleDelete(row.id)}
              title={t("table.delete")}
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
    <>
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
        title={t("table.deleteTitle")}
        message={t("table.deleteMessage")}
        confirmLabel={t("table.delete")}
        cancelLabel={t("table.cancel")}
        variant="danger"
      />
    </>
  );
}