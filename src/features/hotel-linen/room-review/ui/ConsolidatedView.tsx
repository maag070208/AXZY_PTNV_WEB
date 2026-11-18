import { useEffect, useMemo, useState } from "react";
import { ITAlert, ITDataTable, ITDatePicker, ITFlex, ITGrid, ITSelect, ITText } from "@axzydev/axzy_ui_system";
import type { Column, ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import {
  roomReviewApi,
  useHotelZoneOptions,
  type ConsolidatedProductRow,
  type ConsolidatedResponsibleRow,
  type RoomReviewConsolidated,
} from "@entities/hotel-linen";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { dateStrToLocal, dayBoundIso, defaultPeriod, localToDateStr } from "../lib";
import DiffChip from "./DiffChip";

const asTable = <T,>(columns: Column<T>[]) => columns as unknown as Column<Record<string, unknown>>[];

/** Consolidado del periodo: por artículo (esperado/contado/faltante/sobrante) y por responsable. */
export default function ConsolidatedView() {
  const { t } = useTranslation("hotel-linen-room-review");
  const zones = useHotelZoneOptions();
  const [period, setPeriod] = useState(defaultPeriod);
  const [zoneId, setZoneId] = useState("");
  const [data, setData] = useState<RoomReviewConsolidated | null>(null);
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    roomReviewApi
      .consolidated(dayBoundIso(period.from, false), dayBoundIso(period.to, true), zoneId || undefined)
      .then((r) => {
        if (!active) return;
        setData(r);
        setVersion((v) => v + 1);
        setError(null);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, [period, zoneId]);

  const productFetch = useMemo(() => {
    const fetch = makeClientTableFetch<ConsolidatedProductRow>(() => Promise.resolve(data?.byProduct ?? []), {
      item: { value: (r) => `${r.product.code} ${r.product.name}`, match: "text" },
      expected: { value: (r) => r.expected },
      counted: { value: (r) => r.counted },
      missing: { value: (r) => r.missing },
      surplus: { value: (r) => r.surplus },
    });
    return (params: ITDataTableFetchParams) => fetch(params);
  }, [data]);

  const responsibleFetch = useMemo(() => {
    const fetch = makeClientTableFetch<ConsolidatedResponsibleRow>(() => Promise.resolve(data?.byResponsible ?? []), {
      responsible: { value: (r) => r.responsible.name, match: "text" },
      reviews: { value: (r) => r.reviews },
      missing: { value: (r) => r.missing },
      surplus: { value: (r) => r.surplus },
    });
    return (params: ITDataTableFetchParams) => fetch(params);
  }, [data]);

  const productColumns: Column<ConsolidatedProductRow>[] = [
    {
      key: "item",
      label: t("columns.item"),
      type: "string",
      filter: true,
      render: (r) => <ITText className="text-[12px] font-semibold">{`${r.product.code} · ${r.product.name}${r.product.size ? ` · ${r.product.size}` : ""}`}</ITText>,
    },
    { key: "expected", label: t("columns.expected"), type: "number", width: 110, render: (r) => <ITText className="text-[12px] tabular-nums">{r.expected}</ITText> },
    { key: "counted", label: t("columns.counted"), type: "number", width: 110, render: (r) => <ITText className="text-[12px] tabular-nums">{r.counted}</ITText> },
    { key: "missing", label: t("columns.missing"), type: "number", width: 110, render: (r) => <DiffChip diff={-r.missing} /> },
    { key: "surplus", label: t("columns.surplus"), type: "number", width: 110, render: (r) => <DiffChip diff={r.surplus} /> },
  ];

  const responsibleColumns: Column<ConsolidatedResponsibleRow>[] = [
    {
      key: "responsible",
      label: t("columns.responsible"),
      type: "string",
      filter: true,
      render: (r) => (
        <ITFlex align="center" gap={2}>
          <ProfileAvatar name={r.responsible.name} size="sm" />
          <ITText className="text-[12px] font-semibold">{r.responsible.name}</ITText>
        </ITFlex>
      ),
    },
    { key: "reviews", label: t("columns.reviews"), type: "number", width: 120, render: (r) => <ITText className="text-[12px] tabular-nums">{r.reviews}</ITText> },
    { key: "missing", label: t("columns.missingPieces"), type: "number", width: 140, render: (r) => <DiffChip diff={-r.missing} /> },
    { key: "surplus", label: t("columns.surplusPieces"), type: "number", width: 140, render: (r) => <DiffChip diff={r.surplus} /> },
  ];

  const picker = (name: string, label: string, key: "from" | "to") => (
    <ITDatePicker
      name={name}
      label={label}
      value={dateStrToLocal(period[key])}
      onChange={(e) => {
        const v = e.target.value;
        if (v instanceof Date) setPeriod((p) => ({ ...p, [key]: localToDateStr(v) }));
      }}
    />
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITGrid container columns={12} spacing={3} className="items-end">
        <ITGrid item xs={6} md={3}>{picker("reviewsFrom", t("consolidated.from"), "from")}</ITGrid>
        <ITGrid item xs={6} md={3}>{picker("reviewsTo", t("consolidated.to"), "to")}</ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITSelect
            name="reviewsZone"
            label={t("consolidated.zone")}
            options={[{ value: "", label: t("consolidated.allZones") }, ...zones.data.map((z) => ({ value: z.id, label: z.name }))]}
            value={zoneId}
            onChange={(e) => setZoneId(e.target.value)}
          />
        </ITGrid>
        <ITGrid item xs={12} md={3}>
          <ITText muted className="text-[12px]">{data ? t("consolidated.count", { n: data.reviews }) : ""}</ITText>
        </ITGrid>
      </ITGrid>

      <PanelCard title={t("consolidated.byItem")}>
        <ITDataTable
          key={`p-${version}`}
          showViewToggle={false}
          columns={asTable(productColumns)}
          fetchData={productFetch as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>
      <PanelCard title={t("consolidated.byResponsible")}>
        <ITDataTable
          key={`r-${version}`}
          showViewToggle={false}
          columns={asTable(responsibleColumns)}
          fetchData={responsibleFetch as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={52}
        />
      </PanelCard>
    </ITFlex>
  );
}
