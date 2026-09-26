import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaFileSignature, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventarioApi, type Prestamo } from "@entities/inventario";
import { descargarCartaPDF } from "@widgets/carta-responsiva";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVO: "success",
  PARCIAL: "warning",
  DEVUELTO: "gray",
  CANCELADO: "danger",
};

export default function PrestamosPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventarioApi.prestamos();
        return list as unknown as Record<string, unknown>[];
      }),
    []
  );

  useEffect(() => {
    // Precarga (para el conteo en cabecera, si hiciera falta).
  }, []);

  const columns: any[] = [
    {
      type: "string",
      key: "consecutivo",
      label: t("prestamos.colConsecutivo"),
      sortable: false,
      filter: true,
      render: (p: Prestamo) => <ITText className="text-[11px] font-bold text-slate-800">{p.consecutivo}</ITText>,
    },
    {
      type: "string",
      key: "responsable",
      label: t("prestamos.colResponsable"),
      filter: true,
      render: (p: Prestamo) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.responsable ? (
            <>
              <ITBadget color="success" size="lg">{t("prestamos.aEmpleado")}</ITBadget>
              <ITText className="text-[11px] text-slate-600">{p.responsable.name}</ITText>
            </>
          ) : p.departamento ? (
            <>
              <ITBadget color="info" size="lg">{t("prestamos.aDepartamento")}</ITBadget>
              <ITText className="text-[11px] text-slate-600">
                {p.departamento.name}{p.subarea ? ` — ${p.subarea.name}` : ""}
              </ITText>
            </>
          ) : (
            <ITText className="text-[11px] text-slate-400">—</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      type: "date",
      key: "fecha",
      label: t("prestamos.colFecha"),
      sortable: false,
      render: (p: Prestamo) => <ITText className="text-[11px] text-slate-500">{formatFecha(p.fecha)}</ITText>,
    },
    {
      type: "string",
      key: "detalle",
      label: t("prestamos.colDetalle"),
      render: (p: Prestamo) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {p.detalles.map((d) => {
            const pend = d.cantidad - d.devuelto;
            return (
              <ITText key={d.id} className="text-[10px] leading-tight">
                <span className="font-bold text-slate-700">{d.dispositivo?.nombre}</span> <span className="text-slate-400">×{d.cantidad}</span>
                <span className="text-emerald-600"> · {t("devolucion.devuelto")} {d.devuelto}</span>
                {pend > 0 && <span className="text-amber-600"> · {t("devolucion.pendiente")} {pend}</span>}
              </ITText>
            );
          })}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "status",
      label: t("prestamos.colStatus"),
      render: (p: Prestamo) => <ITBadget color={STATUS_COLOR[p.status]} size="lg">{p.status}</ITBadget>,
    },
    {
      type: "string",
      key: "accion",
      label: "",
      render: (p: Prestamo) => (
        <ITFlex gap={1.5}>
          <ITButton variant="outlined" color="primary" size="lg" onClick={() => navigate(`/inventario/prestamos/${p.id}`)}>
            <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
          </ITButton>
          <ITButton variant="outlined" color="secondary" size="lg" onClick={() => descargarCartaPDF(p)} title={t("prestamos.cartaPdf")}>
            <FaFilePdf className="text-red-600" size={13} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITPage
      title={t("prestamos.title")}
      description={t("prestamos.description")}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("prestamos.title") }]}
      backAction={() => navigate("/inventario")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/prestamos/nuevo")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("prestamos.new")}</ITText>
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