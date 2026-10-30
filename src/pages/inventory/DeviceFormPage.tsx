import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITButton,
  ITFlex,
  ITGrid,
  ITInput,
  ITPage,
  ITSearchSelect,
  ITToast, ITText } from "@axzydev/axzy_ui_system";
import { FaBoxOpen } from "react-icons/fa";
import { LuBox, LuLayers } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { inventoryApi, type DeviceType } from "@entities/inventory";
import {
  UnitIdentityEditor,
  resizeUnitRows,
  usesUnitIdentity,
  type UnitIdentityRow,
} from "@features/inventory/unit-identities";
import { useGoBack } from "@shared/lib/useGoBack";
import { FormSection } from "@shared/ui/form-section";
import { LiveSummary, LiveSummaryRow } from "@shared/ui/live-summary";
import { StickyActions } from "@shared/ui/sticky-actions";
import { LangostinGuide, LangostinState, type LangostinGuideStatus } from "@shared/ui/langostin";

export default function DeviceFormPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [types, setTypes] = useState<DeviceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  const [form, setForm] = useState({
    typeId: "",
    name: "",
    brand: "",
    model: "",
    code: "",
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
        code: form.code.trim() || undefined,
        description: form.description || undefined,
        units: units.map((u) => ({
          serialNumber: u.serialNumber || undefined,
          macAddress: u.macAddress || undefined,
          ip: u.ip || undefined,
          hostname: u.hostname || undefined,
        })),
      });
      setToast({ message: t("devices.saved"), type: "success" });
      setTimeout(() => goBack("/inventory/devices"), 1000);
    } catch (e: any) {
      setToast({ message: e.message || t("messages.errorRegistering"), type: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
        noPadding title={t("devices.new")} backAction={() => goBack("/inventory/devices")}>
        <LangostinState kind="loading" />
      </ITPage>
    );
  }

  const identified = units.filter((u) => u.serialNumber || u.macAddress || u.ip || u.hostname).length;
  const pieceSectionDone = !!type && quantityNum >= 1;
  const sectionsDone = (isValid ? 1 : 0) + (pieceSectionDone ? 1 : 0);

  // Pistas de Langostín por campo (clave = atributo `name` del input).
  const hints: Record<string, string> = {
    type: t("devices.hints.type"),
    name: t("devices.hints.name"),
    brand: t("devices.hints.brand"),
    model: t("devices.hints.model"),
    code: t("devices.hints.code"),
    description: t("devices.hints.description"),
    quantity: t("devices.hints.quantity"),
  };
  const guideStatus: LangostinGuideStatus = saving
    ? "saving"
    : toast?.type === "success"
      ? "saved"
      : toast?.type === "error"
        ? "error"
        : "idle";

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("devices.new")}
      description={t("devices.formSub")}
      icon={<FaBoxOpen size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("devices.title"), onClick: () => navigate("/inventory/devices") }, { label: t("devices.new") }]}
      backAction={() => goBack("/inventory/devices")}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
          <FormSection
            number={1}
            icon={<LuBox size={16} />}
            title={t("devices.sectionData")}
            description={t("devices.sectionDataHint")}
            complete={isValid}
          >
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
                  <ITInput name="code" label={t("devices.barcode")} value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
                </ITGrid>
                <ITGrid item xs={12} md={4}>
                  <ITInput name="description" label={t("devices.descriptionField")} value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </ITGrid>
              </ITGrid>
            </ITFlex>
          </FormSection>

          <FormSection
            number={2}
            icon={<LuLayers size={16} />}
            title={t("devices.unitsSection")}
            description={t("devices.sectionPiecesHint")}
            complete={pieceSectionDone}
          >
            <ITFlex direction="column" gap={4}>
              <ITInput
                name="quantity"
                label={t("devices.initialQuantity")}
                type="number"
                min={1}
                max={500}
                value={quantity}
                onChange={(e) => syncQuantity(Number(e.target.value))}
              />
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
            </ITFlex>
          </FormSection>
        </div>

        {/* Resumen vivo: lo capturado hasta ahora, en lenguaje humano */}
        <LiveSummary
          title={t("devices.summaryTitle")}
          total={2}
          done={sectionsDone}
          footer={<ITText className="m-0 text-[12px] text-slate-500">{t("devices.registrationHint", { count: units.length })}</ITText>}
        >
          <LiveSummaryRow label={t("devices.type")} value={type ? `${type.name} (${type.assetTagPrefix})` : undefined} />
          <LiveSummaryRow label={t("devices.name")} value={form.name.trim() || undefined} />
          <LiveSummaryRow label={`${t("devices.brand")} / ${t("devices.model")}`} value={[form.brand.trim(), form.model.trim()].filter(Boolean).join(" · ") || undefined} />
          <LiveSummaryRow label={t("devices.summaryPieces")} value={units.length || quantityNum} />
          {type && anyUnitField && (
            <LiveSummaryRow label={t("devices.summaryIdentified")} value={t("devices.summaryIdentifiedValue", { done: identified, total: units.length })} />
          )}
        </LiveSummary>
      </div>

      <StickyActions>
        <ITButton label={t("common:actions.cancel")} variant="outlined" color="gray" size="sm" className="!rounded-full" onClick={() => goBack("/inventory/devices")} disabled={saving} />
        <ITButton
          label={saving ? t("new.saving") : t("devices.save")}
          variant="rounded"
          color="primary"
          size="sm"
          onClick={handleSubmit}
          disabled={saving || !isValid}
        />
      </StickyActions>

      <LangostinGuide storageKey="inventory-device-new" hints={hints} status={guideStatus} />

      {toast && (
        <ITToast message={toast.message} type={toast.type} position="bottom-center" duration={2500} onClose={() => setToast(null)} />
      )}
    </ITPage>
  );
}
