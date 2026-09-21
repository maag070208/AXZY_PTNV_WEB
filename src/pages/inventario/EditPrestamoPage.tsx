import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITSegmentedControl, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventarioApi, type Dispositivo, type Prestamo, type TipoDispositivo } from "@entities/inventario";
import { departmentsApi, type Department } from "@entities/department";
import { subareaApi, type Subarea } from "@entities/subarea";
import { usersApi, type User } from "@entities/user";
import { CartaResponsivaPreview } from "@widgets/carta-responsiva";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";

export default function EditPrestamoPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [prestamo, setPrestamo] = useState<Prestamo | null>(null);
  const [tipos, setTipos] = useState<TipoDispositivo[]>([]);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [responsables, setResponsables] = useState<User[]>([]);
  const [departamentos, setDepartamentos] = useState<Department[]>([]);
  const [subareas, setSubareas] = useState<Subarea[]>([]);

  const [asignacion, setAsignacion] = useState<"PERSONAL" | "DEPARTAMENTO">("PERSONAL");
  const [responsableId, setResponsableId] = useState("");
  const [departamentoId, setDepartamentoId] = useState("");
  const [subareaId, setSubareaId] = useState("");
  const [tipoId, setTipoId] = useState("");
  const [dispositivoId, setDispositivoId] = useState("");
  const [cantidad, setCantidad] = useState("1");
  const [disponible, setDisponible] = useState<number | null>(null);
  const [observaciones, setObservaciones] = useState("");

  useEffect(() => {
    if (!id) return;
    Promise.all([
      inventarioApi.getPrestamo(id),
      inventarioApi.tipos(),
      inventarioApi.dispositivos(),
      usersApi.empleados(),
      departmentsApi.list(),
      subareaApi.list(),
    ])
      .then(([p, ts, ds, us, deps, subs]) => {
        setPrestamo(p);
        setTipos(ts.filter((x) => x.active));
        setDispositivos(ds);
        setResponsables(us);
        setDepartamentos(deps);
        setSubareas(subs);

        if (p.responsable) setAsignacion("PERSONAL");
        else if (p.departamento) setAsignacion("DEPARTAMENTO");
        setResponsableId(p.responsable?.id ?? "");
        setDepartamentoId(p.departamento?.id ?? "");
        setSubareaId(p.subarea?.id ?? "");
        setObservaciones(p.observaciones ?? "");
        const d = p.detalles[0];
        if (d) {
          setTipoId(d.dispositivo?.tipoId ?? "");
          setDispositivoId(d.dispositivoId);
          setCantidad(String(d.cantidad));
        }
      })
      .finally(() => setLoading(false));
  }, [id]);

  const subareasDept = useMemo(
    () => (departamentoId ? subareas.filter((s) => s.departmentId === departamentoId) : []),
    [subareas, departamentoId]
  );
  const dispositivosTipo = useMemo(
    () => (tipoId ? dispositivos.filter((d) => d.tipoId === tipoId) : []),
    [dispositivos, tipoId]
  );

  // Unidades de este préstamo que siguen prestadas (se liberan al editar).
  const unidadesEnPrestamo = useMemo(() => {
    const detalle = prestamo?.detalles?.[0];
    return (detalle?.unidades ?? []).filter((u) => !u.devuelto).length;
  }, [prestamo]);

  const seleccionarDispositivo = (did: string) => {
    setDispositivoId(did);
    setDisponible(null);
    setCantidad("1");
    if (did) {
      inventarioApi.existencias(did).then((ex) => {
        const bonus = did === prestamo?.detalles?.[0]?.dispositivoId ? unidadesEnPrestamo : 0;
        setDisponible(ex.DISPONIBLE + bonus);
      }).catch(() => setDisponible(0));
    }
  };

  const cantidadNum = Number(cantidad) || 0;
  const overStock = disponible !== null && cantidadNum > disponible;

  const isValid =
    (asignacion === "PERSONAL" ? !!responsableId : !!departamentoId) &&
    !!dispositivoId &&
    cantidadNum >= 1 &&
    disponible !== null &&
    !overStock;

  const draftPrestamo = useMemo<Prestamo>(
    () => ({
      id: "borrador",
      consecutivo: prestamo?.consecutivo ?? "CARTA-XXXX",
      fecha: new Date().toISOString(),
      responsableId: asignacion === "PERSONAL" ? responsableId : null,
      responsable: asignacion === "PERSONAL"
        ? (() => {
            const u = responsables.find((x) => x.id === responsableId);
            return u ? { id: u.id, name: u.name, username: u.username, numeroEmpleado: u.numeroEmpleado ?? null } : null;
          })()
        : null,
      departamentoId: asignacion === "DEPARTAMENTO" ? departamentoId : null,
      departamento: asignacion === "DEPARTAMENTO"
        ? (() => {
            const d = departamentos.find((x) => x.id === departamentoId);
            return d ? { id: d.id, name: d.name } : null;
          })()
        : null,
      subareaId: asignacion === "DEPARTAMENTO" ? subareaId || null : null,
      subarea: asignacion === "DEPARTAMENTO"
        ? (() => {
            const s = subareasDept.find((x) => x.id === subareaId);
            return s ? { id: s.id, name: s.name } : null;
          })()
        : null,
      status: "ACTIVO" as const,
      observaciones: observaciones || null,
      detalles: dispositivoId
        ? [
            {
              id: "detalle",
              dispositivoId,
              dispositivo: dispositivos.find((d) => d.id === dispositivoId),
              cantidad: cantidadNum || 1,
              devuelto: 0,
            },
          ]
        : [],
    }),
    [asignacion, responsableId, departamentoId, subareaId, subareasDept, departamentos, responsables, dispositivoId, dispositivos, cantidadNum, observaciones, prestamo]
  );
  const draftPreview = useDebouncedValue(draftPrestamo, 500);

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await inventarioApi.actualizarPrestamo(id, {
        responsableId: asignacion === "PERSONAL" ? responsableId : undefined,
        departamentoId: asignacion === "DEPARTAMENTO" ? departamentoId : undefined,
        subareaId: asignacion === "DEPARTAMENTO" ? subareaId || undefined : undefined,
        observaciones: observaciones || undefined,
        dispositivoId,
        cantidad: cantidadNum,
      });
      setToast({ message: t("prestamos.savedEdit"), type: "success" });
      setTimeout(() => navigate(`/inventario/prestamos/${id}`), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !prestamo) {
    return (
      <ITPage title={t("prestamos.edit")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const bloqueadoRecurso = (prestamo.detalles[0]?.devuelto ?? 0) > 0;

  return (
    <ITPage
      title={t("prestamos.edit")}
      description={`${prestamo.consecutivo}`}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("prestamos.title"), onClick: () => navigate("/inventario/prestamos") }, { label: t("prestamos.edit") }]}
      backAction={() => navigate(`/inventario/prestamos/${prestamo.id}`)}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("prestamos.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {bloqueadoRecurso && (
        <ITAlert variant="warning" dismissible={false}>
          {t("prestamos.editRecursoBlocked")}
        </ITAlert>
      )}

      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={6}>
          <ITFlex as="section" direction="column" gap={4} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITFlex as="fieldset" direction="column" gap={2}>
              <ITText as="legend" className="text-sm font-semibold text-slate-700">{t("prestamos.asignacion")}</ITText>
              <ITSegmentedControl
                options={[
                  { value: "PERSONAL", label: t("prestamos.aEmpleado"), icon: <FaFileSignature size={11} /> },
                  { value: "DEPARTAMENTO", label: t("prestamos.aDepartamento"), icon: <FaFileSignature size={11} /> },
                ]}
                value={asignacion}
                onChange={(v) => setAsignacion(v as "PERSONAL" | "DEPARTAMENTO")}
                size="md"
                className="mt-2"
              />
            </ITFlex>

            {asignacion === "PERSONAL" ? (
              <ITSearchSelect
                label={t("prestamos.responsable")}
                placeholder={t("prestamos.responsablePlaceholder")}
                options={responsables.map((u) => ({ value: u.id, label: u.name }))}
                value={responsableId}
                onChange={(v) => setResponsableId(String(v))}
              />
            ) : (
              <>
                <ITSearchSelect
                  label={t("prestamos.departamento")}
                  placeholder={t("prestamos.departamentoPlaceholder")}
                  options={departamentos.map((d) => ({ value: d.id, label: d.name }))}
                  value={departamentoId}
                  onChange={(v) => {
                    setDepartamentoId(String(v));
                    setSubareaId("");
                  }}
                />
                {subareasDept.length > 0 && (
                  <ITSearchSelect
                    label={t("prestamos.subarea")}
                    placeholder={t("prestamos.subareaPlaceholder")}
                    options={subareasDept.map((s) => ({ value: s.id, label: s.name }))}
                    value={subareaId}
                    onChange={(v) => setSubareaId(String(v))}
                  />
                )}
              </>
            )}

            <ITText className="text-sm font-semibold text-slate-700">{t("prestamos.recurso")}</ITText>
            <ITGrid container columns={12} spacing={4}>
              <ITGrid item xs={12}>
                <ITSearchSelect
                  label={t("prestamos.tipoDispositivo")}
                  placeholder={t("prestamos.tipoDispositivoPlaceholder")}
                  options={tipos.map((x) => ({ value: x.id, label: `${x.name} (${x.folioPrefix})` }))}
                  value={tipoId}
                  onChange={(v) => {
                    setTipoId(String(v));
                    setDispositivoId("");
                    setDisponible(null);
                  }}
                />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITSearchSelect
                  label={t("prestamos.dispositivo")}
                  placeholder={t("prestamos.dispositivoPlaceholder")}
                  options={dispositivosTipo.map((d) => ({ value: d.id, label: `${d.nombre} (${d.marca} ${d.modelo})` }))}
                  value={dispositivoId}
                  onChange={(v) => seleccionarDispositivo(String(v))}
                />
              </ITGrid>
              <ITGrid item xs={12} md={5}>
                <ITInput
                  name="cantidad"
                  label={t("prestamos.cantidadLabel")}
                  type="number"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  disabled={bloqueadoRecurso}
                  required
                />
              </ITGrid>
              <ITGrid item xs={12} md={7}>
                <ITFlex align="center" gap={2} className="h-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <ITText className="text-xs text-slate-500">
                    {t("prestamos.disponible")}{" "}
                    <strong className="text-slate-700">{disponible ?? "—"}</strong>
                  </ITText>
                </ITFlex>
              </ITGrid>
            </ITGrid>

            {overStock && <ITAlert variant="error">{t("validation.overStock")}</ITAlert>}

            <ITInput name="observaciones" label={t("prestamos.observaciones")} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={6}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{t("prestamos.preview")}</ITText>
            <CartaResponsivaPreview prestamo={draftPreview as never} />
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}