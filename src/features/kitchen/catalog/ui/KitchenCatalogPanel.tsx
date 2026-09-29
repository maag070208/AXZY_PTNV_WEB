import { useCallback, useEffect, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITCheckbox,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { kitchenApi, type KitchenCategory, type KitchenUnit, type KitchenUnitInput, type Supplier } from "@entities/kitchen";

type Tab = "categories" | "suppliers" | "units";
interface SupplierForm {
  name: string;
  rfc: string;
  contact: string;
  phone: string;
  email: string;
}

const emptySupplier = (): SupplierForm => ({ name: "", rfc: "", contact: "", phone: "", email: "" });
const emptyUnit = (): KitchenUnitInput => ({ code: "", name: "", whole: false });

/** Catálogos propios de cocina: categorías y proveedores (los administra el chef). */
export default function KitchenCatalogPanel() {
  const { t } = useTranslation("kitchen");
  const [tab, setTab] = useState<Tab>("categories");
  const [categories, setCategories] = useState<KitchenCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<KitchenUnit[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const [catDialog, setCatDialog] = useState<{ open: boolean; item: KitchenCategory | null; name: string }>({
    open: false,
    item: null,
    name: "",
  });
  const [supDialog, setSupDialog] = useState<{ open: boolean; item: Supplier | null; form: SupplierForm }>({
    open: false,
    item: null,
    form: emptySupplier(),
  });
  const [unitDialog, setUnitDialog] = useState<{ open: boolean; item: KitchenUnit | null; form: KitchenUnitInput }>({
    open: false,
    item: null,
    form: emptyUnit(),
  });
  const [saving, setSaving] = useState(false);

  const reload = useCallback(async () => {
    try {
      const [c, s, u] = await Promise.all([
        kitchenApi.categories(true),
        kitchenApi.suppliers(true),
        kitchenApi.units(true),
      ]);
      setCategories(c);
      setSuppliers(s);
      setUnits(u);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const saveCategory = async () => {
    setSaving(true);
    try {
      if (catDialog.item) await kitchenApi.updateCategory(catDialog.item.id, { name: catDialog.name });
      else await kitchenApi.createCategory({ name: catDialog.name });
      setCatDialog({ open: false, item: null, name: "" });
      await reload();
      setToast(t("catalog.saved"));
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleCategory = async (c: KitchenCategory) => {
    try {
      await kitchenApi.updateCategory(c.id, { active: !c.active });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveSupplier = async () => {
    const f = supDialog.form;
    const payload = {
      name: f.name,
      rfc: f.rfc || null,
      contact: f.contact || null,
      phone: f.phone || null,
      email: f.email || null,
    };
    setSaving(true);
    try {
      if (supDialog.item) await kitchenApi.updateSupplier(supDialog.item.id, payload);
      else await kitchenApi.createSupplier(payload);
      setSupDialog({ open: false, item: null, form: emptySupplier() });
      await reload();
      setToast(t("catalog.saved"));
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleSupplier = async (s: Supplier) => {
    try {
      await kitchenApi.updateSupplier(s.id, { active: !s.active });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveUnit = async () => {
    const f = unitDialog.form;
    setSaving(true);
    try {
      if (unitDialog.item) await kitchenApi.updateUnit(unitDialog.item.id, f);
      else await kitchenApi.createUnit(f);
      setUnitDialog({ open: false, item: null, form: emptyUnit() });
      await reload();
      setToast(t("catalog.saved"));
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const toggleUnit = async (u: KitchenUnit) => {
    try {
      await kitchenApi.updateUnit(u.id, { active: !u.active });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const openNew = () => {
    if (tab === "categories") setCatDialog({ open: true, item: null, name: "" });
    else if (tab === "suppliers") setSupDialog({ open: true, item: null, form: emptySupplier() });
    else setUnitDialog({ open: true, item: null, form: emptyUnit() });
  };

  const newLabel =
    tab === "categories" ? t("catalog.newCategory") : tab === "suppliers" ? t("catalog.newSupplier") : t("catalog.newUnit");

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={3}>
        <ITSearchSelect
          name="kitchenCatalogKind"
          label={t("catalog.title")}
          options={[
            { value: "categories", label: t("catalog.categories") },
            { value: "units", label: t("catalog.units") },
            { value: "suppliers", label: t("catalog.suppliers") },
          ]}
          value={tab}
          onChange={(v) => setTab(String(v) as Tab)}
          className="min-w-[260px]"
        />
        <ITButton variant="filled" color="primary" onClick={openNew}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{newLabel}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {tab === "categories" ? (
        <ITCard className="!p-5 border border-slate-200">
          <ITFlex direction="column" gap={2}>
            {categories.map((c) => (
              <ITFlex key={c.id} align="center" justify="between" gap={2} className="border-b border-slate-50 pb-2">
                <ITText className="text-[12px] font-bold text-slate-700">{c.name}</ITText>
                <ITFlex align="center" gap={2}>
                  <ITBadget color={c.active ? "success" : "gray"} size="sm">
                    {c.active ? t("catalog.active") : t("catalog.inactive")}
                  </ITBadget>
                  <ITButton variant="text" size="sm" color="primary" onClick={() => setCatDialog({ open: true, item: c, name: c.name })}>
                    <FaEdit size={12} />
                  </ITButton>
                  <ITButton variant="text" size="sm" color={c.active ? "error" : "success"} onClick={() => void toggleCategory(c)}>
                    <ITText className="text-[11px] font-bold">{c.active ? t("common.deactivate") : t("common.reactivate")}</ITText>
                  </ITButton>
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        </ITCard>
      ) : tab === "units" ? (
        <ITCard className="!p-5 border border-slate-200">
          <ITFlex direction="column" gap={2}>
            {units.map((u) => (
              <ITFlex key={u.id} align="center" justify="between" gap={2} className="border-b border-slate-50 pb-2">
                <ITFlex align="center" gap={2}>
                  <ITText className="text-[12px] font-bold text-slate-700">{u.name}</ITText>
                  <ITText className="text-[10px] font-mono uppercase text-slate-400">{u.code}</ITText>
                </ITFlex>
                <ITFlex align="center" gap={2}>
                  {u.whole && (
                    <ITBadget color="info" size="sm">
                      {t("catalog.whole")}
                    </ITBadget>
                  )}
                  <ITBadget color={u.active ? "success" : "gray"} size="sm">
                    {u.active ? t("catalog.active") : t("catalog.inactive")}
                  </ITBadget>
                  <ITButton
                    variant="text"
                    size="sm"
                    color="primary"
                    onClick={() => setUnitDialog({ open: true, item: u, form: { code: u.code, name: u.name, whole: u.whole } })}
                  >
                    <FaEdit size={12} />
                  </ITButton>
                  <ITButton variant="text" size="sm" color={u.active ? "error" : "success"} onClick={() => void toggleUnit(u)}>
                    <ITText className="text-[11px] font-bold">{u.active ? t("common.deactivate") : t("common.reactivate")}</ITText>
                  </ITButton>
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        </ITCard>
      ) : (
        <ITCard className="!p-5 border border-slate-200">
          <ITFlex direction="column" gap={2}>
            {suppliers.map((s) => (
              <ITFlex key={s.id} align="center" justify="between" gap={2} className="border-b border-slate-50 pb-2">
                <ITFlex direction="column" gap={0}>
                  <ITText className="text-[12px] font-bold text-slate-700">{s.name}</ITText>
                  <ITText className="text-[10px] text-slate-400">
                    {[s.rfc, s.contact, s.phone, s.email].filter(Boolean).join(" · ") || "—"}
                  </ITText>
                </ITFlex>
                <ITFlex align="center" gap={2}>
                  <ITBadget color={s.active ? "success" : "gray"} size="sm">
                    {s.active ? t("catalog.active") : t("catalog.inactive")}
                  </ITBadget>
                  <ITButton
                    variant="text"
                    size="sm"
                    color="primary"
                    onClick={() =>
                      setSupDialog({
                        open: true,
                        item: s,
                        form: {
                          name: s.name,
                          rfc: s.rfc ?? "",
                          contact: s.contact ?? "",
                          phone: s.phone ?? "",
                          email: s.email ?? "",
                        },
                      })
                    }
                  >
                    <FaEdit size={12} />
                  </ITButton>
                  <ITButton variant="text" size="sm" color={s.active ? "error" : "success"} onClick={() => void toggleSupplier(s)}>
                    <ITText className="text-[11px] font-bold">{s.active ? t("common.deactivate") : t("common.reactivate")}</ITText>
                  </ITButton>
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        </ITCard>
      )}

      <ITDialog isOpen={catDialog.open} onClose={() => setCatDialog({ open: false, item: null, name: "" })} title={catDialog.item ? catDialog.item.name : t("catalog.newCategory")}>
        <ITFlex direction="column" gap={3}>
          <ITInput name="kitchenCategoryName" label={t("catalog.name")} value={catDialog.name} onChange={(e) => setCatDialog((d) => ({ ...d, name: e.target.value }))} />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setCatDialog({ open: false, item: null, name: "" })}>
              {t("catalog.cancel")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={saving} onClick={() => void saveCategory()}>
              <ITText className="font-bold text-[11px]">{t("catalog.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog isOpen={supDialog.open} onClose={() => setSupDialog({ open: false, item: null, form: emptySupplier() })} title={supDialog.item ? supDialog.item.name : t("catalog.newSupplier")}>
        <ITFlex direction="column" gap={3}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={8}>
              <ITInput name="supplierName" label={t("catalog.name")} value={supDialog.form.name} onChange={(e) => setSupDialog((d) => ({ ...d, form: { ...d.form, name: e.target.value } }))} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="supplierRfc" label={t("catalog.rfc")} value={supDialog.form.rfc} onChange={(e) => setSupDialog((d) => ({ ...d, form: { ...d.form, rfc: e.target.value } }))} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="supplierContact" label={t("catalog.contact")} value={supDialog.form.contact} onChange={(e) => setSupDialog((d) => ({ ...d, form: { ...d.form, contact: e.target.value } }))} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="supplierPhone" label={t("catalog.phone")} value={supDialog.form.phone} onChange={(e) => setSupDialog((d) => ({ ...d, form: { ...d.form, phone: e.target.value } }))} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="supplierEmail" label={t("catalog.email")} value={supDialog.form.email} onChange={(e) => setSupDialog((d) => ({ ...d, form: { ...d.form, email: e.target.value } }))} />
            </ITGrid>
            {supDialog.item && (
              <ITGrid item xs={12}>
                <ITCheckbox
                  name="supplierActive"
                  label={t("catalog.active")}
                  checked={supDialog.item.active}
                  onChange={(v) => setSupDialog((d) => (d.item ? { ...d, item: { ...d.item, active: v } } : d))}
                />
              </ITGrid>
            )}
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setSupDialog({ open: false, item: null, form: emptySupplier() })}>
              {t("catalog.cancel")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={saving} onClick={() => void saveSupplier()}>
              <ITText className="font-bold text-[11px]">{t("catalog.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={unitDialog.open}
        onClose={() => setUnitDialog({ open: false, item: null, form: emptyUnit() })}
        title={unitDialog.item ? unitDialog.item.name : t("catalog.newUnit")}
      >
        <ITFlex direction="column" gap={3}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="kitchenUnitCode"
                label={t("catalog.code")}
                value={unitDialog.form.code}
                onChange={(e) => setUnitDialog((d) => ({ ...d, form: { ...d.form, code: e.target.value } }))}
              />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITInput
                name="kitchenUnitName"
                label={t("catalog.name")}
                value={unitDialog.form.name}
                onChange={(e) => setUnitDialog((d) => ({ ...d, form: { ...d.form, name: e.target.value } }))}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITCheckbox
                name="kitchenUnitWhole"
                label={t("catalog.whole")}
                checked={unitDialog.form.whole}
                onChange={(v) => setUnitDialog((d) => ({ ...d, form: { ...d.form, whole: v } }))}
              />
            </ITGrid>
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setUnitDialog({ open: false, item: null, form: emptyUnit() })}>
              {t("catalog.cancel")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={saving} onClick={() => void saveUnit()}>
              <ITText className="font-bold text-[11px]">{t("catalog.save")}</ITText>
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </ITFlex>
  );
}
