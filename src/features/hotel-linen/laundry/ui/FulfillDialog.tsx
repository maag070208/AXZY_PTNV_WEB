import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITCheckbox, ITDialog, ITFlex, ITGrid, ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { laundryApi, type SupplyRequestDetail } from "@entities/hotel-linen";
import { fmt } from "../lib";

interface Props {
  /** Pedido a surtir; `null` = cerrado. */
  requestId: string | null;
  requestCosign: (title: string) => Promise<string | null>;
  onClose: () => void;
  onDone: (detail: SupplyRequestDetail) => void;
}

/** Surtir un pedido: cantidad entregada ahora por renglón y co-firma opcional del auxiliar de piso. */
export default function FulfillDialog({ requestId, requestCosign, onClose, onDone }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const [detail, setDetail] = useState<SupplyRequestDetail | null>(null);
  const [qty, setQty] = useState<Record<string, number | null>>({});
  const [cosign, setCosign] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!requestId) return;
    let active = true;
    setDetail(null);
    setError(null);
    setCosign(false);
    laundryApi
      .request(requestId)
      .then((d) => {
        if (!active) return;
        setDetail(d);
        // Por defecto se entrega todo lo pendiente.
        setQty(Object.fromEntries(d.lines.map((l) => [l.id, l.pendingQty])));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [requestId]);

  const anyQty = !!detail && detail.lines.some((l) => (qty[l.id] ?? 0) > 0);
  const overPending = !!detail && detail.lines.some((l) => (qty[l.id] ?? 0) > l.pendingQty);

  const submit = async () => {
    if (!detail || !requestId) return;
    setBusy(true);
    setError(null);
    try {
      let cosignToken: string | null = null;
      if (cosign) {
        cosignToken = await requestCosign(t("cosign.titleDelivers"));
        if (!cosignToken) return;
      }
      const updated = await laundryApi.fulfillRequest(requestId, {
        lines: detail.lines.map((l) => ({ lineId: l.id, deliveredQty: qty[l.id] ?? 0 })),
        cosignToken,
      });
      onDone(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <ITDialog
      isOpen={requestId !== null}
      onClose={onClose}
      title={detail ? t("fulfill.title", { folio: detail.folio }) : t("fulfill.titleLoading")}
    >
      <ITFlex direction="column" gap={3} className="min-w-[520px]">
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {!detail && !error && <ITText muted>{t("common.loading")}</ITText>}
        {detail && (
          <>
            <ITText muted className="text-[12px]">
              {t("fulfill.hint", { area: detail.area.name })}
            </ITText>
            {detail.lines.map((l, index) => (
              <ITGrid key={l.id} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={12} md={6}>
                  <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">
                    {[l.product.code, l.product.size].filter(Boolean).join(" · ")}
                  </ITText>
                </ITGrid>
                <ITGrid item xs={4} md={2}>
                  <ITText muted className="text-[11px]">{t("detail.pending")}</ITText>
                  <ITText className="text-[12px] tabular-nums">{fmt(l.pendingQty)}</ITText>
                </ITGrid>
                <ITGrid item xs={8} md={4}>
                  <ITInputNumber
                    name={`fulfillQty${index}`}
                    label={t("fulfill.deliverNow")}
                    decimals={0}
                    min={0}
                    value={qty[l.id] ?? null}
                    onChange={(v) => setQty((q) => ({ ...q, [l.id]: v ?? null }))}
                  />
                </ITGrid>
              </ITGrid>
            ))}
            {overPending && <ITAlert variant="warning">{t("fulfill.overPending")}</ITAlert>}
            <ITCheckbox name="fulfillCosign" label={t("fulfill.cosign")} checked={cosign} onChange={setCosign} />
            <ITFlex justify="end" gap={2}>
              <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
              <ITButton
                variant="filled"
                color="primary"
                label={t("fulfill.confirm")}
                disabled={busy || !anyQty || overPending}
                onClick={() => void submit()}
              />
            </ITFlex>
          </>
        )}
      </ITFlex>
    </ITDialog>
  );
}
