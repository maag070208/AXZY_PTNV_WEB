import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITFlex, ITGrid, ITInput, ITInputNumber, ITSearchSelect, ITSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, receptionApi, writeoffApi, type HotelLot, type HotelProduct, type HotelRoomOption, type HotelWarehouse } from "@entities/hotel-linen";
import { newId } from "@shared/lib/newId";
import { PanelCard } from "@shared/ui/panel-card";
import { GuestChargeFields, type GuestChargeValue } from "@shared/ui/guest-loss-dialog";
import { useSuccessToast } from "@app/toast/useSuccessToast";

interface LineDraft {
  id: string;
  productId: string;
  lotId: string;
  quantity: number | null;
}

const emptyLine = (): LineDraft => ({ id: newId(), productId: "", lotId: "", quantity: null });

interface Props {
  onDone: (id: string) => void;
  onCancel: () => void;
}

/** Registrar pérdida de huésped: habitación, huésped, artículos y cantidades, y cobro opcional. Genera una baja motivo G. */
export default function GuestLossForm({ onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const notify = useSuccessToast();
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);
  const [lots, setLots] = useState<Record<string, HotelLot[]>>({});
  const [warehouseId, setWarehouseId] = useState("");
  const [roomId, setRoomId] = useState("");
  const [guestName, setGuestName] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [charge, setCharge] = useState<GuestChargeValue>({ chargeStatus: "NOT_CHARGED", chargeAmount: null });
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products(), receptionApi.rooms()])
      .then(([w, p, r]) => {
        if (!active) return;
        setWarehouses(w);
        setProducts(p.filter((x) => x.kind === "LINEN"));
        setRooms(r);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const patchLine = (id: string, patch: Partial<LineDraft>) => setLines((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  const pickProduct = (id: string, productId: string) => {
    patchLine(id, { productId, lotId: "" });
    if (productId && !lots[productId]) {
      hotelLinenApi
        .lots(productId)
        .then((list) => setLots((m) => ({ ...m, [productId]: list })))
        .catch(() => setLots((m) => ({ ...m, [productId]: [] })));
    }
  };
  const lotOptions = (productId: string) =>
    (lots[productId] ?? [])
      .filter((lot) => !warehouseId || lot.warehouses.some((w) => w.warehouseId === warehouseId && w.quantity > 0))
      .map((lot) => ({ value: lot.id, label: `${lot.code} (${lot.warehouses.find((w) => w.warehouseId === warehouseId)?.quantity ?? lot.balance})` }));
  const productOptions = useMemo(() => products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}${p.size ? ` · ${p.size}` : ""}` })), [products]);

  const valid = !!warehouseId && !!roomId && guestName.trim().length > 0 && lines.every((l) => l.productId && l.quantity !== null && l.quantity > 0);

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const created = await writeoffApi.createGuestLoss({
        warehouseId,
        roomId,
        guestName: guestName.trim(),
        lines: lines.map((l) => ({ productId: l.productId, lotId: l.lotId || null, quantity: l.quantity as number })),
        chargeStatus: charge.chargeStatus,
        chargeAmount: charge.chargeAmount,
        notes: notes.trim() || null,
      });
      notify(t("guestLoss.toast.created"));
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onCancel} />
          <ITButton variant="filled" color="primary" label={t("guestLoss.new.submit")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      }
    >
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="guestLossWarehouse"
              label={t("writeoffs.new.warehouse")}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              value={warehouseId}
              onChange={(e) => setWarehouseId(e.target.value)}
            />
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITSearchSelect
              name="guestLossRoom"
              label={t("guestLoss.room")}
              options={rooms.map((r) => ({ value: r.id, label: r.zone ? `${r.number} · ${r.zone.name}` : r.number }))}
              value={roomId}
              onChange={(v) => setRoomId(String(v))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={5}>
            <ITInput name="guestLossGuest" label={t("guestLoss.guestName")} value={guestName} onChange={(e) => setGuestName(e.target.value)} />
          </ITGrid>
        </ITGrid>

        <ITText className="text-[12px] font-semibold">{t("writeoffs.new.lines")}</ITText>
        {lines.map((line, index) => (
          <ITGrid key={line.id} container columns={12} spacing={3} className="items-end">
            <ITGrid item xs={12} md={5}>
              <ITSearchSelect
                name={`guestLossProduct${index}`}
                label={t("writeoffs.new.item")}
                options={productOptions}
                value={line.productId}
                onChange={(v) => pickProduct(line.id, String(v))}
              />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITSelect
                name={`guestLossLot${index}`}
                label={t("writeoffs.new.lot")}
                options={[{ value: "", label: t("writeoffs.new.lotAuto") }, ...lotOptions(line.productId)]}
                value={line.lotId}
                disabled={!line.productId || !warehouseId}
                onChange={(e) => patchLine(line.id, { lotId: e.target.value })}
              />
            </ITGrid>
            <ITGrid item xs={4} md={3}>
              <ITInputNumber name={`guestLossQty${index}`} label={t("writeoffs.new.quantity")} decimals={0} min={0} value={line.quantity} onChange={(v) => patchLine(line.id, { quantity: v ?? null })} />
            </ITGrid>
            <ITGrid item xs={2} md={1}>
              <ITButton
                variant="outlined"
                color="secondary"
                size="lg"
                title={t("writeoffs.new.removeLine")}
                disabled={lines.length === 1}
                onClick={() => setLines((list) => list.filter((l) => l.id !== line.id))}
              >
                <FaTrash size={12} />
              </ITButton>
            </ITGrid>
          </ITGrid>
        ))}
        <ITFlex>
          <ITButton variant="outlined" color="primary" icon={<FaPlus size={12} />} label={t("writeoffs.new.addLine")} onClick={() => setLines((list) => [...list, emptyLine()])} />
        </ITFlex>

        <GuestChargeFields value={charge} onChange={setCharge} />
        <ITTextarea name="guestLossNotes" label={t("writeoffs.new.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
      </ITFlex>
    </PanelCard>
  );
}
