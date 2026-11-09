import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITInputNumber,
  ITSegmentedControl,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  HOTEL_PRODUCT_KINDS,
  hotelLinenApi,
  useHotelCategoryOptions,
  useHotelUnitOptions,
  type HotelProduct,
  type HotelProductInput,
  type HotelProductKind,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";
import { dyn } from "@shared/i18n/dyn";

type QuickKind = "ALL" | HotelProductKind;

interface FormState {
  code: string;
  name: string;
  kind: HotelProductKind;
  categoryId: string;
  unitId: string;
  size: string;
  tagPrefix: string;
  idealStock: number | null;
  minStock: number | null;
  overstock: number | null;
  lastCost: number | null;
  washLife: number | null;
  standardPerRoom: number | null;
}

const emptyForm = (kind: HotelProductKind = "LINEN"): FormState => ({
  code: "",
  name: "",
  kind,
  categoryId: "",
  unitId: "",
  size: "",
  tagPrefix: "",
  idealStock: 0,
  minStock: 0,
  overstock: 0,
  lastCost: null,
  washLife: null,
  standardPerRoom: null,
});

const fromProduct = (p: HotelProduct): FormState => ({
  code: p.code,
  name: p.name,
  kind: p.kind,
  categoryId: p.categoryId ?? "",
  unitId: p.unitId,
  size: p.size ?? "",
  tagPrefix: p.tagPrefix ?? "",
  idealStock: Number(p.idealStock),
  minStock: Number(p.minStock),
  overstock: Number(p.overstock),
  lastCost: p.lastCost == null ? null : Number(p.lastCost),
  washLife: p.washLife ?? null,
  standardPerRoom: p.standardPerRoom == null ? null : Number(p.standardPerRoom),
});

const money = (v: string | number | null) =>
  v == null ? "—" : Number(v).toLocaleString("es-MX", { style: "currency", currency: "MXN" });

interface Props {
  /** Cada incremento abre el diálogo de alta (el botón vive en la cabecera de la página). */
  newSignal?: number;
}

