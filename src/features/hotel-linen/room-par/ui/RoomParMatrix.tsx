import { useCallback, useEffect, useMemo, useState } from "react";
import { ITAlert, ITButton, ITDataTable, ITFlex, ITInputNumber, ITText, ITToast } from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaInbox } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { ROOM_COMPONENTS, roomParApi, type RoomComponent, type RoomParKind, type RoomParMatrix } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { PanelCard } from "@shared/ui/panel-card";

const cellKey = (productId: string, component: RoomComponent) => `${productId}:${component}`;

interface Props {
  kind: RoomParKind;
}

/** Matriz producto x componente de la dotación; editable solo con `hotel_linen.room_par`. */
export default function RoomParMatrixPanel({ kind }: Props) {
  const { t } = useTranslation("hotel-linen");
  const canEdit = useCan("hotel_linen.room_par");
  const [data, setData] = useState<RoomParMatrix | null>(null);
  const [values, setValues] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await roomParApi.list(kind);
      setData(res);
      setValues(Object.fromEntries(res.lines.map((l) => [cellKey(l.productId, l.component), l.quantity])));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [kind]);

  useEffect(() => {
    void load();
  }, [load]);

  const save = async () => {
    if (!data) return;
    setSaving(true);
    setError(null);
    try {
      const lines = data.products.flatMap((p) =>
        ROOM_COMPONENTS.map((component) => ({ component, productId: p.id, quantity: values[cellKey(p.id, component)] ?? 0 }))
      );
      await roomParApi.save({ kind, lines });
      setToast(t("roomPar.saved"));
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const fetchData = useMemo(
    () => makeClientTableFetch<RoomParMatrix["products"][number]>(async () => data?.products ?? [], {}),
    [data]
  );
  const columns: Column<RoomParMatrix["products"][number]>[] = [
    {
      key: "name",
      label: t("roomPar.product"),
      type: "string",
      width: 260,
      filter: true,
      render: (p) => <ITText className="text-[12px] font-semibold">{`${p.code} · ${p.name}`}</ITText>,
    },
    ...ROOM_COMPONENTS.map((c) => ({
      key: c,
      label: t(`roomPar.components.${c}`),
      type: "string" as const,
      width: 130,
      sortable: false,
      render: (p: RoomParMatrix["products"][number]) => (
        <ITInputNumber
          name={`par-${p.id}-${c}`}
          label=""
          decimals={0}
          min={0}
          max={999}
          disabled={!canEdit}
          value={values[cellKey(p.id, c)] ?? 0}
          onChange={(v) => setValues((prev) => ({ ...prev, [cellKey(p.id, c)]: v ?? 0 }))}
        />
      ),
    })),
  ];

  return (
    <PanelCard
      actions={
        canEdit ? <ITButton variant="filled" color="primary" label={t("roomPar.save")} disabled={saving} onClick={save} /> : undefined
      }
    >
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {!canEdit && <ITAlert variant="info">{t("roomPar.readOnly")}</ITAlert>}
      {data && data.products.length === 0 && (
        <ITFlex direction="column" align="center" gap={2} className="py-8">
          <FaInbox size={22} className="opacity-40" />
          <ITText muted className="text-[12px]">{t("roomPar.empty")}</ITText>
        </ITFlex>
      )}
      {data && data.products.length > 0 && (
        <ITDataTable
          showViewToggle={false}
          columns={columns as unknown as Column<Record<string, unknown>>[]}
          fetchData={fetchData as never}
          size="lg"
          defaultItemsPerPage={25}
          itemsPerPageOptions={[25, 50, 100]}
          layout="fixed"
          density="compact"
          rowHeight={64}
        />
      )}
      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </PanelCard>
  );
}
