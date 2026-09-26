import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaUndoAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventarioApi, type Devolucion } from "@entities/inventario";

export default function DevolucionesPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventarioApi.devoluciones();
        return list as unknown as Record<string, unknown>[];
      }),
    []
  );

  const columns: any[] = [
    {
      type: "string",
      key: "consecutivo",
      label: t("devolucion.colConsecutivo"),
      sortable: false,
      filter: true,
      render: (d: Devolucion) => <ITText className="text-[11px] font-bold text-slate-800">{d.consecutivo}</ITText>,
    },
    {
      type: "string",
      key: "prestamo",
      label: t("devolucion.colPrestamo"),
      filter: true,
      render: (d: Devolucion) => (
        <ITButton
          variant="text"
          color="primary"
          size="lg"
          onClick={() => navigate(`/inventario/prestamos/${d.prestamoId}`)}
        >
          <ITFlex align="center" gap={1}>
            <FaFileSignature size={11} />
            <ITText className="font-bold text-[11px] underline">{d.prestamo?.consecutivo ?? "—"}</ITText>
          </ITFlex>
        </ITButton>
      ),
    },
    {
      type: "string",
      key: "asignado",
      label: t("devolucion.colAsignado"),
      render: (d: Devolucion) => (
        <ITText className="text-[11px] text-slate-600">
          {d.prestamo?.responsable?.name ?? d.prestamo?.departamento?.name ?? "—"}
        </ITText>
      ),
    },
    {
      type: "date",
      key: "fecha",
      label: t("devolucion.colFecha"),
      sortable: false,
      render: (d: Devolucion) => <ITText className="text-[11px] text-slate-500 whitespace-nowrap">{formatFecha(d.fecha)}</ITText>,
    },
    {
      type: "string",
      key: "detalle",
      label: t("devolucion.colDetalle"),
      render: (d: Devolucion) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {d.detalles.map((x) => (
            <ITFlex key={x.id} align="center" gap={1.5} className="min-w-0">
              <ITText className="text-[11px] text-slate-600 truncate">{x.dispositivo?.nombre ?? "—"}</ITText>
              <ITBadget color="gray" size="lg">×{x.cantidad}</ITBadget>
              <ITBadget
                size="lg"
                color={x.condicion === "BUENO" ? "success" : x.condicion === "ACEPTABLE" ? "warning" : x.condicion === "MALO" ? "warning" : "danger"}
              >
                {t(`devolucion.condicionLabels.${x.condicion}`)}
              </ITBadget>
            </ITFlex>
          ))}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "accion",
      label: "",
      render: (d: Devolucion) => (
        <ITButton variant="outlined" color="secondary" size="lg" onClick={() => navigate(`/inventario/prestamos/${d.prestamoId}`)}>
          <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage
      title={t("devolucion.title")}
      description={t("devolucion.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("devolucion.title") }]}
      backAction={() => navigate("/inventario")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/devoluciones/nueva")}>
          <ITFlex align="center" gap={1}>
            <FaUndoAlt size={12} />
            <ITText className="font-bold text-[11px]">{t("devolucion.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />
    </ITPage>
  );
}