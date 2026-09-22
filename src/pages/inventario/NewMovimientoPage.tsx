import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventarioApi, type Condicion, type Dispositivo, type EstadoInventario, type TipoDispositivo, type TipoMovimiento, type UnidadFisica } from "@entities/inventario";
import { TIPO_BADGE_COLOR } from "@entities/inventario/model/movimientoColores";

const ESTADO_LABEL_KEY = {
  DISPONIBLE: "dashboard.disponibles",
  PRESTADO: "dashboard.prestadas",
  DANADO: "dashboard.danadas",
  MANTENIMIENTO: "dashboard.mantenimiento",
  BAJA: "dashboard.baja",
} as const;

const MOVIMIENTO_HINT_KEY = {
  BAJA: "movimientoHint.BAJA",
  MANTENIMIENTO_ENTRADA: "movimientoHint.MANTENIMIENTO_ENTRADA",
  MANTENIMIENTO_SALIDA: "movimientoHint.MANTENIMIENTO_SALIDA",
} as const;

const TIPOS: TipoMovimiento[] = ["BAJA", "MANTENIMIENTO_ENTRADA", "MANTENIMIENTO_SALIDA"];

interface Row {
  key: string;
  tipoFilter: string;
  dispositivoId: string;
  unidadId: string;
  tipo: TipoMovimiento | "";
  condicion: Condicion | "";
  motivo: string;
  observaciones: string;
  unidades: UnidadFisica[];
  unidadesLoading: boolean;
}

const CONDICIONES: Condicion[] = ["BUENO", "ACEPTABLE", "MALO", "ROTO"];

const CONDICION_BADGE_COLOR = {
  BUENO: "success",
  ACEPTABLE: "info",
  MALO: "warning",
  ROTO: "danger",
} as const;

const ESTADOS_OPERABLES: EstadoInventario[] = ["DISPONIBLE", "MANTENIMIENTO"];

const UNIDAD_ESTADO: Partial<Record<TipoMovimiento, EstadoInventario>> = {
  BAJA: "DISPONIBLE",
  MANTENIMIENTO_ENTRADA: "DISPONIBLE",
  MANTENIMIENTO_SALIDA: "MANTENIMIENTO",
};

