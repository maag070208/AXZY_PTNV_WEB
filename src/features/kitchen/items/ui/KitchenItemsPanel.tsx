import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCheckbox,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowUp, FaEdit, FaEye } from "react-icons/fa";
import { useCan } from "@entities/user";
import QuickMovementDialog, { type QuickMode } from "./QuickMovementDialog";
import { useTranslation } from "react-i18next";
import {
  KitchenAlertKpis,
  useKitchenAlerts,
  kitchenApi,
  fmtQty,
  stockStatusColor,
  useKitchenCategoryOptions,
  useKitchenUnitOptions,
  useTaxRateOptions,
  fmtRate,
  KITCHEN_ITEM_KINDS,
  KITCHEN_STORAGES,
  type KitchenItemInput,
  type KitchenItemRow,
} from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";

const emptyForm = (): KitchenItemInput => ({
  code: "",
  name: "",
  categoryId: "",
  kind: "CONSUMABLE",
  unitId: "",
  storage: "DRY",
  tracksExpiry: true,
  minStock: 0,
  maxStock: null,
  notes: null,
  defaultTaxRateId: null,
});

/** Alta/edición de un artículo de cocina. */
function ItemFormDialog({
  open,
  item,
  onClose,
  onSaved,
}: {
  open: boolean;
  item: KitchenItemRow | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation("kitchen");
  const categories = useKitchenCategoryOptions();
  const units = useKitchenUnitOptions();
  const taxRates = useTaxRateOptions();
  const [form, setForm] = useState<KitchenItemInput>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sembrar el formulario al abrir (nuevo o el artículo elegido).
  useEffect(() => {
    if (!open) return;
    setForm(
      item
        ? {
            code: item.code,
            name: item.name,
            categoryId: item.category.id,
            kind: item.kind,
            unitId: item.unit.id,
            storage: item.storage,
            tracksExpiry: item.tracksExpiry,
            minStock: item.minStock,
            maxStock: item.maxStock,
            defaultTaxRateId: item.defaultTaxRateId,
            notes: null,
            active: item.active,
          }
        : emptyForm()
    );
    setError(null);
  }, [open, item]);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (item) await kitchenApi.updateItem(item.id, form);
      else await kitchenApi.createItem(form);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const select = <T extends string>(
    value: T,
    onChange: (v: T) => void,
    options: readonly T[],
    keyPrefix: string,
    label: string
  ) => (
    <ITSelect
      name={keyPrefix}
      label={label}
      value={value}
      options={options.map((o) => ({ value: o, label: dyn(t)(`${keyPrefix}.${o}`) }))}
      onChange={(e) => onChange(e.target.value as T)}
    />
  );

  return (
    <ITDialog isOpen={open} onClose={onClose} title={item ? t("items.edit") : t("items.new")}>
      <ITFlex direction="column" gap={3}>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={4}>
            <ITInput
              name="kitchenItemCode"
              label={t("items.form.code")}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={8}>
            <ITInput
              name="kitchenItemName"
              label={t("items.form.name")}
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="kitchenItemCategory"
              label={t("items.form.category")}
              options={categories.data.map((c) => ({ value: c.id, label: c.name }))}
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            {select(form.kind, (v) => setForm((f) => ({ ...f, kind: v })), KITCHEN_ITEM_KINDS, "kinds", t("items.form.kind"))}
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITSelect
              name="kitchenItemUnit"
              label={t("items.form.unit")}
              options={units.data.map((u) => ({ value: u.id, label: `${u.name} (${u.code})` }))}
              value={form.unitId}
              onChange={(e) => setForm((f) => ({ ...f, unitId: e.target.value }))}
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            {select(form.storage, (v) => setForm((f) => ({ ...f, storage: v })), KITCHEN_STORAGES, "storages", t("items.form.storage"))}
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITInputNumber decimals={2}
              name="kitchenItemMin"
              label={t("items.form.minStock")}
              value={form.minStock}
              onChange={(v) => setForm((f) => ({ ...f, minStock: v ?? 0 }))}
            />
          </ITGrid>
          <ITGrid item xs={6} md={3}>
            <ITInputNumber decimals={2}
              name="kitchenItemMax"
              label={t("items.form.maxStock")}
              value={form.maxStock}
              onChange={(v) => setForm((f) => ({ ...f, maxStock: v ?? null }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="kitchenItemTaxRate"
              label={t("items.form.defaultTaxRate")}
              options={[{ value: "", label: t("items.form.noTaxRate") }, ...taxRates.data.map((r) => ({ value: r.id, label: `${r.name} · ${fmtRate(r.rate)}` }))]}
              value={form.defaultTaxRateId ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, defaultTaxRateId: e.target.value || null }))}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITFlex align="center" className="pt-4">
              <ITCheckbox
                name="kitchenItemTracksExpiry"
                label={t("items.form.tracksExpiry")}
                checked={form.tracksExpiry}
                onChange={(v) => setForm((f) => ({ ...f, tracksExpiry: v }))}
              />
            </ITFlex>
          </ITGrid>
          <ITGrid item xs={12}>
            <ITInput
              name="kitchenItemNotes"
              label={t("items.form.notes")}
              value={form.notes ?? ""}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
            />
          </ITGrid>
        </ITGrid>
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={onClose}>
            {t("items.form.cancel")}
          </ITButton>
          <ITButton variant="filled" color="primary" disabled={saving} onClick={() => void save()}>
            <ITText className="font-bold text-[11px]">{t("items.form.save")}</ITText>
          </ITButton>
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}

export default function KitchenItemsPanel({ newSignal = 0 }: { newSignal?: number }) {
  const { t } = useTranslation("kitchen");
  const units = useKitchenUnitOptions(true);
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [dialog, setDialog] = useState<{ open: boolean; item: KitchenItemRow | null }>({
    open: false,
    item: null,
  });
  const [toast, setToast] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { alerts } = useKitchenAlerts(reloadKey);
  const canIn = useCan("kitchen.stock_in");
  const canOut = useCan("kitchen.stock_out");
  const [quick, setQuick] = useState<{ item: KitchenItemRow | null; mode: QuickMode }>({ item: null, mode: "in" });

  // "Nuevo artículo" vive en la cabecera de la página (como en Personal).
  useEffect(() => {
    if (newSignal > 0) setDialog({ open: true, item: null });
  }, [newSignal]);

  const columns: Column<KitchenItemRow>[] = [
    {
      key: "code",
      label: t("columns.code"),
      type: "string",
      width: 100,
      filter: true,
      sortable: false,
      render: (r) => <ITText className="text-[11px] font-mono text-slate-600">{r.code}</ITText>,
    },
    {
      key: "name",
      label: t("columns.name"),
      type: "string",
      width: 220,
      filter: true,
      sortable: false,
      render: (r) => (
        <ITFlex direction="column" gap={0}>
          <ITText className="text-[12px] font-black text-slate-800">{r.name}</ITText>
          <ITText className="text-[9px] font-bold uppercase tracking-widest text-slate-400">
            {r.category.name}
          </ITText>
        </ITFlex>
      ),
    },
    {
      key: "kind",
      label: t("columns.kind"),
      type: "catalog",
      width: 120,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: KITCHEN_ITEM_KINDS.map((k) => ({ id: k, name: dyn(t)(`kinds.${k}`) })) },
      render: (r) => <ITText className="text-[11px] text-slate-600">{dyn(t)(`kinds.${r.kind}`)}</ITText>,
    },
    {
      key: "unitId",
      label: t("columns.unit"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      sortable: false,
      catalogOptions: { data: units.data.map((u) => ({ id: u.id, name: u.name })) },
      render: (r) => <ITText className="text-[11px] text-slate-600">{r.unit.name}</ITText>,
    },
    {
      key: "available",
      label: t("columns.available"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => (
        <ITText className="text-[12px] font-black text-slate-800">
          {fmtQty(r.available)} {r.unit.name}
        </ITText>
      ),
    },
    {
      key: "minStock",
      label: t("columns.minMax"),
      type: "number",
      width: 110,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-500">
          {fmtQty(r.minStock)} / {r.maxStock == null ? "—" : fmtQty(r.maxStock)}
        </ITText>
      ),
    },
    {
      key: "stockStatus",
      label: t("columns.stockStatus"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: [
          { id: "LOW", name: t("stockStatus.LOW") },
          { id: "OK", name: t("stockStatus.OK") },
          { id: "OVER", name: t("stockStatus.OVER") },
        ],
      },
      render: (r) => (
        <ITBadget color={stockStatusColor(r.stockStatus)} size="sm">
          {dyn(t)(`stockStatus.${r.stockStatus}`)}
        </ITBadget>
      ),
    },
    {
      key: "nextExpiry",
      label: t("columns.nextExpiry"),
      type: "date",
      width: 120,
      sortable: false,
      render: (r) => (
        <ITText className="text-[11px] text-slate-600">{r.nextExpiry ?? "—"}</ITText>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 190,
      actions: (r) => (
        <ITFlex align="center" gap={1}>
          {canIn && r.active && (
            <ITButton variant="outlined" size="lg" color="success" title={t("items.quick.stockIn")} onClick={() => setQuick({ item: r, mode: "in" })}>
              <FaArrowDown size={12} />
            </ITButton>
          )}
          {canOut && r.active && (
            <ITButton variant="outlined" size="lg" color="warning" title={t("items.quick.stockOut")} onClick={() => setQuick({ item: r, mode: "out" })}>
              <FaArrowUp size={12} />
            </ITButton>
          )}
          <ITButton
            variant="outlined"
            size="lg"
            color="primary"
            title={t("items.detail")}
            onClick={() => navigate(`/kitchen/items/${r.id}`)}
          >
            <FaEye size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            size="lg"
            color="secondary"
            title={t("items.edit")}
            onClick={() => setDialog({ open: true, item: r })}
          >
            <FaEdit size={12} />
          </ITButton>
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
      <KitchenAlertKpis alerts={alerts} />

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={kitchenApi.itemsTable as never}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={50}
        itemsPerPageOptions={[10, 25, 50, 100]}
        size="lg"
        virtualized
        virtualizedMaxHeight={520}
        rowHeight={54}
      />

      <ItemFormDialog
        open={dialog.open}
        item={dialog.item}
        onClose={() => setDialog({ open: false, item: null })}
        onSaved={() => {
          setReloadKey((k) => k + 1);
          setToast(t("items.saved"));
          setTimeout(() => setToast(null), 2000);
        }}
      />

      <QuickMovementDialog
        item={quick.item}
        mode={quick.mode}
        onClose={() => setQuick((q) => ({ ...q, item: null }))}
        onDone={(message) => {
          setQuick((q) => ({ ...q, item: null }));
          setReloadKey((k) => k + 1);
          setToast(message);
          setTimeout(() => setToast(null), 2000);
        }}
      />

      {toast && (
        <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />
      )}
    </ITFlex>
  );
}
