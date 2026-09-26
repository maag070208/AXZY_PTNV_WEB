import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaCheckCircle, FaFileSignature, FaInfoCircle, FaSave, FaTimesCircle, FaUndoAlt, FaUserTie } from "react-icons/fa";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import { inventarioApi, type Condicion, type Prestamo } from "@entities/inventario";

interface Row {
  key: string;
  prestamoDetalleId: string;
  dispositivoNombre: string;
  prestado: number;
  devuelto: number;
  pendiente: number;
  cantidad: string;
  condicion: Condicion;
  observaciones: string;
  activos: string[];
}

// Presets de condición (estilo "Urgencia" del ticket).
const CONDITION_PRESETS: Record<string, { icon: ReactNode; ring: string; text: string; dot: string }> = {
  BUENO: { icon: <FaCheckCircle size={12} />, ring: "ring-emerald-300", text: "text-emerald-700", dot: "bg-emerald-500" },
  ACEPTABLE: { icon: <FaInfoCircle size={12} />, ring: "ring-amber-300", text: "text-amber-700", dot: "bg-amber-500" },
  MALO: { icon: <FaTimesCircle size={12} />, ring: "ring-orange-300", text: "text-orange-700", dot: "bg-orange-500" },
  ROTO: { icon: <FaTimesCircle size={12} />, ring: "ring-red-300", text: "text-red-700", dot: "bg-red-500" },
};

const CONDICIONES: Condicion[] = ["BUENO", "ACEPTABLE", "MALO", "ROTO"];

