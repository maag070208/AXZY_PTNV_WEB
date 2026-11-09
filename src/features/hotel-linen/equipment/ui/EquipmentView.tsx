import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITChip, ITDataTable, ITFlex, ITGrid, ITInputNumber, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaTools } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  EQUIPMENT_STATUSES,
  hotelLinenApi,
  receptionApi,
  type EquipmentBoard,
  type EquipmentLoan,
  type EquipmentUnit,
  type HotelProduct,
  type HotelRoomOption,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { dyn } from "@shared/i18n/dyn";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import ReturnEquipmentDialog from "./ReturnEquipmentDialog";

interface Props {
  requestCosign: (title: string) => Promise<string | null>;
}

const STATUS_COLOR: Record<string, "primary" | "success" | "warning" | "danger" | "secondary"> = {
  AVAILABLE: "success",
  LOANED: "primary",
  IN_REPAIR: "warning",
  MISSING: "danger",
  RETIRED: "secondary",
};
const TONE: Record<string, "emerald" | "sky" | "amber" | "rose" | "neutral"> = {
  AVAILABLE: "emerald",
  LOANED: "sky",
  IN_REPAIR: "amber",
  MISSING: "rose",
  RETIRED: "neutral",
};
const fmtDateTime = (iso: string) => new Date(iso).toLocaleString("es-MX");

