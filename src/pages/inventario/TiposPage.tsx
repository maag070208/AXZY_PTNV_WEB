import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITGrid, ITInput, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaTag } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventarioApi, type TipoDispositivo } from "@entities/inventario";

export default function TiposPage() {
  const { t } = useTranslation(["inventario", "common"]);
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<TipoDispositivo | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [prefix, setPrefix] = useState("");
  const [active, setActive] = useState(true);
  const [useSerie, setUseSerie] = useState(true);
  const [useMac, setUseMac] = useState(false);
  const [useIp, setUseIp] = useState(false);
  const [useEquipo, setUseEquipo] = useState(false);

  const fetchData = useMemo(() => makeClientTableFetch<TipoDispositivo>(() => inventarioApi.tipos()), []);

  const abrirNuevo = () => {
    setEditando(null);
    setName("");
    setCode("");
    setPrefix("");
    setActive(true);
    setUseSerie(true);
    setUseMac(false);
    setUseIp(false);
    setUseEquipo(false);
    setShowForm((v) => !v);
  };

  const abrirEdicion = (tp: TipoDispositivo) => {
    setEditando(tp);
    setName(tp.name);
    setCode(tp.code);
    setPrefix(tp.folioPrefix);
    setActive(tp.active);
    setUseSerie(tp.useSerie);
    setUseMac(tp.useMac);
    setUseIp(tp.useIp);
    setUseEquipo(tp.useEquipo);
    setShowForm(true);
  };

  const cerrar = () => {
    setShowForm(false);
    setEditando(null);
  };

  const save = async () => {
    if (!name.trim() || !prefix.trim()) return;
    if (editando) {
      await inventarioApi.actualizarTipo(editando.id, { name: name.trim(), folioPrefix: prefix.trim(), active, useSerie, useMac, useIp, useEquipo });
    } else {
      if (!code.trim()) return;
      await inventarioApi.crearTipo({ name: name.trim(), code: code.trim(), folioPrefix: prefix.trim(), useSerie, useMac, useIp, useEquipo });
    }
    cerrar();
    setReloadKey((k) => k + 1);
  };

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: t("tipos.name"),
      filter: true,
      sortable: false,
      render: (tp: TipoDispositivo) => <ITText className="text-[11px] font-bold text-slate-800">{tp.name}</ITText>,
    },
    { type: "string", key: "code", label: t("tipos.code"), sortable: false, render: (tp: TipoDispositivo) => <ITText className="text-[11px] text-slate-500">{tp.code}</ITText> },
    { type: "string", key: "folioPrefix", label: t("tipos.prefix"), sortable: false, render: (tp: TipoDispositivo) => <ITBadget color="gray" size="lg">{tp.folioPrefix}</ITBadget> },
    {
      type: "boolean",
      key: "active",
      label: t("tipos.estado"),
      sortable: false,
      render: (tp: TipoDispositivo) => (tp.active ? <ITBadget color="success" size="lg">{t("tipos.activo")}</ITBadget> : <ITBadget color="danger" size="lg">{t("tipos.inactivo")}</ITBadget>),
    },
    {
      type: "string",
      key: "accion",
      label: "",
      render: (tp: TipoDispositivo) => (
        <ITButton variant="outlined" color="primary" size="lg" onClick={() => abrirEdicion(tp)}>
          <FaEdit size={12} />
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage
      title={t("tipos.title")}
      description={t("tipos.description")}
      icon={<FaTag size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title"), onClick: () => navigate("/inventario") },
        { label: t("tipos.title") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={abrirNuevo}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("tipos.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {showForm && (
        <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <ITText className="text-sm font-bold text-slate-800">{editando ? t("tipos.edit") : t("tipos.new")}</ITText>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="name" label={t("tipos.name")} value={name} onChange={(e) => setName(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="code" label={t("tipos.code")} value={code} onChange={(e) => setCode(e.target.value)} disabled={!!editando} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="prefix" label={t("tipos.prefix")} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="TAB" />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                {t("tipos.activo")}
              </label>
            </ITGrid>
            <ITGrid item xs={12}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("tipos.campos")}</ITText>
              <ITFlex wrap="wrap" gap={4} className="mt-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useSerie} onChange={(e) => setUseSerie(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  <FaTag size={11} className="text-slate-400" /> {t("dispositivos.numeroSerie")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useMac} onChange={(e) => setUseMac(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("dispositivos.mac")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useIp} onChange={(e) => setUseIp(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("dispositivos.ip")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useEquipo} onChange={(e) => setUseEquipo(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("dispositivos.nombreEquipo")}
                </label>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITFlex align="end" gap={2} className="h-full">
                <ITButton variant="outlined" color="secondary" onClick={cerrar} className="mt-1">
                  <ITText className="font-bold text-[11px]">{t("common:actions.cancel")}</ITText>
                </ITButton>
                <ITButton variant="filled" color="primary" onClick={save} className="mt-1">
                  <ITText className="font-bold text-[11px]">{t("common:actions.save")}</ITText>
                </ITButton>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </ITFlex>
      )}

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