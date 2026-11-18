import { useCallback, useEffect, useState } from "react";
import { ITAlert, ITButton, ITInputNumber, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { ROOM_COMPONENTS, roomParApi, type RoomComponent, type RoomParKind, type RoomParMatrix } from "@entities/hotel-linen";
import { useCan } from "@entities/user";
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

  return (
    <PanelCard
      title={t("roomPar.title")}
      description={t("roomPar.description")}
      actions={
        canEdit ? <ITButton variant="filled" color="primary" label={t("roomPar.save")} disabled={saving} onClick={save} /> : undefined
      }
    >
      {error && <ITAlert variant="error">{error}</ITAlert>}
      {!canEdit && <ITText>{t("roomPar.readOnly")}</ITText>}
      {data && data.products.length === 0 && <ITText>{t("roomPar.empty")}</ITText>}
      {data && data.products.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">{t("roomPar.product")}</th>
                {ROOM_COMPONENTS.map((c) => (
                  <th key={c} className="p-2">
                    {t(`roomPar.components.${c}`)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.products.map((p) => (
                <tr key={p.id}>
                  <td className="p-2 whitespace-nowrap">
                    {p.code} · {p.name}
                  </td>
                  {ROOM_COMPONENTS.map((c) => (
                    <td key={c} className="p-2">
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
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <ITToast message={toast} type="success" position="bottom-center" duration={2000} onClose={() => setToast(null)} />}
    </PanelCard>
  );
}
