import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITChip,
  ITDatePicker,
  ITFlex,
  ITGrid,
  ITInputNumber,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaChevronLeft, FaChevronRight, FaEye, FaFilePdf, FaPaperPlane, FaSave } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  amenityApi,
  hotelLinenApi,
  type AmenityControlDetail,
  type AmenityControlStatus,
  type AmenityLine,
  type AmenityPreview,
  type AmenitySignature,
  type HotelWarehouse,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { computeLine, dateStrToLocal, fmt, fmtDateTime, fmtDay, fmtPct, localToDateStr, shiftDays, todayStr } from "../lib";
import { downloadAmenityControlPdf } from "../pdf/download";
import AmenityStatusChip from "./AmenityStatusChip";

interface Sheet {
  id: string | null;
  folio: string | null;
  status: AmenityControlStatus;
  warehouseId: string;
  areaName: string;
  weekFrom: string;
  weekTo: string;
  rooms: number | null;
  occupiedNights: number;
  override: number | null;
  notes: string;
  lines: AmenityLine[];
  signatures: AmenitySignature[];
  existing: AmenityPreview["existing"];
}

const fromDetail = (d: AmenityControlDetail): Sheet => ({
  id: d.id,
  folio: d.folio,
  status: d.status,
  warehouseId: d.warehouseId,
  areaName: d.area.name,
  weekFrom: d.weekFrom,
  weekTo: d.weekTo,
  rooms: null,
  occupiedNights: d.occupiedNights,
  override: d.occupiedNightsOverride,
  notes: d.notes ?? "",
  lines: d.lines,
  signatures: d.signatures,
  existing: null,
});

const fromPreview = (p: AmenityPreview): Sheet => ({
  id: null,
  folio: null,
  status: "DRAFT",
  warehouseId: p.warehouse.id,
  areaName: p.warehouse.name,
  weekFrom: p.weekFrom,
  weekTo: p.weekTo,
  rooms: p.rooms,
  occupiedNights: p.occupiedNights,
  override: p.occupiedNightsOverride,
  notes: "",
  lines: p.lines,
  signatures: [],
  existing: p.existing,
});

const numCell = "text-[12px] tabular-nums text-right";
const COLS = ["standard", "initial", "supplied", "extras", "final", "real", "expected", "diff"] as const;

interface Props {
  /** Sin id = control nuevo (selector de área y semana). */
  id?: string;
}

/**
 * Control semanal de amenidades (formato pág. 19): estándar, inicial, surtido, extras, final capturable,
 * real, esperado y diferencia % (chip rojo si > 10%). Firmas elabora / revisa / enterado.
 */
