import { useEffect, useMemo, useRef, useState } from "react";
import { ITAlert, ITBadget, ITButton, ITDataTable, ITDialog, ITFlex, ITGrid, ITInput, ITText } from "@axzydev/axzy_ui_system";
import { FaEdit, FaTag } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type DeviceType } from "@entities/inventory";

export default function DeviceTypesTab({ openCreateSignal }: { openCreateSignal?: number }) {
  const { t } = useTranslation(["inventory", "common"]);
  const [reloadKey, setReloadKey] = useState(0);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DeviceType | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [prefix, setPrefix] = useState("");
  const [active, setActive] = useState(true);
  const [useSerialNumber, setUseSerialNumber] = useState(true);
  const [useMac, setUseMac] = useState(false);
  const [useIp, setUseIp] = useState(false);
  const [useHostname, setUseHostname] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useMemo(() => makeClientTableFetch<DeviceType>(() => inventoryApi.types()), []);

  const lastSignal = useRef(openCreateSignal);
  useEffect(() => {
    if (openCreateSignal === lastSignal.current) return;
    lastSignal.current = openCreateSignal;
    setEditing(null);
    setName("");
    setCode("");
    setPrefix("");
    setActive(true);
    setUseSerialNumber(true);
    setUseMac(false);
    setUseIp(false);
    setUseHostname(false);
    setShowForm(true);
  }, [openCreateSignal]);

  const openEdit = (tp: DeviceType) => {
    setEditing(tp);
    setName(tp.name);
    setCode(tp.code);
    setPrefix(tp.assetTagPrefix);
    setActive(tp.active);
    setUseSerialNumber(tp.useSerialNumber);
    setUseMac(tp.useMac);
    setUseIp(tp.useIp);
    setUseHostname(tp.useHostname);
    setShowForm(true);
  };

  const close = () => {
    setShowForm(false);
    setEditing(null);
  };

  const save = async () => {
    if (!name.trim() || !prefix.trim()) return;
    setError(null);
    try {
      if (editing) {
        await inventoryApi.updateType(editing.id, { name: name.trim(), assetTagPrefix: prefix.trim(), active, useSerialNumber, useMac, useIp, useHostname });
      } else {
        if (!code.trim()) return;
        await inventoryApi.createType({ name: name.trim(), code: code.trim(), assetTagPrefix: prefix.trim(), useSerialNumber, useMac, useIp, useHostname });
      }
      close();
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      setError(e.message ?? t("types.saveError"));
    }
  };

  const columns: any[] = [
    {
      type: "string",
      key: "name",
      label: t("types.name"),
      filter: true,
      sortable: false,
      render: (tp: DeviceType) => <ITText className="text-[11px] font-bold text-slate-800">{tp.name}</ITText>,
    },
    { type: "string", key: "code", label: t("types.code"), sortable: false, render: (tp: DeviceType) => <ITText className="text-[11px] text-slate-500">{tp.code}</ITText> },
    { type: "string", key: "assetTagPrefix", label: t("types.prefix"), sortable: false, render: (tp: DeviceType) => <ITBadget color="gray" size="lg">{tp.assetTagPrefix}</ITBadget> },
    {
      type: "boolean",
      key: "active",
      label: t("types.status"),
      sortable: false,
      render: (tp: DeviceType) => (tp.active ? <ITBadget color="success" size="lg">{t("types.active")}</ITBadget> : <ITBadget color="danger" size="lg">{t("types.inactive")}</ITBadget>),
    },
    {
      type: "string",
      key: "action",
      label: "",
      render: (tp: DeviceType) => (
        <ITButton variant="outlined" color="primary" size="lg" onClick={() => openEdit(tp)}>
          <FaEdit size={12} />
        </ITButton>
      ),
    },
  ];

  return (
    <>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITDialog
        isOpen={showForm}
        onClose={close}
        title={editing ? t("types.edit") : t("types.new")}
        useFormHeader
      >
        <div>
          <ITGrid container columns={12} spacing={4}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="name" label={t("types.name")} value={name} onChange={(e) => setName(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="code" label={t("types.code")} value={code} onChange={(e) => setCode(e.target.value)} disabled={!!editing} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInput name="prefix" label={t("types.prefix")} value={prefix} onChange={(e) => setPrefix(e.target.value)} placeholder="TAB" />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <label className="mt-6 flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                {t("types.active")}
              </label>
            </ITGrid>
            <ITGrid item xs={12}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("types.fields")}</ITText>
              <ITFlex wrap="wrap" gap={4} className="mt-2">
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useSerialNumber} onChange={(e) => setUseSerialNumber(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  <FaTag size={11} className="text-slate-400" /> {t("devices.serialNumber")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useMac} onChange={(e) => setUseMac(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("devices.mac")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useIp} onChange={(e) => setUseIp(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("devices.ip")}
                </label>
                <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={useHostname} onChange={(e) => setUseHostname(e.target.checked)} className="h-4 w-4 accent-emerald-600" />
                  {t("devices.hostname")}
                </label>
              </ITFlex>
            </ITGrid>
            <ITGrid item xs={12}>
              <ITFlex justify="end" gap={2}>
                <ITButton variant="outlined" color="secondary" onClick={close}>
                  <ITText className="font-bold text-[11px]">{t("common:actions.cancel")}</ITText>
                </ITButton>
                <ITButton variant="filled" color="primary" onClick={save}>
                  <ITText className="font-bold text-[11px]">{t("common:actions.save")}</ITText>
                </ITButton>
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </div>
      </ITDialog>

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[5, 10, 50]}
        size="lg"
      />
    </>
  );
}