/** Equipos por pieza: inventario con etiqueta, alta, préstamos activos por habitación, retiro con estado B/D/F. */
export default function EquipmentView({ requestCosign }: Props) {
  const { t } = useTranslation("hotel-linen-reception");
  const tt = dyn(t);
  const canManage = useCan("hotel_linen.equipment_manage");
  const canLend = useCan("hotel_linen.equipment_loan");

  const [board, setBoard] = useState<EquipmentBoard | null>(null);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [rooms, setRooms] = useState<HotelRoomOption[]>([]);
  const [available, setAvailable] = useState<EquipmentUnit[]>([]);
  const [reload, setReload] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState<EquipmentLoan | null>(null);

  // Alta de piezas
  const [newProduct, setNewProduct] = useState("");
  const [newQty, setNewQty] = useState<number | null>(1);
  // Préstamo
  const [unitId, setUnitId] = useState("");
  const [roomId, setRoomId] = useState("");

  useEffect(() => {
    let active = true;
    Promise.all([
      receptionApi.equipmentBoard(),
      receptionApi.units("AVAILABLE"),
      canManage ? hotelLinenApi.products() : Promise.resolve([] as HotelProduct[]),
      canLend ? receptionApi.rooms() : Promise.resolve([] as HotelRoomOption[]),
    ])
      .then(([b, units, p, r]) => {
        if (!active) return;
        setBoard(b);
        setAvailable(units);
        setUnitId((cur) => (units.some((u) => u.id === cur) ? cur : (units[0]?.id ?? "")));
        const eq = p.filter((x) => x.kind === "EQUIPMENT" && x.active);
        setProducts(eq);
        setNewProduct((cur) => cur || eq[0]?.id || "");
        setRooms(r);
      })
      .catch((e) => active && setError((e as Error).message));
    return () => {
      active = false;
    };
  }, [reload, canManage, canLend]);

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

  const deliver = (loan: EquipmentLoan, cosigned: boolean) =>
    run(async () => {
      let token: string | null = null;
      if (cosigned) {
        token = await requestCosign(t("equipment.loans.cosignTitle"));
        if (!token) return;
      }
      await receptionApi.deliverEquipment(loan.id, token);
    });

  const columns: Column<EquipmentUnit>[] = useMemo(
    () => [
      { key: "tag", label: t("equipment.columns.tag"), type: "string", width: 110, filter: true, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.tag}</ITText> },
      { key: "product", label: t("equipment.columns.product"), type: "string", width: 220, sortable: false, render: (r) => <ITText className="text-[12px]">{r.product.name}</ITText> },
      {
        key: "status",
        label: t("equipment.columns.status"),
        type: "catalog",
        width: 150,
        filter: "catalog",
        sortable: false,
        catalogOptions: { data: EQUIPMENT_STATUSES.map((s) => ({ id: s, name: tt(`equipmentStatus.${s}`) })) },
        render: (r) => <ITChip size="sm" color={STATUS_COLOR[r.status]} label={tt(`equipmentStatus.${r.status}`)} />,
      },
      { key: "notes", label: t("equipment.columns.notes"), type: "string", width: 200, sortable: false, render: (r) => <ITText className="text-[12px]">{r.notes ?? "—"}</ITText> },
      {
        key: "actions",
        label: "",
        type: "string",
        width: 160,
        sortable: false,
        render: (r) =>
          !canManage ? null : (
            <ITFlex gap={2}>
              {r.status === "IN_REPAIR" && <ITButton size="sm" variant="filled" color="primary" label={t("equipment.repaired")} onClick={() => void run(() => receptionApi.repaired(r.id))} />}
              {(r.status === "AVAILABLE" || r.status === "IN_REPAIR" || r.status === "MISSING") && (
                <ITButton size="sm" variant="outlined" color="secondary" label={t("equipment.retire")} onClick={() => void run(() => receptionApi.patchUnit(r.id, { status: "RETIRED" }))} />
              )}
              {(r.status === "RETIRED" || r.status === "MISSING") && (
                <ITButton size="sm" variant="outlined" color="primary" label={t("equipment.reactivate")} onClick={() => void run(() => receptionApi.patchUnit(r.id, { status: "AVAILABLE" }))} />
              )}
            </ITFlex>
          ),
      },
    ],
    [t, tt, canManage]
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && <ITAlert variant="error">{error}</ITAlert>}

      <ITGrid container spacing={2}>
        {EQUIPMENT_STATUSES.map((s) => (
          <ITGrid item xs={6} md={2} key={s}>
            <KpiTile label={tt(`equipmentStatus.${s}`)} value={String(board?.summary[s] ?? 0)} icon={<FaTools size={14} />} tone={TONE[s]} />
          </ITGrid>
        ))}
      </ITGrid>

      {canLend && (
        <PanelCard title={t("equipment.lend.title")} description={t("equipment.lend.description")}>
          <ITGrid container spacing={2}>
            <ITGrid item xs={12} md={5}>
              <ITSelect name="lendUnit" label={t("equipment.lend.unit")} options={available.map((u) => ({ value: u.id, label: `${u.tag} · ${u.product.name}` }))} value={unitId} onChange={(e) => setUnitId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITSelect name="lendRoom" label={t("equipment.lend.room")} options={[{ value: "", label: t("equipment.lend.pickRoom") }, ...rooms.map((r) => ({ value: r.id, label: r.zone ? `${r.number} · ${r.zone.name}` : r.number }))]} value={roomId} onChange={(e) => setRoomId(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={2}>
              <ITButton variant="filled" color="primary" label={t("equipment.lend.submit")} disabled={!unitId || !roomId} onClick={() => void run(async () => { await receptionApi.lendEquipment({ unitId, roomId }); setRoomId(""); })} />
            </ITGrid>
          </ITGrid>
        </PanelCard>
      )}

      <PanelCard title={t("equipment.loans.title")} description={t("equipment.loans.description")}>
        {board && board.loans.length === 0 && <ITText muted>{t("equipment.loans.empty")}</ITText>}
        <ITFlex direction="column" gap={2}>
          {board?.loans.map((l) => (
            <ITFlex key={l.id} align="center" justify="between" gap={2} className="rounded-lg border border-slate-200 p-3">
              <ITFlex direction="column">
                <ITText className="font-semibold">{l.unit.tag} · {l.unit.product.name}</ITText>
                <ITText muted className="text-[12px]">
                  {t("equipment.loans.room", { room: l.room.number, zone: l.room.zone.name })} · {fmtDateTime(l.requestedAt)}
                  {l.deliveredAt ? ` · ${t("equipment.loans.delivered", { name: l.deliveredBy?.name ?? "" })}` : ""}
                </ITText>
              </ITFlex>
              {canLend && (
                <ITFlex gap={2}>
                  {!l.deliveredAt && (
                    <>
                      <ITButton size="sm" variant="filled" color="primary" label={t("equipment.loans.deliver")} onClick={() => void deliver(l, false)} />
                      <ITButton size="sm" variant="outlined" color="primary" label={t("equipment.loans.deliverCosign")} onClick={() => void deliver(l, true)} />
                    </>
                  )}
                  <ITButton size="sm" variant="outlined" color="secondary" label={t("equipment.loans.return")} onClick={() => setReturning(l)} />
                </ITFlex>
              )}
            </ITFlex>
          ))}
        </ITFlex>
      </PanelCard>

      {canManage && (
        <PanelCard title={t("equipment.add.title")} description={t("equipment.add.description")}>
          <ITGrid container spacing={2}>
            <ITGrid item xs={12} md={6}>
              <ITSelect name="newEquipProduct" label={t("equipment.add.product")} options={products.map((p) => ({ value: p.id, label: p.tagPrefix ? `${p.name} (${p.tagPrefix})` : p.name }))} value={newProduct} onChange={(e) => setNewProduct(e.target.value)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITInputNumber name="newEquipQty" label={t("equipment.add.quantity")} decimals={0} min={1} value={newQty} onChange={(v) => setNewQty(v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITButton variant="filled" color="primary" label={t("equipment.add.submit")} disabled={!newProduct || !newQty} onClick={() => void run(() => receptionApi.createUnits({ productId: newProduct, quantity: newQty as number }))} />
            </ITGrid>
          </ITGrid>
        </PanelCard>
      )}

      <PanelCard title={t("equipment.inventory.title")}>
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={receptionApi.unitsTable as never}
          reloadTrigger={reload}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>

      <ReturnEquipmentDialog loan={returning} onClose={() => setReturning(null)} onDone={() => { setReturning(null); refresh(); }} />
    </ITFlex>
  );
}
