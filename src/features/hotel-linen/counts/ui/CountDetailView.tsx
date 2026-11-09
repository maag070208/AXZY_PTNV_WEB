import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITConfirmDialog, ITFlex, ITGrid, ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { GRADES, writeoffApi, type Grade, type StocktakeDetail } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { PanelCard } from "@shared/ui/panel-card";
import CountStatusChip from "./CountStatusChip";

type GradeDraft = Record<Grade, number | null>;
const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const num = (v: number | string | null | undefined) => (v === null || v === undefined ? null : Number(v));

const emptyDraft = (): GradeDraft => ({ A: null, B: null, C: null, D: null, E: null });
const totalOf = (d: GradeDraft) => GRADES.reduce((s, g) => s + (d[g] ?? 0), 0);
const touched = (d: GradeDraft) => GRADES.some((g) => d[g] !== null);

interface Props {
  id: string;
}

/** Toma de inventario: captura ciega A–E por artículo × ubicación, cierre, revisión de diferencias y aprobación. */
export default function CountDetailView({ id }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const linenCount = useCan("hotel_linen.count");
  const storeCount = useCan("hotel_store.stocktake");
  const linenApprove = useCan("hotel_linen.count_approve");
  const storeApprove = useCan("hotel_store.adjust_approve");
  const canCount = linenCount || storeCount;
  const canApprove = linenApprove || storeApprove;
  const [detail, setDetail] = useState<StocktakeDetail | null>(null);
  const [drafts, setDrafts] = useState<Record<string, GradeDraft>>({});
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmApprove, setConfirmApprove] = useState(false);

  const hydrate = (d: StocktakeDetail) => {
    setDetail(d);
    setDrafts(
      Object.fromEntries(
        d.lines.map((l) => [
          l.id,
          { A: num(l.gradeA), B: num(l.gradeB), C: num(l.gradeC), D: num(l.gradeD), E: num(l.gradeE) } as GradeDraft,
        ])
      )
    );
    setDirty(new Set());
  };

  const load = useCallback(() => {
    writeoffApi
      .stocktake(id)
      .then((d) => {
        hydrate(d);
        setError(null);
      })
      .catch((e: Error) => setError(e.message));
  }, [id]);

  useEffect(load, [load]);

  const lines = useMemo(
    () => [...(detail?.lines ?? [])].sort((a, b) => a.product.name.localeCompare(b.product.name) || a.location.code.localeCompare(b.location.code)),
    [detail]
  );

  if (!detail) {
    return error ? <ITAlert variant="error">{error}</ITAlert> : <ITText muted>{t("common.loading")}</ITText>;
  }

  const counting = detail.status === "COUNTING";
  const review = detail.status === "PENDING_APPROVAL";

  const act = async (fn: () => Promise<unknown>, message?: string) => {
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await fn();
      if (message) setInfo(message);
      hydrate(await writeoffApi.stocktake(id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const setGrade = (lineId: string, grade: Grade, value: number | null) => {
    setDrafts((m) => ({ ...m, [lineId]: { ...(m[lineId] ?? emptyDraft()), [grade]: value } }));
    setDirty((s) => new Set(s).add(lineId));
  };

  const save = () =>
    act(async () => {
      const payload = lines
        .filter((l) => dirty.has(l.id) && drafts[l.id] && touched(drafts[l.id]))
        .map((l) => {
          const d = drafts[l.id];
          return {
            productId: l.productId,
            locationId: l.locationId,
            gradeA: d.A ?? 0,
            gradeB: d.B ?? 0,
            gradeC: d.C ?? 0,
            gradeD: d.D ?? 0,
            gradeE: d.E ?? 0,
          };
        });
      if (payload.length > 0) await writeoffApi.captureStocktake(id, payload);
    }, t("counts.detail.saved"));

  const actions = (
    <ITFlex align="center" gap={2}>
      <CountStatusChip status={detail.status} />
      {detail.status === "DRAFT" && canCount && (
        <ITButton variant="filled" color="primary" label={t("counts.detail.start")} disabled={busy} onClick={() => void act(() => writeoffApi.startStocktake(id))} />
      )}
      {counting && canCount && (
        <>
          <ITButton variant="outlined" color="primary" label={t("counts.detail.save")} disabled={busy || dirty.size === 0} onClick={() => void save()} />
          <ITButton
            variant="filled"
            color="primary"
            label={t("counts.detail.close")}
            disabled={busy || dirty.size > 0}
            onClick={() => void act(() => writeoffApi.closeStocktake(id))}
          />
        </>
      )}
      {review && canApprove && (
        <ITButton variant="filled" color="primary" label={t("counts.detail.approve")} disabled={busy} onClick={() => setConfirmApprove(true)} />
      )}
      {(detail.status === "DRAFT" || counting || review) && canCount && (
        <ITButton variant="outlined" color="danger" label={t("counts.detail.cancel")} disabled={busy} onClick={() => void act(() => writeoffApi.cancelStocktake(id))} />
      )}
    </ITFlex>
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      {info && (
        <ITAlert variant="success" dismissible onDismiss={() => setInfo(null)}>
          {info}
        </ITAlert>
      )}

      <PanelCard title={detail.folio} description={detail.notes ?? undefined} actions={actions}>
        {detail.status === "DRAFT" ? (
          <ITText muted>{t("counts.detail.pendingEmpty")}</ITText>
        ) : lines.length === 0 ? (
          <ITText muted>{t("counts.detail.empty")}</ITText>
        ) : (
          <ITFlex direction="column" gap={4}>
            {counting && <ITText muted className="text-[11px]">{t("counts.detail.gradesHint")}</ITText>}
            {lines.map((line) => {
              const draft = drafts[line.id] ?? emptyDraft();
              const system = num(line.systemQty);
              const counted = num(line.countedQty);
              const difference = counted !== null && system !== null ? counted - system : null;
              return (
                <ITGrid key={line.id} container columns={12} spacing={3} className="items-end">
                  <ITGrid item xs={12} md={counting ? 3 : 4}>
                    <ITText className="text-[12px] font-bold">{line.product.name}</ITText>
                    <ITText muted className="font-mono text-[11px]">{[line.product.code, line.location.code].join(" · ")}</ITText>
                  </ITGrid>
                  {counting && canCount ? (
                    <>
                      {GRADES.map((g) => (
                        <ITGrid key={g} item xs={4} md={1}>
                          <ITInputNumber
                            name={`grade-${line.id}-${g}`}
                            label={t(`counts.grade.${g}`).split(" ")[0]}
                            decimals={0}
                            min={0}
                            value={draft[g]}
                            onChange={(v) => setGrade(line.id, g, v ?? null)}
                          />
                        </ITGrid>
                      ))}
                      <ITGrid item xs={4} md={2}>
                        <ITText muted className="text-[11px]">{t("counts.detail.total")}</ITText>
                        <ITText className="text-[14px] font-bold tabular-nums">{fmt(totalOf(draft))}</ITText>
                      </ITGrid>
                    </>
                  ) : (
                    <>
                      {GRADES.map((g) => (
                        <ITGrid key={g} item xs={2} md={1}>
                          <ITText muted className="text-[11px]">{g}</ITText>
                          <ITText className="text-[12px] tabular-nums">{draft[g] === null ? "—" : fmt(draft[g] as number)}</ITText>
                        </ITGrid>
                      ))}
                      <ITGrid item xs={4} md={1}>
                        <ITText muted className="text-[11px]">{t("counts.detail.total")}</ITText>
                        <ITText className="text-[12px] font-bold tabular-nums">{counted === null ? "—" : fmt(counted)}</ITText>
                      </ITGrid>
                      {review && (
                        <>
                          <ITGrid item xs={4} md={1}>
                            <ITText muted className="text-[11px]">{t("counts.detail.system")}</ITText>
                            <ITText className="text-[12px] tabular-nums">{system === null ? "—" : fmt(system)}</ITText>
                          </ITGrid>
                          <ITGrid item xs={4} md={1}>
                            <ITText muted className="text-[11px]">{t("counts.detail.difference")}</ITText>
                            <ITText className={`text-[12px] tabular-nums ${difference ? "font-bold text-[var(--color-warning)]" : ""}`}>
                              {difference === null ? "—" : fmt(difference)}
                            </ITText>
                          </ITGrid>
                        </>
                      )}
                    </>
                  )}
                </ITGrid>
              );
            })}
          </ITFlex>
        )}
      </PanelCard>

      <ITConfirmDialog
        isOpen={confirmApprove}
        onClose={() => setConfirmApprove(false)}
        onConfirm={() => {
          setConfirmApprove(false);
          void act(() => writeoffApi.approveStocktake(id));
        }}
        title={t("counts.detail.approve")}
        message={t("counts.detail.confirmApprove")}
        confirmLabel={t("counts.detail.approve")}
        cancelLabel={t("common.cancel")}
        loading={busy}
      />
    </ITFlex>
  );
}
