import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITChip,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaMapMarkerAlt, FaPlus, FaSlidersH, FaTrash, FaTrashRestore, FaUserCheck, FaUserSlash, FaWarehouse } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  HOTEL_WAREHOUSE_KINDS,
  hotelLinenApi,
  useHotelZoneOptions,
  type HotelPerson,
  type HotelWarehouse,
  type HotelWarehouseInput,
  type HotelWarehouseKind,
} from "@entities/hotel-linen";
import { personLabel, useCan, usersApi } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { KpiTile } from "@shared/ui/kpi-tile";
import { PanelCard } from "@shared/ui/panel-card";
import { ProfileAvatar } from "@shared/ui/profile-avatar";
import { ToneChip } from "@shared/ui/tone-chip";
import { dyn } from "@shared/i18n/dyn";
import WarehouseLimitsDialog from "./WarehouseLimitsDialog";
import { LuWarehouse, LuMapPin } from "react-icons/lu";
import { DialogHeader } from "@shared/ui/dialog-header";
import { DialogFooter } from "@shared/ui/dialog-footer";

interface FormState {
  code: string;
  name: string;
  kind: HotelWarehouseKind;
  zoneId: string;
  custodianId: string;
}

const emptyForm = (): FormState => ({ code: "", name: "", kind: "CENTRAL", zoneId: "", custodianId: "" });

interface Props {
  /** Cada incremento abre el diálogo de alta (el botón vive en la cabecera de la página). */
  newSignal?: number;
}

