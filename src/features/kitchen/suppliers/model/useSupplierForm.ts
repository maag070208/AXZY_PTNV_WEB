import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { kitchenApi, useKitchenItemOptions, type SupplierFields, type SupplierInput } from "@entities/kitchen";

/** Renglones en edición (las cantidades y días se capturan como texto). */
export interface ContactDraft {
  key: number;
  name: string;
  position: string;
  phone: string;
  email: string;
  isPrimary: boolean;
  notes: string;
}

export interface ItemDraft {
  key: number;
  itemId: string;
  supplierCode: string;
  purchaseUnit: string;
  factor: string;
  lastUnitCost: string;
}

type TextFields = Record<keyof SupplierFields, string>;

const EMPTY: TextFields = {
  name: "",
  legalName: "",
  rfc: "",
  phone: "",
  email: "",
  website: "",
  street: "",
  neighborhood: "",
  postalCode: "",
  city: "",
  state: "",
  locationNotes: "",
  mapsUrl: "",
  paymentTermsDays: "",
  leadTimeDays: "",
  notes: "",
};

const RFC = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const orNull = (v: string) => (v.trim() === "" ? null : v.trim());
const intOrNull = (v: string) => (v.trim() === "" ? null : Math.max(0, Math.trunc(Number(v))));

