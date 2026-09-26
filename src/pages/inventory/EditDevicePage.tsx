import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaChevronDown, FaChevronRight, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventarioApi, type Dispositivo, type EstadoInventario, type UnidadFisica } from "@entities/inventario";

const ESTADO_COLOR: Record<EstadoInventario, "success" | "warning" | "danger" | "gray"> = {
  DISPONIBLE: "success",
  PRESTADO: "warning",
  DANADO: "danger",
  MANTENIMIENTO: "gray",
  BAJA: "danger",
};

interface UnitDraft {
  numeroSerie: string;
  macAddress: string;
  ip: string;
  nombreEquipo: string;
}

export default function EditDispositivoPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [dispositivo, setDispositivo] = useState<Dispositivo | null>(null);
  const [unidades, setUnidades] = useState<UnidadFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState<string | null>(null);
  const [savedUnitId, setSavedUnitId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const [form, setForm] = useState({
    nombre: "",
    marca: "",
    modelo: "",
    descripcion: "",
    observaciones: "",
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([inventarioApi.getDispositivo(id), inventarioApi.unidades(id)])
      .then(([d, us]) => {
        setDispositivo(d);
        setUnidades(us);
        setForm({
          nombre: d.nombre,
          marca: d.marca,
          modelo: d.modelo,
          descripcion: d.descripcion ?? "",
          observaciones: d.observaciones ?? "",
        });
        const draftsInit: Record<string, UnitDraft> = {};
        for (const u of us) {
          draftsInit[u.id] = {
            numeroSerie: u.numeroSerie ?? "",
            macAddress: u.macAddress ?? "",
            ip: u.ip ?? "",
            nombreEquipo: u.nombreEquipo ?? "",
          };
        }
        setDrafts(draftsInit);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isValid = !!form.nombre.trim() && !!form.marca.trim() && !!form.modelo.trim();

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await inventarioApi.actualizarDispositivo(id, {
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        descripcion: form.descripcion || undefined,
        observaciones: form.observaciones || undefined,
      });
      setToast({ message: t("dispositivos.savedEdit"), type: "success" });
      setTimeout(() => navigate(`/inventario/dispositivos/${id}`), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isUnitDirty = (u: UnidadFisica) => {
    const d = drafts[u.id];
    if (!d) return false;
    return d.numeroSerie !== (u.numeroSerie ?? "") || d.macAddress !== (u.macAddress ?? "") || d.ip !== (u.ip ?? "") || d.nombreEquipo !== (u.nombreEquipo ?? "");
  };

  const saveUnidad = async (u: UnidadFisica) => {
    const d = drafts[u.id];
    if (!d || !isUnitDirty(u)) return;
    const tipo = dispositivo?.tipo;
    setSavingUnitId(u.id);
    try {
      await inventarioApi.actualizarUnidad(u.id, {
        ...(tipo?.useSerie ? { numeroSerie: d.numeroSerie || undefined } : {}),
        ...(tipo?.useMac ? { macAddress: d.macAddress || undefined } : {}),
        ...(tipo?.useIp ? { ip: d.ip || undefined } : {}),
        ...(tipo?.useEquipo ? { nombreEquipo: d.nombreEquipo || undefined } : {}),
      });
      setUnidades((prev) => prev.map((x) => (x.id === u.id ? { ...x, numeroSerie: d.numeroSerie, macAddress: d.macAddress, ip: d.ip, nombreEquipo: d.nombreEquipo } : x)));
      setSavedUnitId(u.id);
      setTimeout(() => setSavedUnitId((prev) => (prev === u.id ? null : prev)), 2000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSavingUnitId(null);
    }
  };

  if (loading || !dispositivo) {
    return (
      <ITPage title={t("dispositivos.edit")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("dispositivos.edit")}
      description={dispositivo.nombre}
      icon={<FaBoxOpen size={20} />}
      backAction={() => navigate(`/inventario/dispositivos/${dispositivo.id}`)}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title"), onClick: () => navigate("/inventario") },
        { label: t("dispositivos.title"), onClick: () => navigate("/inventario/dispositivos") },
        { label: dispositivo.nombre, onClick: () => navigate(`/inventario/dispositivos/${dispositivo.id}`) },
        { label: t("dispositivos.edit") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("dispositivos.saveDevice")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        {/* Main form */}
        <ITGrid item xs={12} lg={8}>
          <ITFlex as="section" direction="column" gap={5} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("dispositivos.tipo")}</ITText>
              <ITFlex align="center" gap={2} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <FaBoxOpen className="text-slate-400" size={13} />
                <ITText className="text-sm font-semibold text-slate-700">{dispositivo.tipo?.name ?? ""}</ITText>
                {dispositivo.tipo?.folioPrefix && <ITText className="text-[10px] font-bold uppercase text-slate-400">{dispositivo.tipo.folioPrefix}</ITText>}
              </ITFlex>
            </ITFlex>

            <ITGrid container columns={12} spacing={5}>
              <ITGrid item xs={12}>
                <ITInput name="nombre" label={t("dispositivos.nombre")} value={form.nombre} onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput name="marca" label={t("dispositivos.marca")} value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput name="modelo" label={t("dispositivos.modelo")} value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput name="descripcion" label={t("dispositivos.descripcion")} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput name="observaciones" label={t("dispositivos.observaciones")} value={form.observaciones} onChange={(e) => setForm((f) => ({ ...f, observaciones: e.target.value }))} />
              </ITGrid>
            </ITGrid>

            <ITAlert variant="info" dismissible={false}>
              {t("dispositivos.editHint")}
            </ITAlert>
          </ITFlex>
        </ITGrid>

        {/* Units sidebar */}
        <ITGrid item xs={12} lg={4}>
          <ITFlex as="section" direction="column" gap={3} className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" justify="between" gap={2}>
              <ITFlex align="center" gap={2}>
                <ITText className="text-sm font-bold text-slate-800">{t("dispositivos.unitSidebar")}</ITText>
                <ITBadget color="gray" size="lg">{unidades.length}</ITBadget>
              </ITFlex>
              {unidades.length > 0 && (
                <ITButton variant="text" color="primary" size="lg" onClick={() => {
                  const next = !allExpanded;
                  setAllExpanded(next);
                  const map: Record<string, boolean> = {};
                  for (const u of unidades) map[u.id] = next === true ? true : false;
                  setExpanded(map);
                }}>
                  <ITText className="text-[10px] font-bold uppercase">{allExpanded ? t("dispositivos.collapseAll") : t("dispositivos.expandAll")}</ITText>
                </ITButton>
              )}
            </ITFlex>
            <ITText className="text-[11px] text-slate-400">{t("dispositivos.unitSidebarHint")}</ITText>

            <div className="flex max-h-[720px] flex-col gap-2 overflow-y-auto pr-1">
              {unidades.map((u) => {
                const d = drafts[u.id];
                const dirty = isUnitDirty(u);
                const savingThis = savingUnitId === u.id;
                const isOpen = !!expanded[u.id];
                return (
                  <ITFlex key={u.id} direction="column" className="rounded-xl border border-slate-100 bg-slate-50/60">
                    <button
                      type="button"
                      onClick={() => {
                        setExpanded((prev) => {
                          const nextIsOpen = !prev[u.id];
                          return { ...prev, [u.id]: nextIsOpen };
                        });
                        setAllExpanded(false);
                      }}
                      className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                    >
                      <ITFlex align="center" gap={2} className="min-w-0">
                        {isOpen ? <FaChevronDown className="shrink-0 text-slate-400" size={11} /> : <FaChevronRight className="shrink-0 text-slate-400" size={11} />}
                        <ITText className="truncate text-[11px] font-black uppercase tracking-tight text-emerald-700">{u.activoFijo}</ITText>
                        {dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title={t("dispositivos.unsaved")} />}
                      </ITFlex>
                      <ITBadget color={ESTADO_COLOR[u.estado]} size="lg">{u.estado}</ITBadget>
                    </button>

                    {isOpen && d && (
                      <ITFlex direction="column" gap={2} className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                        {dispositivo.tipo?.useSerie && (
                          <ITInput
                            name={`serie-${u.id}`}
                            label={t("dispositivos.numeroSerie")}
                            value={d.numeroSerie}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, numeroSerie: e.target.value } }))}
                          />
                        )}
                        {(dispositivo.tipo?.useMac || dispositivo.tipo?.useIp) && (
                          <ITGrid container columns={2} spacing={2}>
                            {dispositivo.tipo?.useMac && (
                              <ITGrid item xs={dispositivo.tipo?.useIp ? 6 : 12}>
                                <ITInput
                                  name={`mac-${u.id}`}
                                  label={t("dispositivos.mac")}
                                  value={d.macAddress}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, macAddress: e.target.value } }))}
                                />
                              </ITGrid>
                            )}
                            {dispositivo.tipo?.useIp && (
                              <ITGrid item xs={dispositivo.tipo?.useMac ? 6 : 12}>
                                <ITInput
                                  name={`ip-${u.id}`}
                                  label={t("dispositivos.ip")}
                                  value={d.ip}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, ip: e.target.value } }))}
                                />
                              </ITGrid>
                            )}
                          </ITGrid>
                        )}
                        {dispositivo.tipo?.useEquipo && (
                          <ITInput
                            name={`equipo-${u.id}`}
                            label={t("dispositivos.nombreEquipo")}
                            value={d.nombreEquipo}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, nombreEquipo: e.target.value } }))}
                          />
                        )}
                        <ITFlex align="center" justify="end" gap={2}>
                          {savedUnitId === u.id && (
                            <ITFlex align="center" gap={1}>
                              <FaCheckCircle className="text-emerald-500" size={12} />
                              <ITText className="text-[10px] font-bold text-emerald-600">{t("dispositivos.unitUpdated")}</ITText>
                            </ITFlex>
                          )}
                          <ITButton variant={dirty ? "filled" : "outlined"} color="primary" size="lg" onClick={() => saveUnidad(u)} disabled={!dirty || savingThis}>
                            {savingThis ? t("new.saving") : t("common:actions.save")}
                          </ITButton>
                        </ITFlex>
                      </ITFlex>
                    )}
                  </ITFlex>
                );
              })}
              {unidades.length === 0 && <ITText className="py-8 text-center text-sm text-slate-400">{t("dispositivos.noUnits")}</ITText>}
            </div>
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />}
    </ITPage>
  );
}