import { useEffect, useState } from "react";
import { ITChip, ITDataTable, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, laundryApi, type DirtyReceiptRow, type HotelWarehouse } from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { AREA_KINDS, fmt, fmtDate } from "../lib";

interface Props {
  onOpen: (id: string) => void;
}

/** Recepciones de sucios: tabla server-side con filtros por área, fecha y faltante. */
export default function DirtyReceiptsBoard({ onOpen }: Props) {
  const { t } = useTranslation("hotel-linen-laundry");
  const tt = dyn(t);
  const [areas, setAreas] = useState<HotelWarehouse[]>([]);

  useEffect(() => {
    let active = true;
    hotelLinenApi
      .warehouses()
      .then((list) => active && setAreas(list.filter((w) => AREA_KINDS.includes(w.kind))))
      .catch(() => active && setAreas([]));
    return () => {
      active = false;
    };
  }, []);

  const columns: Column<DirtyReceiptRow>[] = [
    { key: "folio", label: t("dirty.columns.folio"), type: "string", width: 120, filter: true, render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.folio}</ITText> },
    { key: "date", label: t("dirty.columns.date"), type: "date", width: 120, filter: "date-range", render: (r) => <ITText className="text-[12px]">{fmtDate(r.date)}</ITText> },
    {
      key: "origin",
      label: t("dirty.columns.origin"),
      type: "catalog",
      width: 200,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: areas.map((w) => ({ id: w.id, name: w.name })) },
      render: (r) => <ITText className="text-[12px]">{r.origin.name}</ITText>,
    },
    { key: "cartNumber", label: t("dirty.columns.cart"), type: "string", width: 90, sortable: false, render: (r) => <ITText className="text-[12px]">{r.cartNumber ?? "—"}</ITText> },
    { key: "shift", label: t("dirty.columns.shift"), type: "string", width: 120, sortable: false, render: (r) => <ITText className="text-[12px]">{r.shift ? tt(`shift.${r.shift}`) : "—"}</ITText> },
    { key: "deliveredBy", label: t("dirty.columns.deliveredBy"), type: "string", width: 170, sortable: false, render: (r) =>
        r.deliveredBy ? (
          <ITFlex align="center" gap={2}>
            <ProfileAvatar name={r.deliveredBy.name} size="sm" />
            <ITText className="text-[11px] font-semibold">{r.deliveredBy.name}</ITText>
          </ITFlex>
        ) : (
          <ITText className="text-[12px]">—</ITText>
        ),
    },
    { key: "receivedDirty", label: t("dirty.columns.received"), type: "number", width: 110, sortable: false, render: (r) => <ITText className="text-[12px] tabular-nums">{fmt(r.receivedDirty)}</ITText> },
    {
      key: "hasShortage",
      label: t("dirty.columns.shortage"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: [{ id: "true", name: t("dirty.withShortage") }, { id: "false", name: t("dirty.noShortage") }] },
      render: (r) => (r.hasShortage ? <ITChip size="sm" color="danger" label={fmt(r.shortage)} /> : <ITText className="text-[12px]">—</ITText>),
    },
  ];

  return (
    <PanelCard>
      <ITDataTable
        showViewToggle={false}
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={laundryApi.dirtyTable as never}
        onRowClick={((row: DirtyReceiptRow) => onOpen(row.id)) as never}
        size="lg"
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={56}
      />
    </PanelCard>
  );
}