/** Alta y edición de un proveedor con sus contactos y los artículos que surte. */
export const useSupplierForm = (id?: string) => {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const items = useKitchenItemOptions(true);
  const itemById = useMemo(() => new Map(items.data.map((i) => [i.id, i])), [items.data]);

  const [fields, setFields] = useState<TextFields>(EMPTY);
  const [active, setActive] = useState(true);
  const [contacts, setContacts] = useState<ContactDraft[]>([]);
  const [supplied, setSupplied] = useState<ItemDraft[]>([]);
  const [nextKey, setNextKey] = useState(1);
  const [loading, setLoading] = useState(Boolean(id));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    kitchenApi
      .supplier(id)
      .then((s) => {
        const text = { ...EMPTY };
        for (const key of Object.keys(EMPTY) as Array<keyof SupplierFields>) {
          const value = s[key];
          text[key] = value == null ? "" : String(value);
        }
        setFields(text);
        setActive(s.active);
        let key = 1;
        setContacts(
          s.contacts.map((c) => ({
            key: key++,
            name: c.name,
            position: c.position ?? "",
            phone: c.phone ?? "",
            email: c.email ?? "",
            isPrimary: c.isPrimary,
            notes: c.notes ?? "",
          }))
        );
        setSupplied(
          s.items.map((i) => ({
            key: key++,
            itemId: i.item.id,
            supplierCode: i.supplierCode ?? "",
            purchaseUnit: i.purchaseUnit,
            factor: String(i.factor),
            lastUnitCost: i.lastUnitCost == null ? "" : String(i.lastUnitCost),
          }))
        );
        setNextKey(key);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const takeKey = () => {
    const key = nextKey;
    setNextKey((k) => k + 1);
    return key;
  };

  const setField = (key: keyof SupplierFields, value: string) => setFields((f) => ({ ...f, [key]: value }));

  const addContact = () =>
    setContacts((c) => [
      ...c,
      { key: takeKey(), name: "", position: "", phone: "", email: "", isPrimary: c.length === 0, notes: "" },
    ]);
  const patchContact = (key: number, patch: Partial<ContactDraft>) =>
    setContacts((c) =>
      c.map((row) => {
        // Marcar uno como principal desmarca a los demás.
        if (patch.isPrimary && row.key !== key) return { ...row, isPrimary: false };
        return row.key === key ? { ...row, ...patch } : row;
      })
    );
  const removeContact = (key: number) =>
    setContacts((c) => {
      const rest = c.filter((row) => row.key !== key);
      if (rest.length > 0 && !rest.some((row) => row.isPrimary)) rest[0] = { ...rest[0], isPrimary: true };
      return rest;
    });

  const addItem = () =>
    setSupplied((s) => [...s, { key: takeKey(), itemId: "", supplierCode: "", purchaseUnit: "", factor: "1", lastUnitCost: "" }]);
  const patchItem = (key: number, patch: Partial<ItemDraft>) =>
    setSupplied((s) => s.map((row) => (row.key === key ? { ...row, ...patch } : row)));
  const removeItem = (key: number) => setSupplied((s) => s.filter((row) => row.key !== key));

  /** Primer error de validación (el API vuelve a validar todo). */
  const validate = (): string | null => {
    if (!fields.name.trim()) return t("suppliers.validation.name");
    const rfc = fields.rfc.replace(/\s+/g, "").toUpperCase();
    if (rfc && !RFC.test(rfc)) return t("suppliers.validation.rfc");
    if (fields.postalCode.trim() && !/^\d{5}$/.test(fields.postalCode.trim())) return t("suppliers.validation.postalCode");
    if (fields.email.trim() && !EMAIL.test(fields.email.trim())) return t("suppliers.validation.email");
    if (contacts.some((c) => !c.name.trim())) return t("suppliers.validation.contact");
    if (contacts.some((c) => c.email.trim() && !EMAIL.test(c.email.trim()))) return t("suppliers.validation.email");
    const withItem = supplied.filter((s) => s.itemId);
    if (withItem.some((s) => !s.purchaseUnit.trim() || !(Number(s.factor) > 0))) return t("suppliers.validation.item");
    if (new Set(withItem.map((s) => s.itemId)).size !== withItem.length) return t("suppliers.validation.duplicateItem");
    return null;
  };

  const save = async () => {
    const problem = validate();
    if (problem) {
      setError(problem);
      return;
    }
    const input: SupplierInput = {
      name: fields.name.trim(),
      legalName: orNull(fields.legalName),
      rfc: orNull(fields.rfc.replace(/\s+/g, "").toUpperCase()),
      phone: orNull(fields.phone),
      email: orNull(fields.email),
      website: orNull(fields.website),
      street: orNull(fields.street),
      neighborhood: orNull(fields.neighborhood),
      postalCode: orNull(fields.postalCode),
      city: orNull(fields.city),
      state: orNull(fields.state),
      locationNotes: orNull(fields.locationNotes),
      mapsUrl: orNull(fields.mapsUrl),
      paymentTermsDays: intOrNull(fields.paymentTermsDays),
      leadTimeDays: intOrNull(fields.leadTimeDays),
      notes: orNull(fields.notes),
      contacts: contacts.map((c) => ({
        name: c.name.trim(),
        position: orNull(c.position),
        phone: orNull(c.phone),
        email: orNull(c.email),
        isPrimary: c.isPrimary,
        notes: orNull(c.notes),
      })),
      items: supplied
        .filter((s) => s.itemId)
        .map((s) => ({
          itemId: s.itemId,
          supplierCode: orNull(s.supplierCode),
          purchaseUnit: s.purchaseUnit.trim(),
          factor: Number(s.factor),
          lastUnitCost: s.lastUnitCost.trim() === "" ? null : Number(s.lastUnitCost),
        })),
      ...(id ? { active } : {}),
    };
    setSaving(true);
    setError(null);
    try {
      const saved = id ? await kitchenApi.updateSupplier(id, input) : await kitchenApi.createSupplier(input);
      setToast(t(id ? "suppliers.saved" : "suppliers.created"));
      setTimeout(() => navigate(`/kitchen/suppliers/${saved.id}`), 500);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return {
    t,
    fields,
    setField,
    active,
    setActive,
    contacts,
    addContact,
    patchContact,
    removeContact,
    supplied,
    addItem,
    patchItem,
    removeItem,
    items: items.data,
    itemById,
    loading,
    saving,
    error,
    setError,
    toast,
    setToast,
    save,
    cancel: () => navigate(id ? `/kitchen/suppliers/${id}` : "/kitchen/suppliers"),
  };
};

export type UseSupplierForm = ReturnType<typeof useSupplierForm>;
