import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaEdit, FaHistory, FaThumbsDown, FaToolbox, FaUserTie } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFechaHora } from "@shared/utils/dates";
import { inventarioApi, type Dispositivo, type Existencias, type KardexRow, type TipoMovimiento, type UnidadFisica } from "@entities/inventario";
import { StatCard } from "@shared/ui/stat-card";

const ESTADO_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  DISPONIBLE: "success",
  PRESTADO: "warning",
  DANADO: "danger",
  MANTENIMIENTO: "gray",
  BAJA: "danger",
};

const TIPO_BADGE_COLOR: Record<TipoMovimiento, "success" | "warning" | "danger" | "gray" | "info"> = {
  ENTRADA: "success",
  PRESTAMO: "warning",
  DEVOLUCION: "info",
  BAJA: "danger",
  TRASPASO: "info",
  AJUSTE_ENTRADA: "success",
  AJUSTE_SALIDA: "warning",
  MANTENIMIENTO_ENTRADA: "gray",
  MANTENIMIENTO_SALIDA: "info",
  REVERSION: "danger",
};

export default function DispositivoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null);
  const [existencias, setExistencias] = useState<Existencias | null>(null);
  const [unidades, setUnidades] = useState<UnidadFisica[]>([]);
  const [kardex, setKardex] = useState<KardexRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([inventarioApi.getDispositivo(id), inventarioApi.existencias(id), inventarioApi.unidades(id), inventarioApi.kardex(id)])
      .then(([d, ex, un, k]) => {
        setDispositivo(d);
        setExistencias(ex);
        setUnidades(un);
        setKardex(k.rows);
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading || !dispositivo) {
    return (
      <ITPage title={t("dispositivos.detail")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const s = existencias;

  return (
    <ITPage
      title={dispositivo.nombre}
      description={`${dispositivo.marca} ${dispositivo.modelo}`}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("dispositivos.title"), onClick: () => navigate("/inventario/dispositivos") }, { label: dispositivo.nombre }]}
      backAction={() => navigate("/inventario/dispositivos")}
      actions={
        <ITButton variant="outlined" color="primary" onClick={() => navigate(`/inventario/dispositivos/${dispositivo.id}/editar`)}>
          <ITFlex align="center" gap={1}>
            <FaEdit size={12} />
            <ITText className="font-bold text-[11px]">{t("dispositivos.edit")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {/* Hero */}
      <ITFlex
        as="section"
        direction="column"
        gap={4}
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-6 shadow-sm"
      >
        <ITFlex align="center" justify="between" gap={4} wrap="wrap">
          <ITFlex align="center" gap={4} className="min-w-0">
            <ITFlex align="center" justify="center" className="h-16 w-16 shrink-0 rounded-2xl bg-slate-800 text-white shadow-md">
              <FaBoxOpen size={26} />
            </ITFlex>
            <ITFlex direction="column" gap={1} className="min-w-0">
              <ITFlex align="center" gap={2} wrap="wrap">
                <ITText className="text-2xl font-black text-slate-900">{dispositivo.nombre}</ITText>
                <ITBadget color="gray" size="lg">{dispositivo.tipo?.name ?? ""}</ITBadget>
              </ITFlex>
              <ITText className="text-sm text-slate-500">
                {dispositivo.marca} · {dispositivo.modelo}
                {dispositivo.descripcion ? ` · ${dispositivo.descripcion}` : ""}
              </ITText>
            </ITFlex>
          </ITFlex>
          <ITFlex direction="column" align="end" gap={1}>
            <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("dispositivos.activa")}</ITText>
            <ITText className="text-4xl font-black text-slate-900 leading-none">{s?.activa ?? 0}</ITText>
            <ITText className="text-[11px] text-slate-400">{t("dispositivos.units", { total: s?.historica ?? 0 })}</ITText>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      {/* Stats */}
      <ITGrid container columns={12} spacing={4}>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaCheckCircle size={16} className="text-white" />} circleClass="bg-emerald-500" value={s?.DISPONIBLE ?? 0} label={t("dispositivos.avail")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaUserTie size={16} className="text-white" />} circleClass="bg-amber-500" value={s?.PRESTADO ?? 0} label={t("dispositivos.prest")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaThumbsDown size={16} className="text-white" />} circleClass="bg-orange-500" value={s?.DANADO ?? 0} label={t("dispositivos.dan")} />
        </ITGrid>
        <ITGrid item xs={6} md={3}>
          <StatCard size="lg" icon={<FaToolbox size={16} className="text-white" />} circleClass="bg-slate-500" value={s?.MANTENIMIENTO ?? 0} label={t("dispositivos.mant")} />
        </ITGrid>
      </ITGrid>

      <ITGrid container columns={12} spacing={6}>
        {/* Unidades */}
        <ITGrid item xs={12} lg={5}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" justify="between" gap={2}>
              <ITText className="text-sm font-bold text-slate-800">{t("dispositivos.unidades")}</ITText>
              <ITBadget color="gray" size="lg">{unidades.length}</ITBadget>
            </ITFlex>
            <div className="max-h-[420px] overflow-y-auto rounded-xl border border-slate-100">
              {unidades.map((u) => (
                <ITFlex key={u.id} align="center" justify="between" gap={3} className="border-b border-slate-100 px-3 py-2.5 last:border-0 hover:bg-slate-50/60">
                  <ITFlex direction="column" gap={0.5} className="min-w-0">
                    <ITText className="font-black text-emerald-700 text-[12px] uppercase tracking-tight">{u.activoFijo}</ITText>
                    <ITFlex gap={2} wrap="wrap" className="text-[10px] text-slate-400">
                      {dispositivo.tipo?.useSerie && u.numeroSerie && <span>Serie: {u.numeroSerie}</span>}
                      {dispositivo.tipo?.useMac && u.macAddress && <span>MAC: {u.macAddress}</span>}
                      {dispositivo.tipo?.useIp && u.ip && <span>IP: {u.ip}</span>}
                      {dispositivo.tipo?.useEquipo && u.nombreEquipo && <span>Equipo: {u.nombreEquipo}</span>}
                      {!u.numeroSerie && !u.macAddress && !u.ip && !u.nombreEquipo && <span>—</span>}
                    </ITFlex>
                  </ITFlex>
                  <ITBadget color={ESTADO_COLOR[u.estado]} size="lg">{u.estado}</ITBadget>
                </ITFlex>
              ))}
              {unidades.length === 0 && <ITText className="py-8 text-center text-sm text-slate-400">{t("dispositivos.noUnits")}</ITText>}
            </div>
          </ITFlex>
        </ITGrid>

        {/* Kardex */}
        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" gap={2}>
              <FaHistory className="text-slate-400" size={14} />
              <ITText className="text-sm font-bold text-slate-800">{t("dispositivos.kardex")}</ITText>
            </ITFlex>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                    <th className="px-3 py-2.5">{t("kardex.fecha")}</th>
                    <th className="px-3 py-2.5">{t("kardex.movimiento")}</th>
                    <th className="px-3 py-2.5 text-right">{t("kardex.entrada")}</th>
                    <th className="px-3 py-2.5 text-right">{t("kardex.salida")}</th>
                    <th className="px-3 py-2.5 text-right">{t("kardex.saldo")}</th>
                    <th className="px-3 py-2.5">{t("kardex.motivo")}</th>
                  </tr>
                </thead>
                <tbody>
                  {kardex.map((r, i) => (
                    <tr key={i} className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50/40" : ""}`}>
                      <td className="px-3 py-2 text-[11px] text-slate-500 whitespace-nowrap">{formatFechaHora(r.fecha)}</td>
                      <td className="px-3 py-2">
                        <ITBadget color={TIPO_BADGE_COLOR[r.tipo]} size="lg">{r.tipo}</ITBadget>
                      </td>
                      <td className="px-3 py-2 text-right text-[12px] font-bold text-emerald-600">{r.entrada ? `+${r.entrada}` : ""}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-bold text-red-500">{r.salida ? `−${r.salida}` : ""}</td>
                      <td className="px-3 py-2 text-right text-[12px] font-black text-slate-800">{r.saldo}</td>
                      <td className="px-3 py-2 text-[11px] text-slate-400">{r.motivo ?? ""}</td>
                    </tr>
                  ))}
                  {kardex.length === 0 && (
                    <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">{t("dispositivos.noMovements")}</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}