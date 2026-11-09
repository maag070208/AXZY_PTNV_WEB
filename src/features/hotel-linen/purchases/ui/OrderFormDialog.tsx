import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITDatePicker,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  hotelLinenApi,
  purchaseApi,
  type HotelProduct,
  type HotelWarehouse,
  type PurchaseLookups,
  type PurchaseOrderDetail,
} from "@entities/hotel-linen";
import { newId } from "@shared/lib/newId";
import { dateStrToLocal, localToDateStr, money } from "../lib";

interface LineDraft {
  id: string;
  productId: string;
  quantity: number | null;
  unitCost: number | null;
  taxRateId: string;
}

const emptyLine = (taxRateId: string): LineDraft => ({ id: newId(), productId: "", quantity: null, unitCost: null, taxRateId });

interface Props {
  open: boolean;
  lookups: PurchaseLookups;
  /** Borrador a editar; `null` = OC nueva. */
  order: PurchaseOrderDetail | null;
  onClose: () => void;
  onDone: (id: string) => void;
}

/** Nueva OC (o edición de un borrador): proveedor, renglones producto/cantidad/costo/IVA y totales. */
export default function OrderFormDialog({ open, lookups, order, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-purchase");
  const defaultTax = useMemo(() => lookups.taxRates.find((r) => Math.abs(r.rate - 0.16) < 1e-9)?.id ?? lookups.taxRates[0]?.id ?? "", [lookups]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [warehouseId, setWarehouseId] = useState("");
  const [expected, setExpected] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.all([hotelLinenApi.products(), hotelLinenApi.warehouses()])
      .then(([p, w]) => {
        if (!active) return;
        setProducts(p);
        setWarehouses(w.filter((x) => x.kind === "CENTRAL" || x.kind === "NEW_LINEN"));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setSupplierId(order?.supplier?.id ?? "");
    setWarehouseId(order?.warehouse?.id ?? "");
    setExpected(order?.expectedDate ?? "");
    setNotes(order?.notes ?? "");
    setLines(
      order
        ? order.lines.map((l) => ({ id: newId(), productId: l.product.id, quantity: l.quantity, unitCost: l.unitCost, taxRateId: l.taxRateId ?? "" }))
        : [emptyLine(defaultTax)]
    );
  }, [open, order, defaultTax]);

  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}${p.size ? ` · ${p.size}` : ""}` }));
  const rateOf = (id: string) => lookups.taxRates.find((r) => r.id === id)?.rate ?? 0;

  const patch = (id: string, change: Partial<LineDraft>) => setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...change } : l)));
  const pickProduct = (id: string, productId: string) => {
    const product = products.find((p) => p.id === productId);
    patch(id, { productId, unitCost: product?.lastCost != null ? Number(product.lastCost) : null });
  };

  const totals = lines.reduce(
    (acc, l) => {
      const sub = (l.quantity ?? 0) * (l.unitCost ?? 0);
      return { subtotal: acc.subtotal + sub, tax: acc.tax + sub * rateOf(l.taxRateId) };
    },
    { subtotal: 0, tax: 0 }
  );

  const valid = lines.length > 0 && lines.every((l) => l.productId && (l.quantity ?? 0) > 0) && new Set(lines.map((l) => l.productId)).size === lines.length;

  const save = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        supplierId: supplierId || null,
        warehouseId: warehouseId || null,
        expectedDate: expected || null,
        notes: notes.trim() || null,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity as number, unitCost: l.unitCost ?? 0, taxRateId: l.taxRateId || null })),
      };
      const saved = order ? await purchaseApi.updateOrder(order.id, body) : await purchaseApi.createOrder(body);
      onDone(saved.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={open} onClose={onClose} title={order ? t("form.editTitle", { folio: order.folio }) : t("form.title")}>
      <ITFlex direction="column" gap={3} className="min-w-[860px]">
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={5}>
            <ITSelect
              name="poSupplier"
              label={t("form.supplier")}
              options={[{ value: "", label: t("form.noSupplier") }, ...lookups.suppliers.map((s) => ({ value: s.id, label: s.name }))]}
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="poWarehouse"
              label={t("form.warehouse")}
              options={[{ value: "", label: t("form.defaultWarehouse") }, ...warehouses.map((w) => ({ value: w.id, label: w.name }))]}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITDatePicker
              name="poExpected"
              label={t("form.expected")}
              value={dateStrToLocal(expected)}
              onChange={(e) => {
                const v = e.target.value;
                setExpected(v instanceof Date ? localToDateStr(v) : "");
              }}
            />
          </ITGrid>
        </ITGrid>

        {lines.map((line, index) => (
          <ITGrid key={line.id} container columns={12} spacing={3} className="items-end">
            <ITGrid item xs={12} md={5}>
              <ITSearchSelect
                name={`poProduct${index}`}
                label={t("form.product")}
                options={productOptions}
                value={line.productId}
                onChange={(v) => pickProduct(line.id, String(v))}
              />
            </ITGrid>
            <ITGrid item xs={4} md={2}>
              <ITInputNumber
                name={`poQty${index}`}
                label={t("form.quantity")}
                decimals={products.find((p) => p.id === line.productId)?.unit?.whole === false ? 2 : 0}
                min={0}
                value={line.quantity}
                onChange={(v) => patch(line.id, { quantity: v ?? null })}
              />
            </ITGrid>
            <ITGrid item xs={4} md={2}>
              <ITInputNumber name={`poCost${index}`} label={t("form.unitCost")} decimals={2} min={0} value={line.unitCost} onChange={(v) => patch(line.id, { unitCost: v ?? null })} />
            </ITGrid>
            <ITGrid item xs={3} md={2}>
              <ITSelect
                name={`poTax${index}`}
                label={t("form.tax")}
                options={lookups.taxRates.map((r) => ({ value: r.id, label: r.name }))}
                value={line.taxRateId}
                onChange={(e) => patch(line.id, { taxRateId: e.target.value })}
              />
            </ITGrid>
            <ITGrid item xs={1} md={1}>
              <ITButton
                variant="outlined"
                color="secondary"
                icon={<FaTrash size={12} />}
                disabled={lines.length === 1}
                onClick={() => setLines((ls) => ls.filter((l) => l.id !== line.id))}
              />
            </ITGrid>
          </ITGrid>
        ))}
        <ITFlex>
          <ITButton variant="outlined" color="primary" icon={<FaPlus size={12} />} label={t("form.addLine")} onClick={() => setLines((ls) => [...ls, emptyLine(defaultTax)])} />
        </ITFlex>

        <ITFlex direction="column" gap={1} className="self-end text-right">
          <ITText className="text-[12px] tabular-nums">{`${t("form.subtotal")}: ${money(totals.subtotal)}`}</ITText>
          <ITText className="text-[12px] tabular-nums">{`${t("form.taxTotal")}: ${money(totals.tax)}`}</ITText>
          <ITText className="text-[14px] font-bold tabular-nums">{`${t("form.total")}: ${money(totals.subtotal + totals.tax)}`}</ITText>
        </ITFlex>

        <ITTextarea name="poNotes" label={t("form.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("form.save")} disabled={busy || !valid} onClick={() => void save()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
