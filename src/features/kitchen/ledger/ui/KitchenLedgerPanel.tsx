import { useCallback, useRef, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column, ITDataTableFetchParams } from "@axzydev/axzy_ui_system";
import { FaEye, FaFileCsv, FaUndo } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  kitchenApi,
  fmtQty,
  movementStatusColor,
  movementTypeColor,
  KITCHEN_MOVEMENT_TYPES,
  type KitchenMovement,
} from "@entities/kitchen";
import { useRequestKey } from "@shared/lib/useRequestKey";
import { fileName } from "@shared/i18n";
import { dyn } from "@shared/i18n/dyn";

/**
 * Kardex: todos los movimientos con su lote exacto. Exporta a CSV lo que está
 * en la tabla (filtros vigentes) y permite ver el detalle y revertir.
 */
export default function KitchenLedgerPanel() {
  const { t } = useTranslation("kitchen");
  const requestKey = useRequestKey();
  const paramsRef = useRef<ITDataTableFetchParams | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [detail, setDetail] = useState<KitchenMovement | null>(null);
  const [toReverse, setToReverse] = useState<KitchenMovement | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params: ITDataTableFetchParams) => {
    paramsRef.current = params;
    const res = await kitchenApi.movementsTable({
      page: params.page,
      limit: params.limit,
      filters: params.filters,
      ...(params.sort ? { sort: params.sort } : {}),
    });
    return res as unknown as { data: Record<string, unknown>[]; total: number };
  }, []);

  const openDetail = async (m: KitchenMovement) => {
    try {
      setDetail(await kitchenApi.movement(m.id));
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const confirmReverse = async () => {
    if (!toReverse) return;
    setSaving(true);
    try {
      await kitchenApi.reverse(toReverse.id, null, requestKey({ id: toReverse.id }));
      setReloadKey((k) => k + 1);
      setToast(t("ledger.reversed"));
      setTimeout(() => setToast(null), 2000);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
      setToReverse(null);
    }
  };

  /** Exporta a CSV las filas del filtro vigente (recorre las páginas de a 200). */
  const exportCsv = async () => {
    try {
      const base = paramsRef.current;
      const rows: KitchenMovement[] = [];
      let page = 1;
      for (;;) {
        const res = await kitchenApi.movementsTable({
          page,
          limit: 200,
          filters: base?.filters ?? {},
          ...(base?.sort ? { sort: base.sort } : {}),
        });
        rows.push(...res.data);
        if (rows.length >= res.total || res.data.length === 0) break;
        page += 1;
      }
      const header = [
        t("columns.type"),
        t("columns.date"),
        t("columns.status"),
        t("columns.reference"),
        t("columns.createdBy"),
        t("columns.item"),
        t("columns.lotCode"),
        t("columns.quantity"),
      ];
      const lines = rows.flatMap((m) =>
        m.lines.map((l) => [
          dyn(t)(`movementTypes.${m.type}`),
          new Date(m.date).toLocaleString("es-MX"),
          dyn(t)(`movementStatus.${m.status}`),
          m.reference ?? "",
          m.createdBy.name,
          `${l.item.code} ${l.item.name}`,
          l.lot.lotCode,
          fmtQty(l.quantity),
        ])
      );
      const escape = (c: unknown) => `"${String(c ?? "").replace(/"/g, '""')}"`;
      const csv = [header, ...lines].map((r) => r.map(escape).join(",")).join("\r\n");
      const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${fileName("kitchenLedger")}-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: Column<KitchenMovement>[] = [
    {
      key: "type",
      label: t("columns.type"),
      type: "catalog",
      width: 130,
      sortable: true,
      filter: "catalog",
      catalogOptions: {
        data: KITCHEN_MOVEMENT_TYPES.map((m) => ({ id: m, name: dyn(t)(`movementTypes.${m}`) })),
      },
      render: (m) => (
        <ITBadget color={movementTypeColor(m.type)} size="sm">
          {dyn(t)(`movementTypes.${m.type}`)}
        </ITBadget>
      ),
    },
    {
      key: "date",
      label: t("columns.date"),
      type: "date",
      width: 160,
      sortable: true,
      filter: "date-range",
      render: (m) => (
        <ITText className="text-[11px] text-slate-600 whitespace-nowrap">
          {new Date(m.date).toLocaleString("es-MX")}
        </ITText>
      ),
    },
    {
      key: "reference",
      label: t("columns.reference"),
      type: "string",
      width: 140,
      sortable: true,
      filter: true,
      render: (m) => <ITText className="text-[11px] text-slate-600">{m.reference ?? "—"}</ITText>,
    },
    {
      key: "item",
      label: t("columns.lines"),
      type: "string",
      width: 260,
      sortable: false,
      filter: true,
      render: (m) => (
        <ITFlex direction="column" gap={0}>
          {m.lines.slice(0, 3).map((l) => (
            <ITText key={l.id} className="text-[11px] text-slate-600">
              {l.item.name} · {fmtQty(l.quantity)} {l.item.unit.name}
            </ITText>
          ))}
          {m.lines.length > 3 && (
            <ITText className="text-[10px] text-slate-400">+{m.lines.length - 3}</ITText>
          )}
        </ITFlex>
      ),
    },
    {
      key: "createdBy",
      label: t("columns.createdBy"),
      type: "string",
      width: 150,
      sortable: true,
      filter: true,
      render: (m) => <ITText className="text-[11px] text-slate-600">{m.createdBy.name}</ITText>,
    },
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 110,
      sortable: true,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "ACTIVE", name: t("movementStatus.ACTIVE") },
          { id: "CANCELLED", name: t("movementStatus.CANCELLED") },
        ],
      },
      render: (m) => (
        <ITBadget color={movementStatusColor(m.status)} size="sm">
          {dyn(t)(`movementStatus.${m.status}`)}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 110,
      actions: (m) => (
        <ITFlex align="center" gap={1}>
          <ITButton variant="outlined" size="lg" color="primary" title={t("ledger.detail")} onClick={() => void openDetail(m)}>
            <FaEye size={12} />
          </ITButton>
          {m.status === "ACTIVE" && m.type !== "REVERSAL" && (
            <ITButton variant="outlined" size="lg" color="error" title={t("ledger.reverse")} onClick={() => setToReverse(m)}>
              <FaUndo size={12} />
            </ITButton>
          )}
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}
      <ITFlex justify="end">
        <ITButton variant="outlined" color="gray" size="sm" onClick={() => void exportCsv()}>
          <ITFlex align="center" gap={1}>
            <FaFileCsv className="text-emerald-600" size={13} />
            <ITText className="font-bold text-[11px]">{t("ledger.exportCsv")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={50}
        itemsPerPageOptions={[10, 25, 50, 100]}
        size="lg"
        virtualized
        virtualizedMaxHeight={520}
        rowHeight={64}
      />

      <ITDialog isOpen={!!detail} onClose={() => setDetail(null)} title={t("ledger.detail")}>
        {detail && (
          <ITFlex direction="column" gap={2}>
            <ITFlex gap={2}>
              <ITBadget color={movementTypeColor(detail.type)} size="sm">
                {dyn(t)(`movementTypes.${detail.type}`)}
              </ITBadget>
              <ITBadget color={movementStatusColor(detail.status)} size="sm">
                {dyn(t)(`movementStatus.${detail.status}`)}
              </ITBadget>
              {detail.wasteReason && (
                <ITText className="text-[11px] text-slate-600">{dyn(t)(`wasteReasons.${detail.wasteReason}`)}</ITText>
              )}
            </ITFlex>
            <ITText className="text-[11px] text-slate-500">
              {new Date(detail.date).toLocaleString("es-MX")} · {detail.createdBy.name}
              {detail.reference ? ` · ${detail.reference}` : ""}
            </ITText>
            <ITFlex direction="column" gap={1}>
              {detail.lines.map((l) => (
                <ITFlex key={l.id} gap={2} className="items-center">
                  <ITText className="text-[11px] font-bold text-slate-700">
                    {l.item.name} · {fmtQty(l.quantity)} {l.item.unit.name}
                  </ITText>
                  <ITText className="text-[10px] font-mono text-slate-400">{l.lot.lotCode}</ITText>
                </ITFlex>
              ))}
            </ITFlex>
            {detail.notes && <ITText className="text-[11px] text-slate-500">{detail.notes}</ITText>}
          </ITFlex>
        )}
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!toReverse}
        onClose={() => {
          if (!saving) setToReverse(null);
        }}
        onConfirm={() => void confirmReverse()}
        title={t("ledger.reverseTitle")}
        message={t("ledger.reverseMessage")}
        confirmLabel={t("ledger.reverse")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={saving}
      />

      {toast && (
        <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />
      )}
    </ITFlex>
  );
}
