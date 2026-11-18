import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITCheckbox,
  ITChip,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaCheck, FaClipboardCheck, FaTimes } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  WRITEOFF_DISPOSITIONS,
  writeoffApi,
  type WriteoffDetail,
  type WriteoffDisposition,
  type WriteoffEvidence,
  type WriteoffLine,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { fmt, fmtDateTime, money } from "../lib";
import WriteoffStatusChip from "./WriteoffStatusChip";
import { LuClipboardCheck } from "react-icons/lu";
import { DialogHeader } from "@shared/ui/dialog-header";
import { DialogFooter } from "@shared/ui/dialog-footer";
import { useSuccessToast } from "@app/toast/useSuccessToast";

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
  const notify = useSuccessToast();
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

  const lines = detail?.lines;
  const linesFetch = useMemo(() => makeClientTableFetch<WriteoffLine>(() => Promise.resolve(lines ?? [])), [lines]);
  const lineColumns: Column<WriteoffLine>[] = useMemo(
    () => [
      {
        key: "product.name",
        label: t("writeoffs.columns.product"),
        type: "string",
        width: 260,
        filter: true,
        render: (l) => (
          <ITFlex direction="column">
            <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
            <ITText muted className="font-mono text-[11px]">
              {[l.product.code, l.product.size, l.lot?.code, l.location?.code].filter(Boolean).join(" · ")}
            </ITText>
          </ITFlex>
        ),
      },
      { key: "quantity", label: t("writeoffs.detail.quantity"), type: "number", width: 100, render: (l) => <ITText className="text-[12px] tabular-nums">{fmt(l.quantity)}</ITText> },
    ],
    [t]
  );

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
      notify();
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
      {error && mode === null && (
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
        <ITDataTable
          showViewToggle={false}
          columns={lineColumns as unknown as Column<Record<string, unknown>>[]}
          fetchData={linesFetch as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
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
      >
      <DialogHeader icon={<LuClipboardCheck />} title={mode === "approve" ? t("writeoffs.detail.approveTitle") : t("writeoffs.detail.reject")} subtitle={mode === "approve" ? t("writeoffs.detail.approveSubtitle") : t("writeoffs.detail.rejectSubtitle")} />
        <ITFlex direction="column" gap={3}>
          {error && <ITAlert variant="error">{error}</ITAlert>}
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
          <DialogFooter
            onCancel={() => setMode(null)}
            onConfirm={() =>
              mode === "approve"
                ? void run((cosignToken) =>
                    writeoffApi.approve(id, { disposition: disposition as WriteoffDisposition, notes: notes.trim() || null, cosignToken })
                  )
                : void run((cosignToken) => writeoffApi.reject(id, { notes: notes.trim(), cosignToken }))
            }
            confirmLabel={mode === "approve" ? t("writeoffs.detail.confirmApprove") : t("writeoffs.detail.confirmReject")}
            busy={busy}
            danger={mode !== "approve"}
            disabled={mode === "approve" ? !disposition : !notes.trim()}
          />
        </ITFlex>
      </ITDialog>
    </ITFlex>
  );
}
