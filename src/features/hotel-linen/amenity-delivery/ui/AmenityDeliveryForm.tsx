import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInputNumber, ITSearchSelect, ITSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaMagic, FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  amenityDeliveryApi,
  hotelLinenApi,
  type AmenityRecipient,
  type AmenitySuggestion,
  type HotelProduct,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import { newId } from "@shared/lib/newId";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { PanelCard } from "@shared/ui/panel-card";

interface LineDraft {
  id: string;
  productId: string;
  quantity: number | null;
}

const emptyLine = (): LineDraft => ({ id: newId(), productId: "", quantity: null });

interface Props {
  onDone: (id: string) => void;
  onCancel: () => void;
}

/** Nueva entrega: ropería, destinataria (supervisora de la zona), sugerido por área y renglones. */
export default function AmenityDeliveryForm({ onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const requestKey = useRequestKey();
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [fromId, setFromId] = useState("");
  const [toId, setToId] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [recipients, setRecipients] = useState<AmenityRecipient[]>([]);
  const [suggestion, setSuggestion] = useState<AmenitySuggestion | null>(null);
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products()])
      .then(([w, p]) => {
        if (!active) return;
        setWarehouses(w);
        setProducts(p.filter((x) => x.kind === "CONSUMABLE"));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  // Al elegir la ropería: supervisoras de la zona y sugerido del área.
  useEffect(() => {
    setRecipientId("");
    setRecipients([]);
    setSuggestion(null);
    if (!toId) return;
    let active = true;
    Promise.all([amenityDeliveryApi.recipients(toId), amenityDeliveryApi.suggestion(toId)])
      .then(([r, s]) => {
        if (!active) return;
        setRecipients(r);
        setSuggestion(s);
        if (r.length === 1) setRecipientId(r[0].id);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [toId]);

  const patchLine = (id: string, patch: Partial<LineDraft>) => setLines((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const applySuggestion = () => {
    if (!suggestion || suggestion.lines.length === 0) return;
    setLines(suggestion.lines.map((l) => ({ id: newId(), productId: l.product.id, quantity: l.suggested })));
  };

  const sources = warehouses.filter((w) => w.kind === "CENTRAL").map((w) => ({ value: w.id, label: w.name }));
  const areas = warehouses.filter((w) => w.kind === "ZONE").map((w) => ({ value: w.id, label: w.name }));
  const productOptions = products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}` }));
  const filled = lines.filter((l) => l.productId);
  const valid = !!fromId && !!toId && !!recipientId && filled.length > 0 && filled.every((l) => l.quantity !== null && l.quantity > 0);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const body = {
        fromWarehouseId: fromId,
        toWarehouseId: toId,
        recipientId,
        lines: filled.map((l) => ({ productId: l.productId, quantity: l.quantity as number })),
        notes: notes.trim() || null,
      };
      const created = await amenityDeliveryApi.create(body, requestKey(body));
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITFlex direction="column" gap={4}>
      <PanelCard title={t("new.title")} description={t("new.description")}>
        <ITFlex direction="column" gap={4}>
          {error && (
            <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
              {error}
            </ITAlert>
          )}
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITSelect name="amenityFrom" label={t("new.from")} options={sources} value={fromId} onChange={(e) => setFromId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSelect name="amenityTo" label={t("new.to")} options={areas} value={toId} onChange={(e) => setToId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSelect
                name="amenityRecipient"
                label={t("new.recipient")}
                options={recipients.map((r) => ({ value: r.id, label: r.name }))}
                value={recipientId}
                disabled={!toId}
                onChange={(e) => setRecipientId(e.target.value)}
              />
            </ITGrid>
          </ITGrid>
          {toId && recipients.length === 0 && suggestion && <ITAlert variant="warning">{t("new.noRecipients")}</ITAlert>}
        </ITFlex>
      </PanelCard>

      {suggestion && (
        <PanelCard
          title={t("new.suggestionTitle")}
          description={t("new.suggestionHint", { rooms: suggestion.rooms })}
          actions={
            <ITButton
              variant="outlined"
              color="primary"
              icon={<FaMagic size={12} />}
              label={t("new.applySuggestion")}
              disabled={suggestion.lines.length === 0}
              onClick={applySuggestion}
            />
          }
        >
          {suggestion.lines.length === 0 ? (
            <ITText muted>{t("new.noSuggestion")}</ITText>
          ) : (
            <ITFlex direction="column" gap={2}>
              <ITGrid container columns={12} spacing={3}>
                <ITGrid item xs={6}><ITText muted className="text-[11px] font-bold uppercase">{t("new.item")}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("new.expected")}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("new.onHand")}</ITText></ITGrid>
                <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("new.suggested")}</ITText></ITGrid>
              </ITGrid>
              {suggestion.lines.map((l) => (
                <ITGrid key={l.product.id} container columns={12} spacing={3} className="items-center">
                  <ITGrid item xs={6}><ITText className="text-[12px] font-semibold">{`${l.product.code} · ${l.product.name}`}</ITText></ITGrid>
                  <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">{l.expected}</ITText></ITGrid>
                  <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">{l.onHand}</ITText></ITGrid>
                  <ITGrid item xs={2}><ITText className="text-[12px] font-bold tabular-nums">{l.suggested}</ITText></ITGrid>
                </ITGrid>
              ))}
            </ITFlex>
          )}
        </PanelCard>
      )}

      <PanelCard title={t("new.quantity")}>
        <ITFlex direction="column" gap={3}>
          {lines.map((line, index) => (
            <ITGrid key={line.id} container columns={12} spacing={3}>
              <ITGrid item xs={12} md={7}>
                <ITSearchSelect
                  name={`amenityProduct${index}`}
                  label={t("new.item")}
                  options={productOptions}
                  value={line.productId}
                  onChange={(v) => patchLine(line.id, { productId: String(v) })}
                />
              </ITGrid>
              <ITGrid item xs={9} md={4}>
                <ITInputNumber
                  name={`amenityQty${index}`}
                  label={t("new.quantity")}
                  decimals={0}
                  min={0}
                  value={line.quantity}
                  onChange={(v) => patchLine(line.id, { quantity: v ?? null })}
                />
              </ITGrid>
              <ITGrid item xs={3} md={1}>
                <ITButton variant="outlined" color="secondary" size="lg" disabled={lines.length === 1} onClick={() => setLines((list) => list.filter((l) => l.id !== line.id))}>
                  <FaTrash size={12} />
                </ITButton>
              </ITGrid>
            </ITGrid>
          ))}
          <ITFlex>
            <ITButton variant="outlined" color="primary" icon={<FaPlus size={12} />} label={t("new.addLine")} onClick={() => setLines((list) => [...list, emptyLine()])} />
          </ITFlex>
          <ITTextarea name="amenityNotes" label={t("new.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("cancel")} onClick={onCancel} />
            <ITButton variant="filled" color="primary" label={t("new.submit")} disabled={busy || !valid} onClick={() => void submit()} />
          </ITFlex>
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
