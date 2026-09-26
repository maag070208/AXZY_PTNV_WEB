import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITAlert, ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaCheck, FaChevronDown, FaChevronRight, FaInfoCircle, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventarioApi, type TipoDispositivo } from "@entities/inventario";

interface UnitRow {
  id: number;
  numeroSerie: string;
  macAddress: string;
  ip: string;
  nombreEquipo: string;
}

let rowId = 0;

function SectionHeader({
  icon,
  iconBg,
  title,
  hint,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  hint: string;
}) {
  return (
    <ITFlex align="center" gap={3} className="mb-5">
      <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl shadow-sm ${iconBg}`}>
        {icon}
      </ITFlex>
      <ITFlex direction="column" gap={0.25}>
        <ITText className="text-[12px] font-black uppercase tracking-widest text-slate-700">{title}</ITText>
        <ITText className="text-[10px] text-slate-400">{hint}</ITText>
      </ITFlex>
    </ITFlex>
  );
}

export default function DispositivoFormPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [tipos, setTipos] = useState<TipoDispositivo[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [form, setForm] = useState({
    tipoId: "",
    nombre: "",
    marca: "",
    modelo: "",
    descripcion: "",
  });
  const [cantidad, setCantidad] = useState("3");
  const [unidades, setUnidades] = useState<UnitRow[]>([]);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  useEffect(() => {
    inventarioApi
      .tipos()
      .then((ts) => setTipos(ts.filter((x) => x.active)))
      .finally(() => setLoading(false));
  }, []);

  const tipo = tipos.find((x) => x.id === form.tipoId);
  const anyUnitField = !tipo || tipo.useSerie || tipo.useMac || tipo.useIp || tipo.useEquipo;

  const syncCantidad = (n: number) => {
    const clamped = Math.max(1, Math.min(500, n || 1));
    setCantidad(String(clamped));
    setUnidades((prev) => {
      const next: UnitRow[] = [];
      for (let i = 0; i < clamped; i++) {
        next.push(prev[i] ?? { id: (rowId += 1), numeroSerie: "", macAddress: "", ip: "", nombreEquipo: "" });
      }
      return next;
    });
  };

  const updateUnidad = (id: number, field: keyof UnitRow, value: string) => {
    setUnidades((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const cambiarTipo = (v: string | number) => {
    const val = String(v);
    setForm((f) => ({ ...f, tipoId: val }));
    const nuevoTipo = tipos.find((x) => x.id === val);
    setUnidades((prev) => {
      if (prev.length === 0) {
        const rows: UnitRow[] = [];
        for (let i = 0; i < cantidadNum; i++) rows.push({ id: (rowId += 1), numeroSerie: "", macAddress: "", ip: "", nombreEquipo: "" });
        return rows;
      }
      return prev.map((u) => ({
        ...u,
        numeroSerie: nuevoTipo?.useSerie ? u.numeroSerie : "",
        macAddress: nuevoTipo?.useMac ? u.macAddress : "",
        ip: nuevoTipo?.useIp ? u.ip : "",
        nombreEquipo: nuevoTipo?.useEquipo ? u.nombreEquipo : "",
      }));
    });
  };

  const cantidadNum = Number(cantidad) || 1;
  const isValid = !!form.tipoId && !!form.nombre.trim() && !!form.marca.trim() && !!form.modelo.trim();

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await inventarioApi.crearDispositivo({
        tipoId: form.tipoId,
        nombre: form.nombre.trim(),
        marca: form.marca.trim(),
        modelo: form.modelo.trim(),
        descripcion: form.descripcion || undefined,
        unidades: unidades.map((u) => ({
          numeroSerie: u.numeroSerie || undefined,
          macAddress: u.macAddress || undefined,
          ip: u.ip || undefined,
          nombreEquipo: u.nombreEquipo || undefined,
        })),
      });
      setToast({ message: t("dispositivos.saved"), type: "success" });
      setTimeout(() => navigate("/inventario/dispositivos"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage title={t("dispositivos.new")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  const activeFields = [
    { key: "numeroSerie", label: t("dispositivos.numeroSerie"), active: tipo?.useSerie },
    { key: "macAddress", label: t("dispositivos.mac"), active: tipo?.useMac },
    { key: "ip", label: t("dispositivos.ip"), active: tipo?.useIp },
    { key: "nombreEquipo", label: t("dispositivos.nombreEquipo"), active: tipo?.useEquipo },
  ].filter((f) => f.active);

  const toggleAll = () => {
    const next = !allExpanded;
    setAllExpanded(next);
    const map: Record<number, boolean> = {};
    for (const u of unidades) map[u.id] = next;
    setExpanded(map);
  };

  return (
    <ITPage
      title={t("dispositivos.new")}
      description={t("dispositivos.formSub")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventario") }, { label: t("dispositivos.title"), onClick: () => navigate("/inventario/dispositivos") }, { label: t("dispositivos.new") }]}
      backAction={() => navigate("/inventario/dispositivos")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("dispositivos.save")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="space-y-6 min-w-0">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<FaBoxOpen size={15} className="text-blue-600" />}
              iconBg="bg-blue-50"
              title={t("dispositivos.new")}
              hint={t("dispositivos.formSub")}
            />
            <ITFlex direction="column" gap={4}>
              <ITSearchSelect
                name="tipo"
                label={t("dispositivos.tipo")}
                placeholder={t("dispositivos.tipoPlaceholder")}
                options={tipos.map((x) => ({ value: x.id, label: `${x.name} (${x.folioPrefix})` }))}
                value={form.tipoId}
                onChange={cambiarTipo}
              />
              <ITGrid container columns={12} spacing={4}>
                <ITGrid item xs={12}>
                  <ITInput
                    name="nombre"
                    label={t("dispositivos.nombre")}
                    value={form.nombre}
                    onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder={t("dispositivos.nombrePlaceholder")}
                    required
                  />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="marca" label={t("dispositivos.marca")} value={form.marca} onChange={(e) => setForm((f) => ({ ...f, marca: e.target.value }))} required />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="modelo" label={t("dispositivos.modelo")} value={form.modelo} onChange={(e) => setForm((f) => ({ ...f, modelo: e.target.value }))} required />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="descripcion" label={t("dispositivos.descripcion")} value={form.descripcion} onChange={(e) => setForm((f) => ({ ...f, descripcion: e.target.value }))} />
                </ITGrid>
              </ITGrid>
            </ITFlex>
          </section>

          <section className="rounded-[24px] p-6 text-[11px] leading-5 text-slate-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/60">
            <ITFlex align="center" gap={2}>
              <FaInfoCircle size={11} className="text-blue-700" />
              <ITText className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                {t("dispositivos.cantidadInicial")}
              </ITText>
              <ITText className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700">{unidades.length}</ITText>
            </ITFlex>
            <ul className="mt-3 space-y-2 font-bold text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {t("dispositivos.altaHint", { count: unidades.length })}
              </li>
              {activeFields.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {t("dispositivos.unitsHintTipo", { tipo: tipo?.name ?? "" })}
                </li>
              )}
            </ul>
          </section>
        </div>

        <aside className="space-y-6 lg:sticky lg:top-5">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
            <SectionHeader
              icon={<FaBoxes size={15} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              title={t("dispositivos.unitsSection")}
              hint={t("dispositivos.unitSidebarHint")}
            />
            <ITFlex align="center" gap={2} className="mb-4">
              <ITInput
                name="cantidad"
                label={t("dispositivos.cantidadInicial")}
                type="number"
                min={1}
                max={500}
                value={cantidad}
                onChange={(e) => syncCantidad(Number(e.target.value))}
                className="flex-1"
              />
              {unidades.length > 0 && (
                <ITButton variant="text" color="primary" size="lg" onClick={toggleAll} className="mt-5">
                  <ITText className="text-[10px] font-bold uppercase">{allExpanded ? t("dispositivos.collapseAll") : t("dispositivos.expandAll")}</ITText>
                </ITButton>
              )}
            </ITFlex>

            {!tipo ? (
              <ITAlert variant="info" dismissible={false}>
                {t("dispositivos.unitsSelectTipo")}
              </ITAlert>
            ) : !anyUnitField ? (
              <ITAlert variant="info" dismissible={false}>
                {t("dispositivos.unitsNoCampos", { tipo: tipo.name })}
              </ITAlert>
            ) : (
              <div className="flex flex-col gap-2">
                {unidades.map((u) => {
                  const isOpen = !!expanded[u.id];
                  const filled = u.numeroSerie || u.macAddress || u.ip || u.nombreEquipo;
                  return (
                    <ITFlex key={u.id} direction="column" className="rounded-xl border border-slate-100 bg-slate-50/60">
                      <button
                        type="button"
                        onClick={() => {
                          setExpanded((prev) => ({ ...prev, [u.id]: !prev[u.id] }));
                          setAllExpanded(false);
                        }}
                        className="flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-slate-100"
                      >
                        <ITFlex align="center" gap={2} className="min-w-0">
                          {isOpen ? <FaChevronDown className="shrink-0 text-slate-400" size={11} /> : <FaChevronRight className="shrink-0 text-slate-400" size={11} />}
                          <ITText className="truncate text-[11px] font-bold uppercase tracking-tight text-slate-700">
                            {t("dispositivos.unitRow")} {unidades.indexOf(u) + 1}
                          </ITText>
                          {filled && <FaCheck className="shrink-0 text-emerald-500" size={11} />}
                        </ITFlex>
                        <ITBadget color="gray" size="lg">{u.numeroSerie || "—"}</ITBadget>
                      </button>
                      {isOpen && (
                        <ITFlex direction="column" gap={2} className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                          {tipo.useSerie && (
                            <ITInput
                              name={`serie-${u.id}`}
                              label={t("dispositivos.numeroSerie")}
                              value={u.numeroSerie}
                              onChange={(e) => updateUnidad(u.id, "numeroSerie", e.target.value)}
                            />
                          )}
                          {(tipo.useMac || tipo.useIp) && (
                            <ITGrid container columns={2} spacing={2}>
                              {tipo.useMac && (
                                <ITGrid item xs={tipo.useIp ? 6 : 12}>
                                  <ITInput
                                    name={`mac-${u.id}`}
                                    label={t("dispositivos.mac")}
                                    value={u.macAddress}
                                    onChange={(e) => updateUnidad(u.id, "macAddress", e.target.value)}
                                  />
                                </ITGrid>
                              )}
                              {tipo.useIp && (
                                <ITGrid item xs={tipo.useMac ? 6 : 12}>
                                  <ITInput
                                    name={`ip-${u.id}`}
                                    label={t("dispositivos.ip")}
                                    value={u.ip}
                                    onChange={(e) => updateUnidad(u.id, "ip", e.target.value)}
                                  />
                                </ITGrid>
                              )}
                            </ITGrid>
                          )}
                          {tipo.useEquipo && (
                            <ITInput
                              name={`equipo-${u.id}`}
                              label={t("dispositivos.nombreEquipo")}
                              value={u.nombreEquipo}
                              onChange={(e) => updateUnidad(u.id, "nombreEquipo", e.target.value)}
                            />
                          )}
                        </ITFlex>
                      )}
                    </ITFlex>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}