import { useEffect, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
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
import { hotelLinenApi, type HotelLot, type HotelProduct, type HotelWarehouse } from "@entities/hotel-linen";
import { newId } from "@shared/lib/newId";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { PanelCard } from "@shared/ui/panel-card";

interface LineDraft {
  id: string;
  productId: string;
  quantity: number | null;
  lotId: string;
}

const emptyLine = (): LineDraft => ({ id: newId(), productId: "", quantity: null, lotId: "" });

interface Props {
  /** Pide la co-firma de quien entrega; `null` = cancelada. */
  requestCosign: (title: string) => Promise<string | null>;
  onDone: (id: string) => void;
  onCancel: () => void;
}

/** Nuevo traspaso: origen, destino y renglones (artículo + cantidad + lote opcional). */
export default function TransferForm({ requestCosign, onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen");
  const requestKey = useRequestKey();
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [lots, setLots] = useState<Record<string, HotelLot[]>>({});
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [cosign, setCosign] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products()])
      .then(([w, p]) => {
        if (!active) return;
        setWarehouses(w);
        setProducts(p);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const patchLine = (id: string, patch: Partial<LineDraft>) =>
    setLines((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const pickProduct = (id: string, productId: string) => {
    patchLine(id, { productId, lotId: "" });
    if (productId && !lots[productId]) {
      hotelLinenApi
        .lots(productId)
        .then((list) => setLots((m) => ({ ...m, [productId]: list })))
        .catch(() => setLots((m) => ({ ...m, [productId]: [] })));
    }
  };

  // Solo lotes con saldo en el almacén de origen.
  const lotOptions = (productId: string) =>
    (lots[productId] ?? [])
      .filter((lot) => !fromId || lot.warehouses.some((w) => w.warehouseId === fromId && w.quantity > 0))
      .map((lot) => {
        const here = lot.warehouses.find((w) => w.warehouseId === fromId)?.quantity ?? lot.balance;
        return { value: lot.id, label: `${lot.code} (${here})` };
      });

  const warehouseOptions = warehouses.map((w) => ({ value: w.id, label: w.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));

  const valid =
    !!fromId &&
    !!toId &&
    fromId !== toId &&
    lines.length > 0 &&
    lines.every((l) => l.productId && l.quantity !== null && l.quantity > 0);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity as number, lotId: l.lotId || null })),
        notes: notes.trim() || null,
      };
      let cosignToken: string | null = null;
      if (cosign) {
        cosignToken = await requestCosign(t("cosign.titleDelivers"));
        if (!cosignToken) return;
      }
      const created = await hotelLinenApi.sendTransfer({ ...body, cosignToken }, requestKey(body));
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard title={t("transfers.new.title")} description={t("transfers.new.description")}>
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="transferFrom"
              label={t("transfers.new.from")}
              options={warehouseOptions}
              value={fromId}
              onChange={(e) => setFromId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="transferTo"
              label={t("transfers.new.to")}
              options={warehouseOptions.filter((w) => w.value !== fromId)}
              value={toId}
              onChange={(e) => setToId(e.target.value)}
            />
          </ITGrid>
        </ITGrid>

        <ITText className="text-[12px] font-semibold">{t("transfers.new.lines")}</ITText>
        {lines.map((line, index) => (
          <ITGrid key={line.id} container columns={12} spacing={3}>
            <ITGrid item xs={12} md={5}>
              <ITSearchSelect
                name={`transferProduct${index}`}
                label={t("transfers.new.item")}
                options={productOptions}
                value={line.productId}
                onChange={(v) => pickProduct(line.id, String(v))}
              />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInputNumber
                name={`transferQty${index}`}
                label={t("transfers.new.quantity")}
                decimals={products.find((p) => p.id === line.productId)?.unit?.whole === false ? 2 : 0}
                min={0}
                value={line.quantity}
                onChange={(v) => patchLine(line.id, { quantity: v ?? null })}
              />
            </ITGrid>
            <ITGrid item xs={6} md={4}>
              <ITSelect
                name={`transferLot${index}`}
                label={t("transfers.new.lot")}
                options={[{ value: "", label: t("transfers.new.lotAuto") }, ...lotOptions(line.productId)]}
                value={line.lotId}
                disabled={!line.productId}
                onChange={(e) => patchLine(line.id, { lotId: e.target.value })}
              />
            </ITGrid>
            <ITGrid item xs={12} md={1}>
              <ITButton
                variant="outlined"
                color="secondary"
                size="lg"
                title={t("transfers.new.removeLine")}
                disabled={lines.length === 1}
                onClick={() => setLines((list) => list.filter((l) => l.id !== line.id))}
              >
                <FaTrash size={12} />
              </ITButton>
            </ITGrid>
          </ITGrid>
        ))}
        <ITFlex>
          <ITButton
            variant="outlined"
            color="primary"
            icon={<FaPlus size={12} />}
            label={t("transfers.new.addLine")}
            onClick={() => setLines((list) => [...list, emptyLine()])}
          />
        </ITFlex>

        <ITTextarea
          name="transferNotes"
          label={t("transfers.new.notes")}
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e)}
        />
        <ITCheckbox name="transferCosign" label={t("transfers.new.cosign")} checked={cosign} onChange={setCosign} />

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onCancel} />
          <ITButton
            variant="filled"
            color="primary"
            label={t("transfers.new.send")}
            disabled={busy || !valid}
            onClick={() => void submit()}
          />
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
