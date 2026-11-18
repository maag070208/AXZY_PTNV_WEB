import { useEffect, useMemo, useState } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITConfirmDialog,
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
import { FaBath, FaBed, FaDoorOpen, FaEdit, FaTrash, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  HOTEL_ROOM_STATUSES,
  roomApi,
  useHotelZoneOptions,
  type HotelRoom,
  type HotelRoomTypeOption,
} from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";
import { KpiTile } from "@shared/ui/kpi-tile";
import { dyn } from "@shared/i18n/dyn";

interface FormState {
  number: string;
  zoneId: string;
  typeId: string;
  kingBeds: number;
  queenBeds: number;
  sofaBeds: number;
  bathrooms: number;
  notes: string;
  active: boolean;
}

const emptyForm = (): FormState => ({
  number: "",
  zoneId: "",
  typeId: "",
  kingBeds: 0,
  queenBeds: 0,
  sofaBeds: 0,
  bathrooms: 0,
  notes: "",
  active: true,
});

interface Props {
  /** Cada incremento abre el diálogo de alta (el botón vive en la cabecera de la página). */
  newSignal?: number;
}

/** Catálogo de habitaciones: composición de camas y baños, zona y tipo. */
export default function RoomsPanel({ newSignal = 0 }: Props) {
  const { t } = useTranslation("hotel-linen-rooms");
  const tt = dyn(t);
  const canManage = useCan("hotel_rooms.manage");
  const zones = useHotelZoneOptions();
  const [types, setTypes] = useState<HotelRoomTypeOption[]>([]);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toDisable, setToDisable] = useState<HotelRoom | null>(null);
  const [dialog, setDialog] = useState<{ open: boolean; item: HotelRoom | null; form: FormState }>({
    open: false,
    item: null,
    form: emptyForm(),
  });

  useEffect(() => {
    let active = true;
    roomApi
      .types()
      .then((list) => active && setTypes(list))
      .catch(() => active && setTypes([]));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (newSignal > 0) setDialog({ open: true, item: null, form: emptyForm() });
  }, [newSignal]);

  const zoneName = (r: HotelRoom) => r.zone?.name ?? zones.data.find((z) => z.id === r.zoneId)?.name ?? "";
  const typeName = (r: HotelRoom) => r.type?.name ?? types.find((x) => x.id === r.typeId)?.name ?? "";

  const kpis = useMemo(() => {
    const act = rooms.filter((r) => r.active);
    const sum = (k: "kingBeds" | "queenBeds" | "sofaBeds" | "bathrooms") => act.reduce((s, r) => s + r[k], 0);
    return { active: act.length, king: sum("kingBeds"), queen: sum("queenBeds"), sofa: sum("sofaBeds"), baths: sum("bathrooms") };
  }, [rooms]);

  const run = async (fn: () => Promise<unknown>) => {
    setSaving(true);
    setError(null);
    try {
      await fn();
      setReloadKey((k) => k + 1);
      setToast(t("saved"));
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

  const f = dialog.form;
  const valid = !!f.number.trim() && !!f.typeId && !!f.zoneId;

  const save = async () => {
    if (!valid) return;
    const composition = { kingBeds: f.kingBeds, queenBeds: f.queenBeds, sofaBeds: f.sofaBeds, bathrooms: f.bathrooms };
    const ok = await run(() =>
      dialog.item
        ? roomApi.update(dialog.item.id, {
            zoneId: f.zoneId,
            number: f.number.trim(),
            typeId: f.typeId,
            ...composition,
            notes: f.notes.trim() || null,
            active: f.active,
          })
        : roomApi.create({
            number: f.number.trim(),
            zoneId: f.zoneId,
            typeId: f.typeId,
            ...composition,
            notes: f.notes.trim() || null,
          })
    );
    if (ok) setDialog({ open: false, item: null, form: emptyForm() });
  };

  const confirmDisable = async () => {
    const room = toDisable;
    setToDisable(null);
    if (room) await run(() => roomApi.remove(room.id));
  };

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<HotelRoom>(
        () =>
          roomApi.list(true).then((list) => {
            setRooms(list);
            return list;
          }),
        {
          zone: { value: (r) => zoneName(r) },
          type: { value: (r) => typeName(r) },
          status: { match: "equals" },
          active: { match: "equals" },
        }
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reloadKey, zones.data, types]
  );

  const numCol = (key: "kingBeds" | "queenBeds" | "sofaBeds" | "bathrooms", label: string): Column<HotelRoom> => ({
    key,
    label,
    type: "number",
    width: 90,
    filter: true,
    render: (r) => <ITText className="text-[12px] font-semibold">{r[key]}</ITText>,
  });

  const columns: Column<HotelRoom>[] = [
    {
      key: "number",
      label: t("columns.number"),
      type: "string",
      width: 100,
      filter: true,
      render: (r) => <ITText className="font-mono text-[12px] font-bold">{r.number}</ITText>,
    },
    {
      key: "zone",
      label: t("columns.zone"),
      type: "string",
      width: 160,
      filter: true,
      render: (r) => <ITText className="text-[11px]">{zoneName(r) || "—"}</ITText>,
    },
    {
      key: "type",
      label: t("columns.type"),
      type: "string",
      width: 170,
      filter: true,
      render: (r) => <ITText className="text-[11px]">{typeName(r) || "—"}</ITText>,
    },
    numCol("kingBeds", t("columns.king")),
    numCol("queenBeds", t("columns.queen")),
    numCol("sofaBeds", t("columns.sofa")),
    numCol("bathrooms", t("columns.bathrooms")),
    {
      key: "status",
      label: t("columns.status"),
      type: "catalog",
      width: 150,
      filter: "catalog",
      catalogOptions: { data: HOTEL_ROOM_STATUSES.map((s) => ({ id: s, name: tt(`status.${s}`) })) },
      render: (r) => (
        <ITBadget color="info" size="lg">
          {tt(`status.${r.status}`)}
        </ITBadget>
      ),
    },
    {
      key: "active",
      label: t("columns.active"),
      type: "catalog",
      width: 110,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "true", name: t("active") },
          { id: "false", name: t("inactive") },
        ],
      },
      render: (r) => (
        <ITBadget color={r.active ? "success" : "danger"} size="lg">
          {r.active ? t("active") : t("inactive")}
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
            actions: (r: HotelRoom) => (
              <ITFlex align="center" gap={2}>
                <ITButton
                  variant="outlined"
                  color="primary"
                  size="lg"
                  title={t("edit")}
                  onClick={() =>
                    setDialog({
                      open: true,
                      item: r,
                      form: {
                        number: r.number,
                        zoneId: r.zoneId,
                        typeId: r.typeId,
                        kingBeds: r.kingBeds,
                        queenBeds: r.queenBeds,
                        sofaBeds: r.sofaBeds,
                        bathrooms: r.bathrooms,
                        notes: r.notes ?? "",
                        active: r.active,
                      },
                    })
                  }
                >
                  <FaEdit size={12} />
                </ITButton>
                <ITButton
                  variant="outlined"
                  color={r.active ? "secondary" : "success"}
                  size="lg"
                  title={r.active ? t("deactivate") : t("reactivate")}
                  onClick={() => (r.active ? setToDisable(r) : void run(() => roomApi.update(r.id, { active: true })))}
                >
                  {r.active ? <FaTrash size={12} /> : <FaTrashRestore size={12} />}
                </ITButton>
              </ITFlex>
            ),
          },
        ]
      : []),
  ];

  const closeDialog = () => setDialog({ open: false, item: null, form: emptyForm() });
  const numField = (key: "kingBeds" | "queenBeds" | "sofaBeds" | "bathrooms", label: string) => (
    <ITGrid item xs={6} md={3}>
      <ITInputNumber
        name={`room_${key}`}
        label={label}
        decimals={0}
        min={0}
        max={20}
        value={f[key]}
        onChange={(v) => setField(key, v ?? 0)}
      />
    </ITGrid>
  );

  return (
    <PanelCard title={t("title")} description={t("description")}>
      <ITFlex direction="column" gap={3}>
        <ITGrid container spacing={2}>
          <ITGrid item xs={6} md={4}>
            <KpiTile label={t("kpi.active")} value={String(kpis.active)} icon={<FaDoorOpen size={14} />} tone="sky" />
          </ITGrid>
          <ITGrid item xs={6} md={4}>
            <KpiTile label={t("kpi.king")} value={String(kpis.king)} icon={<FaBed size={14} />} tone="emerald" />
          </ITGrid>
          <ITGrid item xs={6} md={4}>
            <KpiTile label={t("kpi.queen")} value={String(kpis.queen)} icon={<FaBed size={14} />} tone="violet" />
          </ITGrid>
          <ITGrid item xs={6} md={4}>
            <KpiTile label={t("kpi.sofa")} value={String(kpis.sofa)} icon={<FaBed size={14} />} tone="amber" />
          </ITGrid>
          <ITGrid item xs={6} md={4}>
            <KpiTile label={t("kpi.bathrooms")} value={String(kpis.baths)} icon={<FaBath size={14} />} tone="orange" />
          </ITGrid>
        </ITGrid>
        {error && !dialog.open && (
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

      <ITDialog isOpen={dialog.open} onClose={closeDialog} title={dialog.item ? t("editTitle") : t("newTitle")}>
        <ITFlex direction="column" gap={3} className="min-w-[360px]">
          {error && <ITAlert variant="error">{error}</ITAlert>}
          <ITGrid container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITInput name="roomNumber" label={t("form.number")} value={f.number} onChange={(e) => setField("number", e.target.value)} />
            </ITGrid>
            <ITGrid item xs={12} md={8}>
              <ITSelect
                name="roomZone"
                label={t("form.zone")}
                options={zones.data.filter((z) => !z.kind || z.kind === "FLOOR" || z.id === f.zoneId).map((z) => ({ value: z.id, label: z.name }))}
                value={f.zoneId}
                onChange={(e) => setField("zoneId", e.target.value)}
              />
            </ITGrid>
            <ITGrid item xs={12}>
              <ITSelect
                name="roomType"
                label={t("form.type")}
                options={types.filter((x) => x.active || x.id === f.typeId).map((x) => ({ value: x.id, label: x.name }))}
                value={f.typeId}
                onChange={(e) => setField("typeId", e.target.value)}
              />
            </ITGrid>
            {numField("kingBeds", t("form.king"))}
            {numField("queenBeds", t("form.queen"))}
            {numField("sofaBeds", t("form.sofa"))}
            {numField("bathrooms", t("form.bathrooms"))}
            <ITGrid item xs={12}>
              <ITInput name="roomNotes" label={t("form.notes")} value={f.notes} onChange={(e) => setField("notes", e.target.value)} />
            </ITGrid>
            {dialog.item && (
              <ITGrid item xs={12}>
                <ITSelect
                  name="roomActive"
                  label={t("form.active")}
                  options={[
                    { value: "true", label: t("active") },
                    { value: "false", label: t("inactive") },
                  ]}
                  value={String(f.active)}
                  onChange={(e) => setField("active", e.target.value === "true")}
                />
              </ITGrid>
            )}
          </ITGrid>
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" label={t("cancel")} onClick={closeDialog} />
            <ITButton variant="filled" color="primary" label={t("save")} disabled={saving || !valid} onClick={() => void save()} />
          </ITFlex>
        </ITFlex>
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!toDisable}
        onClose={() => setToDisable(null)}
        onConfirm={confirmDisable}
        title={t("deactivate")}
        message={t("deactivateConfirm", { number: toDisable?.number ?? "" })}
        confirmLabel={t("deactivate")}
        cancelLabel={t("cancel")}
        variant="danger"
      />

      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </PanelCard>
  );
}
