import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITDialog, ITFlex, ITSelect, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaPlus } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, writeoffApi, type HotelWarehouse, type StocktakeSummary } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import CountStatusChip from "./CountStatusChip";

const STATUSES = ["DRAFT", "COUNTING", "PENDING_APPROVAL", "APPLIED", "CANCELLED"] as const;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("es-MX") : "—");

interface Props {
  onOpen: (id: string) => void;
}

/** Tomas de inventario: lista (con filtros) y alta por almacén. */
export default function CountsBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const tt = dyn(t);
  const linenCount = useCan("hotel_linen.count");
  const storeCount = useCan("hotel_store.stocktake");
  const canCreate = linenCount || storeCount;
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [creating, setCreating] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setWarehouses(list))
      .catch(() => active && setWarehouses([]));
    return () => {
      active = false;
    };
  }, []);

  const nameOf = (id: string) => warehouses.find((w) => w.id === id)?.name ?? "—";

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<StocktakeSummary>(() => writeoffApi.stocktakes(), {
        warehouseId: { match: "equals" },
        status: { match: "equals" },
      }),
    []
  );

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const created = await writeoffApi.createStocktake({ warehouseId, notes: notes.trim() || null, blind: true });
      setCreating(false);
      setWarehouseId("");
      setNotes("");
      onOpen(created.id);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const columns: Column<StocktakeSummary>[] = [
    {
      key: "folio",
      label: t("counts.columns.folio"),
      type: "string",
      width: 130,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText>,
    },
    {
      key: "warehouseId",
      label: t("counts.columns.warehouse"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      catalogOptions: { data: warehouses.map((w) => ({ id: w.id, name: w.name })) },
      render: (r) => <ITText className="text-[12px]">{nameOf(r.warehouseId)}</ITText>,
    },
    {
      key: "status",
      label: t("counts.columns.status"),
      type: "catalog",
      width: 160,
      filter: "catalog",
      catalogOptions: { data: STATUSES.map((s) => ({ id: s, name: tt(`counts.status.${s}`) })) },
      render: (r) => <CountStatusChip status={r.status} />,
    },
    {
      key: "createdAt",
      label: t("counts.columns.createdAt"),
      type: "date",
      width: 130,
      filter: "date-range",
      render: (r) => <ITText className="text-[12px]">{fmtDate(r.createdAt)}</ITText>,
    },
    {
      key: "approvedAt",
      label: t("counts.columns.approvedAt"),
      type: "date",
      width: 130,
      filter: false,
      render: (r) => <ITText className="text-[12px]">{fmtDate(r.approvedAt)}</ITText>,
    },
  ];

  return (
    <PanelCard
      title={t("counts.title")}
      description={t("counts.description")}
      actions={
        canCreate ? (
          <ITButton variant="filled" color="primary" icon={<FaPlus size={12} />} label={t("counts.new.action")} onClick={() => setCreating(true)} />
        ) : undefined
      }
    >
      <ITDataTable
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        onRowClick={((row: StocktakeSummary) => onOpen(row.id)) as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />

      <ITDialog isOpen={creating} onClose={() => setCreating(false)} title={t("counts.new.action")}>
        <ITFlex direction="column" gap={3} className="min-w-[420px]">
          {error && <ITAlert variant="error">{error}</ITAlert>}
          <ITSelect
            name="countWarehouse"
            label={t("counts.new.warehouse")}
            options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
            value={warehouseId}
            onChange={(e) => setWarehouseId(e.target.value)}
          />
          <ITTextarea name="countNotes" label={t("counts.new.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />
          <ITText muted className="text-[11px]">{t("counts.new.blind")}</ITText>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={() => setCreating(false)} />
            <ITButton variant="filled" color="primary" label={t("counts.new.create")} disabled={busy || !warehouseId} onClick={() => void create()} />
          </ITFlex>
        </ITFlex>
      </ITDialog>
    </PanelCard>
  );
}
