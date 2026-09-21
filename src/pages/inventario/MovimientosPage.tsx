import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITGrid, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaExchangeAlt, FaFilePdf, FaHistory, FaPlus, FaTrash, FaUndoAlt, FaWrench } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventarioApi, type Movimiento, type TipoMovimiento } from "@entities/inventario";
import { TIPO_BADGE_COLOR } from "@entities/inventario/model/movimientoColores";
import { descargarReporteMovimientosPDF } from "@widgets/movimiento-pdf";
import { StatCard } from "@shared/ui/stat-card";

interface StatCounts {
  total: number;
  bajas: number;
  mantenimiento: number;
}

type TipoGroup = "bajas" | "mantenimiento";

const GROUP_TIPOS: Record<TipoGroup, TipoMovimiento[]> = {
  bajas: ["BAJA"],
  mantenimiento: ["MANTENIMIENTO_ENTRADA", "MANTENIMIENTO_SALIDA"],
};

type AccionColor = "success" | "warning" | "danger" | "info";
const ACCION_VISUAL: Record<TipoMovimiento, { icon: ReactNode; color: AccionColor }> = {
  ENTRADA: { icon: <FaArrowDown size={12} />, color: "success" },
  AJUSTE_ENTRADA: { icon: <FaArrowDown size={12} />, color: "success" },
  DEVOLUCION: { icon: <FaArrowRight size={12} />, color: "success" },
  PRESTAMO: { icon: <FaArrowUp size={12} />, color: "warning" },
  BAJA: { icon: <FaTrash size={12} />, color: "danger" },
  AJUSTE_SALIDA: { icon: <FaArrowUp size={12} />, color: "warning" },
  TRASPASO: { icon: <FaExchangeAlt size={12} />, color: "info" },
  MANTENIMIENTO_ENTRADA: { icon: <FaWrench size={12} />, color: "info" },
  MANTENIMIENTO_SALIDA: { icon: <FaWrench size={12} />, color: "warning" },
  REVERSION: { icon: <FaUndoAlt size={12} />, color: "danger" },
};
const ACCION_DEFAULT: AccionColor = "warning";

interface MovRow {
  id: string;
  movId: string;
  fecha: string;
  tipo: TipoMovimiento;
  nombre: string;
  unidad: string;
  motivo?: string | null;
  responsable?: { id: string; name: string } | null;
  usuario?: { id: string; name: string } | null;
  status: "ACTIVO" | "CANCELADO";
}

function flattenMovimientos(list: Movimiento[]): MovRow[] {
  const out: MovRow[] = [];
  for (const m of list) {
    for (const d of m.detalles ?? []) {
      const nombre = d.dispositivo?.nombre ?? "—";
      const unis = d.unidades ?? [];
      if (unis.length > 0) {
        for (const u of unis) {
          out.push({
            id: `${m.id}:${d.id}:${u.id}`,
            movId: m.id,
            fecha: m.fecha,
            tipo: m.tipo,
            nombre,
            unidad: u.unidadFisica?.activoFijo ?? "—",
            motivo: m.motivo,
            responsable: m.responsable,
            usuario: m.usuario,
            status: m.status,
          });
        }
      } else {
        out.push({
          id: `${m.id}:${d.id}`,
          movId: m.id,
          fecha: m.fecha,
          tipo: m.tipo,
          nombre,
          unidad: d.cantidad > 1 ? `×${d.cantidad}` : "—",
          motivo: m.motivo,
          responsable: m.responsable,
          usuario: m.usuario,
          status: m.status,
        });
      }
    }
  }
  return out;
}

