import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITFlex, ITGrid, ITInput, ITInputNumber, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  EXTRA_STATUSES,
  hotelLinenApi,
  receptionApi,
  type ExtrasBoard,
  type HotelProduct,
  type HotelRoomOption,
  type RoomExtra,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import CollectDialog from "./CollectDialog";

interface Props {
  /** La página provee la co-firma (las features no se importan entre sí). */
  requestCosign: (title: string) => Promise<string | null>;
}

const fmt = (n: number) => new Intl.NumberFormat("es-MX", { maximumFractionDigits: 2 }).format(n);
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");
const STATUS_COLOR: Record<string, "primary" | "success" | "warning" | "danger" | "secondary"> = {
  REQUESTED: "warning",
  DELIVERED: "primary",
  COLLECTED: "success",
  MISSING: "danger",
  CANCELLED: "secondary",
};

/** Adicionales a habitación: vista de Recepción (registrar) y de la supervisora (tablero por zona). */
export default function ExtrasView({ requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const tt = dyn(t);
  const canCreate = useCan("hotel_linen.extras_create");
  const canCollect = useCan("hotel_linen.extras_collect");

  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [board, setBoard] = useState<ExtrasBoard | null>(null);
  const [roomId, setRoomId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState<number | null>(1);
  const [notes, setNotes] = useState("");
  const [reload, setReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [collecting, setCollecting] = useState<RoomExtra | null>(null);

  useEffect(() => {
    let active = true;
    if (canCreate) {
      Promise.all([receptionApi.rooms(), hotelLinenApi.products()])
        .then(([r, p]) => {
          if (!active) return;
          setRooms(r);
          const list = p.filter((x) => (x.kind === "LINEN" || x.kind === "CONSUMABLE") && x.active);
          setProducts(list);
          setProductId((cur) => cur || list[0]?.id || "");
        })
        .catch((e) => active && setError((e as Error).message));
    }
    return () => {
      active = false;
    };
  }, [canCreate]);

  useEffect(() => {
    if (!canCollect) return;
    let active = true;
    receptionApi
      .extrasBoard()
      .then((b) => active && setBoard(b))
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [canCollect, reload]);

  const refresh = () => setReload((n) => n + 1);

  const run = async (fn: () => Promise<unknown>) => {
    setError(null);
    try {
      await fn();
      refresh();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const submit = async () => {
    if (!roomId || !productId || !qty) return;
    setBusy(true);
    await run(async () => {
      await receptionApi.createExtra({ roomId, productId, quantity: qty, notes: notes.trim() || null });
      setQty(1);
      setNotes("");
    });
    setBusy(false);
  };

  const deliver = (extra: RoomExtra, cosigned: boolean) =>
    run(async () => {
      let token: string | null = null;
      if (cosigned) {
        token = await requestCosign(t("extras.board.cosignTitle"));
        if (!token) return;
      }
      await receptionApi.deliverExtra(extra.id, token);
    });

  const fetchData = useCallback((params: Parameters<typeof receptionApi.extrasTable>[0]) => receptionApi.extrasTable(params), []);

  const columns: Column<RoomExtra>[] = useMemo(
    () => [
      { key: "requestedAt", label: t("extras.columns.date"), type: "date", width: 150, filter: "date-range", render: (r) => <ITText className="text-[12px]">{fmtDateTime(r.requestedAt)}</ITText> },
      { key: "room", label: t("extras.columns.room"), type: "string", width: 100, sortable: false, render: (r) => <ITText className="text-[12px] font-bold">{r.room.number}</ITText> },
      { key: "product", label: t("extras.columns.product"), type: "string", width: 200, sortable: false, render: (r) => <ITText className="text-[12px]">{r.quantity} × {r.product.name}</ITText> },
      { key: "kind", label: t("extras.columns.kind"), type: "string", width: 120, sortable: false, render: (r) => <ITText className="text-[12px]">{tt(`kind.${r.kind}`)}</ITText> },
      { key: "requestedBy", label: t("extras.columns.requestedBy"), type: "string", width: 150, sortable: false, render: (r) => <ITText className="text-[12px]">{r.requestedBy.name}</ITText> },
      {
        key: "status",
        label: t("extras.columns.status"),
        type: "catalog",
        width: 150,
        filter: "catalog",
        sortable: false,
        catalogOptions: { data: EXTRA_STATUSES.map((s) => ({ id: s, name: tt(`extraStatus.${s}`) })) },
        render: (r) => (
          <ITChip
            size="sm"
            color={STATUS_COLOR[r.status]}
            label={r.kind === "CONSUMABLE" && r.status === "DELIVERED" ? tt("extraStatus.CONSUMED") : tt(`extraStatus.${r.status}`)}
          />
        ),
      },
      { key: "missingQty", label: t("extras.columns.missing"), type: "number", width: 100, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{r.missingQty > 0 ? fmt(r.missingQty) : "—"}</ITText> },
    ],
    [t, tt]
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}

      {canCreate && (
        <PanelCard title={t("extras.new.title")} description={t("extras.new.description")}>
          <ITGrid container spacing={2}>
            <ITGrid item xs={12} md={3}>
              <ITSelect name="extraRoom" label={t("extras.new.room")} options={[{ value: "", label: t("extras.new.pickRoom") }, ...rooms.map((r) => ({ value: r.id, label: r.zone ? `${r.number} · ${r.zone.name}` : r.number }))]} value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={3}>
              <ITSelect name="extraProduct" label={t("extras.new.product")} options={products.map((p) => ({ value: p.id, label: p.name }))} value={productId} onChange={(e) => setProductId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInputNumber name="extraQty" label={t("extras.new.quantity")} decimals={0} min={0} value={qty} onChange={(v) => setQty(v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={4}>
              <ITInput name="extraNotes" label={t("extras.new.notes")} value={notes} onChange={(e) => setNotes(e.target.value)} />
            </ITGrid>
          </ITGrid>
          <ITFlex justify="end" className="mt-3">
            <ITButton variant="filled" color="primary" label={t("extras.new.submit")} disabled={busy || !roomId || !productId || !qty} onClick={() => void submit()} />
          </ITFlex>
        </PanelCard>
      )}

      {canCollect && (
        <PanelCard title={t("extras.board.title")} description={t("extras.board.description")}>
          {board && board.zones.length === 0 && <ITText muted>{t("extras.board.empty")}</ITText>}
          <ITFlex direction="column" gap={4}>
            {board?.zones.map((z) => (
              <ITFlex key={z.zone.id} direction="column" gap={2}>
                <ITText className="font-bold">{z.zone.name}</ITText>
                {z.rooms.map((r) => (
                  <ITFlex key={r.room.id} direction="column" gap={1} className={`rounded-lg border p-3 ${r.collectNow ? "border-amber-400 bg-amber-50" : "border-slate-200"}`}>
                    <ITFlex align="center" gap={2}>
                      <ITText className="font-semibold">{t("extras.board.room", { number: r.room.number })}</ITText>
                      <ITChip size="sm" color="secondary" label={tt(`roomStatus.${r.room.status}`)} />
                      {r.collectNow && <ITChip size="sm" color="warning" label={t("extras.board.collectNow")} />}
                    </ITFlex>
                    {r.extras.map((e) => (
                      <ITFlex key={e.id} align="center" justify="between" gap={2}>
                        <ITText className="text-[13px]">
                          {e.quantity} × {e.product.name} <span className="text-slate-400">· {e.kind === "CONSUMABLE" && e.status === "DELIVERED" ? tt("extraStatus.CONSUMED") : tt(`extraStatus.${e.status}`)}{e.notes ? ` · ${e.notes}` : ""}</span>
                        </ITText>
                        <ITFlex gap={2}>
                          {e.status === "REQUESTED" && (
                            <>
                              <ITButton size="sm" variant="filled" color="primary" label={t("extras.board.deliver")} onClick={() => void deliver(e, false)} />
                              <ITButton size="sm" variant="outlined" color="primary" label={t("extras.board.deliverCosign")} onClick={() => void deliver(e, true)} />
                            </>
                          )}
                          {e.status === "DELIVERED" && e.kind === "LINEN" && (
                            <ITButton size="sm" variant="filled" color="primary" label={t("extras.board.collect")} onClick={() => setCollecting(e)} />
                          )}
                        </ITFlex>
                      </ITFlex>
                    ))}
                  </ITFlex>
                ))}
              </ITFlex>
            ))}
          </ITFlex>
        </PanelCard>
      )}

      <PanelCard title={t("extras.table.title")}>
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchData as never}
          reloadTrigger={reload}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>

      <CollectDialog extra={collecting} onClose={() => setCollecting(null)} onDone={() => { setCollecting(null); refresh(); }} />
    </ITFlex>
  );
}
