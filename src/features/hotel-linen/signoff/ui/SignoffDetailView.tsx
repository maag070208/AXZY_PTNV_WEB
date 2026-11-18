import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITButton, ITChip, ITFlex, ITGrid, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaCheck, FaExclamationTriangle } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import type { RootState } from "@app/store";
import { signoffApi, type SignoffResult, type TransferSignoffDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import SignoffStatusChip from "./SignoffStatusChip";

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

interface Props {
  id: string;
}

/** Detalle de la conformidad: contado por línea y botones Conforme / Con diferencia (nota obligatoria). */
export default function SignoffDetailView({ id }: Props) {
  const { t } = useTranslation("hotel-linen-signoff");
  const canSign = useCan("hotel_linen.transfer_signoff");
  const userId = useSelector((s: RootState) => s.auth.user?.id);
  const [detail, setDetail] = useState<TransferSignoffDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [asDifference, setAsDifference] = useState(false);
  const [notes, setNotes] = useState("");

  const load = useCallback(() => {
    signoffApi
      .detail(id)
      .then((d) => {
        setDetail(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  if (!detail) return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("loading")}</ITText>;

  const pending = detail.signoffStatus === "PENDING";
  const isCounter = !!userId && detail.receivedBy?.id === userId;
  const noteMissing = asDifference && notes.trim() === "";

  const submit = async (result: SignoffResult) => {
    setBusy(true);
    setError(null);
    try {
      await signoffApi.sign(id, { result, notes: notes.trim() || null });
      setAsDifference(false);
      setNotes("");
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

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
        actions={detail.signoffStatus ? <SignoffStatusChip status={detail.signoffStatus} /> : undefined}
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITText muted className="text-[11px]">{t("detail.receivedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              {detail.receivedBy && <ProfileAvatar name={detail.receivedBy.name} size="sm" />}
              <ITText className="text-[12px] font-semibold">{detail.receivedBy?.name ?? "—"}</ITText>
            </ITFlex>
            {detail.receivedAt && <ITText muted className="text-[11px]">{fmtDateTime(detail.receivedAt)}</ITText>}
          </ITGrid>
          {detail.signoffBy && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.signoffBy")}</ITText>
              <ITFlex align="center" gap={2}>
                <ProfileAvatar name={detail.signoffBy.name} size="sm" />
                <ITText className="text-[12px] font-semibold">{detail.signoffBy.name}</ITText>
              </ITFlex>
              {detail.signoffAt && <ITText muted className="text-[11px]">{fmtDateTime(detail.signoffAt)}</ITText>}
            </ITGrid>
          )}
          {detail.signoffNotes && (
            <ITGrid item xs={12} md={4}>
              <ITText muted className="text-[11px]">{t("detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.signoffNotes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("detail.lines")}>
        <ITFlex direction="column" gap={3}>
          {detail.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={12} md={5}>
                <ITText className="text-[12px] font-bold">{line.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">
                  {[line.product.code, line.product.size, line.lot?.code].filter(Boolean).join(" · ")}
                </ITText>
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITText muted className="text-[11px]">{t("detail.sent")}</ITText>
                <ITText className="text-[12px] tabular-nums">{fmt(line.quantity)}</ITText>
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITText muted className="text-[11px]">{t("detail.counted")}</ITText>
                <ITText className="text-[12px] tabular-nums">{line.receivedQuantity === null ? "—" : fmt(line.receivedQuantity)}</ITText>
              </ITGrid>
              <ITGrid item xs={4} md={2}>
                <ITText muted className="text-[11px]">{t("detail.difference")}</ITText>
                {line.difference ? <ITChip size="sm" color="warning" label={fmt(line.difference)} /> : <ITText className="text-[12px]">{line.difference === null ? "—" : "0"}</ITText>}
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </PanelCard>

      {detail.signoffStatus === null && <ITAlert variant="info">{t("detail.notApplicable")}</ITAlert>}

      {pending && canSign && (
        <PanelCard title={t("detail.action")} description={t("detail.noStockBlock")}>
          {isCounter ? (
            <ITAlert variant="warning">{t("detail.sameUser")}</ITAlert>
          ) : (
            <ITFlex direction="column" gap={3}>
              {asDifference && (
                <ITTextarea
                  name="signoffNotes"
                  label={t("detail.notesLabel")}
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e)}
                  error={noteMissing ? t("detail.notesRequired") : undefined}
                />
              )}
              <ITFlex justify="end" gap={2}>
                {asDifference ? (
                  <>
                    <ITButton variant="outlined" color="secondary" label={t("cancel")} disabled={busy} onClick={() => setAsDifference(false)} />
                    <ITButton
                      variant="filled"
                      color="danger"
                      icon={<FaExclamationTriangle size={12} />}
                      label={t("detail.confirmDifference")}
                      disabled={busy || noteMissing}
                      onClick={() => void submit("DIFFERENCE")}
                    />
                  </>
                ) : (
                  <>
                    <ITButton
                      variant="outlined"
                      color="danger"
                      icon={<FaExclamationTriangle size={12} />}
                      label={t("detail.withDifference")}
                      disabled={busy}
                      onClick={() => setAsDifference(true)}
                    />
                    <ITButton
                      variant="filled"
                      color="primary"
                      icon={<FaCheck size={12} />}
                      label={t("detail.conform")}
                      disabled={busy}
                      onClick={() => void submit("CONFORM")}
                    />
                  </>
                )}
              </ITFlex>
            </ITFlex>
          )}
        </PanelCard>
      )}
    </ITFlex>
  );
}