export default function NewDevolucionPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const prestamoIdParam = searchParams.get("prestamoId");
  const [prestamos, setPrestamos] = useState<Prestamo[]>([]);
  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  useEffect(() => {
    inventarioApi
      .prestamos()
      .then((p) => setPrestamos(p.filter((x) => x.status === "ACTIVO" || x.status === "PARCIAL")))
      .finally(() => setLoading(false));
  }, []);

  const seleccionar = (id: string) => {
    const p = prestamos.find((x) => x.id === id);
    setPrestamo(p ?? null);
    if (p) {
      setRows(
        p.detalles
          .filter((d) => d.cantidad - d.devuelto > 0)
          .map((d) => ({
            key: d.id,
            prestamoDetalleId: d.id,
            dispositivoNombre: d.dispositivo?.nombre ?? "",
            prestado: d.cantidad,
            devuelto: d.devuelto,
            pendiente: d.cantidad - d.devuelto,
            cantidad: String(d.cantidad - d.devuelto),
            condicion: "BUENO",
            observaciones: "",
            activos: (d.unidades ?? [])
              .filter((u) => !u.devuelto)
              .map((u) => u.unidadFisica?.activoFijo ?? "")
              .filter(Boolean),
          }))
      );
    }
  };

  useEffect(() => {
    if (prestamoIdParam && prestamos.length > 0) seleccionar(prestamoIdParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prestamoIdParam, prestamos.length]);

  const updateRow = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const totalADevolver = rows.reduce((sum, r) => sum + (Number(r.cantidad) || 0), 0);
  const totalPendiente = rows.reduce((sum, r) => sum + r.pendiente, 0);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    // observación requerida si MALO/ROTO, mínimo 3 caracteres
    rows.forEach((r, idx) => {
      if ((r.condicion === "MALO" || r.condicion === "ROTO") && r.observaciones.trim().length < 3) {
        e[`observaciones-${idx}`] = "La observación debe tener al menos 3 caracteres";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid =
    !!prestamo &&
    rows.length > 0 &&
    rows.every((r) => Number(r.cantidad) >= 0 && Number(r.cantidad) <= r.pendiente && !!r.condicion) &&
    totalADevolver > 0;

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: "Revisa las observaciones marcadas", type: "error" });
      return;
    }
    setSaving(true);
    try {
      await inventarioApi.crearDevolucion({
        prestamoId: prestamo!.id,
        detalles: rows
          .filter((r) => Number(r.cantidad) > 0)
          .map((r) => ({
            prestamoDetalleId: r.prestamoDetalleId,
            cantidad: Number(r.cantidad),
            condicion: r.condicion,
            observaciones: (r.condicion === "MALO" || r.condicion === "ROTO") && r.observaciones.trim() ? r.observaciones : undefined,
          })),
      });
      setToast({ message: t("devolucion.saved"), type: "success" });
      setTimeout(() => navigate("/inventario/prestamos"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("devolucion.new")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("devolucion.new")}
      description={t("devolucion.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("devolucion.title"), onClick: () => navigate("/inventario/devoluciones") }, { label: t("devolucion.new") }]}
      backAction={() => navigate("/inventario/prestamos")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("devolucion.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={8}>
          <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITSearchSelect
              label={t("devolucion.selectPrestamo")}
              placeholder={t("devolucion.selectPrestamoPlaceholder")}
              options={prestamos.map((p) => ({ value: p.id, label: `${p.consecutivo} · ${p.responsable?.name ?? p.departamento?.name ?? ""}` }))}
              value={prestamo?.id ?? ""}
              onChange={(v) => seleccionar(String(v))}
            />

            {prestamo && rows.length > 0 && (
              <>
                <ITFlex direction="column" gap={3}>
                  {rows.map((r) => {
                    return (
                      <ITFlex
                        key={r.key}
                        direction="column"
                        gap={3}
                        className="rounded-xl border border-slate-200 bg-slate-50/50 p-4"
                      >
                        <ITFlex align="center" justify="between" gap={3} wrap="wrap">
                          <ITFlex align="center" gap={2} className="min-w-0">
                            <ITText className="text-sm font-bold text-slate-800">{r.dispositivoNombre}</ITText>
                          </ITFlex>
                          <ITFlex gap={1.5} wrap="wrap">
                            <ITBadget color="gray" size="lg">{t("devolucion.prestado")}: {r.prestado}</ITBadget>
                            <ITBadget color="success" size="lg">{t("devolucion.devuelto")}: {r.devuelto}</ITBadget>
                            <ITBadget color="warning" size="lg">{t("devolucion.pendiente")}: {r.pendiente}</ITBadget>
                          </ITFlex>
                        </ITFlex>

                        {r.activos.length > 0 && (
                          <ITFlex gap={1} wrap="wrap">
                            {r.activos.map((a) => (
                              <span key={a} className="rounded-md bg-slate-200/70 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                                {a}
                              </span>
                            ))}
                          </ITFlex>
                        )}

                        <ITGrid container columns={12} spacing={4}>
                          <ITGrid item xs={12} md={3}>
                            <ITInput
                              name={`devolver-${r.key}`}
                              label={t("devolucion.devolver")}
                              type="number"
                              min={0}
                              max={r.pendiente}
                              value={r.cantidad}
                              onChange={(e) => updateRow(r.key, { cantidad: e.target.value })}
                            />
                          </ITGrid>
                          <ITGrid item xs={12} md={9}>
                            <ITFlex as="fieldset" direction="column" gap={2}>
                              <ITText as="legend" className="text-sm font-semibold text-slate-700">
                                {t("devolucion.condicion")}
                              </ITText>
                              <ITFlex gap={2} wrap="wrap">
                                {CONDICIONES.map((c) => {
                                  const p = CONDITION_PRESETS[c];
                                  const isActive = r.condicion === c;
                                  return (
                                    <button
                                      key={c}
                                      type="button"
                                      onClick={() => updateRow(r.key, { condicion: c })}
                                      className={`inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-3.5 py-2 text-xs font-medium transition-all ${
                                        isActive
                                          ? `border-transparent bg-slate-50 ring-2 ${p.ring} ${p.text}`
                                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                                      }`}
                                    >
                                      {p.icon}
                                      <span>{t(`devolucion.condicionLabels.${c}`)}</span>
                                    </button>
                                  );
                                })}
                              </ITFlex>
                            </ITFlex>
                          </ITGrid>
                        </ITGrid>

                        {r.condicion === "ROTO" && (
                          <ITText className="text-[11px] font-semibold text-red-600">{t("devolucion.rotoBajaHint")}</ITText>
                        )}
                        {(r.condicion === "MALO" || r.condicion === "ROTO") && (
                          <div>
                            <ITInput
                              name={`observaciones-${r.key}`}
                              label={t("new.comentario")}
                              placeholder={t("devolucion.comentarioPlaceholder")}
                              value={r.observaciones}
                              onChange={(e) => updateRow(r.key, { observaciones: e.target.value })}
                              aria-invalid={!!errors[`observaciones-${rows.indexOf(r)}`]}
                            />
                            {errors[`observaciones-${rows.indexOf(r)}`] && (
                              <span role="alert" className="text-red-500 text-xs mt-1 block">
                                {errors[`observaciones-${rows.indexOf(r)}`]}
                              </span>
                            )}
                          </div>
                        )}
                      </ITFlex>
                    );
                  })}
                </ITFlex>
              </>
            )}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={4}>
          <ITFlex direction="column" gap={4} className="lg:sticky lg:top-6">
            {prestamo && (
              <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <ITFlex align="center" gap={2}>
                  <FaFileSignature className="text-slate-400" size={14} />
                  <ITText className="text-sm font-semibold text-slate-800">{t("devolucion.cartaInfo")}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.colConsecutivo")}</ITText>
                  <ITText className="text-sm font-bold text-slate-900">{prestamo.consecutivo}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.colFecha")}</ITText>
                  <ITText className="text-sm text-slate-600">{formatFecha(prestamo.fecha)}</ITText>
                </ITFlex>

                <ITFlex direction="column" gap={1}>
                  <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("prestamos.asignacion")}</ITText>
                  <ITFlex align="center" gap={2}>
                    <FaUserTie className="text-slate-400" size={12} />
                    <ITText className="text-sm font-semibold text-slate-700">
                      {prestamo.responsable?.name ?? (prestamo.departamento?.name || "—")}
                    </ITText>
                  </ITFlex>
                </ITFlex>

                <ITFlex
                  align="center"
                  justify="between"
                  gap={2}
                  className="rounded-xl border border-amber-100 bg-amber-50/60 px-4 py-3"
                >
                  <ITText className="text-xs text-slate-600">{t("devolucion.pendienteTotal")}</ITText>
                  <ITText className="text-lg font-black text-slate-800">{totalPendiente}</ITText>
                </ITFlex>

                <ITFlex
                  align="center"
                  justify="between"
                  gap={2}
                  className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                >
                  <ITText className="text-xs text-slate-600">{t("devolucion.aDevolver")}</ITText>
                  <ITText className="text-lg font-black text-emerald-700">{totalADevolver}</ITText>
                </ITFlex>
              </ITFlex>
            )}
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}