import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITChip, ITFlex, ITGrid, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { amenityDeliveryApi, type AmenityDeliveryDetail } from "@entities/hotel-linen";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import AmenityDeliveryStatusChip from "./AmenityDeliveryStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);

interface Props {
  id: string;
  /** Abre el traspaso (donde la destinataria recibe y firma). */
  onOpenTransfer: (id: string) => void;
}

/** Detalle de una entrega: destinataria, renglones enviados/recibidos y acceso a la recepción. */
export default function AmenityDeliveryDetailView({ id, onOpenTransfer }: Props) {
  const { t } = useTranslation("hotel-linen-amenity-delivery");
  const [detail, setDetail] = useState<AmenityDeliveryDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    amenityDeliveryApi
      .get(id)
      .then((d) => active && setDetail(d))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  if (!detail) return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("loading")}</ITText>;

  return (
    <ITFlex direction="column" gap={4}>
      <PanelCard
        title={detail.folio}
        description={`${detail.from?.name ?? "—"} → ${detail.to?.name ?? "—"}`}
        actions={
          <ITFlex align="center" gap={2}>
            <AmenityDeliveryStatusChip status={detail.status} />
            <ITButton variant="outlined" color="primary" label={t("detail.openTransfer")} onClick={() => onOpenTransfer(detail.id)} />
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.recipient")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.recipient && <ProfileAvatar name={detail.recipient.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.recipient?.name ?? "—"}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{t("detail.recipientHint")}</ITText>
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.sentBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.sentBy && <ProfileAvatar name={detail.sentBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.sentBy?.name ?? "—"}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{new Date(detail.date).toLocaleString("es-MX")}</ITText>
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <ITFlex direction="column" gap={3}>
          {detail.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={12} md={6}>
                <ITText className="text-[12px] font-bold">{line.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">{line.product.code}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("detail.sent")}</ITText>
                <ITText className="text-[12px] tabular-nums">{fmt(line.quantity)}</ITText>
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <ITText muted className="text-[11px]">{t("detail.received")}</ITText>
                {line.difference ? (
                  <ITChip size="sm" color="warning" label={`${fmt(line.receivedQuantity ?? 0)} (−${fmt(line.difference)})`} />
                ) : (
                  <ITText className="text-[12px] tabular-nums">{line.receivedQuantity === null ? "—" : fmt(line.receivedQuantity)}</ITText>
                )}
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </PanelCard>
    </ITFlex>
  );
}