export default function AmenityControlView({ id }: Props) {
  const { t } = useTranslation("hotel-linen-amenity");
  const tt = dyn(t);
  const navigate = useNavigate();
  const canControl = useCan("hotel_linen.amenities_control");
  const canAcknowledge = useCan("hotel_linen.reports");
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);
  const [areaId, setAreaId] = useState("");
  const [anchor, setAnchor] = useState(todayStr());
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [finals, setFinals] = useState<Record<string, number | null>>({});
  const [loading, setLoading] = useState(!!id);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const adopt = useCallback((next: Sheet) => {
    setSheet(next);
    setFinals(Object.fromEntries(next.lines.map((l) => [l.product.id, l.finalStock])));
  }, []);

  useEffect(() => {
    if (id) return;
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setAreas(list.filter((w) => w.kind === "ZONE")))
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [id]);

  // Control existente.
  useEffect(() => {
    if (!id) return;
    let active = true;
    setLoading(true);
    amenityApi
      .get(id)
      .then((d) => active && (adopt(fromDetail(d)), setError(null)))
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, adopt]);

  // Control nuevo: vista previa al elegir área y semana.
  useEffect(() => {
    if (id || !areaId) return;
    let active = true;
    setLoading(true);
    amenityApi
      .preview(areaId, anchor)
      .then((p) => active && (adopt(fromPreview(p)), setError(null)))
      .catch((e: Error) => active && (setSheet(null), setError(e.message)))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id, areaId, anchor, adopt]);

  const editable = !!sheet && sheet.status === "DRAFT" && canControl && !sheet.existing;
  const nights = sheet ? (sheet.override ?? sheet.occupiedNights) : 0;
  const lines = useMemo(
    () => (sheet ? sheet.lines.map((l) => computeLine(nights, l, finals[l.product.id] ?? l.finalStock)) : []),
    [sheet, finals, nights]
  );
  const flagged = lines.filter((l) => l.flagged).length;

  const persist = async (): Promise<AmenityControlDetail | null> => {
    if (!sheet) return null;
    return amenityApi.save({
      warehouseId: sheet.warehouseId,
      weekFrom: sheet.weekFrom,
      occupiedNightsOverride: sheet.override,
      notes: sheet.notes.trim() || null,
      lines: sheet.lines.map((l) => ({ productId: l.product.id, finalStock: finals[l.product.id] ?? l.finalStock })),
    });
  };

  const run = async (action: () => Promise<AmenityControlDetail | null>) => {
    setBusy(true);
    setError(null);
    try {
      const d = await action();
      if (!d) return;
      if (!id) navigate(`/linen/amenities/${d.id}`, { replace: true });
      else adopt(fromDetail(d));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const status = sheet?.status;
  const actions = sheet && (
    <ITFlex gap={2} align="center">
      {editable && (
        <ITButton variant="outlined" color="primary" icon={<FaSave size={12} />} label={t("actions.save")} disabled={busy} onClick={() => void run(persist)} />
      )}
      {editable && (
        <ITButton
          variant="filled"
          color="primary"
          icon={<FaPaperPlane size={12} />}
          label={t("actions.submit")}
          disabled={busy}
          onClick={() => void run(async () => amenityApi.submit((await persist())!.id))}
        />
      )}
      {sheet.id && status === "SUBMITTED" && canControl && (
        <ITButton variant="filled" color="primary" icon={<FaEye size={12} />} label={t("actions.review")} disabled={busy} onClick={() => void run(() => amenityApi.review(sheet.id!))} />
      )}
      {sheet.id && status === "REVIEWED" && canAcknowledge && (
        <ITButton variant="filled" color="primary" icon={<FaCheck size={12} />} label={t("actions.acknowledge")} disabled={busy} onClick={() => void run(() => amenityApi.acknowledge(sheet.id!))} />
      )}
      <ITButton
        variant="outlined"
        color="secondary"
        icon={<FaFilePdf size={12} />}
        label={t("actions.pdf")}
        disabled={busy || lines.length === 0}
        onClick={() =>
          void downloadAmenityControlPdf({
            folio: sheet.folio,
            areaName: sheet.areaName,
            weekFrom: sheet.weekFrom,
            weekTo: sheet.weekTo,
            occupiedNights: nights,
            lines,
            signatures: sheet.signatures,
          })
        }
      />
    </ITFlex>
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {!id && (
        <PanelCard title={t("form.title")} description={t("form.description")}>
          <ITGrid container columns={12} spacing={3} className="items-end">
            <ITGrid item xs={12} md={4}>
              <ITSelect
                name="amenityArea"
                label={t("form.area")}
                options={areas.map((a) => ({ value: a.id, label: a.name }))}
                value={areaId}
                onChange={(e) => setAreaId(e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITFlex gap={2} align="end">
                <ITButton variant="outlined" color="primary" icon={<FaChevronLeft size={12} />} aria-label={t("form.previous")} onClick={() => setAnchor((a) => shiftDays(a, -7))} />
                <ITDatePicker
                  name="amenityWeek"
                  label={t("form.weekOf")}
                  value={dateStrToLocal(anchor)}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v instanceof Date) setAnchor(localToDateStr(v));
                  }}
                />
                <ITButton variant="outlined" color="primary" icon={<FaChevronRight size={12} />} aria-label={t("form.next")} onClick={() => setAnchor((a) => shiftDays(a, 7))} />
              </ITFlex>
            </ITGrid>
          </ITGrid>
        </PanelCard>
      )}

      {sheet?.existing && (
        <ITAlert variant="warning">
          {t("form.exists", { folio: sheet.existing.folio })}{" "}
          <Link to={`/linen/amenities/${sheet.existing.id}`} className="font-bold underline">
            {t("form.open")}
          </Link>
        </ITAlert>
      )}

      {loading && <ITText muted>{t("loading")}</ITText>}
      {!sheet && !loading && !id && <ITText muted>{t("form.pick")}</ITText>}

      {sheet && (
        <>
          <PanelCard
            title={sheet.folio ?? t("sheet.newTitle")}
            description={`${sheet.areaName} · ${fmtDay(sheet.weekFrom)} – ${fmtDay(sheet.weekTo)}`}
            actions={
              <ITFlex align="center" gap={2}>
                <AmenityStatusChip status={sheet.status} />
                {actions}
              </ITFlex>
            }
          >
            <ITGrid container columns={12} spacing={3} className="items-end">
              <ITGrid item xs={6} md={3}>
                <KpiTile label={t("sheet.calculated")} value={sheet.occupiedNights} size="sm" hint={sheet.rooms ? t("sheet.rooms", { count: sheet.rooms }) : undefined} />
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                {editable ? (
                  <ITInputNumber
                    name="amenityOverride"
                    label={t("sheet.override")}
                    decimals={0}
                    min={0}
                    value={sheet.override}
                    onChange={(v) => setSheet((s) => (s ? { ...s, override: v ?? null } : s))}
                  />
                ) : (
                  <KpiTile label={t("sheet.override")} value={sheet.override ?? "—"} size="sm" />
                )}
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <KpiTile label={t("sheet.effective")} value={nights} size="sm" tone="sky" />
              </ITGrid>
              <ITGrid item xs={6} md={3}>
                <KpiTile label={t("sheet.flagged")} value={flagged} size="sm" tone={flagged > 0 ? "rose" : "emerald"} />
              </ITGrid>
            </ITGrid>
          </PanelCard>

          <PanelCard title={t("sheet.linesTitle")} description={t("sheet.formula")}>
            {lines.length === 0 ? (
              <ITText muted>{t("sheet.noLines")}</ITText>
            ) : (
              <div className="overflow-x-auto">
                <ITFlex direction="column" gap={2} className="min-w-[980px]">
                  <ITFlex gap={2} align="center">
                    <div className="w-56 shrink-0"><ITText muted className="text-[11px]">{t("sheet.item")}</ITText></div>
                    {COLS.map((c) => (
                      <div key={c} className="w-24 shrink-0"><ITText muted className="text-right text-[11px]">{t(`sheet.col.${c}`)}</ITText></div>
                    ))}
                  </ITFlex>
                  {lines.map((l) => (
                    <ITFlex key={l.product.id} gap={2} align="center">
                      <div className="w-56 shrink-0">
                        <ITText className="text-[12px] font-bold">{l.product.name}</ITText>
                        <ITText muted className="font-mono text-[11px]">{`${l.product.code} · ${l.product.unit}`}</ITText>
                      </div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.standardPerRoom)}</ITText></div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.initialStock)}</ITText></div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.supplied)}</ITText></div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.extras)}</ITText></div>
                      <div className="w-24 shrink-0">
                        {editable ? (
                          <ITInputNumber
                            name={`amenityFinal-${l.product.id}`}
                            decimals={0}
                            min={0}
                            value={finals[l.product.id] ?? l.finalStock}
                            onChange={(v) => setFinals((f) => ({ ...f, [l.product.id]: v ?? null }))}
                          />
                        ) : (
                          <ITText className={numCell}>{fmt(l.finalStock)}</ITText>
                        )}
                      </div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.realConsumption)}</ITText></div>
                      <div className="w-24 shrink-0"><ITText className={numCell}>{fmt(l.expectedConsumption)}</ITText></div>
                      <div className="flex w-24 shrink-0 justify-end">
                        <ITChip size="sm" color={l.flagged ? "danger" : "gray"} label={fmtPct(l.diffPct)} />
                      </div>
                    </ITFlex>
                  ))}
                </ITFlex>
              </div>
            )}
          </PanelCard>

          {editable && (
            <PanelCard title={t("sheet.notes")}>
              <ITTextarea name="amenityNotes" rows={2} value={sheet.notes} onChange={(e) => setSheet((s) => (s ? { ...s, notes: e } : s))} />
            </PanelCard>
          )}

          <PanelCard title={t("sheet.signatures")}>
            {sheet.signatures.length === 0 ? (
              <ITText muted>{t("sheet.noSignatures")}</ITText>
            ) : (
              <ITFlex direction="column" gap={2}>
                {sheet.signatures.map((s) => (
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
        </>
      )}
    </ITFlex>
  );
}