/** Catálogo de blancos: tabla con filtros por columna, alta y edición en diálogo. */
export default function LinenCatalogPanel({ newSignal = 0 }: Props) {
  const { t } = useTranslation("hotel-linen");
  const tt = dyn(t);
  const canManage = useCan("hotel_store.manage");
  const units = useHotelUnitOptions();
  const categories = useHotelCategoryOptions();
  const [quick, setQuick] = useState<QuickKind>("ALL");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; item: HotelProduct | null; form: FormState }>({
    open: false,
    item: null,
    form: emptyForm(),
  });

  useEffect(() => {
    if (newSignal > 0) setDialog({ open: true, item: null, form: emptyForm(quick === "ALL" ? "LINEN" : quick) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newSignal]);

  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      setReloadKey((k) => k + 1);
      setToast(t("common.saved"));
      setTimeout(() => setToast(null), 2000);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setDialog((d) => ({ ...d, form: { ...d.form, [key]: value } }));

  const save = async () => {
    const f = dialog.form;
    if (!f.code.trim() || !f.name.trim() || !f.unitId) return;
    const input: HotelProductInput = {
      code: f.code.trim(),
      name: f.name.trim(),
      kind: f.kind,
      categoryId: f.categoryId || null,
      unitId: f.unitId,
      size: f.size.trim() || null,
      tagPrefix: f.tagPrefix.trim() || null,
      idealStock: f.idealStock ?? 0,
      minStock: f.minStock ?? 0,
      overstock: f.overstock ?? 0,
      lastCost: f.lastCost,
      washLife: f.washLife,
      standardPerRoom: f.standardPerRoom ?? 0,
    };
    const ok = await run(() =>
      dialog.item ? hotelLinenApi.updateProduct(dialog.item.id, input) : hotelLinenApi.createProduct(input)
    );
    if (ok) setDialog({ open: false, item: null, form: emptyForm() });
  };

  const kindOptions = HOTEL_PRODUCT_KINDS.map((k) => ({ id: k, name: tt(`kind.${k}`) }));

  const fetchData = useMemo(() => {
    const base = makeClientTableFetch<HotelProduct>(
      async () => {
        const rows = await hotelLinenApi.products(true);
        return quick === "ALL" ? rows : rows.filter((p) => p.kind === quick);
      },
      {
        kind: { match: "equals" },
        category: { value: (p) => p.category?.name },
        idealStock: { value: (p) => Number(p.idealStock), sortValue: (p) => Number(p.idealStock) },
        minStock: { sortValue: (p) => Number(p.minStock) },
        lastCost: { sortValue: (p) => (p.lastCost == null ? null : Number(p.lastCost)) },
        active: { match: "equals" },
      }
    );
    return base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey, quick]);

  const columns: Column<HotelProduct>[] = [
    {
      key: "code",
      label: t("catalog.columns.code"),
      type: "string",
      width: 110,
      filter: true,
      render: (p) => <ITText className="font-mono text-[12px] font-bold">{p.code}</ITText>,
    },
    {
      key: "name",
      label: t("catalog.columns.name"),
      type: "string",
      width: 240,
      filter: true,
      render: (p) => <ITText className="text-[12px] font-bold">{p.name}</ITText>,
    },
    {
      key: "kind",
      label: t("catalog.columns.kind"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      catalogOptions: { data: kindOptions },
      render: (p) => (
        <ITBadget color="info" size="lg">
          {tt(`kind.${p.kind}`)}
        </ITBadget>
      ),
    },
    {
      key: "category",
      label: t("catalog.columns.category"),
      type: "string",
      width: 150,
      filter: true,
      render: (p) => <ITText className="text-[11px]">{p.category?.name ?? "—"}</ITText>,
    },
    {
      key: "size",
      label: t("catalog.columns.size"),
      type: "string",
      width: 100,
      filter: true,
      render: (p) => <ITText className="text-[11px]">{p.size ?? "—"}</ITText>,
    },
    {
      key: "idealStock",
      label: t("catalog.columns.par"),
      type: "number",
      width: 90,
      render: (p) => <ITText className="text-[13px] font-black tabular-nums">{Number(p.idealStock)}</ITText>,
    },
    {
      key: "minStock",
      label: t("catalog.columns.minStock"),
      type: "number",
      width: 100,
      render: (p) => <ITText className="text-[12px] tabular-nums">{Number(p.minStock)}</ITText>,
    },
    {
      key: "washLife",
      label: t("catalog.columns.washLife"),
      type: "number",
      width: 100,
      render: (p) => <ITText className="text-[12px] tabular-nums">{p.washLife ?? "—"}</ITText>,
    },
    {
      key: "standardPerRoom",
      label: t("catalog.columns.standard"),
      type: "number",
      width: 100,
      render: (p) => {
        const value = Number(p.standardPerRoom ?? 0);
        return <ITText className="text-[12px] tabular-nums">{p.kind === "CONSUMABLE" && value ? value : "—"}</ITText>;
      },
    },
    {
      key: "lastCost",
      label: t("catalog.columns.cost"),
      type: "number",
      width: 110,
      render: (p) => <ITText className="text-[12px] tabular-nums">{money(p.lastCost)}</ITText>,
    },
    {
      key: "active",
      label: t("catalog.columns.status"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: t("common.active") },
          { id: "false", name: t("common.inactive") },
        ],
      },
      render: (p) => (
        <ITBadget color={p.active ? "success" : "danger"} size="lg">
          {p.active ? t("common.active") : t("common.inactive")}
        </ITBadget>
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "",
            type: "actions" as const,
            width: 120,
            actions: (p: HotelProduct) => (
              <ITFlex align="center" gap={2}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="lg"
                  title={t("common.edit")}
                  onClick={() => setDialog({ open: true, item: p, form: fromProduct(p) })}
                >
                  <FaEdit size={12} />
                </ITButton>
                <ITButton
                  variant="outlined"
                  color={p.active ? "secondary" : "success"}
                  size="lg"
                  title={p.active ? t("common.deactivate") : t("common.reactivate")}
                  onClick={() => void run(() => hotelLinenApi.updateProduct(p.id, { active: !p.active }))}
                >
                  {p.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
                </ITButton>
              </ITFlex>
            ),
          },
        ]
      : []),
  ];

  const quickOptions = [
    { value: "ALL", label: t("common.all") },
    ...HOTEL_PRODUCT_KINDS.map((k) => ({ value: k, label: tt(`kind.${k}`) })),
  ];

  const f = dialog.form;

  return (
    <PanelCard
      title={t("catalog.title")}
      description={t("catalog.description")}
      actions={
        <ITSegmentedControl
          size="sm"
          options={quickOptions}
          value={quick}
          onChange={(v) => setQuick(v as QuickKind)}
        />
      }
    >
      <ITFlex direction="column" gap={3}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITDataTable
          key={`products-${quick}`}
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchData as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={50}
          virtualized
          virtualizedMaxHeight={520}
        />
      </ITFlex>

      <ITDialog
        isOpen={dialog.open}
        onClose={() => setDialog({ open: false, item: null, form: emptyForm() })}
        title={dialog.item ? t("catalog.edit") : t("catalog.new")}
      >
        <ITFlex direction="column" gap={3} className="min-w-[360px]">
          {error && <ITAlert variant="error">{error}</ITAlert>}
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="linenCode" label={t("catalog.form.code")} value={f.code} onChange={(e) => setField("code", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITInput name="linenName" label={t("catalog.form.name")} value={f.name} onChange={(e) => setField("name", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect
                name="linenKind"
                label={t("catalog.form.kind")}
                options={HOTEL_PRODUCT_KINDS.map((k) => ({ value: k, label: tt(`kind.${k}`) }))}
                value={f.kind}
                onChange={(e) => setField("kind", e.target.value as HotelProductKind)}
              />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect
                name="linenCategory"
                label={t("catalog.form.category")}
                options={categories.data.map((c) => ({ value: c.id, label: c.name }))}
                value={f.categoryId}
                onChange={(e) => setField("categoryId", e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITSelect
                name="linenUnit"
                label={t("catalog.form.unit")}
                options={units.data.map((u) => ({ value: u.id, label: u.name }))}
                value={f.unitId}
                onChange={(e) => setField("unitId", e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput name="linenSize" label={t("catalog.form.size")} value={f.size} onChange={(e) => setField("size", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="linenTagPrefix"
                label={t("catalog.form.tagPrefix")}
                placeholder="SEC"
                value={f.tagPrefix}
                onChange={(e) => setField("tagPrefix", e.target.value.toUpperCase())}
              />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITInputNumber name="linenPar" label={t("catalog.form.par")} decimals={0} min={0} value={f.idealStock} onChange={(v) => setField("idealStock", v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITInputNumber name="linenMin" label={t("catalog.form.minStock")} decimals={0} min={0} value={f.minStock} onChange={(v) => setField("minStock", v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITInputNumber name="linenOver" label={t("catalog.form.overstock")} decimals={0} min={0} value={f.overstock} onChange={(v) => setField("overstock", v ?? null)} />
            </ITGrid>
            <ITGrid item xs={6} md={3}>
              <ITInputNumber name="linenCost" label={t("catalog.form.cost")} decimals={2} min={0} prefix="$" value={f.lastCost} onChange={(v) => setField("lastCost", v ?? null)} />
            </ITGrid>
            {f.kind === "LINEN" && (
              <ITGrid item xs={6} md={3}>
                <ITInputNumber
                  name="linenWashLife"
                  label={t("catalog.form.washLife")}
                  decimals={0}
                  min={0}
                  value={f.washLife}
                  onChange={(v) => setField("washLife", v ?? null)}
                />
              </ITGrid>
            )}
            {f.kind === "CONSUMABLE" && (
              <ITGrid item xs={6} md={3}>
                <ITInputNumber
                  name="linenStandard"
                  label={t("catalog.form.standard")}
                  decimals={2}
                  min={0}
                  value={f.standardPerRoom}
                  onChange={(v) => setField("standardPerRoom", v ?? null)}
                />
              </ITGrid>
            )}
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={() => setDialog({ open: false, item: null, form: emptyForm() })} />
            <ITButton
              variant="filled"
              color="primary"
              label={t("common.save")}
              disabled={saving || !f.code.trim() || !f.name.trim() || !f.unitId}
              onClick={() => void save()}
            />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </PanelCard>
  );
}
