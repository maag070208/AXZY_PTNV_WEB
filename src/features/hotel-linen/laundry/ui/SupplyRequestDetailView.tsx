import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITButton, ITChip, ITConfirmDialog, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { FaBan, FaCheck, FaPaperPlane, FaTruck } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { laundryApi, type SupplyRequestDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDate, fmtDateTime } from "../lib";
import FulfillDialog from "./FulfillDialog";
import SupplyStatusChip from "./SupplyStatusChip";

type Confirm = "cancel" | "confirm" | null;

interface Props {
  id: string;
  requestCosign: (title: string) => Promise<string | null>;
}

/** Detalle del pedido (formato del hotel): Solicitado / Entregado / Recibido / Pendiente, traspasos y firmas. */
export default function SupplyRequestDetailView({ id, requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const canRequest = useCan("hotel_linen.request");
  const canFulfill = useCan("hotel_linen.fulfill");
  const [detail, setDetail] = useState<SupplyRequestDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Confirm>(null);
  const [fulfilling, setFulfilling] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    laundryApi
      .request(id)
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  if (!detail) {
    return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{loading ? t("common.loading") : ""}</ITText>;
  }

  const run = async (action: () => Promise<SupplyRequestDetail>) => {
    setBusy(true);
    setError(null);
    try {
      setDetail(await action());
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setConfirm(null);
    }
  };

  const status = detail.status;
  const openTransit = detail.transfers.some((tr) => tr.status === "IN_TRANSIT");
  const actions = (
    <ITFlex gap={2}>
      {canRequest && status === "DRAFT" && (
        <ITButton variant="filled" color="primary" icon={<FaPaperPlane size={12} />} label={t("detail.submit")} disabled={busy} onClick={() => void run(() => laundryApi.submitRequest(id))} />
      )}
      {canRequest && (status === "DRAFT" || status === "SUBMITTED") && (
        <ITButton variant="outlined" color="danger" icon={<FaBan size={12} />} label={t("detail.cancel")} disabled={busy} onClick={() => setConfirm("cancel")} />
      )}
      {canFulfill && (status === "SUBMITTED" || status === "PARTIALLY_FULFILLED") && (
        <ITButton variant="filled" color="primary" icon={<FaTruck size={12} />} label={t("detail.fulfill")} disabled={busy} onClick={() => setFulfilling(true)} />
      )}
      {canRequest && status === "FULFILLED" && (
        <ITButton variant="filled" color="primary" icon={<FaCheck size={12} />} label={t("detail.confirm")} disabled={busy || openTransit} title={openTransit ? t("detail.confirmBlocked") : undefined} onClick={() => setConfirm("confirm")} />
      )}
    </ITFlex>
  );

  const totals = detail.lines.reduce(
    (s, l) => ({ r: s.r + l.requestedQty, d: s.d + l.deliveredQty, rc: s.rc + l.receivedQty, p: s.p + l.pendingQty }),
    { r: 0, d: 0, rc: 0, p: 0 }
  );
  const cell = "text-[12px] tabular-nums text-right";

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <PanelCard
        title={detail.folio}
        description={`${detail.source.name} → ${detail.area.name}`}
        actions={
          <ITFlex align="center" gap={2}>
            <SupplyStatusChip status={status} />
            {actions}
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("detail.requestedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.requestedBy && <ProfileAvatar name={detail.requestedBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.requestedBy?.name ?? "—"}</ITText>
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("detail.dateShift")}</ITText>
            <ITText className="text-[12px]">
              {fmtDate(detail.date)}
              {detail.shift ? ` · ${tt(`shift.${detail.shift}`)}` : ""}
            </ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("form.checkouts")}</ITText>
            <ITText className="text-[12px] tabular-nums">{detail.checkouts}</ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("form.occupied")}</ITText>
            <ITText className="text-[12px] tabular-nums">{detail.occupied}</ITText>
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12}>
              <ITText muted className="text-[11px]">{t("form.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <ITFlex direction="column" gap={2}>
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={4}><ITText muted className="text-[11px]">{t("detail.item")}</ITText></ITGrid>
            {(["requested", "delivered", "received", "pending"] as const).map((k) => (
              <ITGrid key={k} item xs={2}><ITText muted className="text-right text-[11px]">{t(`detail.${k}`)}</ITText></ITGrid>
            ))}
          </ITGrid>
          {detail.lines.map((l) => (
            <ITGrid key={l.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={4}>
                <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">{[l.product.code, l.product.size].filter(Boolean).join(" · ")}</ITText>
              </ITGrid>
              <ITGrid item xs={2}><ITText className={cell}>{fmt(l.requestedQty)}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText className={cell}>{fmt(l.deliveredQty)}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText className={cell}>{fmt(l.receivedQty)}</ITText></ITGrid>
              <ITGrid item xs={2}>
                <ITText className={`${cell} ${l.pendingQty > 0 ? "font-bold text-[var(--color-warning)]" : ""}`}>{fmt(l.pendingQty)}</ITText>
              </ITGrid>
            </ITGrid>
          ))}
          <ITGrid container columns={12} spacing={3} className="items-center border-t pt-2">
            <ITGrid item xs={4}><ITText className="text-[12px] font-bold">{t("detail.total")}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText className={`${cell} font-bold`}>{fmt(totals.r)}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText className={`${cell} font-bold`}>{fmt(totals.d)}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText className={`${cell} font-bold`}>{fmt(totals.rc)}</ITText></ITGrid>
            <ITGrid item xs={2}><ITText className={`${cell} font-bold`}>{fmt(totals.p)}</ITText></ITGrid>
          </ITGrid>
        </ITFlex>
      </PanelCard>

      <PanelCard title={t("detail.transfers")} description={t("detail.transfersHint")}>
        {detail.transfers.length === 0 ? (
          <ITText muted>{t("detail.noTransfers")}</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {detail.transfers.map((tr) => (
              <ITFlex key={tr.id} align="center" gap={2}>
                <Link to={`/linen/transfers/${tr.id}`} className="font-mono text-[12px] font-bold underline">
                  {tr.folio}
                </Link>
                <ITChip size="sm" color={tr.status === "IN_TRANSIT" ? "info" : tr.status === "CANCELLED" ? "gray" : "success"} label={tt(`transferStatus.${tr.status}`)} />
                <ITText muted className="text-[11px]">{fmtDateTime(tr.date)}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </PanelCard>

      <PanelCard title={t("detail.signatures")}>
        {detail.signatures.length === 0 ? (
          <ITText muted>{t("detail.noSignatures")}</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {detail.signatures.map((s) => (
              <ITFlex key={`${s.role}-${s.signedAt}`} align="center" gap={2}>
                <ProfileAvatar name={s.user.name} size="sm" />
                <ITText className="text-[12px] font-semibold">{s.user.name}</ITText>
                <ITChip size="sm" label={tt(`role.${s.role}`, { defaultValue: s.role })} />
                <ITText muted className="text-[11px]">{fmtDateTime(s.signedAt)}</ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </PanelCard>

      <FulfillDialog
        requestId={fulfilling ? id : null}
        requestCosign={requestCosign}
        onClose={() => setFulfilling(false)}
        onDone={(updated) => {
          setDetail(updated);
          setFulfilling(false);
        }}
      />
      <ITConfirmDialog
        isOpen={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={() => void run(() => (confirm === "cancel" ? laundryApi.cancelRequest(id) : laundryApi.confirmRequest(id)))}
        title={confirm === "cancel" ? t("detail.cancelTitle") : t("detail.confirmTitle")}
        message={confirm === "cancel" ? t("detail.cancelMessage") : t("detail.confirmMessage")}
        confirmLabel={confirm === "cancel" ? t("detail.cancel") : t("detail.confirm")}
        cancelLabel={t("common.cancel")}
        variant={confirm === "cancel" ? "danger" : "primary"}
        loading={busy}
      />
    </ITFlex>
  );
}
