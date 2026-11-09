import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITGrid, ITInputNumber, ITText } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, type HotelProduct, type HotelWarehouse } from "@entities/hotel-linen";

interface Props {
  warehouse: HotelWarehouse | null;
  onClose: () => void;
  onSaved: () => void;
}

type Draft = Record<string, { min: number | null; max: number | null }>;

/** Mínimos y máximos por artículo de un almacén (GET/PUT limits). Vacío = sin límite. */
export default function WarehouseLimitsDialog({ warehouse, onClose, onSaved }: Props) {
  const { t } = useTranslation("hotel-linen");
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [draft, setDraft] = useState<Draft>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!warehouse) return;
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([hotelLinenApi.products(), hotelLinenApi.warehouseLimits(warehouse.id)])
      .then(([list, limits]) => {
        if (!active) return;
        setProducts(list.filter((p) => p.kind !== "CHEMICAL"));
        setDraft(Object.fromEntries(limits.map((l) => [l.productId, { min: l.minStock, max: l.maxStock }])));
      })
      .catch((e: Error) => active && setError(e.message))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [warehouse]);

  const patch = (productId: string, key: "min" | "max", value: number | null) =>
    setDraft((d) => ({ ...d, [productId]: { min: d[productId]?.min ?? null, max: d[productId]?.max ?? null, [key]: value } }));

  const entries = Object.entries(draft)
    .filter(([, v]) => v.min !== null || v.max !== null)
    .map(([productId, v]) => ({ productId, minStock: v.min ?? 0, maxStock: v.max ?? 0 }));
  const invalid = entries.some((l) => l.maxStock !== 0 && l.maxStock < l.minStock);

  const save = async () => {
    if (!warehouse) return;
    setSaving(true);
    setError(null);
    try {
      await hotelLinenApi.setWarehouseLimits(warehouse.id, entries);
      onSaved();
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ITDialog isOpen={warehouse !== null} onClose={onClose} title={t("areas.limits.title", { name: warehouse?.name ?? "" })}>
      <ITFlex direction="column" gap={3} className="min-w-[520px]">
        <ITText muted className="text-[12px]">
          {t("areas.limits.hint")}
        </ITText>
        {error && <ITAlert variant="error">{error}</ITAlert>}
        {invalid && <ITAlert variant="warning">{t("areas.limits.invalid")}</ITAlert>}
        {loading ? (
          <ITText muted>{t("common.loading")}</ITText>
        ) : (
          <ITFlex direction="column" gap={2} className="max-h-[420px] overflow-y-auto">
            {products.map((p) => (
              <ITGrid key={p.id} container columns={12} spacing={3} className="items-center">
                <ITGrid item xs={12} md={6}>
                  <ITText className="text-[12px] font-bold">{p.name}</ITText>
                  <ITText muted className="font-mono text-[11px]">{p.code}</ITText>
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITInputNumber
                    name={`limitMin-${p.id}`}
                    label={t("areas.limits.min")}
                    decimals={0}
                    min={0}
                    value={draft[p.id]?.min ?? null}
                    onChange={(v) => patch(p.id, "min", v ?? null)}
                  />
                </ITGrid>
                <ITGrid item xs={6} md={3}>
                  <ITInputNumber
                    name={`limitMax-${p.id}`}
                    label={t("areas.limits.max")}
                    decimals={0}
                    min={0}
                    value={draft[p.id]?.max ?? null}
                    onChange={(v) => patch(p.id, "max", v ?? null)}
                  />
                </ITGrid>
              </ITGrid>
            ))}
          </ITFlex>
        )}
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onClose} />
          <ITButton
            variant="filled"
            color="primary"
            label={t("common.save")}
            disabled={saving || loading || invalid}
            onClick={() => void save()}
          />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
