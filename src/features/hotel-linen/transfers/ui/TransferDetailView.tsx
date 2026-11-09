import { useCallback, useEffect, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITChip,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITInputNumber,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaBan, FaClipboardCheck } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { hotelLinenApi, type HotelTransferDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import TransferStatusChip from "./TransferStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

interface Props {
  id: string;
  /** Pide la co-firma de quien recibe; `null` = cancelada. */
  requestCosign: (title: string) => Promise<string | null>;
}

/** Detalle del traspaso: líneas, firmas, diferencia; recibir (conteo ciego) y cancelar. */
export default function TransferDetailView({ id, requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen");
  const tt = dyn(t);
  const canReceive = useCan("hotel_linen.transfer_receive");
  const canSend = useCan("hotel_linen.transfer_send");
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const [detail, setDetail] = useState<HotelTransferDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [counting, setCounting] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [receiveNotes, setReceiveNotes] = useState("");
  const [cosign, setCosign] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    hotelLinenApi
      .transfer(id)
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

  const inTransit = detail.status === "IN_TRANSIT";
  // Conteo ciego: quien puede recibir (y no envió) no ve lo enviado mientras está en tránsito.
  const isSender = !!userId && detail.sentBy?.id === userId;
  const blind = inTransit && canReceive && !isSender;
  const allCounted = detail.lines.every((l) => counts[l.id] !== null && counts[l.id] !== undefined);

  const doReceive = async () => {
    setBusy(true);
    setError(null);
    try {
      let cosignToken: string | null = null;
      if (cosign) {
        cosignToken = await requestCosign(t("cosign.titleReceives"));
        if (!cosignToken) return;
      }
      const updated = await hotelLinenApi.receiveTransfer(id, {
        lines: detail.lines.map((l) => ({ lineId: l.id, receivedQuantity: counts[l.id] ?? 0 })),
        notes: receiveNotes.trim() || null,
        cosignToken,
      });
      setDetail(updated);
      setCounting(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const doCancel = async () => {
    setBusy(true);
    setError(null);
    try {
      setDetail(await hotelLinenApi.cancelTransfer(id));
      setConfirmCancel(false);
    } catch (e) {
      setError((e as Error).message);
      setConfirmCancel(false);
    } finally {
      setBusy(false);
    }
  };

  const actions = inTransit ? (
    <ITFlex gap={2}>
      {canSend && (
        <ITButton
          variant="outlined"
          color="danger"
          icon={<FaBan size={12} />}
          label={t("transfers.detail.cancel")}
          disabled={busy}
          onClick={() => setConfirmCancel(true)}
        />
      )}
      {canReceive && !counting && (
        <ITButton
          variant="filled"
          color="primary"
          icon={<FaClipboardCheck size={12} />}
          label={t("transfers.detail.receive")}
          disabled={busy}
          onClick={() => {
            setCounts({});
            setCounting(true);
          }}
        />
      )}
    </ITFlex>
  ) : undefined;

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <PanelCard
        title={detail.folio}
        description={`${detail.from?.name ?? "—"} → ${detail.to?.name ?? "—"}`}
        actions={
          <ITFlex align="center" gap={2}>
            <TransferStatusChip status={detail.status} />
            {actions}
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("transfers.detail.sentBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.sentBy && <ProfileAvatar name={detail.sentBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.sentBy?.name ?? "—"}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{fmtDateTime(detail.date)}</ITText>
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("transfers.detail.receivedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.receivedBy && <ProfileAvatar name={detail.receivedBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.receivedBy?.name ?? "—"}</ITText>
            </ITFlex>
            {detail.receivedAt && <ITText muted className="text-[11px]">{fmtDateTime(detail.receivedAt)}</ITText>}
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("transfers.detail.difference")}</ITText>
            <ITText className={`text-[16px] font-bold tabular-nums ${detail.difference ? "text-[var(--color-warning)]" : ""}`}>
              {detail.difference === null ? "—" : fmt(detail.difference)}
            </ITText>
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12}>
              <ITText muted className="text-[11px]">{t("transfers.detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
          {detail.receiveNotes && (
            <ITGrid item xs={12}>
              <ITText muted className="text-[11px]">{t("transfers.detail.receiveNotes")}</ITText>
              <ITText className="text-[12px]">{detail.receiveNotes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard
        title={t("transfers.detail.lines")}
        description={counting ? t("transfers.detail.blindHint") : blind ? t("transfers.detail.blindNotice") : undefined}
      >
        <ITFlex direction="column" gap={3}>
          {detail.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={12} md={counting ? 5 : 4}>
                <ITText className="text-[12px] font-bold">{line.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">
                  {[line.product.code, line.product.size, line.lot?.code].filter(Boolean).join(" · ")}
                </ITText>
              </ITGrid>
              {counting ? (
                <ITGrid item xs={12} md={3}>
                  <ITInputNumber
                    name={`receive-${line.id}`}
                    label={t("transfers.detail.countedQty")}
                    decimals={2}
                    min={0}
                    value={counts[line.id] ?? null}
                    onChange={(v) => setCounts((c) => ({ ...c, [line.id]: v ?? null }))}
                  />
                </ITGrid>
              ) : (
                <>
                  <ITGrid item xs={4} md={2}>
                    <ITText muted className="text-[11px]">{t("transfers.detail.sent")}</ITText>
                    <ITText className="text-[12px] tabular-nums">{blind ? "•••" : fmt(line.quantity)}</ITText>
                  </ITGrid>
                  <ITGrid item xs={4} md={2}>
                    <ITText muted className="text-[11px]">{t("transfers.detail.received")}</ITText>
                    <ITText className="text-[12px] tabular-nums">
                      {line.receivedQuantity === null ? "—" : fmt(line.receivedQuantity)}
                    </ITText>
                  </ITGrid>
                  <ITGrid item xs={4} md={2}>
                    <ITText muted className="text-[11px]">{t("transfers.detail.difference")}</ITText>
                    {line.difference ? (
                      <ITChip size="sm" color="warning" label={fmt(line.difference)} />
                    ) : (
                      <ITText className="text-[12px]">{line.difference === null ? "—" : "0"}</ITText>
                    )}
                  </ITGrid>
                </>
              )}
            </ITGrid>
          ))}

          {counting && (
            <ITFlex direction="column" gap={3}>
              <ITTextarea
                name="receiveNotes"
                label={t("transfers.detail.receiveNotes")}
                rows={2}
                value={receiveNotes}
                onChange={(e) => setReceiveNotes(e)}
              />
              <ITCheckbox name="receiveCosign" label={t("transfers.detail.cosign")} checked={cosign} onChange={setCosign} />
              <ITFlex justify="end" gap={2}>
                <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={() => setCounting(false)} />
                <ITButton
                  variant="filled"
                  color="primary"
                  label={t("transfers.detail.confirmReceive")}
                  disabled={busy || !allCounted}
                  onClick={() => void doReceive()}
                />
              </ITFlex>
            </ITFlex>
          )}
        </ITFlex>
      </PanelCard>

      <PanelCard title={t("transfers.detail.signatures")}>
        {detail.signatures.length === 0 ? (
          <ITText muted>{t("transfers.detail.noSignatures")}</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {detail.signatures.map((s) => (
              <ITFlex key={`${s.role}-${s.signedAt}`} align="center" gap={2}>
                <ProfileAvatar name={s.user.name} size="sm" />
                <ITText className="text-[12px] font-semibold">{s.user.name}</ITText>
                <ITChip size="sm" label={tt(`transfers.role.${s.role}`)} />
                <ITText muted className="text-[11px]">
                  {tt(`transfers.method.${s.method}`)} · {fmtDateTime(s.signedAt)}
                </ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </PanelCard>

      <ITConfirmDialog
        isOpen={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={() => void doCancel()}
        title={t("transfers.detail.cancelTitle")}
        message={t("transfers.detail.cancelMessage")}
        confirmLabel={t("transfers.detail.cancel")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={busy}
      />
    </ITFlex>
  );
}
