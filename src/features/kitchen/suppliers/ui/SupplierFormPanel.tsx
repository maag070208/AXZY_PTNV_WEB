import type { ReactNode } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITChip,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaAddressBook, FaBoxOpen, FaBuilding, FaHandshake, FaMapMarkerAlt, FaPlus, FaSave, FaTrash } from "react-icons/fa";
import { PanelCard } from "@shared/ui/panel-card";
import { fmtQty, numOrNull, numText } from "@entities/kitchen";
import { useSupplierForm } from "../model/useSupplierForm";

/** Puestos sugeridos (el campo es libre). */
const POSITIONS = ["manager", "sales", "delivery", "billing", "invoicing", "owner"] as const;

function Section({ title, hint, right, children }: { icon?: ReactNode; title: string; hint: string; right?: ReactNode; children: ReactNode }) {
  return (
    <PanelCard title={title} description={hint} actions={right}>{children}</PanelCard>
  );
}

/** Alta y edición de proveedor: datos, ubicación, condiciones, contactos y artículos que surte. */
export default function SupplierFormPanel({ id }: { id?: string }) {
  const fx = useSupplierForm(id);
  const { t, fields } = fx;

  if (fx.loading) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const input = (key: keyof typeof fields, md: number, extra: { type?: "text" | "email"; placeholder?: string } = {}) => (
    <ITGrid item xs={12} md={md}>
      <ITInput
        name={`supplier-${key}`}
        type={extra.type ?? "text"}
        label={t(`suppliers.fields.${key}`)}
        placeholder={extra.placeholder}
        value={fields[key]}
        onChange={(e) => fx.setField(key, e.target.value)}
      />
    </ITGrid>
  );

  return (
    <ITFlex direction="column" gap={4}>
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <Section icon={<FaBuilding size={13} />} title={t("suppliers.sections.general")} hint={t("suppliers.sections.generalHint")}>
        <ITGrid container columns={12} spacing={3}>
          {input("name", 6)}
          {input("legalName", 6)}
          {input("rfc", 4, { placeholder: t("suppliers.hints.rfc") })}
          {input("phone", 4)}
          {input("email", 4, { type: "email" })}
          {input("website", 6)}
          {id && (
            <ITGrid item xs={12} md={6}>
              <div className="pt-7">
                <ITCheckbox name="supplierActive" label={t("suppliers.active")} checked={fx.active} onChange={(v) => fx.setActive(v)} />
              </div>
            </ITGrid>
          )}
        </ITGrid>
      </Section>

      <Section icon={<FaMapMarkerAlt size={13} />} title={t("suppliers.sections.location")} hint={t("suppliers.sections.locationHint")}>
        <ITGrid container columns={12} spacing={3}>
          {input("street", 6)}
          {input("neighborhood", 3)}
          {input("postalCode", 3)}
          {input("city", 4)}
          {input("state", 4)}
          {input("mapsUrl", 4)}
          {input("locationNotes", 12)}
        </ITGrid>
      </Section>

      <Section icon={<FaHandshake size={13} />} title={t("suppliers.sections.terms")} hint={t("suppliers.sections.termsHint")}>
        <ITGrid container columns={12} spacing={3}>
          {(["paymentTermsDays", "leadTimeDays"] as const).map((key) => (
            <ITGrid key={key} item xs={6} md={3}>
              <ITInputNumber
                name={`supplier-${key}`}
                decimals={0}
                min={0}
                label={t(`suppliers.fields.${key}`)}
                placeholder={key === "paymentTermsDays" ? t("suppliers.hints.paymentTerms") : undefined}
                value={numOrNull(fields[key])}
                onChange={(v) => fx.setField(key, numText(v))}
              />
            </ITGrid>
          ))}
          {input("notes", 6)}
        </ITGrid>
      </Section>

      <Section
        icon={<FaAddressBook size={13} />}
        title={t("suppliers.sections.contacts")}
        hint={t("suppliers.sections.contactsHint")}
        right={<ITButton variant="outlined" color="primary" size="sm" icon={<FaPlus size={10} />} label={t("suppliers.actions.addContact")} onClick={fx.addContact} />}
      >
        <ITFlex direction="column" gap={4}>
          {fx.contacts.length === 0 && <ITText className="text-[11px] text-slate-400">{t("suppliers.hints.noContacts")}</ITText>}
          {fx.contacts.map((c) => (
            <div key={c.key} className="rounded-xl border border-slate-200 p-3">
              <ITGrid container columns={12} spacing={3} className="items-end">
                <ITGrid item xs={12} md={3}>
                  <ITInput name={`contactName-${c.key}`} label={t("suppliers.fields.contactName")} value={c.name} onChange={(e) => fx.patchContact(c.key, { name: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={12} md={3}>
                  <ITInput name={`contactPosition-${c.key}`} label={t("suppliers.fields.position")} value={c.position} onChange={(e) => fx.patchContact(c.key, { position: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInput name={`contactPhone-${c.key}`} label={t("suppliers.fields.phone")} value={c.phone} onChange={(e) => fx.patchContact(c.key, { phone: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITInput name={`contactEmail-${c.key}`} type="email" label={t("suppliers.fields.email")} value={c.email} onChange={(e) => fx.patchContact(c.key, { email: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={12} md={1}>
                  <ITFlex justify="end" className="pb-1">
                    <ITButton variant="icon-only" color="error" size="sm" ariaLabel={t("common.remove")} onClick={() => fx.removeContact(c.key)}>
                      <FaTrash size={12} />
                    </ITButton>
                  </ITFlex>
                </ITGrid>
              </ITGrid>
              <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="mt-2">
                <ITFlex wrap="wrap" gap={1}>
                  {!c.position.trim() &&
                    POSITIONS.map((p) => (
                      <ITChip key={p} size="sm" variant="outlined" color="gray" label={t(`suppliers.positions.${p}`)} onClick={() => fx.patchContact(c.key, { position: t(`suppliers.positions.${p}`) })} />
                    ))}
                </ITFlex>
                <ITCheckbox name={`contactPrimary-${c.key}`} label={t("suppliers.fields.primary")} checked={c.isPrimary} onChange={(v) => v && fx.patchContact(c.key, { isPrimary: true })} />
              </ITFlex>
            </div>
          ))}
        </ITFlex>
      </Section>

      <Section
        icon={<FaBoxOpen size={13} />}
        title={t("suppliers.sections.items")}
        hint={t("suppliers.sections.itemsHint")}
        right={<ITButton variant="outlined" color="primary" size="sm" icon={<FaPlus size={10} />} label={t("suppliers.actions.addItem")} onClick={fx.addItem} />}
      >
        <ITFlex direction="column" gap={3}>
          {fx.supplied.length === 0 && <ITText className="text-[11px] text-slate-400">{t("suppliers.hints.noItems")}</ITText>}
          {fx.supplied.map((s) => {
            const item = fx.itemById.get(s.itemId);
            const factor = Number(s.factor);
            return (
              <ITGrid key={s.key} container columns={12} spacing={3} className="items-end border-b border-slate-100 pb-3">
                <ITGrid item xs={12} md={4}>
                  <ITSearchSelect
                    name={`supplierItem-${s.key}`}
                    label={t("suppliers.fields.item")}
                    options={fx.items.map((i) => ({ value: i.id, label: `${i.code} · ${i.name}` }))}
                    value={s.itemId}
                    onChange={(value) => fx.patchItem(s.key, { itemId: String(value) })}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInput name={`supplierItemUnit-${s.key}`} label={t("suppliers.fields.purchaseUnit")} placeholder="Caja" value={s.purchaseUnit} onChange={(e) => fx.patchItem(s.key, { purchaseUnit: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInputNumber decimals={2}
                    name={`supplierItemFactor-${s.key}`}
                    label={item ? `${t("suppliers.fields.factor")} (${item.unit.code})` : t("suppliers.fields.factor")}
                    value={numOrNull(s.factor)}
                    onChange={(v) => fx.patchItem(s.key, { factor: numText(v) })}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={2}>
                  <ITInput name={`supplierItemCode-${s.key}`} label={t("suppliers.fields.supplierCode")} value={s.supplierCode} onChange={(e) => fx.patchItem(s.key, { supplierCode: e.target.value })} />
                </ITGrid>
                <ITGrid item xs={5} md={1}>
                  <ITInputNumber decimals={2} prefix="$" name={`supplierItemCost-${s.key}`} label={t("suppliers.fields.lastUnitCost")} value={numOrNull(s.lastUnitCost)} onChange={(v) => fx.patchItem(s.key, { lastUnitCost: numText(v) })} />
                </ITGrid>
                <ITGrid item xs={1} md={1}>
                  <ITFlex justify="end" className="pb-1">
                    <ITButton variant="icon-only" color="error" size="sm" ariaLabel={t("common.remove")} onClick={() => fx.removeItem(s.key)}>
                      <FaTrash size={12} />
                    </ITButton>
                  </ITFlex>
                </ITGrid>
                {item && s.purchaseUnit.trim() && factor > 0 && (
                  <ITGrid item xs={12}>
                    <ITText className="text-[11px] font-bold text-emerald-700">
                      {t("suppliers.hints.factor", { unit: s.purchaseUnit.trim(), factor: fmtQty(factor), base: item.unit.name })}
                    </ITText>
                  </ITGrid>
                )}
              </ITGrid>
            );
          })}
        </ITFlex>
      </Section>

      <ITFlex align="center" justify="end" gap={2}>
        <ITButton variant="outlined" color="secondary" label={t("suppliers.actions.cancel")} onClick={fx.cancel} />
        <ITButton variant="filled" color="primary" icon={<FaSave size={12} />} label={t("suppliers.actions.save")} disabled={fx.saving} onClick={() => void fx.save()} />
      </ITFlex>

      {fx.toast && <ITToast message={fx.toast} type="success" onClose={() => fx.setToast(null)} />}
    </ITFlex>
  );
}
