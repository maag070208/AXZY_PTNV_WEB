import { LottieLoader } from "@shared/ui/lottie-loader";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInput, ITPage, ITSearchSelect, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { FaBoxOpen, FaBoxes, FaInfoCircle, FaSave } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { inventoryApi, type DeviceType } from "@entities/inventory";
import {
  UnitIdentityEditor,
  resizeUnitRows,
  usesUnitIdentity,
  type UnitIdentityRow,
} from "@features/inventory/unit-identities";

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

export default function DeviceFormPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [form, setForm] = useState({
    typeId: "",
    name: "",
    brand: "",
    model: "",
    description: "",
  });
  const [quantity, setQuantity] = useState("3");
  const [units, setUnits] = useState<UnitIdentityRow[]>([]);

  useEffect(() => {
    inventoryApi
      .types()
      .then((ts) => setTypes(ts.filter((x) => x.active)))
      .finally(() => setLoading(false));
  }, []);

  const type = types.find((x) => x.id === form.typeId);
  const anyUnitField = !type || usesUnitIdentity(type);

  const syncQuantity = (n: number) => {
    const clamped = Math.max(1, Math.min(500, n || 1));
    setQuantity(String(clamped));
    setUnits((prev) => resizeUnitRows(prev, clamped));
  };

  const updateUnit = (id: number, field: keyof UnitIdentityRow, value: string) => {
    setUnits((prev) => prev.map((u) => (u.id === id ? { ...u, [field]: value } : u)));
  };

  const changeType = (v: string | number) => {
    const val = String(v);
    setForm((f) => ({ ...f, typeId: val }));
    const newType = types.find((x) => x.id === val);
    setUnits((prev) => {
      if (prev.length === 0) return resizeUnitRows([], quantityNum);
      return prev.map((u) => ({
        ...u,
        serialNumber: newType?.useSerialNumber ? u.serialNumber : "",
        macAddress: newType?.useMac ? u.macAddress : "",
        ip: newType?.useIp ? u.ip : "",
        hostname: newType?.useHostname ? u.hostname : "",
      }));
    });
  };

  const quantityNum = Number(quantity) || 1;
  const isValid = !!form.typeId && !!form.name.trim() && !!form.brand.trim() && !!form.model.trim();

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await inventoryApi.createDevice({
        typeId: form.typeId,
        name: form.name.trim(),
        brand: form.brand.trim(),
        model: form.model.trim(),
        description: form.description || undefined,
        units: units.map((u) => ({
          serialNumber: u.serialNumber || undefined,
          macAddress: u.macAddress || undefined,
          ip: u.ip || undefined,
          hostname: u.hostname || undefined,
        })),
      });
      setToast({ message: t("devices.saved"), type: "success" });
      setTimeout(() => navigate("/inventory/devices"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage
        noPadding title={t("devices.new")} backAction={() => navigate(-1)}>
        <ITFlex justify="center" align="center" className="py-20">
          <LottieLoader size="lg" />
        </ITFlex>
      </ITPage>
    );
  }

  const activeFields = [
    { key: "serialNumber", label: t("devices.serialNumber"), active: type?.useSerialNumber },
    { key: "macAddress", label: t("devices.mac"), active: type?.useMac },
    { key: "ip", label: t("devices.ip"), active: type?.useIp },
    { key: "hostname", label: t("devices.hostname"), active: type?.useHostname },
  ].filter((f) => f.active);

  return (
    <ITPage
      noPadding
      title={t("devices.new")}
      description={t("devices.formSub")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title"), onClick: () => navigate("/inventory/devices") }, { label: t("devices.new") }]}
      backAction={() => navigate("/inventory/devices")}
      actions={
        <ITButton variant="filled" color="primary" onClick={handleSubmit} disabled={saving || !isValid}>
          <ITFlex align="center" gap={1}>
            <FaSave size={12} />
            <ITText className="font-bold text-[11px]">{saving ? t("new.saving") : t("devices.save")}</ITText>
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
              title={t("devices.new")}
              hint={t("devices.formSub")}
            />
            <ITFlex direction="column" gap={4}>
              <ITSearchSelect
                name="type"
                label={t("devices.type")}
                placeholder={t("devices.typePlaceholder")}
                options={types.map((x) => ({ value: x.id, label: `${x.name} (${x.assetTagPrefix})` }))}
                value={form.typeId}
                onChange={changeType}
              />
              <ITGrid container columns={12} spacing={4}>
                <ITGrid item xs={12}>
                  <ITInput
                    name="name"
                    label={t("devices.name")}
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder={t("devices.namePlaceholder")}
                    required
                  />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="brand" label={t("devices.brand")} value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} required />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="model" label={t("devices.model")} value={form.model} onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))} required />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="description" label={t("devices.descriptionField")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </ITGrid>
              </ITGrid>
            </ITFlex>
          </section>

          <section className="rounded-[24px] p-6 text-[11px] leading-5 text-slate-600 bg-gradient-to-br from-blue-50/80 to-indigo-50/60">
            <ITFlex align="center" gap={2}>
              <FaInfoCircle size={11} className="text-blue-700" />
              <ITText className="text-[10px] font-black uppercase tracking-widest text-blue-800">
                {t("devices.initialQuantity")}
              </ITText>
              <ITText className="ml-auto rounded-full bg-blue-100 px-2 py-0.5 text-[9px] font-black text-blue-700">{units.length}</ITText>
            </ITFlex>
            <ul className="mt-3 space-y-2 font-bold text-slate-600">
              <li className="flex items-start gap-2">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                {t("devices.registrationHint", { count: units.length })}
              </li>
              {activeFields.length > 0 && (
                <li className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-500" />
                  {t("devices.unitsHintType", { type: type?.name ?? "" })}
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
              title={t("devices.unitsSection")}
              hint={t("devices.unitSidebarHint")}
            />
            <ITFlex align="center" gap={2} className="mb-4">
              <ITInput
                name="quantity"
                label={t("devices.initialQuantity")}
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => syncQuantity(Number(e.target.value))}
                className="flex-1"
              />
            </ITFlex>

            {!type ? (
              <ITAlert variant="info" dismissible={false}>
                {t("devices.unitsSelectType")}
              </ITAlert>
            ) : !anyUnitField ? (
              <ITAlert variant="info" dismissible={false}>
                {t("devices.unitsNoFields", { type: type.name })}
              </ITAlert>
            ) : (
              <UnitIdentityEditor
                type={type}
                units={units}
                onChange={updateUnit}
                label={(index) => `${t("devices.unitRow")} ${index + 1}`}
              />
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