/** Áreas y puntos de blancos = almacenes del hotel con su custodio, zona y ubicaciones. */
export default function LinenAreasPanel({ newSignal = 0 }: Props) {
  const { t } = useTranslation("hotel-linen");
  const tt = dyn(t);
  const canManage = useCan("hotel_store.manage");
  const zones = useHotelZoneOptions();
  const [people, setPeople] = useState<HotelPerson[]>([]);
  const [all, setAll] = useState<HotelWarehouse[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<{ open: boolean; item: HotelWarehouse | null; form: FormState }>({
    open: false,
    item: null,
    form: emptyForm(),
  });
  const [limitsArea, setLimitsArea] = useState<HotelWarehouse | null>(null);
  const [locDialog, setLocDialog] = useState<{ open: boolean; area: HotelWarehouse | null; code: string; name: string }>({
    open: false,
    area: null,
    code: "",
    name: "",
  });

  // Personas para el custodio (incluye foto para el avatar de la tabla).
  useEffect(() => {
    let active = true;
    usersApi
      .people()
      .then((list) => active && setPeople(list))
      .catch(() => active && setPeople([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (newSignal > 0) setDialog({ open: true, item: null, form: emptyForm() });
  }, [newSignal]);

  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);
  const custodianOf = (w: HotelWarehouse) => w.custodian ?? (w.custodianId ? personById.get(w.custodianId) ?? null : null);

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
    if (!f.name.trim() || (!dialog.item && !f.code.trim())) return;
    const ok = await run(() => {
      if (dialog.item) {
        const input: Partial<HotelWarehouseInput> = {
          name: f.name.trim(),
          zoneId: f.zoneId || null,
          custodianId: f.custodianId || null,
        };
        return hotelLinenApi.updateWarehouse(dialog.item.id, input);
      }
      return hotelLinenApi.createWarehouse({
        code: f.code.trim(),
        name: f.name.trim(),
        kind: f.kind,
        zoneId: f.zoneId || null,
        custodianId: f.custodianId || null,
      });
    });
    if (ok) setDialog({ open: false, item: null, form: emptyForm() });
  };

  const saveLocation = async () => {
    if (!locDialog.area || !locDialog.code.trim()) return;
    const ok = await run(() =>
      hotelLinenApi.addLocation(locDialog.area!.id, { code: locDialog.code.trim(), name: locDialog.name.trim() || null })
    );
    if (ok) setLocDialog({ open: false, area: null, code: "", name: "" });
  };

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<HotelWarehouse>(
        () =>
          hotelLinenApi.warehouses(true).then((rows) => {
            setAll(rows);
            return rows;
          }),
        {
        kind: { match: "equals" },
        zone: { value: (w) => w.zone?.name ?? zones.data.find((z) => z.id === w.zoneId)?.name },
        custodian: { value: (w) => (w.custodian ?? (w.custodianId ? personById.get(w.custodianId) : null))?.name },
        locations: { value: (w) => w.locations.map((l) => l.code) },
        active: { match: "equals" },
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey, zones.data, personById]
  );

  const columns: Column<HotelWarehouse>[] = [
    {
      key: "code",
      label: t("areas.columns.code"),
      type: "string",
      width: 100,
      filter: true,
      render: (w) => <ITText className="font-mono text-[12px] font-bold">{w.code}</ITText>,
    },
    {
      key: "name",
      label: t("areas.columns.name"),
      type: "string",
      width: 210,
      filter: true,
      render: (w) => <ITText className="text-[12px] font-bold">{w.name}</ITText>,
    },
    {
      key: "kind",
      label: t("areas.columns.kind"),
      type: "catalog",
      width: 160,
      filter: "catalog",
      catalogOptions: { data: HOTEL_WAREHOUSE_KINDS.map((k) => ({ id: k, name: tt(`warehouseKind.${k}`) })) },
      render: (w) => (
        <ToneChip tone="info" label={tt(`warehouseKind.${w.kind}`)} />
      ),
    },
    {
      key: "custodian",
      label: t("areas.columns.custodian"),
      type: "string",
      width: 220,
      filter: true,
      render: (w) => {
        const c = custodianOf(w);
        return c ? (
          <ITFlex align="center" gap={2}>
            <ProfileAvatar name={c.name} photoUrl={c.photoUrl} size="sm" />
            <ITText className="text-[11px] font-semibold">{c.name}</ITText>
          </ITFlex>
        ) : (
          <ITText className="text-[11px]">{t("common.none")}</ITText>
        );
      },
    },
    {
      key: "zone",
      label: t("areas.columns.zone"),
      type: "string",
      width: 140,
      filter: true,
      render: (w) => (
        <ITText className="text-[11px]">{w.zone?.name ?? zones.data.find((z) => z.id === w.zoneId)?.name ?? "—"}</ITText>
      ),
    },
    {
      key: "locations",
      label: t("areas.columns.locations"),
      type: "string",
      width: 260,
      filter: true,
      sortable: false,
      render: (w) =>
        w.locations.length === 0 ? (
          <ITText className="text-[11px]">{t("areas.noLocations")}</ITText>
        ) : (
          <ITFlex wrap="wrap" gap={1}>
            {w.locations.map((l) => (
              <ITChip key={l.id} size="sm" label={l.name ? `${l.code} · ${l.name}` : l.code} />
            ))}
          </ITFlex>
        ),
    },
    {
      key: "active",
      label: t("areas.columns.status"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: t("common.active") },
          { id: "false", name: t("common.inactive") },
        ],
      },
      render: (w) => (
        <ToneChip tone={w.active ? "success" : "danger"} label={w.active ? t("common.active") : t("common.inactive")} />
      ),
    },
    ...(canManage
      ? [
          {
            key: "actions",
            label: "",
            type: "actions" as const,
            width: 220,
            actions: (w: HotelWarehouse) => (
              <ITFlex align="center" gap={2}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="lg"
                  title={t("common.edit")}
                  onClick={() =>
                    setDialog({
                      open: true,
                      item: w,
                      form: { code: w.code, name: w.name, kind: w.kind, zoneId: w.zoneId ?? "", custodianId: w.custodianId ?? "" },
                    })
                  }
                >
                  <FaEdit size={12} />
                </ITButton>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="lg"
                  title={t("areas.addLocation")}
                  onClick={() => setLocDialog({ open: true, area: w, code: "", name: "" })}
                >
                  <FaPlus size={12} />
                </ITButton>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="lg"
                  title={t("areas.limits.action")}
                  onClick={() => setLimitsArea(w)}
                >
                  <FaSlidersH size={12} />
                </ITButton>
                <ITButton
                  variant="outlined"
                  color={w.active ? "secondary" : "success"}
                  size="lg"
                  title={w.active ? t("common.deactivate") : t("common.reactivate")}
                  onClick={() => void run(() => hotelLinenApi.updateWarehouse(w.id, { active: !w.active }))}
                >
                  {w.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
                </ITButton>
              </ITFlex>
            ),
          },
        ]
      : []),
  ];

  const f = dialog.form;
  const kpis = useMemo(() => {
    const act = all.filter((w) => w.active);
    const withCustodian = act.filter((w) => custodianOf(w)).length;
    return {
      active: act.length,
      withCustodian,
      without: act.length - withCustodian,
      locations: act.reduce((n, w) => n + w.locations.length, 0),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, personById]);

  return (
    <PanelCard>
      <ITFlex direction="column" gap={4}>
        <div className="grid !grid-cols-2 gap-4 md:!grid-cols-4">
          <KpiTile size="sm" label={t("areas.kpi.active")} value={kpis.active} icon={<FaWarehouse size={14} />} tone="sky" />
          <KpiTile size="sm" label={t("areas.kpi.withCustodian")} value={kpis.withCustodian} icon={<FaUserCheck size={14} />} tone="emerald" />
          <KpiTile
            size="sm"
            label={t("areas.kpi.withoutCustodian")}
            value={kpis.without}
            icon={<FaUserSlash size={14} />}
            tone={kpis.without > 0 ? "amber" : "neutral"}
            hint={kpis.without === 0 ? t("common.allGood") : undefined}
          />
          <KpiTile size="sm" label={t("areas.kpi.locations")} value={kpis.locations} icon={<FaMapMarkerAlt size={14} />} tone="violet" />
        </div>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchData as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={56}
          virtualized
          virtualizedMaxHeight={520}
        />
      </ITFlex>

      <ITDialog
        isOpen={dialog.open}
        onClose={() => setDialog({ open: false, item: null, form: emptyForm() })}
      >
      <DialogHeader icon={<LuWarehouse />} title={dialog.item ? t("areas.edit") : t("areas.new")} subtitle={t("areas.formSubtitle")} />
        <ITFlex direction="column" gap={3} className="min-w-[360px]">
          {error && <ITAlert variant="error">{error}</ITAlert>}
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput
                name="areaCode"
                label={t("areas.form.code")}
                value={f.code}
                disabled={!!dialog.item}
                onChange={(e) => setField("code", e.target.value.toUpperCase())}
              />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITInput name="areaName" label={t("areas.form.name")} value={f.name} onChange={(e) => setField("name", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect
                name="areaKind"
                label={t("areas.form.kind")}
                disabled={!!dialog.item}
                options={HOTEL_WAREHOUSE_KINDS.map((k) => ({ value: k, label: tt(`warehouseKind.${k}`) }))}
                value={f.kind}
                onChange={(e) => setField("kind", e.target.value as HotelWarehouseKind)}
              />
            </ITGrid>
            <ITGrid item xs={12} md={6}>
              <ITSelect
                name="areaZone"
                label={t("areas.form.zone")}
                options={zones.data.map((z) => ({ value: z.id, label: z.name }))}
                value={f.zoneId}
                onChange={(e) => setField("zoneId", e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITSelect
                name="areaCustodian"
                label={t("areas.form.custodian")}
                options={people.map((p) => ({ value: p.id, label: personLabel(p) }))}
                value={f.custodianId}
                onChange={(e) => setField("custodianId", e.target.value)}
              />
            </ITGrid>
          </ITGrid>
          <DialogFooter onCancel={() => setDialog({ open: false, item: null, form: emptyForm() })} onConfirm={() => void save()} confirmLabel={t("common.save")} busy={saving} disabled={!f.name.trim() || (!dialog.item && !f.code.trim())} />
        </ITFlex>
      </ITDialog>

      <ITDialog
        isOpen={locDialog.open}
        onClose={() => setLocDialog({ open: false, area: null, code: "", name: "" })}
      >
      <DialogHeader icon={<LuMapPin />} title={t("areas.locationTitle", { name: locDialog.area?.name ?? "" })} subtitle={t("areas.locationSubtitle")} />
        <ITFlex direction="column" gap={3} className="min-w-[320px]">
          <ITInput
            name="locationCode"
            label={t("areas.location.code")}
            value={locDialog.code}
            onChange={(e) => setLocDialog((d) => ({ ...d, code: e.target.value.toUpperCase() }))}
          />
          <ITInput
            name="locationName"
            label={t("areas.location.name")}
            value={locDialog.name}
            onChange={(e) => setLocDialog((d) => ({ ...d, name: e.target.value }))}
          />
          <DialogFooter onCancel={() => setLocDialog({ open: false, area: null, code: "", name: "" })} onConfirm={() => void saveLocation()} confirmLabel={t("common.save")} busy={saving} disabled={!locDialog.code.trim()} />
        </ITFlex>
      </ITDialog>

      <WarehouseLimitsDialog
        warehouse={limitsArea}
        onClose={() => setLimitsArea(null)}
        onSaved={() => {
          setToast(t("common.saved"));
          setTimeout(() => setToast(null), 2000);
        }}
      />

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </PanelCard>
  );
}
