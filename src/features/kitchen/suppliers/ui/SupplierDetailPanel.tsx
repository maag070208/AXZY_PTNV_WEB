import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ITAlert, ITBadget, ITButton, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaAddressBook, FaBoxOpen, FaBuilding, FaEdit, FaEnvelope, FaFileInvoice, FaMapMarkerAlt, FaPhone, FaShoppingCart, FaStar } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { PanelCard } from "@shared/ui/panel-card";
import { dyn } from "@shared/i18n/dyn";
import { fmtQty, kitchenApi, purchaseOrderStatusColor, type SupplierDetail } from "@entities/kitchen";
import { useCan } from "@entities/user";

const money = (n: number) => `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;

function Card({ title, children, right }: { icon?: ReactNode; title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <PanelCard title={title} actions={right}>{children}</PanelCard>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <ITFlex justify="between" gap={3} className="border-b border-slate-50 py-1.5">
      <ITText className="text-[11px] text-slate-500">{label}</ITText>
      <div className="text-right text-[12px] font-bold text-slate-800">{value || "—"}</div>
    </ITFlex>
  );
}

/** Detalle del proveedor: datos, ubicación, contactos, artículos que surte y su historial de compras. */
export default function SupplierDetailPanel({ id }: { id?: string }) {
  const { t } = useTranslation("kitchen");
  const navigate = useNavigate();
  const canManage = useCan("kitchen.manage");
  const [supplier, setSupplier] = useState<SupplierDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    kitchenApi.supplier(id).then(setSupplier).catch((e: Error) => setError(e.message));
  }, [id]);

  if (error) return <ITAlert variant="error">{error}</ITAlert>;
  if (!supplier) {
    return (
      <ITFlex justify="center" className="py-16">
        <ITText className="text-[12px] text-slate-400">{t("common.loading")}</ITText>
      </ITFlex>
    );
  }

  const s = supplier;
  const days = (n: number | null) => (n == null ? null : n === 0 ? t("suppliers.hints.cash") : t("suppliers.hints.days", { count: n }));
  const address = [s.street, s.neighborhood, s.postalCode ? `CP ${s.postalCode}` : null, s.city, s.state].filter(Boolean).join(", ");

  return (
    <ITFlex direction="column" gap={4}>
      <ITFlex align="center" justify="between" wrap="wrap" gap={2}>
        <ITFlex direction="column" gap={0}>
          <ITFlex align="center" gap={2}>
            <ITText className="text-[16px] font-black text-slate-800">{s.name}</ITText>
            <ITBadget color={s.active ? "success" : "gray"} size="sm">
              {s.active ? t("suppliers.active") : t("suppliers.inactive")}
            </ITBadget>
          </ITFlex>
          <ITText className="text-[11px] text-slate-500">{[s.legalName, s.rfc].filter(Boolean).join(" · ")}</ITText>
        </ITFlex>
        {canManage && (
          <ITButton variant="outlined" color="primary" icon={<FaEdit size={12} />} label={t("suppliers.actions.edit")} onClick={() => navigate(`/kitchen/suppliers/${s.id}/edit`)} />
        )}
      </ITFlex>

      <div className="grid gap-4 lg:!grid-cols-2">
        <Card icon={<FaBuilding size={13} />} title={t("suppliers.sections.general")}>
          <Row label={t("suppliers.fields.legalName")} value={s.legalName} />
          <Row label={t("suppliers.fields.rfc")} value={s.rfc && <span className="font-mono">{s.rfc}</span>} />
          <Row label={t("suppliers.fields.phone")} value={s.phone && <a className="text-sky-700 underline" href={`tel:${s.phone}`}>{s.phone}</a>} />
          <Row label={t("suppliers.fields.email")} value={s.email && <a className="text-sky-700 underline" href={`mailto:${s.email}`}>{s.email}</a>} />
          <Row label={t("suppliers.fields.website")} value={s.website && <a className="text-sky-700 underline" href={s.website} target="_blank" rel="noreferrer">{s.website}</a>} />
          <Row label={t("suppliers.fields.paymentTermsDays")} value={days(s.paymentTermsDays)} />
          <Row label={t("suppliers.fields.leadTimeDays")} value={days(s.leadTimeDays)} />
          {s.notes && <ITText className="mt-2 whitespace-pre-line text-[11px] text-slate-500">{s.notes}</ITText>}
        </Card>

        <Card
          icon={<FaMapMarkerAlt size={13} />}
          title={t("suppliers.sections.location")}
          right={s.mapsUrl ? <ITButton variant="text" color="primary" size="sm" label={t("suppliers.actions.map")} onClick={() => window.open(s.mapsUrl!, "_blank", "noopener")} /> : undefined}
        >
          <ITText className="text-[12px] font-bold text-slate-800">{address || "—"}</ITText>
          {s.locationNotes && <ITText className="mt-2 text-[11px] text-slate-500">{s.locationNotes}</ITText>}
        </Card>
      </div>

      <Card icon={<FaAddressBook size={13} />} title={t("suppliers.sections.contacts")}>
        {s.contacts.length === 0 ? (
          <ITText className="text-[11px] text-slate-400">{t("suppliers.hints.noContacts")}</ITText>
        ) : (
          <div className="grid gap-3 md:!grid-cols-2 xl:!grid-cols-3">
            {s.contacts.map((c) => (
              <div key={c.id} className={`rounded-xl border p-3 ${c.isPrimary ? "border-amber-200 bg-amber-50/40" : "border-slate-200"}`}>
                <ITFlex align="center" gap={2}>
                  {c.isPrimary && <FaStar size={11} className="text-amber-500" />}
                  <ITText className="text-[12px] font-bold text-slate-800">{c.name}</ITText>
                </ITFlex>
                {c.position && <ITText className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{c.position}</ITText>}
                <ITFlex direction="column" gap={1} className="mt-2">
                  {c.phone && (
                    <a className="flex items-center gap-2 text-[11px] text-sky-700" href={`tel:${c.phone}`}>
                      <FaPhone size={10} /> {c.phone}
                    </a>
                  )}
                  {c.email && (
                    <a className="flex items-center gap-2 text-[11px] text-sky-700" href={`mailto:${c.email}`}>
                      <FaEnvelope size={10} /> {c.email}
                    </a>
                  )}
                  {c.notes && <ITText className="text-[10px] text-slate-500">{c.notes}</ITText>}
                </ITFlex>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card icon={<FaBoxOpen size={13} />} title={t("suppliers.sections.items")}>
        {s.items.length === 0 ? (
          <ITText className="text-[11px] text-slate-400">{t("suppliers.hints.noItems")}</ITText>
        ) : (
          <ITFlex direction="column" gap={0}>
            {s.items.map((i) => (
              <ITFlex key={i.id} align="center" justify="between" gap={3} className="border-b border-slate-50 py-2">
                <ITFlex direction="column" gap={0}>
                  <ITText className="text-[12px] font-bold text-slate-800">
                    {i.item.name} <span className="font-mono text-[10px] text-slate-400">{i.item.code}</span>
                  </ITText>
                  <ITText className="text-[11px] text-emerald-700">
                    {t("suppliers.hints.factor", { unit: i.purchaseUnit, factor: fmtQty(i.factor), base: i.item.unit.name })}
                    {i.supplierCode ? ` · ${i.supplierCode}` : ""}
                  </ITText>
                </ITFlex>
                <ITFlex direction="column" gap={0} className="text-right">
                  <ITText className="text-[12px] font-bold text-slate-800">{i.lastUnitCost == null ? "—" : money(i.lastUnitCost)}</ITText>
                  {i.lastPurchasedAt && (
                    <ITText className="text-[10px] text-slate-400">{t("suppliers.hints.lastBought", { date: i.lastPurchasedAt.slice(0, 10) })}</ITText>
                  )}
                </ITFlex>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </Card>

      <div className="grid gap-4 lg:!grid-cols-2">
        <Card icon={<FaShoppingCart size={13} />} title={t("suppliers.sections.orders")}>
          {s.purchaseOrders.length === 0 && <ITText className="text-[11px] text-slate-400">—</ITText>}
          {s.purchaseOrders.map((o) => (
            <ITFlex key={o.id} align="center" justify="between" className="cursor-pointer border-b border-slate-50 py-1.5" onClick={() => navigate(`/kitchen/purchase-orders/${o.id}`)}>
              <ITText className="font-mono text-[12px] font-bold text-slate-700">{o.number}</ITText>
              <ITFlex align="center" gap={2}>
                <ITText className="text-[10px] text-slate-400">{o.createdAt.slice(0, 10)}</ITText>
                <ITBadget size="sm" color={purchaseOrderStatusColor(o.status)}>
                  {dyn(t)(`purchaseOrders.status.${o.status}`)}
                </ITBadget>
              </ITFlex>
            </ITFlex>
          ))}
        </Card>
        <Card icon={<FaFileInvoice size={13} />} title={t("suppliers.sections.invoices")}>
          {s.invoices.length === 0 && <ITText className="text-[11px] text-slate-400">—</ITText>}
          {s.invoices.map((inv) => (
            <ITFlex key={inv.id} align="center" justify="between" className="cursor-pointer border-b border-slate-50 py-1.5" onClick={() => navigate(`/kitchen/invoices/${inv.id}`)}>
              <ITText className="font-mono text-[12px] font-bold text-slate-700">{inv.number}</ITText>
              <ITFlex align="center" gap={2}>
                <ITText className="text-[10px] text-slate-400">{inv.date}</ITText>
                <ITText className="text-[12px] font-bold text-slate-700">{money(inv.total)}</ITText>
              </ITFlex>
            </ITFlex>
          ))}
        </Card>
      </div>
    </ITFlex>
  );
}
