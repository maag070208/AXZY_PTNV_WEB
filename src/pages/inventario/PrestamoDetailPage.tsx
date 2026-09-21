import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaCommentDots, FaEdit, FaFilePdf, FaFileSignature, FaUndoAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatFecha, formatFechaHora } from "@shared/utils/dates";
import { inventarioApi, type Condicion, type Prestamo } from "@entities/inventario";
import { CartaResponsivaPreview, descargarCartaPDF } from "@widgets/carta-responsiva";

const STATUS_COLOR: Record<string, "success" | "warning" | "danger" | "gray"> = {
  ACTIVO: "success",
  PARCIAL: "warning",
  DEVUELTO: "gray",
  CANCELADO: "danger",
};

const CONDICION_COLOR: Record<Condicion, "success" | "info" | "warning" | "danger"> = {
  BUENO: "success",
  ACEPTABLE: "info",
  MALO: "warning",
  ROTO: "danger",
};

export default function PrestamoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    inventarioApi.getPrestamo(id).then(setPrestamo).finally(() => setLoading(false));
  }, [id]);

  if (loading || !prestamo) {
    return (
      <ITPage title={t("prestamos.detail")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={prestamo.consecutivo}
      description={`${prestamo.responsable?.name ?? "—"} · ${formatFecha(prestamo.fecha)}`}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("prestamos.title"), onClick: () => navigate("/inventario/prestamos") }, { label: prestamo?.consecutivo ?? "" }]}
      backAction={() => navigate("/inventario/prestamos")}
      actions={
        <ITFlex gap={2}>
          {(prestamo.status === "ACTIVO" || prestamo.status === "PARCIAL") && (
            <ITButton variant="outlined" color="primary" onClick={() => navigate(`/inventario/prestamos/${prestamo.id}/editar`)}>
              <ITFlex align="center" gap={1}>
                <FaEdit size={12} />
                <ITText className="font-bold text-[11px]">{t("prestamos.edit")}</ITText>
              </ITFlex>
            </ITButton>
          )}
          <ITButton variant="outlined" color="secondary" onClick={() => descargarCartaPDF(prestamo)}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{t("prestamos.cartaPdf")}</ITText>
            </ITFlex>
          </ITButton>
          {(prestamo.status === "ACTIVO" || prestamo.status === "PARCIAL") && (
            <ITButton variant="filled" color="primary" onClick={() => navigate(`/inventario/devoluciones/nueva?prestamoId=${prestamo.id}`)}>
              <ITFlex align="center" gap={1}>
                <FaUndoAlt size={12} />
                <ITText className="font-bold text-[11px]">{t("devolucion.new")}</ITText>
              </ITFlex>
            </ITButton>
          )}
        </ITFlex>
      }
    >
      <ITBadget color={STATUS_COLOR[prestamo.status]} size="lg">{prestamo.status}</ITBadget>

      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={5}>
          <ITFlex direction="column" gap={4}>
            {/* Formulario en modo lectura */}
            <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITText className="text-sm font-bold text-slate-800">{t("prestamos.detailData")}</ITText>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.colConsecutivo")}</ITText>
                <ITText className="text-sm font-bold text-slate-900">{prestamo.consecutivo}</ITText>
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.colFecha")}</ITText>
                <ITText className="text-sm text-slate-700">{formatFecha(prestamo.fecha)}</ITText>
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.asignacion")}</ITText>
                {prestamo.responsable ? (
                  <ITFlex align="center" gap={2}>
                    <ITBadget color="success" size="lg">{t("prestamos.aEmpleado")}</ITBadget>
                    <ITText className="text-sm font-semibold text-slate-700">{prestamo.responsable.name}</ITText>
                  </ITFlex>
                ) : prestamo.departamento ? (
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <ITBadget color="info" size="lg">{t("prestamos.aDepartamento")}</ITBadget>
                    <ITText className="text-sm font-semibold text-slate-700">
                      {prestamo.departamento.name}{prestamo.subarea ? ` — ${prestamo.subarea.name}` : ""}
                    </ITText>
                  </ITFlex>
                ) : (
                  <ITText className="text-sm text-slate-400">—</ITText>
                )}
                {prestamo.responsable?.numeroEmpleado && (
                  <ITText className="text-[10px] text-slate-400">{t("prestamos.empleadoNo", { n: prestamo.responsable.numeroEmpleado })}</ITText>
                )}
              </ITFlex>

              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.recurso")}</ITText>
                {prestamo.detalles.map((d) => (
                  <ITText key={d.id} className="text-sm text-slate-700">
                    {d.dispositivo?.nombre} ({d.dispositivo?.marca} {d.dispositivo?.modelo}) —{" "}
                    <b>{t("prestamos.cantidad", { n: d.cantidad })}</b>
                  </ITText>
                ))}
              </ITFlex>

              {prestamo.observaciones && (
                <ITFlex direction="column" gap={0.5}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.observaciones")}</ITText>
                  <ITText className="text-sm text-slate-600">{prestamo.observaciones}</ITText>
                </ITFlex>
              )}
            </ITFlex>

            {/* Seguimiento del préstamo */}
            <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITText className="text-sm font-bold text-slate-800">{t("prestamos.detalles")}</ITText>
              {prestamo.detalles.map((d) => {
                const pendiente = d.cantidad - d.devuelto;
                return (
                  <ITFlex key={d.id} align="center" justify="between" gap={2} className="border-b border-slate-100 py-2 last:border-0">
                    <ITFlex direction="column" gap={0.5} className="min-w-0">
                      <ITText className="text-[12px] font-bold text-slate-700">{d.dispositivo?.nombre}</ITText>
                      <ITText className="text-[10px] text-slate-400">
                        {t("devolucion.prestado")}: {d.cantidad} · {t("devolucion.devuelto")}: {d.devuelto} · {t("devolucion.pendiente")}: {pendiente}
                      </ITText>
                    </ITFlex>
                    <ITBadget color={pendiente > 0 ? "warning" : "success"} size="lg">
                      {pendiente > 0 ? t("devolucion.parcial") : t("devolucion.completo")}
                    </ITBadget>
                  </ITFlex>
                );
              })}
            </ITFlex>

            {/* Historial de devoluciones (kardex) */}
            <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-sm font-bold text-slate-800">{t("prestamos.devolucionHistory")}</ITText>
                <ITText className="text-[10px] text-slate-400">{t("prestamos.devolucionHistoryHint")}</ITText>
              </ITFlex>
              {!prestamo.devoluciones || prestamo.devoluciones.length === 0 ? (
                <ITText className="text-[11px] text-slate-400">{t("prestamos.sinDevoluciones")}</ITText>
              ) : (
                <div className="relative pl-5 before:absolute before:left-[5px] before:top-1 before:bottom-1 before:w-0.5 before:bg-slate-100">
                  {[...prestamo.devoluciones]
                    .sort((a, b) => +new Date(a.fecha) - +new Date(b.fecha))
                    .map((dv) => (
                      <ITFlex key={dv.id} direction="column" gap={2} className="relative pb-4 last:pb-0">
                        <span className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />
                        <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <ITText className="text-[12px] font-black text-slate-700">{formatFechaHora(dv.fecha)}</ITText>
                            <ITBadget color="info" size="lg">{dv.consecutivo}</ITBadget>
                          </ITFlex>
                          {dv.responsable?.name && (
                            <ITText className="text-[10px] text-slate-400">por {dv.responsable.name}</ITText>
                          )}
                        </ITFlex>
                        {dv.detalles.map((dd) => (
                          <ITFlex key={dd.id} direction="column" gap={1} className="rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                            <ITFlex align="center" justify="between" gap={2} wrap="wrap">
                              <ITText className="text-[11px] font-bold text-slate-700">
                                {dd.dispositivo?.nombre ?? t("prestamos.title")} <span className="text-slate-400">×{dd.cantidad}</span>
                              </ITText>
                              <ITBadget color={CONDICION_COLOR[dd.condicion]} size="lg">
                                {t(`devolucion.condicionLabels.${dd.condicion}`)}
                              </ITBadget>
                            </ITFlex>
                            {dd.unidades && dd.unidades.length > 0 && (
                              <ITFlex gap={1} wrap="wrap">
                                {dd.unidades.map((u) => (
                                  <span key={u.id} className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                    {u.unidadFisica.activoFijo}
                                  </span>
                                ))}
                              </ITFlex>
                            )}
                            {dd.observaciones && (
                              <ITFlex align="center" gap={1}>
                                <FaCommentDots className="text-slate-400" size={11} />
                                <ITText className="text-[10px] italic text-slate-500">“{dd.observaciones}”</ITText>
                              </ITFlex>
                            )}
                          </ITFlex>
                        ))}
                      </ITFlex>
                    ))}
                </div>
              )}
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{t("prestamos.preview")}</ITText>
            <CartaResponsivaPreview prestamo={prestamo} />
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}