export default function MovimientosPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [tipoFilter, setTipoFilter] = useState<TipoGroup | null>(null);
  const [stats, setStats] = useState<StatCounts>({ total: 0, bajas: 0, mantenimiento: 0 });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    inventarioApi.movimientos().then((list) => {
      const rows = flattenMovimientos(list);
      const counts: StatCounts = { total: rows.length, bajas: 0, mantenimiento: 0 };
      for (const r of rows) {
        if (GROUP_TIPOS.bajas.includes(r.tipo)) counts.bajas += 1;
        else if (GROUP_TIPOS.mantenimiento.includes(r.tipo)) counts.mantenimiento += 1;
      }
      setStats(counts);
    });
  }, [reloadKey]);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventarioApi.movimientos();
        const filtered = tipoFilter ? list.filter((m) => GROUP_TIPOS[tipoFilter].includes(m.tipo)) : list;
        return flattenMovimientos(filtered) as unknown as Record<string, unknown>[];
      }),
    [tipoFilter]
  );

  const aplicarFiltro = (group: TipoGroup | null) => {
    setTipoFilter((prev) => (prev === group ? null : group));
    setReloadKey((k) => k + 1);
  };

  const revertir = async (movId: string) => {
    if (!window.confirm(t("movimientos.confirmRevert"))) return;
    try {
      await inventarioApi.revertir(movId);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      window.alert(e.message || "Error");
    }
  };

  const generarReporte = async () => {
    setGeneratingPdf(true);
    try {
      const list = await inventarioApi.movimientos();
      await descargarReporteMovimientosPDF(list);
    } catch {
      window.alert("Error al generar el reporte");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const statCardActive = (group: TipoGroup | null) => tipoFilter === group;

  const columns: any[] = [
    {
      type: "date",
      key: "fecha",
      label: t("kardex.fecha"),
      sortable: false,
      render: (m: MovRow) => <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{formatFechaHora(m.fecha)}</ITText>,
    },
    {
      type: "string",
      key: "tipo",
      label: t("movimientos.colTipo"),
      sortable: false,
      filter: true,
      render: (m: MovRow) => <ITBadget color={TIPO_BADGE_COLOR[m.tipo]} size="lg">{m.tipo}</ITBadget>,
    },
    {
      type: "string",
      key: "nombre",
      label: t("movimientos.colDetalle"),
      render: (m: MovRow) => (
        <ITText className="text-[11px] text-slate-600 truncate">
          {m.nombre} {m.unidad !== "—" && <b className="text-slate-800">· {m.unidad}</b>}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "motivo",
      label: t("movimientos.colComentario"),
      render: (m: MovRow) => <ITText className="text-[11px] text-slate-500">{m.motivo || "—"}</ITText>,
    },
    {
      type: "string",
      key: "responsable",
      label: t("movimientos.colResponsable"),
      render: (m: MovRow) => <ITText className="text-[11px] text-slate-600">{m.responsable?.name ?? m.usuario?.name ?? "—"}</ITText>,
    },
    {
      type: "string",
      key: "status",
      label: t("movimientos.colStatus"),
      render: (m: MovRow) =>
        m.status === "CANCELADO" ? <ITBadget color="danger" size="lg">{t("movimientos.cancelled")}</ITBadget> : <ITBadget color="success" size="lg">{t("movimientos.activeLabel")}</ITBadget>,
    },
  ];

  return (
    <ITPage
      title={t("movimientos.title")}
      description={t("movimientos.description")}
      icon={<FaHistory size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("movimientos.title") }]}
      backAction={() => navigate("/inventario")}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" onClick={generarReporte} disabled={generatingPdf}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{generatingPdf ? t("new.saving") : t("movimientos.reporte")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventario/movimientos/nuevo")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("movimientos.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaHistory size={16} className="text-white" />}
            circleClass={statCardActive(null) ? "bg-slate-800 ring-4 ring-slate-200" : "bg-slate-800"}
            value={stats.total}
            label={t("movimientos.stats.total")}
            onClick={() => aplicarFiltro(null)}
          />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaTrash size={16} className="text-white" />}
            circleClass={statCardActive("bajas") ? "bg-red-500 ring-4 ring-red-200" : "bg-red-500"}
            value={stats.bajas}
            label={t("movimientos.stats.bajas")}
            onClick={() => aplicarFiltro("bajas")}
          />
        </ITGrid>
        <ITGrid item xs={6} md={4}>
          <StatCard
            size="lg"
            icon={<FaWrench size={16} className="text-white" />}
            circleClass={statCardActive("mantenimiento") ? "bg-sky-500 ring-4 ring-sky-200" : "bg-sky-500"}
            value={stats.mantenimiento}
            label={t("movimientos.stats.mantenimiento")}
            onClick={() => aplicarFiltro("mantenimiento")}
          />
        </ITGrid>
      </ITGrid>

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />
    </ITPage>
  );
}