import { useCallback, useEffect, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITChip,
  ITDialog,
  ITFlex,
  ITGrid,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaClipboardCheck, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  WRITEOFF_DISPOSITIONS,
  writeoffApi,
  type WriteoffDetail,
  type WriteoffDisposition,
  type WriteoffEvidence,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDateTime, money } from "../lib";
import WriteoffStatusChip from "./WriteoffStatusChip";

/** Foto de la baja: se descarga con la sesión (blob) y se muestra como miniatura. */
function EvidenceThumb({ id, evidence }: { id: string; evidence: WriteoffEvidence }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let url: string | null = null;
    let active = true;
    writeoffApi
      .evidence(id, evidence.id)
      .then((blob) => {
        if (!active) return;
        url = URL.createObjectURL(blob);
        setSrc(url);
      })
      .catch(() => active && setSrc(null));
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [id, evidence.id]);
  if (!src) return <div className="h-28 w-28 animate-pulse rounded-lg bg-[var(--color-border)]" />;
  return (
    <a href={src} target="_blank" rel="noreferrer">
      <img src={src} alt="" className="h-28 w-28 rounded-lg object-cover" />
    </a>
  );
}

interface Props {
  id: string;
  /** Pide la co-firma de quien firma; `null` = cancelada. */
  requestCosign: (title: string) => Promise<string | null>;
}

