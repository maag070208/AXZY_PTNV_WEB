import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { receptionApi, type TowelLoan } from "@entities/hotel-linen";
import { fmt, money } from "../lib";

interface Props {
  loan: TowelLoan | null;
  onClose: () => void;
  onDone: () => void;
}

/** Devolución (parcial permitida): reembolsa cantidad × depósito por toalla. */
export default function ReturnLoanDialog({ loan, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const [qty, setQty] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setQty(loan ? loan.pendingQty : null);
    setError(null);
  }, [loan]);

  const valid = !!loan && qty !== null && qty > 0 && qty <= loan.pendingQty;

  const submit = async () => {
    if (!loan || !valid) return;
    setBusy(true);
    setError(null);
    try {
      await receptionApi.returnLoan(loan.folio, qty as number);
      onDone();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog isOpen={loan !== null} onClose={onClose} title={t("loans.returnDialog.title", { folio: loan?.folio ?? "" })}>
      <ITFlex direction="column" gap={3} className="min-w-[380px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITText>{t("loans.returnDialog.pending", { guest: loan?.guestName ?? "", count: fmt(loan?.pendingQty ?? 0) })}</ITText>
        <ITInputNumber name="returnQty" label={t("loans.returnDialog.quantity")} decimals={0} min={0} value={qty} onChange={(v) => setQty(v ?? null)} />
        <ITText muted>{t("loans.returnDialog.refund", { amount: money((qty ?? 0) * (loan?.depositUnit ?? 0)) })}</ITText>
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton variant="filled" color="primary" label={t("loans.returnDialog.confirm")} disabled={busy || !valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
