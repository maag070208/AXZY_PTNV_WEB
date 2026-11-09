import { useEffect, useMemo, useRef, useState } from "react";
import {
  ITAlert,
  ITButton,
  ITFlex,
  ITGrid,
  ITInputNumber,
  ITSearchSelect,
  ITSelect,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaCamera, FaPlus, FaTimes, FaTrash } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import {
  WRITEOFF_REASONS,
  hotelLinenApi,
  writeoffApi,
  type HotelLot,
  type HotelProduct,
  type HotelWarehouse,
  type WriteoffReasonCode,
} from "@entities/hotel-linen";
import { dyn } from "@shared/i18n/dyn";
import { newId } from "@shared/lib/newId";
import { PanelCard } from "@shared/ui/panel-card";

interface LineDraft {
  id: string;
  productId: string;
  lotId: string;
  quantity: number | null;
  reason: WriteoffReasonCode | "";
}

interface Photo {
  id: string;
  file: File;
  preview: string;
}

const emptyLine = (): LineDraft => ({ id: newId(), productId: "", lotId: "", quantity: null, reason: "" });

interface Props {
  onDone: (ids: string[]) => void;
  onCancel: () => void;
}

/** Nueva baja: almacén, renglones artículo/lote/cantidad/motivo y fotos (cámara o archivo). */
export default function WriteoffForm({ onDone, onCancel }: Props) {
  const { t } = useTranslation("hotel-linen-writeoff");
  const tt = dyn(t);
  const fileInput = useRef<HTMLInputElement>(null);
  const [warehouses, setWarehouses] = useState<HotelWarehouse[]>([]);
  const [products, setProducts] = useState<HotelProduct[]>([]);
  const [lots, setLots] = useState<Record<string, HotelLot[]>>({});
  const [warehouseId, setWarehouseId] = useState("");
  const [locationId, setLocationId] = useState("");
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()]);
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([hotelLinenApi.warehouses(), hotelLinenApi.products()])
      .then(([w, p]) => {
        if (!active) return;
        setWarehouses(w);
        setProducts(p.filter((x) => x.kind === "LINEN"));
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
    };
  }, []);

  // Libera las vistas previas al salir.
  const previews = useRef<string[]>([]);
  previews.current = photos.map((p) => p.preview);
  useEffect(() => () => previews.current.forEach((url) => URL.revokeObjectURL(url)), []);

  const warehouse = warehouses.find((w) => w.id === warehouseId);
  const patchLine = (id: string, patch: Partial<LineDraft>) =>
    setLines((list) => list.map((l) => (l.id === id ? { ...l, ...patch } : l)));

  const pickProduct = (id: string, productId: string) => {
    patchLine(id, { productId, lotId: "" });
    if (productId && !lots[productId]) {
      hotelLinenApi
        .lots(productId)
        .then((list) => setLots((m) => ({ ...m, [productId]: list })))
        .catch(() => setLots((m) => ({ ...m, [productId]: [] })));
    }
  };

  const lotOptions = (productId: string) =>
    (lots[productId] ?? [])
      .filter((lot) => !warehouseId || lot.warehouses.some((w) => w.warehouseId === warehouseId && w.quantity > 0))
      .map((lot) => ({
        value: lot.id,
        label: `${lot.code} (${lot.warehouses.find((w) => w.warehouseId === warehouseId)?.quantity ?? lot.balance})`,
      }));

  const addFiles = (list: FileList | null) => {
    if (!list) return;
    const added = Array.from(list).map((file) => ({ id: newId(), file, preview: URL.createObjectURL(file) }));
    setPhotos((current) => [...current, ...added]);
    if (fileInput.current) fileInput.current.value = "";
  };
  const removePhoto = (id: string) =>
    setPhotos((current) => {
      const gone = current.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return current.filter((p) => p.id !== id);
    });

  const reasonOptions = WRITEOFF_REASONS.map((c) => ({ value: c, label: `${c} · ${tt(`writeoffs.reason.${c}`)}` }));
  const productOptions = useMemo(() => products.map((p) => ({ value: p.id, label: `${p.code} · ${p.name}${p.size ? ` · ${p.size}` : ""}` })), [products]);

  const linesValid = lines.length > 0 && lines.every((l) => l.productId && l.reason && l.quantity !== null && l.quantity > 0);
  const photosOk = photos.length > 0 || lines.every((l) => l.reason === "F");
  const valid = !!warehouseId && linesValid && photosOk;

  const submit = async () => {
    if (!valid) return;
    setBusy(true);
    setError(null);
    try {
      const created = await writeoffApi.create({
        warehouseId,
        locationId: locationId || null,
        notes: notes.trim() || null,
        photos: photos.map((p) => p.file),
        lines: lines.map((l) => ({
          productId: l.productId,
          lotId: l.lotId || null,
          quantity: l.quantity as number,
          reasonCode: l.reason as WriteoffReasonCode,
        })),
      });
      onDone(created.map((w) => w.id));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <PanelCard title={t("writeoffs.new.title")} description={t("writeoffs.new.description")}>
      <ITFlex direction="column" gap={4}>
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        <ITGrid container columns={12} spacing={3}>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="writeoffWarehouse"
              label={t("writeoffs.new.warehouse")}
              options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
              value={warehouseId}
              onChange={(e) => {
                setWarehouseId(e.target.value);
                setLocationId("");
              }}
            />
          </ITGrid>
          <ITGrid item xs={12} md={6}>
            <ITSelect
              name="writeoffLocation"
              label={t("writeoffs.new.location")}
              options={[
                { value: "", label: t("writeoffs.new.locationAuto") },
                ...(warehouse?.locations ?? []).filter((l) => l.active).map((l) => ({ value: l.id, label: l.name ?? l.code })),
              ]}
              value={locationId}
              disabled={!warehouseId}
              onChange={(e) => setLocationId(e.target.value)}
            />
          </ITGrid>
        </ITGrid>

        <ITText className="text-[12px] font-semibold">{t("writeoffs.new.lines")}</ITText>
        {lines.map((line, index) => (
          <ITGrid key={line.id} container columns={12} spacing={3}>
            <ITGrid item xs={12} md={4}>
              <ITSearchSelect
                name={`writeoffProduct${index}`}
                label={t("writeoffs.new.item")}
                options={productOptions}
                value={line.productId}
                onChange={(v) => pickProduct(line.id, String(v))}
              />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITSelect
                name={`writeoffLot${index}`}
                label={t("writeoffs.new.lot")}
                options={[{ value: "", label: t("writeoffs.new.lotAuto") }, ...lotOptions(line.productId)]}
                value={line.lotId}
                disabled={!line.productId || !warehouseId}
                onChange={(e) => patchLine(line.id, { lotId: e.target.value })}
              />
            </ITGrid>
            <ITGrid item xs={6} md={2}>
              <ITInputNumber
                name={`writeoffQty${index}`}
                label={t("writeoffs.new.quantity")}
                decimals={0}
                min={0}
                value={line.quantity}
                onChange={(v) => patchLine(line.id, { quantity: v ?? null })}
              />
            </ITGrid>
            <ITGrid item xs={10} md={3}>
              <ITSelect
                name={`writeoffReason${index}`}
                label={t("writeoffs.new.reason")}
                options={reasonOptions}
                value={line.reason}
                onChange={(e) => patchLine(line.id, { reason: e.target.value as WriteoffReasonCode })}
              />
            </ITGrid>
            <ITGrid item xs={2} md={1}>
              <ITButton
                variant="outlined"
                color="secondary"
                size="lg"
                title={t("writeoffs.new.removeLine")}
                disabled={lines.length === 1}
                onClick={() => setLines((list) => list.filter((l) => l.id !== line.id))}
              >
                <FaTrash size={12} />
              </ITButton>
            </ITGrid>
          </ITGrid>
        ))}
        <ITFlex>
          <ITButton
            variant="outlined"
            color="primary"
            icon={<FaPlus size={12} />}
            label={t("writeoffs.new.addLine")}
            onClick={() => setLines((list) => [...list, emptyLine()])}
          />
        </ITFlex>

        <ITFlex direction="column" gap={2}>
          <ITText className="text-[12px] font-semibold">{t("writeoffs.new.photos")}</ITText>
          <ITText muted className="text-[11px]">{t("writeoffs.new.photosHint")}</ITText>
          {/* Cámara trasera en móvil o selector de archivos; sin getUserMedia. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            className="hidden"
            onChange={(e) => addFiles(e.target.files)}
          />
          <ITFlex gap={3} wrap="wrap" align="center">
            {photos.map((p) => (
              <div key={p.id} className="relative">
                <img src={p.preview} alt={p.file.name} className="h-24 w-24 rounded-lg object-cover" />
                <button
                  type="button"
                  className="absolute -right-2 -top-2 rounded-full bg-[var(--color-danger)] p-1 text-white"
                  title={t("writeoffs.new.photosRemove")}
                  aria-label={t("writeoffs.new.photosRemove")}
                  onClick={() => removePhoto(p.id)}
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ))}
            <ITButton
              variant="outlined"
              color="primary"
              icon={<FaCamera size={12} />}
              label={t("writeoffs.new.photosAdd")}
              onClick={() => fileInput.current?.click()}
            />
          </ITFlex>
        </ITFlex>

        <ITTextarea name="writeoffNotes" label={t("writeoffs.new.notes")} rows={2} value={notes} onChange={(e) => setNotes(e)} />

        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" label={t("common.cancel")} onClick={onCancel} />
          <ITButton
            variant="filled"
            color="primary"
            label={t("writeoffs.new.submit")}
            disabled={busy || !valid}
            onClick={() => void submit()}
          />
        </ITFlex>
      </ITFlex>
    </PanelCard>
  );
}
