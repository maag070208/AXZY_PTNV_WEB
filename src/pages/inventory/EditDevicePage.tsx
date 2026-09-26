import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITBadget, ITButton, ITFlex, ITGrid, ITInput, ITLoader, ITPage, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaCheckCircle, FaChevronDown, FaChevronRight, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type Device, type DeviceUnitStatus, type DeviceUnit } from "@entities/inventory";

const STATUS_COLOR: Record<DeviceUnitStatus, "success" | "warning" | "danger" | "gray"> = {
  AVAILABLE: "success",
  ON_LOAN: "warning",
  DAMAGED: "danger",
  IN_MAINTENANCE: "gray",
  RETIRED: "danger",
};

interface UnitDraft {
  serialNumber: string;
  macAddress: string;
  ip: string;
  hostname: string;
}

export default function EditDevicePage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [device, setDevice] = useState<Device | null>(null);
  const [units, setUnits] = useState<DeviceUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingUnitId, setSavingUnitId] = useState<string | null>(null);
  const [savedUnitId, setSavedUnitId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);
  const [drafts, setDrafts] = useState<Record<string, UnitDraft>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [allExpanded, setAllExpanded] = useState(false);

  const [form, setForm] = useState({
    name: "",
    brand: "",
    model: "",
    description: "",
    notes: "",
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([inventoryApi.getDevice(id), inventoryApi.units(id)])
      .then(([d, us]) => {
        setDevice(d);
        setUnits(us);
        setForm({
          name: d.name,
          brand: d.brand,
          model: d.model,
          description: d.description ?? "",
          notes: d.notes ?? "",
        });
        const draftsInit: Record<string, UnitDraft> = {};
        for (const u of us) {
          draftsInit[u.id] = {
            serialNumber: u.serialNumber ?? "",
            macAddress: u.macAddress ?? "",
            ip: u.ip ?? "",
            hostname: u.hostname ?? "",
          };
        }
        setDrafts(draftsInit);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const isValid = !!form.name.trim() && !!form.brand.trim() && !!form.model.trim();

  const handleSubmit = async () => {
    if (!id) return;
    setSaving(true);
    try {
      await inventoryApi.updateDevice(id, {
        name: form.name.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description || undefined,
        notes: form.notes || undefined,
      });
      setToast({ message: t("devices.savedEdit"), type: "success" });
      setTimeout(() => navigate(`/inventory/devices/${id}`), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  const isUnitDirty = (u: DeviceUnit) => {
    const d = drafts[u.id];
    if (!d) return false;
    return d.serialNumber !== (u.serialNumber ?? "") || d.macAddress !== (u.macAddress ?? "") || d.ip !== (u.ip ?? "") || d.hostname !== (u.hostname ?? "");
  };

  const saveUnit = async (u: DeviceUnit) => {
    const d = drafts[u.id];
    if (!d || !isUnitDirty(u)) return;
    const type = device?.type;
    setSavingUnitId(u.id);
    try {
      await inventoryApi.updateUnit(u.id, {
        ...(type?.useSerialNumber ? { serialNumber: d.serialNumber || undefined } : {}),
        ...(type?.useMac ? { macAddress: d.macAddress || undefined } : {}),
        ...(type?.useIp ? { ip: d.ip || undefined } : {}),
        ...(type?.useHostname ? { hostname: d.hostname || undefined } : {}),
      });
      setUnits((prev) => prev.map((x) => (x.id === u.id ? { ...x, serialNumber: d.serialNumber, macAddress: d.macAddress, ip: d.ip, hostname: d.hostname } : x)));
      setSavedUnitId(u.id);
      setTimeout(() => setSavedUnitId((prev) => (prev === u.id ? null : prev)), 2000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSavingUnitId(null);
    }
  };

  if (loading || !device) {
    return (
      <ITPage title={t("devices.edit")} loading backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={t("devices.edit")}
      description={device.name}
      icon={<FaBoxOpen size={20} />}
      backAction={() => navigate(`/inventory/devices/${device.id}`)}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("dashboard.title"), onClick: () => navigate("/inventory") },
        { label: t("devices.title"), onClick: () => navigate("/inventory/devices") },
        { label: device.name, onClick: () => navigate(`/inventory/devices/${device.id}`) },
        { label: t("devices.edit") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("devices.saveDevice")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        {/* Main form */}
        <ITGrid item xs={12} lg={8}>
          <ITFlex as="section" direction="column" gap={5} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <ITFlex direction="column" gap={1}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t("devices.type")}</ITText>
              <ITFlex align="center" gap={2} className="rounded-xl border border-slate-100 bg-slate-50 px-3 py-2">
                <FaBoxOpen className="text-slate-400" size={13} />
                <ITText className="text-sm font-semibold text-slate-700">{device.type?.name ?? ""}</ITText>
                {device.type?.assetTagPrefix && <ITText className="text-[10px] font-bold uppercase text-slate-400">{device.type.assetTagPrefix}</ITText>}
              </ITFlex>
            </ITFlex>

            <ITGrid container columns={12} spacing={5}>
              <ITGrid item xs={12}>
                <ITInput name="name" label={t("devices.name")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput name="brand" label={t("devices.brand")} value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12} md={6}>
                <ITInput name="model" label={t("devices.model")} value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput name="description" label={t("devices.descriptionField")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </ITGrid>
              <ITGrid item xs={12}>
                <ITInput name="notes" label={t("devices.notes")} value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
              </ITGrid>
            </ITGrid>

            <ITAlert variant="info" dismissible={false}>
              {t("devices.editHint")}
            </ITAlert>
          </ITFlex>
        </ITGrid>

        {/* Units sidebar */}
        <ITGrid item xs={12} lg={4}>
          <ITFlex as="section" direction="column" gap={3} className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITFlex align="center" justify="between" gap={2}>
              <ITFlex align="center" gap={2}>
                <ITText className="text-sm font-bold text-slate-800">{t("devices.unitSidebar")}</ITText>
                <ITBadget color="gray" size="lg">{units.length}</ITBadget>
              </ITFlex>
              {units.length > 0 && (
                <ITButton variant="text" color="primary" size="lg" onClick={() => {
                  const next = !allExpanded;
                  setAllExpanded(next);
                  const map: Record<string, boolean> = {};
                  for (const u of units) map[u.id] = next === true ? true : false;
                  setExpanded(map);
                }}>
                  <ITText className="text-[10px] font-bold uppercase">{allExpanded ? t("devices.collapseAll") : t("devices.expandAll")}</ITText>
                </ITButton>
              )}
            </ITFlex>
            <ITText className="text-[11px] text-slate-400">{t("devices.unitSidebarHint")}</ITText>

            <div className="flex max-h-[720px] flex-col gap-2 overflow-y-auto pr-1">
              {units.map((u) => {
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
                        <ITText className="truncate text-[11px] font-black uppercase tracking-tight text-emerald-700">{u.assetTag}</ITText>
                        {dirty && <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" title={t("devices.unsaved")} />}
                      </ITFlex>
                      <ITBadget color={STATUS_COLOR[u.status]} size="lg">{u.status}</ITBadget>
                    </button>

                    {isOpen && d && (
                      <ITFlex direction="column" gap={2} className="border-t border-slate-100 px-3 pb-3 pt-2.5">
                        {device.type?.useSerialNumber && (
                          <ITInput
                            name={`serialNumber-${u.id}`}
                            label={t("devices.serialNumber")}
                            value={d.serialNumber}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, serialNumber: e.target.value } }))}
                          />
                        )}
                        {(device.type?.useMac || device.type?.useIp) && (
                          <ITGrid container columns={2} spacing={2}>
                            {device.type?.useMac && (
                              <ITGrid item xs={device.type?.useIp ? 6 : 12}>
                                <ITInput
                                  name={`mac-${u.id}`}
                                  label={t("devices.mac")}
                                  value={d.macAddress}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, macAddress: e.target.value } }))}
                                />
                              </ITGrid>
                            )}
                            {device.type?.useIp && (
                              <ITGrid item xs={device.type?.useMac ? 6 : 12}>
                                <ITInput
                                  name={`ip-${u.id}`}
                                  label={t("devices.ip")}
                                  value={d.ip}
                                  onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, ip: e.target.value } }))}
                                />
                              </ITGrid>
                            )}
                          </ITGrid>
                        )}
                        {device.type?.useHostname && (
                          <ITInput
                            name={`hostname-${u.id}`}
                            label={t("devices.hostname")}
                            value={d.hostname}
                            onChange={(e) => setDrafts((prev) => ({ ...prev, [u.id]: { ...d, hostname: e.target.value } }))}
                          />
                        )}
                        <ITFlex align="center" justify="end" gap={2}>
                          {savedUnitId === u.id && (
                            <ITFlex align="center" gap={1}>
                              <FaCheckCircle className="text-emerald-500" size={12} />
                              <ITText className="text-[10px] font-bold text-emerald-600">{t("devices.unitUpdated")}</ITText>
                            </ITFlex>
                          )}
                          <ITButton variant={dirty ? "filled" : "outlined"} color="primary" size="lg" onClick={() => saveUnit(u)} disabled={!dirty || savingThis}>
                            {savingThis ? t("new.saving") : t("common:actions.save")}
                          </ITButton>
                        </ITFlex>
                      </ITFlex>
                    )}
                  </ITFlex>
                );
              })}
              {units.length === 0 && <ITText className="py-8 text-center text-sm text-slate-400">{t("devices.noUnits")}</ITText>}
            </div>
          </ITFlex>
        </ITGrid>
      </ITGrid>

      {toast && <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />}
    </ITPage>
  );
}