import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import { FaBed, FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, turnoverApi, type HotelProduct, type LaundryProductRef, type TurnoverSuggestion } from "@entities/hotel-linen";
import { DialogHeader } from "@shared/ui/dialog-header";
import { useSuccessToast } from "@app/toast/useSuccessToast";
import QtyStepper from "./QtyStepper";

interface Props {
  /** Habitación que se desocupó; `null` = cerrado. */
  room: { id: string; number: string } | null;
  onClose: () => void;
  onDone: () => void;
}

interface Row {
  product: LaundryProductRef;
  quantity: number;
}

/** "Se desocupó": lista sugerida por la dotación de la habitación, con +/- y agregar artículos, y "Pedir". */
export default function TurnoverDialog({ room, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-tablet");
  const notify = useSuccessToast();
  const [suggestion, setSuggestion] = useState<TurnoverSuggestion | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [catalog, setCatalog] = useState<HotelProduct[]>([]);
  const [extraId, setExtraId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!room) return;
    let active = true;
    setSuggestion(null);
    setRows([]);
    setError(null);
    setExtraId("");
    turnoverApi
      .suggestion(room.id)
      .then((s) => {
        if (!active) return;
        setSuggestion(s);
        setRows(s.lines.map((l) => ({ product: l.product, quantity: l.quantity })));
      })
      .catch((e: Error) => active && setError(e.message));
    hotelLinenApi
      .products()
      .then((all) => active && setCatalog(all.filter((p) => p.kind === "LINEN" && p.active)))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [room]);

  const extraOptions = useMemo(
    () =>
      catalog
        .filter((p) => !rows.some((r) => r.product.id === p.id))
        .map((p) => ({ value: p.id, label: [p.name, p.size].filter(Boolean).join(" · ") })),
    [catalog, rows]
  );

  const addExtra = () => {
    const p = catalog.find((x) => x.id === extraId);
    if (!p) return;
    setRows((r) => [...r, { product: { id: p.id, code: p.code, name: p.name, size: p.size }, quantity: 1 }]);
    setExtraId("");
  };

  const total = rows.reduce((s, r) => s + r.quantity, 0);

  const submit = async () => {
    if (!room) return;
    setBusy(true);
    setError(null);
    try {
      const res = await turnoverApi.create({
        roomId: room.id,
        lines: rows.filter((r) => r.quantity > 0).map((r) => ({ productId: r.product.id, requestedQty: r.quantity })),
      });
      notify(res.created ? t("toast.created") : t("toast.existing", { folio: res.request.folio }));
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={room !== null} onClose={onClose}>
      <DialogHeader icon={<FaBed />} title={t("turnover.title", { number: room?.number ?? "" })} subtitle={t("turnover.subtitle")} />
      <ITFlex direction="column" gap={3} className="min-w-[min(560px,90vw)]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {!suggestion && !error && <ITText muted>{t("loading")}</ITText>}
        {suggestion?.openRequest && <ITAlert variant="warning">{t("turnover.alreadyOpen", { folio: suggestion.openRequest.folio })}</ITAlert>}
        {rows.map((r, index) => (
          <ITFlex key={r.product.id} justify="between" align="center" gap={3}>
            <ITFlex direction="column">
              <ITText className="text-[18px] font-bold">{r.product.name}</ITText>
              <ITText muted className="text-[12px]">{[r.product.code, r.product.size].filter(Boolean).join(" · ")}</ITText>
            </ITFlex>
            <QtyStepper value={r.quantity} onChange={(q) => setRows((all) => all.map((x, i) => (i === index ? { ...x, quantity: q } : x)))} />
          </ITFlex>
        ))}
        {suggestion && (
          <ITFlex align="end" gap={2}>
            <ITFlex direction="column" className="flex-1">
              <ITSelect name="turnoverExtra" label={t("turnover.addItem")} options={extraOptions} value={extraId} onChange={(e) => setExtraId(e.target.value)} />
            </ITFlex>
            <ITButton variant="outlined" color="secondary" className="!h-12" icon={<FaPlus size={14} />} label={t("turnover.add")} disabled={!extraId} onClick={addExtra} />
          </ITFlex>
        )}
        <ITFlex justify="end" gap={2} className="mt-2">
          <ITButton variant="outlined" color="gray" className="!h-14 !px-6" label={t("cancel")} disabled={busy} onClick={onClose} />
          <ITButton variant="filled" color="primary" className="!h-14 !px-8 !text-[18px]" label={busy ? t("sending") : t("turnover.order")} disabled={busy || total === 0 || !suggestion || !!suggestion.openRequest} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
