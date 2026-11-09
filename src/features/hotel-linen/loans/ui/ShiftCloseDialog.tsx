import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITCheckbox, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, type ShiftClosePreview, type TowelLoan } from "@entities/hotel-linen";
import { fmt, money } from "../lib";

interface Props {
  isOpen: boolean;
  pointId: string;
  pointName: string;
  requestCosign: (title: string) => Promise<string | null>;
  onClose: () => void;
  onDone: () => void;
}

/** Corte de turno: totales, marcar no devueltas (retienen depósito) y co-firma de quien recibe el turno. */
export default function ShiftCloseDialog({ isOpen, pointId, pointName, requestCosign, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const [open, setOpen] = useState<TowelLoan[]>([]);
  const [marked, setMarked] = useState<string[]>([]);
  const [preview, setPreview] = useState<ShiftClosePreview | null>(null);
  const [endOfDay, setEndOfDay] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Abiertos del punto (abiertos y parciales) al abrir el diálogo.
  useEffect(() => {
    if (!isOpen || !pointId) return;
    setMarked([]);
    setEndOfDay(false);
    setError(null);
    const load = (status: string) => receptionApi.loansTable({ page: 1, limit: 200, filters: { warehouse: pointId, status } as never });
    Promise.all([load("OPEN"), load("PARTIAL")])
      .then(([a, b]) => setOpen([...a.data, ...b.data]))
      .catch((e) => setError((e as Error).message));
  }, [isOpen, pointId]);

  useEffect(() => {
    if (!isOpen || !pointId) return;
    receptionApi.closePreview(pointId, marked).then(setPreview).catch((e) => setError((e as Error).message));
  }, [isOpen, pointId, marked]);

  const toggle = (folioId: string) => setMarked((cur) => (cur.includes(folioId) ? cur.filter((x) => x !== folioId) : [...cur, folioId]));

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      let cosignToken: string | null = null;
      if (!endOfDay) {
        cosignToken = await requestCosign(t("close.cosignTitle"));
        if (!cosignToken) return;
      }
      await receptionApi.createClose({ warehouseId: pointId, cosignToken, endOfDay, markUnreturned: marked });
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const totals = preview?.totals;
  return (
    <ITDialog isOpen={isOpen} onClose={onClose} title={t("close.title", { point: pointName })}>
      <ITFlex direction="column" gap={3} className="min-w-[480px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITFlex direction="column" gap={1}>
          <ITText>{t("close.totals.lent", { count: fmt(totals?.lent ?? 0) })}</ITText>
          <ITText>{t("close.totals.returned", { count: fmt(totals?.returned ?? 0) })}</ITText>
          <ITText>{t("close.totals.unreturned", { count: fmt(totals?.unreturned ?? 0) })}</ITText>
          <ITText>{t("close.totals.collected", { amount: money(totals?.depositsCollected ?? 0) })}</ITText>
          <ITText>{t("close.totals.returnedDeposit", { amount: money(totals?.depositsReturned ?? 0) })}</ITText>
          <ITText className="font-bold">{t("close.totals.retained", { amount: money(totals?.depositsRetained ?? 0) })}</ITText>
          {!!preview?.carriedOver && <ITText muted>{t("close.carriedOver", { count: preview.carriedOver })}</ITText>}
        </ITFlex>
        {open.length > 0 && (
          <ITFlex direction="column" gap={1}>
            <ITText className="font-semibold">{t("close.markTitle")}</ITText>
            {open.map((l) => (
              <ITCheckbox
                key={l.id}
                checked={marked.includes(l.id)}
                onChange={() => toggle(l.id)}
                label={`${l.folio} · ${l.guestName}${l.room ? ` (${l.room})` : ""} · ${fmt(l.pendingQty)} ${l.product.name}`}
              />
            ))}
          </ITFlex>
        )}
        <ITCheckbox checked={endOfDay} onChange={() => setEndOfDay((v) => !v)} label={t("close.endOfDay")} />
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("close.confirm")} disabled={busy || !preview || preview.included === 0} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
