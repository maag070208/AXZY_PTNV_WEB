import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITBadget, ITButton, ITFlex, ITGrid, ITInputNumber, ITSearchSelect, ITSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  REVIEW_SHIFTS,
  hotelLinenApi,
  receptionApi,
  roomReviewApi,
  type HotelProduct,
  type HotelRoomOption,
  type ReviewShift,
  type RoomExpected,
} from "@entities/hotel-linen";
import { personLabel, usersApi } from "@entities/user";
import type { User } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import DiffChip from "./DiffChip";

interface Props {
  onDone: (id: string) => void;
  onCancel: () => void;
  /** Lleva al catálogo de dotación cuando la habitación no tiene. */
  onGoToPar: () => void;
}

const productLabel = (p: { code: string; name: string; size?: string | null }) => `${p.code} · ${p.name}${p.size ? ` · ${p.size}` : ""}`;

/** Nueva revisión: habitación, esperado por artículo, contado con diferencia en vivo y responsable. */
export default function RoomReviewForm({ onDone, onCancel, onGoToPar }: Props) {
  const { t } = useTranslation("hotel-linen-room-review");
  const tt = dyn(t);
  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);
  const [people, setPeople] = useState<User[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [roomId, setRoomId] = useState("");
  const [expected, setExpected] = useState<RoomExpected | null>(null);
  const [noPar, setNoPar] = useState(false);
  const [counts, setCounts] = useState<Record<string, number | null>>({});
  const [extraIds, setExtraIds] = useState<string[]>([]);
  const [extraPick, setExtraPick] = useState("");
  const [responsibleId, setResponsibleId] = useState("");
  const [shift, setShift] = useState<ReviewShift | "">("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([receptionApi.rooms(), usersApi.people(), hotelLinenApi.products()])
      .then(([r, p, prods]) => {
        if (!active) return;
        setRooms(r);
        setPeople(p.filter((u) => u.active));
        setProducts(prods.filter((x) => x.kind === "LINEN" && x.active));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  const pickRoom = (id: string) => {
    setRoomId(id);
    setExpected(null);
    setNoPar(false);
    setCounts({});
    setExtraIds([]);
    setError(null);
    if (!id) return;
    roomReviewApi
      .expected(id)
      .then((e) => setExpected(e))
      .catch((e: Error & { code?: string }) => {
        if (e.code === "HOTEL_ROOM_PAR_EMPTY") setNoPar(true);
        else setError(e.message);
      });
  };

  const roomOptions = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => (a.zone?.name ?? "").localeCompare(b.zone?.name ?? "") || a.number.localeCompare(b.number, undefined, { numeric: true }))
        .map((r) => ({ value: r.id, label: `${r.zone?.name ? `${r.zone.name} · ` : ""}${r.number}` })),
    [rooms]
  );
  const expectedIds = useMemo(() => new Set(expected?.expected.map((e) => e.product.id) ?? []), [expected]);
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const extraOptions = products
    .filter((p) => !expectedIds.has(p.id) && !extraIds.includes(p.id))
    .map((p) => ({ value: p.id, label: productLabel(p) }));

  const setCount = (productId: string, v: number | null) => setCounts((c) => ({ ...c, [productId]: v }));
  const valid = !!expected && !!responsibleId && !!shift && !busy;

  const submit = async () => {
    if (!expected || !shift || !valid) return;
    setBusy(true);
    setError(null);
    try {
      // Lo esperado sin capturar se manda como 0 (el servidor lo calcula igual).
      const lines = [...expected.expected.map((e) => e.product.id), ...extraIds].map((productId) => ({
        productId,
        counted: counts[productId] ?? 0,
      }));
      const created = await roomReviewApi.create({ roomId, responsibleId, shift, notes: notes.trim() || null, lines });
      onDone(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const composition = expected?.room;

  return (
    <PanelCard title={t("new.title")} description={t("new.description")}>
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="reviewRoom"
              label={t("new.room")}
              options={roomOptions}
              value={roomId}
              onChange={(v) => pickRoom(String(v ?? ""))}
              onClear={() => pickRoom("")}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="reviewResponsible"
              label={t("new.responsible")}
              options={people.map((p) => ({ value: p.id, label: personLabel(p) }))}
              value={responsibleId}
              onChange={(v) => setResponsibleId(String(v ?? ""))}
              onClear={() => setResponsibleId("")}
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSelect
              name="reviewShift"
              label={t("new.shift")}
              options={REVIEW_SHIFTS.map((s) => ({ value: s, label: tt(`shift.${s}`) }))}
              value={shift}
              onChange={(e) => setShift(e.target.value as ReviewShift)}
            />
          </ITGrid>
        </ITGrid>

        {noPar && (
          <ITAlert variant="warning">
            <ITFlex align="center" gap={3} wrap="wrap">
              <ITText className="text-[12px]">{t("new.noPar")}</ITText>
              <ITButton variant="outlined" color="primary" size="sm" label={t("new.goToPar")} onClick={onGoToPar} />
            </ITFlex>
          </ITAlert>
        )}

        {composition && (
          <ITFlex gap={2} wrap="wrap" align="center">
            <ITText muted className="text-[12px]">{`${composition.type.name} · ${composition.zone.name}`}</ITText>
            <ITBadget color="info" size="lg">{t("new.king", { n: composition.kingBeds })}</ITBadget>
            <ITBadget color="info" size="lg">{t("new.queen", { n: composition.queenBeds })}</ITBadget>
            <ITBadget color="info" size="lg">{t("new.sofa", { n: composition.sofaBeds })}</ITBadget>
            <ITBadget color="info" size="lg">{t("new.bathrooms", { n: composition.bathrooms })}</ITBadget>
          </ITFlex>
        )}

        {expected && (
          <ITFlex direction="column" gap={2}>
            <ITGrid container columns={12} spacing={3}>
              <ITGrid item xs={5}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.item")}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.expected")}</ITText></ITGrid>
              <ITGrid item xs={3}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.counted")}</ITText></ITGrid>
              <ITGrid item xs={2}><ITText muted className="text-[11px] font-bold uppercase">{t("columns.diff")}</ITText></ITGrid>
            </ITGrid>
            {expected.expected.map((e, index) => {
              const counted = counts[e.product.id] ?? null;
              return (
                <ITGrid key={e.product.id} container columns={12} spacing={3} className="items-center">
                  <ITGrid item xs={5}><ITText className="text-[12px] font-semibold">{productLabel(e.product)}</ITText></ITGrid>
                  <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">{e.quantity}</ITText></ITGrid>
                  <ITGrid item xs={3}>
                    <ITInputNumber name={`reviewCount${index}`} decimals={0} min={0} value={counted} onChange={(v) => setCount(e.product.id, v ?? null)} />
                  </ITGrid>
                  <ITGrid item xs={2}>{counted === null ? <ITText muted className="text-[12px]">—</ITText> : <DiffChip diff={counted - e.quantity} />}</ITGrid>
                </ITGrid>
              );
            })}

            {extraIds.map((id, index) => {
              const p = productById.get(id);
              const counted = counts[id] ?? null;
              return (
                <ITGrid key={id} container columns={12} spacing={3} className="items-center">
                  <ITGrid item xs={5}>
                    <ITFlex align="center" gap={2} wrap="wrap">
                      <ITText className="text-[12px] font-semibold">{p ? productLabel(p) : id}</ITText>
                      <ITBadget color="info" size="sm">{t("unexpected")}</ITBadget>
                    </ITFlex>
                  </ITGrid>
                  <ITGrid item xs={2}><ITText className="text-[12px] tabular-nums">0</ITText></ITGrid>
                  <ITGrid item xs={3}>
                    <ITInputNumber name={`reviewExtraCount${index}`} decimals={0} min={0} value={counted} onChange={(v) => setCount(id, v ?? null)} />
                  </ITGrid>
                  <ITGrid item xs={1}>{counted === null ? <ITText muted className="text-[12px]">—</ITText> : <DiffChip diff={counted} />}</ITGrid>
                  <ITGrid item xs={1}>
                    <ITButton variant="outlined" color="secondary" size="sm" title={t("new.removeExtra")} onClick={() => setExtraIds((l) => l.filter((x) => x !== id))}>
                      <FaTrash size={11} />
                    </ITButton>
                  </ITGrid>
                </ITGrid>
              );
            })}

            <ITGrid container columns={12} spacing={3} className="items-end">
              <ITGrid item xs={9} md={6}>
                <ITSearchSelect
                  name="reviewExtraPick"
                  label={t("new.addUnexpected")}
                  options={extraOptions}
                  value={extraPick}
                  onChange={(v) => setExtraPick(String(v ?? ""))}
                  onClear={() => setExtraPick("")}
                />
              </ITGrid>
              <ITGrid item xs={3} md={2}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  icon={<FaPlus size={12} />}
                  label={t("new.add")}
                  disabled={!extraPick}
                  onClick={() => {
                    setExtraIds((l) => [...l, extraPick]);
                    setExtraPick("");
                  }}
                />
              </ITGrid>
            </ITGrid>
            <ITText muted className="text-[11px]">{t("new.uncountedHint")}</ITText>
          </ITFlex>
        )}

        <ITTextarea name="reviewNotes" label={t("new.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("cancel")} onClick={onCancel} />
          <ITButton variant="filled" color="primary" label={t("new.submit")} disabled={!valid} onClick={() => void submit()} />
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