export default function NewMovimientoPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoDispositivo[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [rows, setRows] = useState<Row[]>([{ key: crypto.randomUUID(), tipoFilter: "", dispositivoId: "", unidadId: "", tipo: "", condicion: "", motivo: "", observaciones: "", unidades: [], unidadesLoading: false }]);

  useEffect(() => {
    Promise.all([inventarioApi.tipos(), inventarioApi.dispositivos()])
      .then(([ts, ds]) => {
        setTipos(ts);
        setDispositivos(ds);
      })
      .finally(() => setLoading(false));
  }, []);

  const cargarUnidades = async (key: string, dispositivoId: string) => {
    setRows((r) => r.map((x) => (x.key === key ? { ...x, unidades: [], unidadesLoading: true } : x)));
    try {
      const todas = await inventarioApi.unidades(dispositivoId);
      setRows((r) => r.map((x) => (x.key === key ? { ...x, unidades: todas, unidadesLoading: false } : x)));
    } catch {
      setRows((r) => r.map((x) => (x.key === key ? { ...x, unidades: [], unidadesLoading: false } : x)));
      window.alert("Error al cargar las unidades");
    }
  };

  const updateRow = (key: string, patch: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...patch } : x)));

  const elegirDispositivo = (key: string, dispositivoId: string) => {
    updateRow(key, { dispositivoId, unidadId: "", tipo: "", unidades: [] });
    if (dispositivoId) cargarUnidades(key, dispositivoId);
  };

  const elegirTipoFiltro = (key: string, tipoId: string) => {
    updateRow(key, { tipoFilter: tipoId, dispositivoId: "", unidadId: "", tipo: "", unidades: [] });
  };

  const elegirTipo = (key: string, tp: TipoMovimiento) => {
    setRows((r) =>
      r.map((x) => {
        if (x.key !== key) return x;
        const estadoValido = UNIDAD_ESTADO[tp];
        const unidadOk = x.unidadId && estadoValido && x.unidades.find((u) => u.id === x.unidadId)?.estado === estadoValido;
        return { ...x, tipo: tp, unidadId: unidadOk ? x.unidadId : "" };
      })
    );
  };

  const addRow = () => setRows((r) => [...r, { key: crypto.randomUUID(), tipoFilter: "", dispositivoId: "", unidadId: "", tipo: "", condicion: "", motivo: "", observaciones: "", unidades: [], unidadesLoading: false }]);
  const removeRow = (key: string) => setRows((r) => r.filter((x) => x.key !== key));

  const unidadesVisibles = (r: Row) => {
    const base = r.unidades.filter((u) => ESTADOS_OPERABLES.includes(u.estado));
    const estado = r.tipo ? UNIDAD_ESTADO[r.tipo as TipoMovimiento] : undefined;
    return estado ? base.filter((u) => u.estado === estado) : base;
  };

  const unidadLabel = (u: UnidadFisica) => {
    const extras = [u.numeroSerie, u.nombreEquipo, u.macAddress].filter(Boolean).join(" · ");
    return `${u.activoFijo}${extras ? ` · ${extras}` : ""} · ${u.estado}`;
  };

  const rowValida = (r: Row) =>
    !!r.dispositivoId &&
    !!r.unidadId &&
    !!r.tipo &&
    (r.tipo === "BAJA" || r.tipo === "MANTENIMIENTO_ENTRADA" ? !!r.motivo.trim() : true) &&
    (r.tipo !== "MANTENIMIENTO_SALIDA" || !!r.condicion);

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    rows.forEach((r, idx) => {
      if ((r.tipo === "BAJA" || r.tipo === "MANTENIMIENTO_ENTRADA") && r.motivo.trim().length < 3) {
        e[`motivo-${idx}`] = "El motivo debe tener al menos 3 caracteres";
      }
      if (r.tipo === "MANTENIMIENTO_SALIDA" && r.observaciones.trim().length > 0 && r.observaciones.trim().length < 3) {
        e[`observaciones-${idx}`] = "La observación debe tener al menos 3 caracteres";
      }
    });
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const isValid = rows.length > 0 && rows.every(rowValida);

  const handleSubmit = async () => {
    if (!validate()) {
      setToast({ message: "Revisa los campos marcados", type: "error" });
      return;
    }
    setSaving(true);
    try {
      const grupos = new Map<TipoMovimiento, Row[]>();
      rows.forEach((r) => {
        if (!r.tipo) return;
        const arr = grupos.get(r.tipo) ?? [];
        arr.push(r);
        grupos.set(r.tipo, arr);
      });
      await Promise.all(
        [...grupos.entries()].map(([tp, rs]) =>
          inventarioApi.registrarMovimiento({
            tipo: tp,
            motivo: rs.find((r) => r.motivo.trim())?.motivo || undefined,
            detalles: rs.map((r) => ({
              dispositivoId: r.dispositivoId,
              unidadId: r.unidadId,
              cantidad: 1,
              condicion: tp === "MANTENIMIENTO_SALIDA" ? (r.condicion as Condicion) : undefined,
              observaciones: r.observaciones.trim() ? r.observaciones : undefined,
            })),
          })
        )
      );
      setToast({ message: t("messages.movementRegistered"), type: "success" });
      setTimeout(() => navigate("/inventario/movimientos"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("new.title")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("new.title")}
      description={t("new.description")}
      icon={<FaSave size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("movimientos.title"), onClick: () => navigate("/inventario/movimientos") }, { label: t("movimientos.new") }]}
      backAction={() => navigate("/inventario/movimientos")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("new.register")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITFlex as="section" direction="column" gap={5} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <ITText className="text-sm font-semibold text-slate-700">{t("new.detalle")}</ITText>

        <ITFlex align="center" justify="between" gap={2}>
          <ITText className="text-[11px] font-bold text-slate-500">
            {rows.length} {rows.length === 1 ? t("new.row") : t("new.rows")} · {rows.length} {rows.length === 1 ? t("new.pieza") : t("new.piezas")}
          </ITText>
        </ITFlex>

        <ITFlex direction="column" gap={4}>
          {rows.map((r, idx) => {
            const visibles = unidadesVisibles(r);
            const estadoValido = r.tipo ? UNIDAD_ESTADO[r.tipo as TipoMovimiento] : undefined;
            const dispFiltrados = r.tipoFilter ? dispositivos.filter((d) => d.tipoId === r.tipoFilter) : dispositivos;
            const unidadSel = r.unidadId ? r.unidades.find((u) => u.id === r.unidadId) : undefined;
            const tiposValidos = unidadSel ? TIPOS.filter((tp) => UNIDAD_ESTADO[tp as TipoMovimiento] === unidadSel.estado) : TIPOS;
            return (
              <ITFlex key={r.key} direction="column" gap={3} className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
                <ITFlex align="center" justify="between" gap={2}>
                  <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {t("new.item")} {idx + 1}
                  </ITText>
                  <ITButton variant="outlined" color="error" size="lg" onClick={() => removeRow(r.key)} disabled={rows.length === 1}>
                    {t("common:actions.delete")}
                  </ITButton>
                </ITFlex>

                <ITGrid container columns={12} spacing={3}>
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      label={t("new.tipoFilter")}
                      placeholder={t("new.tipoFilterPlaceholder")}
                      options={[{ value: "", label: t("new.todo") }, ...tipos.map((tp) => ({ value: tp.id, label: tp.name }))]}
                      value={r.tipoFilter}
                      onChange={(v) => elegirTipoFiltro(r.key, String(v))}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      label={t("new.productType")}
                      placeholder={t("new.productTypePlaceholder")}
                      options={dispFiltrados.map((d) => ({ value: d.id, label: `${d.nombre} (${d.marca} ${d.modelo})` }))}
                      value={r.dispositivoId}
                      onChange={(v) => elegirDispositivo(r.key, String(v))}
                    />
                  </ITGrid>
                  <ITGrid item xs={12} md={4}>
                    <ITSearchSelect
                      label={t("new.unidad")}
                      placeholder={t("new.unidadPlaceholder")}
                      options={visibles.map((u) => ({ value: u.id, label: unidadLabel(u) }))}
                      value={r.unidadId}
                      disabled={!r.dispositivoId}
                      isLoading={r.unidadesLoading}
                      onChange={(v) => updateRow(r.key, { unidadId: String(v) })}
                    />
                  </ITGrid>
                </ITGrid>

                <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("new.howLabel")}</ITText>
                <ITFlex gap={2} wrap="wrap">
                  {tiposValidos.map((tp) => {
                    const sel = r.tipo === tp;
                    return (
                      <button
                        key={tp}
                        type="button"
                        onClick={() => elegirTipo(r.key, tp)}
                        className={`rounded-full p-0 transition-all ${sel ? "shadow-md scale-105" : "opacity-50 hover:opacity-100"}`}
                      >
                        <ITBadget color={TIPO_BADGE_COLOR[tp]} variant={sel ? "filled" : "outlined"} size="lg">
                          {t(`typeLabels.${tp}`)}
                        </ITBadget>
                      </button>
                    );
                  })}
                </ITFlex>

                {(r.tipo === "BAJA" || r.tipo === "MANTENIMIENTO_ENTRADA") && (
                  <div>
                    <ITInput
                      name={`motivo-${r.key}`}
                      label={t("new.motivo")}
                      value={r.motivo}
                      onChange={(e) => updateRow(r.key, { motivo: e.target.value })}
                      required
                      aria-invalid={!!errors[`motivo-${idx}`]}
                    />
                    {errors[`motivo-${idx}`] && (
                      <span role="alert" className="text-red-500 text-xs mt-1 block">
                        {errors[`motivo-${idx}`]}
                      </span>
                    )}
                  </div>
                )}

                {r.tipo === "MANTENIMIENTO_SALIDA" && (
                      <>
                        <ITText className="text-[11px] font-black uppercase tracking-wider text-slate-400">{t("devolucion.condicion")}</ITText>
                        <ITFlex gap={2} wrap="wrap">
                          {CONDICIONES.map((c) => {
                            const sel = r.condicion === c;
                            return (
                              <button
                                key={c}
                                type="button"
                                onClick={() => updateRow(r.key, { condicion: c })}
                                className={`rounded-full p-0 transition-all ${sel ? "shadow-md scale-105" : "opacity-50 hover:opacity-100"}`}
                              >
                                <ITBadget color={CONDICION_BADGE_COLOR[c]} variant={sel ? "filled" : "outlined"} size="lg">
                                  {c}
                                </ITBadget>
                              </button>
                            );
                          })}
                        </ITFlex>
                        <div>
                      <ITInput
                        name={`observaciones-${r.key}`}
                        label={t("new.comentario")}
                        value={r.observaciones}
                        onChange={(e) => updateRow(r.key, { observaciones: e.target.value })}
                        aria-invalid={!!errors[`observaciones-${idx}`]}
                      />
                      {errors[`observaciones-${idx}`] && (
                        <span role="alert" className="text-red-500 text-xs mt-1 block">
                          {errors[`observaciones-${idx}`]}
                        </span>
                      )}
                    </div>
                        {r.condicion === "ROTO" && (
                          <ITText className="text-[11px] font-semibold text-red-600">{t("devolucion.rotoBajaHint")}</ITText>
                        )}
                      </>
                    )}

                {r.tipo && estadoValido && (
                  <ITText className="text-[11px] font-semibold text-slate-500">
                    {t("new.unidadEstadoHint", { estado: t(ESTADO_LABEL_KEY[estadoValido]) })}
                  </ITText>
                )}

                {r.tipo && r.dispositivoId && !r.unidadesLoading && visibles.length === 0 && (
                  <ITText className="text-[11px] font-semibold text-amber-600">{t("new.sinUnidadesEstado")}</ITText>
                )}

                {r.tipo && r.dispositivoId && visibles.length > 0 && (
                  <ITText className="text-[11px] text-slate-400">{t(MOVIMIENTO_HINT_KEY[r.tipo as keyof typeof MOVIMIENTO_HINT_KEY])}</ITText>
                )}
              </ITFlex>
            );
          })}
          <ITFlex>
            <ITButton variant="outlined" color="secondary" size="lg" onClick={addRow}>
              + {t("new.addRow")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITFlex>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}