/** Detalle de la baja: renglones, fotos, firmas y acciones de revisar / autorizar / rechazar. */
export default function WriteoffDetailView({ id, requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const tt = dyn(t);
  const canReview = useCan("hotel_linen.writeoff_review");
  const canApprove = useCan("hotel_linen.writeoff_approve");
  const [detail, setDetail] = useState<WriteoffDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [disposition, setDisposition] = useState<WriteoffDisposition | "">("");
  const [notes, setNotes] = useState("");
  const [cosign, setCosign] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    writeoffApi
      .detail(id)
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

  const pending = detail.status === "PENDING_APPROVAL";

  const run = async (action: (cosignToken: string | null) => Promise<WriteoffDetail>) => {
    setBusy(true);
    setError(null);
    try {
      let cosignToken: string | null = null;
      if (cosign) {
        cosignToken = await requestCosign(t("writeoffs.detail.cosignTitle"));
        if (!cosignToken) return;
      }
      setDetail(await action(cosignToken));
      setMode(null);
      setNotes("");
      setCosign(false);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const actions = pending ? (
    <ITFlex gap={2}>
      {canReview && !detail.reviewed && (
        <ITButton
          variant="outlined"
          color="primary"
          icon={<FaClipboardCheck size={12} />}
          label={t("writeoffs.detail.review")}
          disabled={busy}
          onClick={() => void run((cosignToken) => writeoffApi.review(id, { cosignToken }))}
        />
      )}
      {canApprove && (
        <>
          <ITButton variant="outlined" color="danger" icon={<FaTimes size={12} />} label={t("writeoffs.detail.reject")} disabled={busy} onClick={() => setMode("reject")} />
          <ITButton variant="filled" color="primary" icon={<FaCheck size={12} />} label={t("writeoffs.detail.approve")} disabled={busy} onClick={() => setMode("approve")} />
        </>
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
      {detail.reviewSkipped && <ITAlert variant="warning">{t("writeoffs.detail.skipped")}</ITAlert>}
      {detail.quarantined && <ITAlert variant="warning">{t("writeoffs.detail.quarantined")}</ITAlert>}

      <PanelCard
        title={detail.folio}
        description={detail.warehouse?.name ?? undefined}
        actions={
          <ITFlex align="center" gap={2}>
            <WriteoffStatusChip status={detail.status} />
            {actions}
          </ITFlex>
        }
      >
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={3}>
            <ITText muted className="text-[11px]">{t("writeoffs.detail.requestedBy")}</ITText>
            <ITFlex align="center" gap={2}>
              <ProfileAvatar name={detail.requestedBy.name} size="sm" />
              <ITText className="text-[12px] font-semibold">{detail.requestedBy.name}</ITText>
            </ITFlex>
            <ITText muted className="text-[11px]">{fmtDateTime(detail.date)}</ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("writeoffs.detail.reason")}</ITText>
            <ITText className="text-[12px] font-semibold">{detail.reason?.name ?? "—"}</ITText>
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITText muted className="text-[11px]">{t("writeoffs.detail.cost")}</ITText>
            <ITText className="text-[14px] font-bold tabular-nums">{money(detail.cost)}</ITText>
          </ITGrid>
          <ITGrid item xs={12} md={3}>
            <ITText muted className="text-[11px]">{t("writeoffs.detail.disposition")}</ITText>
            <ITText className="text-[12px] font-semibold">
              {detail.disposition ? tt(`writeoffs.disposition.${detail.disposition}`) : "—"}
            </ITText>
          </ITGrid>
          {detail.notes && (
            <ITGrid item xs={12}>
              <ITText muted className="text-[11px]">{t("writeoffs.detail.notes")}</ITText>
              <ITText className="text-[12px]">{detail.notes}</ITText>
            </ITGrid>
          )}
        </ITGrid>
      </PanelCard>

      <PanelCard title={t("writeoffs.detail.lines")}>
        <ITFlex direction="column" gap={3}>
          {detail.lines.map((line) => (
            <ITGrid key={line.id} container columns={12} spacing={3} className="items-center">
              <ITGrid item xs={12} md={6}>
                <ITText className="text-[12px] font-bold">{line.product.name}</ITText>
                <ITText muted className="font-mono text-[11px]">
                  {[line.product.code, line.product.size, line.lot?.code, line.location?.code].filter(Boolean).join(" · ")}
                </ITText>
              </ITGrid>
              <ITGrid item xs={12} md={3}>
                <ITText muted className="text-[11px]">{t("writeoffs.detail.quantity")}</ITText>
                <ITText className="text-[12px] tabular-nums">{fmt(line.quantity)}</ITText>
              </ITGrid>
            </ITGrid>
          ))}
        </ITFlex>
      </PanelCard>

      <PanelCard title={t("writeoffs.detail.photos")}>
        {detail.evidence.length === 0 ? (
          <ITText muted>{t("writeoffs.detail.noPhotos")}</ITText>
        ) : (
          <ITFlex gap={3} wrap="wrap">
            {detail.evidence.map((e) => (
              <EvidenceThumb key={e.id} id={id} evidence={e} />
            ))}
          </ITFlex>
        )}
      </PanelCard>

      <PanelCard title={t("writeoffs.detail.signatures")}>
        {detail.signatures.length === 0 ? (
          <ITText muted>{t("writeoffs.detail.noSignatures")}</ITText>
        ) : (
          <ITFlex direction="column" gap={2}>
            {detail.signatures.map((s) => (
              <ITFlex key={`${s.role}-${s.signedAt}`} align="center" gap={2}>
                <ProfileAvatar name={s.user.name} size="sm" />
                <ITText className="text-[12px] font-semibold">{s.user.name}</ITText>
                <ITChip size="sm" label={tt(`writeoffs.role.${s.role}`)} />
                <ITText muted className="text-[11px]">
                  {tt(`writeoffs.method.${s.method}`)} · {fmtDateTime(s.signedAt)}
                  {s.notes ? ` · ${s.notes}` : ""}
                </ITText>
              </ITFlex>
            ))}
          </ITFlex>
        )}
      </PanelCard>

      <ITDialog
        isOpen={mode !== null}
        onClose={() => setMode(null)}
        title={mode === "approve" ? t("writeoffs.detail.approveTitle") : t("writeoffs.detail.reject")}
      >
        <ITFlex direction="column" gap={3}>
          {mode === "approve" ? (
            <>
              <ITText muted className="text-[12px]">{t("writeoffs.detail.approveHint")}</ITText>
              <ITSelect
                name="writeoffDisposition"
                label={t("writeoffs.detail.disposition")}
                options={WRITEOFF_DISPOSITIONS.map((d) => ({ value: d, label: tt(`writeoffs.disposition.${d}`) }))}
                value={disposition}
                onChange={(e) => setDisposition(e.target.value as WriteoffDisposition)}
              />
            </>
          ) : null}
          <ITTextarea
            name="writeoffDecisionNotes"
            label={mode === "reject" ? t("writeoffs.detail.rejectNotes") : t("writeoffs.detail.reviewNotes")}
            rows={2}
            value={notes}
            onChange={(e) => setNotes(e)}
          />
          <ITCheckbox name="writeoffCosign" label={t("writeoffs.detail.cosign")} checked={cosign} onChange={setCosign} />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={() => setMode(null)} />
            {mode === "approve" ? (
              <ITButton
                variant="filled"
                color="primary"
                label={t("writeoffs.detail.confirmApprove")}
                disabled={busy || !disposition}
                onClick={() =>
                  void run((cosignToken) =>
                    writeoffApi.approve(id, { disposition: disposition as WriteoffDisposition, notes: notes.trim() || null, cosignToken })
                  )
                }
              />
            ) : (
              <ITButton
                variant="filled"
                color="danger"
                label={t("writeoffs.detail.confirmReject")}
                disabled={busy || !notes.trim()}
                onClick={() => void run((cosignToken) => writeoffApi.reject(id, { notes: notes.trim(), cosignToken }))}
              />
            )}
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
