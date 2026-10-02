import { useEffect, useMemo, useState, type ReactNode } from "react";
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
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaBalanceScale, FaBuilding, FaEdit, FaPercent, FaPlus, FaTags, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { fmtRate, kitchenApi, type CostCenter, type CostCenterInput, type KitchenCategory, type KitchenUnit, type KitchenUnitInput, type TaxRate } from "@entities/kitchen";
import { useDepartmentOptions } from "@entities/department";
import { makeClientTableFetch } from "@shared/api/clientTable";

type Tab = "categories" | "units" | "taxRates" | "costCenters";

const emptyUnit = (): KitchenUnitInput => ({ code: "", name: "", whole: false });
const emptyCostCenter = (): CostCenterInput => ({ name: "", code: "", departmentId: "" });

/**
 * Catálogos de cocina con el mismo diseño que Catálogos del sistema: tabla con
 * filtros a la izquierda y menú lateral con "Nuevo" a la derecha.
 */
export default function KitchenCatalogPanel() {
  const { t } = useTranslation("kitchen");
  const [tab, setTab] = useState<Tab>("categories");
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [catDialog, setCatDialog] = useState<{ open: boolean; item: KitchenCategory | null; name: string }>({ open: false, item: null, name: "" });
  const [unitDialog, setUnitDialog] = useState<{ open: boolean; item: KitchenUnit | null; form: KitchenUnitInput }>({
    open: false,
    item: null,
    form: emptyUnit(),
  });

  const [taxDialog, setTaxDialog] = useState<{ open: boolean; item: TaxRate | null; name: string; percent: number | null }>({
    open: false,
    item: null,
    name: "",
    percent: null,
  });

  const [costDialog, setCostDialog] = useState<{ open: boolean; item: CostCenter | null; form: CostCenterInput }>({
    open: false,
    item: null,
    form: emptyCostCenter(),
  });

  const departments = useDepartmentOptions();

  useEffect(() => setError(null), [tab]);

  const done = (message: string) => {
    setReloadKey((k) => k + 1);
    setToast(message);
    setTimeout(() => setToast(null), 2000);
  };

  const run = async (fn: () => Promise<unknown>, message = t("catalog.saved")) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      done(message);
      return true;
    } catch (e) {
      setError((e as Error).message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveCategory = async () => {
    const name = catDialog.name.trim();
    if (!name) return;
    const ok = await run(() => (catDialog.item ? kitchenApi.updateCategory(catDialog.item.id, { name }) : kitchenApi.createCategory({ name })));
    if (ok) setCatDialog({ open: false, item: null, name: "" });
  };

  const saveUnit = async () => {
    const f = unitDialog.form;
    if (!f.code.trim() || !f.name.trim()) return;
    const ok = await run(() => (unitDialog.item ? kitchenApi.updateUnit(unitDialog.item.id, f) : kitchenApi.createUnit(f)));
    if (ok) setUnitDialog({ open: false, item: null, form: emptyUnit() });
  };

  const saveTaxRate = async () => {
    const name = taxDialog.name.trim();
    if (!name || taxDialog.percent == null) return;
    const input = { name, rate: Math.round(taxDialog.percent * 100) / 10000 };
    const ok = await run(() => (taxDialog.item ? kitchenApi.updateTaxRate(taxDialog.item.id, input) : kitchenApi.createTaxRate(input)));
    if (ok) setTaxDialog({ open: false, item: null, name: "", percent: null });
  };

  const saveCostCenter = async () => {
    const f = costDialog.form;
    if (!f.name.trim() || !f.code.trim()) return;
    const input: CostCenterInput = { name: f.name.trim(), code: f.code.trim(), departmentId: f.departmentId || null };
    const ok = await run(() => (costDialog.item ? kitchenApi.updateCostCenter(costDialog.item.id, input) : kitchenApi.createCostCenter(input)));
    if (ok) setCostDialog({ open: false, item: null, form: emptyCostCenter() });
  };

  const openNew = () => {
    if (tab === "categories") setCatDialog({ open: true, item: null, name: "" });
    else if (tab === "units") setUnitDialog({ open: true, item: null, form: emptyUnit() });
    else if (tab === "costCenters") setCostDialog({ open: true, item: null, form: emptyCostCenter() });
    else setTaxDialog({ open: true, item: null, name: "", percent: null });
  };

  const statusColumn = {
    key: "active",
    label: t("columns.status"),
    type: "catalog" as const,
    width: 130,
    filter: "catalog" as const,
    sortable: false,
    catalogOptions: {
      data: [
        { id: "true", name: t("catalog.active") },
        { id: "false", name: t("catalog.inactive") },
      ],
    },
    render: (row: { active?: boolean }) => (
      <ITBadget color={row.active ? "success" : "danger"} size="lg">
        {row.active ? t("catalog.active") : t("catalog.inactive")}
      </ITBadget>
    ),
  };

  const actions = (row: { active?: boolean }, onEdit: () => void, onToggle: () => void) => (
    <ITFlex align="center" gap={2}>
      <ITButton variant="outlined" color="primary" size="lg" title={t("suppliers.actions.edit")} onClick={onEdit}>
        <FaEdit size={12} />
      </ITButton>
      <ITButton
        variant="outlined"
        color={row.active ? "secondary" : "success"}
        size="lg"
        title={row.active ? t("common.deactivate") : t("common.reactivate")}
        onClick={onToggle}
      >
        {row.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
      </ITButton>
    </ITFlex>
  );

  const categoryColumns: Column<KitchenCategory>[] = [
    {
      key: "name",
      label: t("catalog.name"),
      type: "string",
      width: 320,
      filter: true,
      sortable: true,
      render: (c) => <ITText className="text-[12px] font-bold text-slate-800">{c.name}</ITText>,
    },
    statusColumn,
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 130,
      actions: (c) =>
        actions(
          c,
          () => setCatDialog({ open: true, item: c, name: c.name }),
          () => void run(() => kitchenApi.updateCategory(c.id, { active: !c.active }))
        ),
    },
  ];

  const unitColumns: Column<KitchenUnit>[] = [
    {
      key: "code",
      label: t("catalog.code"),
      type: "string",
      width: 120,
      filter: true,
      sortable: true,
      render: (u) => <ITText className="font-mono text-[12px] font-bold uppercase text-slate-700">{u.code}</ITText>,
    },
    {
      key: "name",
      label: t("catalog.name"),
      type: "string",
      width: 240,
      filter: true,
      sortable: true,
      render: (u) => <ITText className="text-[12px] font-bold text-slate-800">{u.name}</ITText>,
    },
    {
      key: "whole",
      label: t("catalog.whole"),
      type: "catalog",
      width: 130,
      filter: "catalog",
      sortable: false,
      catalogOptions: {
        data: [
          { id: "true", name: t("catalog.yes") },
          { id: "false", name: t("catalog.no") },
        ],
      },
      render: (u) => (
        <ITBadget color={u.whole ? "info" : "gray"} size="lg">
          {u.whole ? t("catalog.yes") : t("catalog.no")}
        </ITBadget>
      ),
    },
    statusColumn,
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 130,
      actions: (u) =>
        actions(
          u,
          () => setUnitDialog({ open: true, item: u, form: { code: u.code, name: u.name, whole: u.whole } }),
          () => void run(() => kitchenApi.updateUnit(u.id, { active: !u.active }))
        ),
    },
  ];

  const taxColumns: Column<TaxRate>[] = [
    {
      key: "name",
      label: t("catalog.name"),
      type: "string",
      width: 260,
      filter: true,
      sortable: true,
      render: (r) => <ITText className="text-[12px] font-bold text-slate-800">{r.name}</ITText>,
    },
    {
      key: "rate",
      label: t("catalog.rate"),
      type: "number",
      width: 130,
      sortable: true,
      render: (r) => <ITText className="text-[13px] font-black tabular-nums text-slate-800">{fmtRate(r.rate)}</ITText>,
    },
    statusColumn,
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 130,
      actions: (r) =>
        actions(
          r,
          () => setTaxDialog({ open: true, item: r, name: r.name, percent: Math.round(Number(r.rate) * 10000) / 100 }),
          () => void run(() => kitchenApi.updateTaxRate(r.id, { active: !r.active }))
        ),
    },
  ];

  const fetchTaxRates = useMemo(
    () => makeClientTableFetch<TaxRate>(() => kitchenApi.taxRates(true), { active: { match: "equals" }, rate: { sortValue: (r) => Number(r.rate) } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey]
  );

  const costColumns: Column<CostCenter>[] = [
    {
      key: "code",
      label: t("catalog.code"),
      type: "string",
      width: 120,
      filter: true,
      sortable: true,
      render: (c) => <ITText className="font-mono text-[12px] font-bold uppercase text-slate-700">{c.code}</ITText>,
    },
    {
      key: "name",
      label: t("catalog.name"),
      type: "string",
      width: 260,
      filter: true,
      sortable: true,
      render: (c) => <ITText className="text-[12px] font-bold text-slate-800">{c.name}</ITText>,
    },
    {
      key: "department",
      label: t("catalog.department"),
      type: "string",
      width: 200,
      sortable: false,
      render: (c) => <ITText className="text-[11px] text-slate-600">{c.department?.name ?? t("catalog.noDepartment")}</ITText>,
    },
    statusColumn,
    {
      key: "actions",
      label: "",
      type: "actions",
      width: 130,
      actions: (c) =>
        actions(
          c,
          () => setCostDialog({ open: true, item: c, form: { name: c.name, code: c.code, departmentId: c.department?.id ?? "" } }),
          () => void run(() => kitchenApi.updateCostCenter(c.id, { active: !c.active }))
        ),
    },
  ];

  const fetchCostCenters = useMemo(
    () => makeClientTableFetch<CostCenter>(() => kitchenApi.costCenters(true), { active: { match: "equals" } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey]
  );

  const fetchCategories = useMemo(
    () => makeClientTableFetch<KitchenCategory>(() => kitchenApi.categories(true), { active: { match: "equals" } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey]
  );
  const fetchUnits = useMemo(
    () => makeClientTableFetch<KitchenUnit>(() => kitchenApi.units(true), { active: { match: "equals" }, whole: { match: "equals" } }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey]
  );

  const nav: Array<{ id: Tab; label: string; hint: string; icon: ReactNode }> = [
    { id: "categories", label: t("catalog.categories"), hint: t("catalog.categoriesHint"), icon: <FaTags size={12} /> },
    { id: "units", label: t("catalog.units"), hint: t("catalog.unitsHint"), icon: <FaBalanceScale size={12} /> },
    { id: "taxRates", label: t("catalog.taxRates"), hint: t("catalog.taxRatesHint"), icon: <FaPercent size={11} /> },
    { id: "costCenters", label: t("catalog.costCenters"), hint: t("catalog.costCentersHint"), icon: <FaBuilding size={11} /> },
  ];

  return (
    <ITGrid container columns={12} spacing={5} className="items-start">
      <ITGrid item xs={8} sm={9} md={9} className="flex min-w-0 flex-col gap-4">
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        {tab === "categories" ? (
          <ITDataTable
            key="categories"
            columns={categoryColumns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchCategories as never}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[10, 25, 50]}
            size="lg"
          />
        ) : tab === "taxRates" ? (
          <ITDataTable
            key="taxRates"
            columns={taxColumns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchTaxRates as never}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[10, 25, 50]}
            size="lg"
          />
        ) : tab === "costCenters" ? (
          <ITDataTable
            key="costCenters"
            columns={costColumns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchCostCenters as never}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[10, 25, 50]}
            size="lg"
          />
        ) : (
          <ITDataTable
            key="units"
            columns={unitColumns as unknown as Column<Record<string, unknown>>[]}
            fetchData={fetchUnits as never}
            defaultItemsPerPage={25}
            itemsPerPageOptions={[10, 25, 50]}
            size="lg"
          />
        )}
      </ITGrid>

      <ITGrid item xs={4} sm={3} md={3} className="min-w-0">
        <ITStack
          as="nav"
          direction="column"
          spacing={0}
          className="sticky top-24 overflow-hidden rounded-2xl border border-slate-200 bg-white p-2 shadow-lg shadow-slate-200/50"
        >
          <ITButton variant="filled" color="primary" size="lg" onClick={openNew} className="mb-1 w-full">
            <ITFlex align="center" justify="center" gap={1}>
              <FaPlus size={11} />
              <ITText className="font-bold text-[11px]">{tab === "categories" ? t("catalog.newCategory") : tab === "units" ? t("catalog.newUnit") : tab === "costCenters" ? t("catalog.newCostCenter") : t("catalog.newTaxRate")}</ITText>
            </ITFlex>
          </ITButton>
          <ITText as="p" className="px-2.5 pb-1 pt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">
            {t("catalog.title")}
          </ITText>
          {nav.map((item) => {
            const active = item.id === tab;
            return (
              <ITFlex
                key={item.id}
                as="button"
                align="center"
                gap={2.5}
                onClick={() => setTab(item.id)}
                className={`group w-full rounded-lg px-2.5 py-2 text-left text-[12px] font-semibold transition-colors ${
                  active ? "bg-[#0D5777]/10 text-[#0D5777]" : "text-slate-600 hover:bg-[#0D5777]/5"
                }`}
              >
                <ITFlex
                  align="center"
                  justify="center"
                  className={`h-6 w-6 shrink-0 rounded-md transition-colors ${
                    active ? "bg-[#0D5777] text-white" : "bg-slate-100 text-slate-500 group-hover:bg-[#0D5777]/10 group-hover:text-[#0D5777]"
                  }`}
                >
                  {item.icon}
                </ITFlex>
                <span className="min-w-0">
                  <span className="block truncate">{item.label}</span>
                  <span className="block truncate text-[10px] font-normal text-slate-400">{item.hint}</span>
                </span>
                {active && <ITFlex className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-[#0D5777]" />}
              </ITFlex>
            );
          })}
        </ITStack>
      </ITGrid>

      <ITDialog
        isOpen={catDialog.open}
        onClose={() => setCatDialog({ open: false, item: null, name: "" })}
        title={catDialog.item ? catDialog.item.name : t("catalog.newCategory")}
      >
        <ITFlex direction="column" gap={3} className="min-w-[320px]">
          <ITInput
            name="kitchenCategoryName"
            label={t("catalog.name")}
            value={catDialog.name}
            onChange={(e) => setCatDialog((d) => ({ ...d, name: e.target.value }))}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("catalog.cancel")} onClick={() => setCatDialog({ open: false, item: null, name: "" })} />
            <ITButton variant="filled" color="primary" label={t("catalog.save")} disabled={saving || !catDialog.name.trim()} onClick={() => void saveCategory()} />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={unitDialog.open}
        onClose={() => setUnitDialog({ open: false, item: null, form: emptyUnit() })}
        title={unitDialog.item ? unitDialog.item.name : t("catalog.newUnit")}
      >
        <ITFlex direction="column" gap={3} className="min-w-[320px]">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="kitchenUnitCode"
                label={t("catalog.code")}
                placeholder="KG"
                value={unitDialog.form.code}
                onChange={(e) => setUnitDialog((d) => ({ ...d, form: { ...d.form, code: e.target.value } }))}
              />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITInput
                name="kitchenUnitName"
                label={t("catalog.name")}
                placeholder="Kilogramo"
                value={unitDialog.form.name}
                onChange={(e) => setUnitDialog((d) => ({ ...d, form: { ...d.form, name: e.target.value } }))}
              />
            </ITGrid>
          </ITGrid>
          <ITCheckbox
            name="kitchenUnitWhole"
            label={t("catalog.wholeHint")}
            checked={unitDialog.form.whole}
            onChange={(v) => setUnitDialog((d) => ({ ...d, form: { ...d.form, whole: v } }))}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("catalog.cancel")} onClick={() => setUnitDialog({ open: false, item: null, form: emptyUnit() })} />
            <ITButton
              variant="filled"
              color="primary"
              label={t("catalog.save")}
              disabled={saving || !unitDialog.form.code.trim() || !unitDialog.form.name.trim()}
              onClick={() => void saveUnit()}
            />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={taxDialog.open}
        onClose={() => setTaxDialog({ open: false, item: null, name: "", percent: null })}
        title={taxDialog.item ? taxDialog.item.name : t("catalog.newTaxRate")}
      >
        <ITFlex direction="column" gap={3} className="min-w-[320px]">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={7}>
              <ITInput
                name="taxRateName"
                label={t("catalog.name")}
                placeholder="IVA 16%"
                value={taxDialog.name}
                onChange={(e) => setTaxDialog((d) => ({ ...d, name: e.target.value }))}
              />
            </ITGrid>
            <ITGrid item xs={12} md={5}>
              <ITInputNumber
                name="taxRatePercent"
                label={t("catalog.ratePercent")}
                decimals={2}
                min={0}
                max={99.99}
                value={taxDialog.percent}
                onChange={(v) => setTaxDialog((d) => ({ ...d, percent: v ?? null }))}
              />
            </ITGrid>
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("catalog.cancel")} onClick={() => setTaxDialog({ open: false, item: null, name: "", percent: null })} />
            <ITButton
              variant="filled"
              color="primary"
              label={t("catalog.save")}
              disabled={saving || !taxDialog.name.trim() || taxDialog.percent == null}
              onClick={() => void saveTaxRate()}
            />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={costDialog.open}
        onClose={() => setCostDialog({ open: false, item: null, form: emptyCostCenter() })}
        title={costDialog.item ? costDialog.item.name : t("catalog.newCostCenter")}
      >
        <ITFlex direction="column" gap={3} className="min-w-[320px]">
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="costCenterCode"
                label={t("catalog.code")}
                placeholder="CC-01"
                value={costDialog.form.code}
                onChange={(e) => setCostDialog((d) => ({ ...d, form: { ...d.form, code: e.target.value } }))}
              />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITInput
                name="costCenterName"
                label={t("catalog.name")}
                value={costDialog.form.name}
                onChange={(e) => setCostDialog((d) => ({ ...d, form: { ...d.form, name: e.target.value } }))}
              />
            </ITGrid>
          </ITGrid>
          <ITSelect
            name="costCenterDepartment"
            label={t("catalog.department")}
            options={[
              { value: "", label: t("catalog.noDepartment") },
              ...departments.data.map((d) => ({ value: d.id, label: d.name })),
            ]}
            value={costDialog.form.departmentId ?? ""}
            onChange={(e) => setCostDialog((d) => ({ ...d, form: { ...d.form, departmentId: e.target.value } }))}
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("catalog.cancel")} onClick={() => setCostDialog({ open: false, item: null, form: emptyCostCenter() })} />
            <ITButton
              variant="filled"
              color="primary"
              label={t("catalog.save")}
              disabled={saving || !costDialog.form.name.trim() || !costDialog.form.code.trim()}
              onClick={() => void saveCostCenter()}
            />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </ITGrid>
  );
}
