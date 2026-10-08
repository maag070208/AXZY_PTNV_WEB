import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import { ITButton, ITConfirmDialog, ITEmptyState, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import {
  FaBalanceScale,
  FaCheckCircle,
  FaClipboardCheck,
  FaExclamationTriangle,
  FaHandPointer,
  FaLink,
  FaSyncAlt,
} from "react-icons/fa";
import { inventoryApi } from "@entities/inventory";
import { formatDateTime } from "@shared/utils/dates";
import { PanelCard } from "@shared/ui/panel-card";
import { useInventoryAudit } from "../model/useInventoryAudit";

type Row = {
  movementItemId?: string;
  movementType?: string;
  date?: string;
  device?: string;
  deviceId?: string;
  quantity?: number;
  linked?: number;
  ledger?: number;
  linkedAfter?: number;
  ledgerIfQuantity?: number;
};

type Mode = "link" | "quantity" | "review";

/** `YYYY-MM-DD` → `DD/MM/AAAA` sin pasar por `Date`. */
const formatDay = (day?: string): string => (day ? day.split("-").reverse().join("/") : "");

/**
 * Pantalla para resolver un descuadre del auditor. A la izquierda los
 * movimientos que no cuadran; a la derecha, el elegido con lo que dice, las
 * salidas que de verdad sirven y UNA comparación —cómo está hoy y cómo queda
 * con la salida marcada—. Se elige, se ve el resultado y se aplica; la que
 * mueve las existencias pide confirmación.
 */
export default function InventoryMismatchesBoard() {
  const { t } = useTranslation(["inventory", "common"]);
  const { audit, loading, error, reload } = useInventoryAudit(true);
  const filas = ((audit?.checks.find((c) => c.key === "MOVEMENT_UNITS_MISMATCH")?.rows ?? []) as Row[]).filter(
    (f) => f.movementItemId
  );

  const preseleccion = (useLocation().state as { movementItemId?: string } | null)?.movementItemId;
  const [sel, setSel] = useState<Row | null>(null);
  const [modo, setModo] = useState<Mode | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [fallo, setFallo] = useState<string | null>(null);
  const [listo, setListo] = useState<string | null>(null);

  // Si se llegó desde el "Resolver" de un renglón, se abre ya elegido.
  const [preseleccionAplicada, setPreseleccionAplicada] = useState(false);
  useEffect(() => {
    if (preseleccionAplicada || sel || !preseleccion) return;
    const fila = filas.find((f) => f.movementItemId === preseleccion);
    if (fila) setSel(fila);
    if (fila || filas.length) setPreseleccionAplicada(true);
  }, [preseleccionAplicada, sel, preseleccion, filas]);

  const total = filas.length;
  // Lo que de verdad se puede registrar (piezas que existen y están libres),
  // no la suma de lo que "dice" cada renglón.
  const porRegistrar = filas.reduce(
    (s, f) => s + Math.max(0, (f.linkedAfter ?? f.linked ?? 0) - (f.linked ?? 0)),
    0
  );

  // Cómo está hoy el movimiento y el inventario del dispositivo.
  const dice = sel?.quantity ?? 0;
  const registradas = sel?.linked ?? 0;
  const disponible = sel?.ledger ?? 0;
  const quedanRegistradas = sel?.linkedAfter ?? registradas;
  /** Piezas que existen libres y se le pueden ligar (nunca más de las que faltan). */
  const ligables = Math.max(0, quedanRegistradas - registradas);
  const faltan = Math.max(0, dice - registradas);
  const sobran = Math.max(0, registradas - dice);

  const elegir = (fila: Row) => {
    setListo(null);
    setFallo(null);
    setModo(null);
    setSel(fila);
  };

  const resolver = async (mode: Mode) => {
    if (!sel?.movementItemId) return;
    setGuardando(true);
    setFallo(null);
    try {
      const r = await inventoryApi.resolveMismatch(sel.movementItemId, mode);
      setListo(
        mode === "link"
          ? t("audit.resolvedLink", { n: r.linked, remaining: r.remaining })
          : mode === "quantity"
            ? t("audit.resolvedQuantity", { n: r.quantity })
            : t("audit.resolvedReview")
      );
      setConfirmar(false);
      setModo(null);
      setSel(null);
      await reload();
    } catch (e) {
      setFallo(e instanceof Error ? e.message : String(e));
    } finally {
      setGuardando(false);
    }
  };

  /** Aplica lo elegido; cuadrar la cantidad mueve existencias, así que confirma. */
  const aplicar = () => {
    if (!modo) return;
    if (modo === "quantity") {
      setConfirmar(true);
      return;
    }
    void resolver(modo);
  };

  /**
   * Salidas que SÍ sirven para este renglón: ligar (solo si hay piezas libres),
   * cuadrar la cantidad (solo si de verdad cambia) y darlo por revisado. Así no
   * se ofrecen dos botones que hacen lo mismo. Cada una lleva su "por qué".
   */
  const opciones: {
    mode: Mode;
    icono: ReactNode;
    titulo: string;
    detalle: string;
    etiqueta: string;
    tono: "emerald" | "amber" | "slate";
  }[] = [];
  if (ligables > 0) {
    opciones.push({
      mode: "link",
      icono: <FaLink size={13} />,
      titulo: t("audit.optLink", { n: ligables }),
      detalle: t("audit.optLinkWhy", { n: ligables }),
      etiqueta: t("audit.tagNoStock"),
      tono: "emerald",
    });
  }
  if (quedanRegistradas !== dice) {
    // Cuadrar la cantidad mueve el kardex: sube o baja lo declarado por el
    // renglón, así que el disponible del dispositivo se mueve en el mismo sentido.
    const baja = (sel?.ledgerIfQuantity ?? disponible) < disponible;
    opciones.push({
      mode: "quantity",
      icono: <FaBalanceScale size={13} />,
      titulo: t("audit.optQuantity", { n: quedanRegistradas }),
      detalle: baja
        ? t("audit.optQuantityWhyDown", { quantity: dice, n: quedanRegistradas, from: disponible, to: sel?.ledgerIfQuantity ?? disponible })
        : t("audit.optQuantityWhyUp", { quantity: dice, n: quedanRegistradas, from: disponible, to: sel?.ledgerIfQuantity ?? disponible }),
      etiqueta: t("audit.tagStock"),
      tono: "amber",
    });
  }
  opciones.push({
    mode: "review",
    icono: <FaClipboardCheck size={13} />,
    titulo: t("audit.optReview"),
    detalle: t("audit.optReviewWhy"),
    etiqueta: t("audit.tagNothing"),
    tono: "slate",
  });

  // Diagnóstico en una línea: por qué no cuadra y con qué se arregla.
  const diagnostico =
    sobran > 0 || faltan === 0
      ? t("audit.diagExtra")
      : ligables >= faltan
        ? t("audit.diagFree", { n: ligables })
        : ligables > 0
          ? t("audit.diagPartial", { n: ligables, rest: faltan - ligables })
          : t("audit.diagNone");

  // Cómo queda con la salida marcada (sin marcar, todavía no hay "después").
  const despues =
    modo === null
      ? null
      : {
          dice: modo === "quantity" ? quedanRegistradas : dice,
          registradas: modo === "review" ? registradas : quedanRegistradas,
          disponible: modo === "quantity" ? (sel?.ledgerIfQuantity ?? disponible) : disponible,
        };

  // Qué pasa, en una frase, con la salida marcada.
  const resultado =
    modo === "link"
      ? t("audit.sayLink", { n: ligables, total: quedanRegistradas })
      : modo === "quantity"
        ? t("audit.sayQuantity", { n: quedanRegistradas, from: disponible, to: despues?.disponible ?? disponible })
        : modo === "review"
          ? t("audit.sayReview")
          : null;

  /** Renglón de la comparación: cómo está hoy y cómo queda (con su cambio). */
  const Comparacion = ({ label, hoy, luego }: { label: string; hoy: number; luego?: number }) => {
    const delta = luego === undefined ? 0 : luego - hoy;
    return (
      <div className="flex items-center border-t border-slate-100 px-3 py-2">
        <span className="min-w-0 flex-1 !text-[11px] text-slate-600">{label}</span>
        <span className="w-14 shrink-0 text-center !text-[13px] font-bold tabular-nums text-slate-700">{hoy}</span>
        <span className="flex w-28 shrink-0 items-center justify-center gap-1.5">
          {luego === undefined ? (
            <span className="!text-[12px] text-slate-300">—</span>
          ) : (
            <>
              <span
                className={`!text-[13px] font-black tabular-nums ${delta === 0 ? "text-slate-700" : delta > 0 ? "text-emerald-700" : "text-amber-700"}`}
              >
                {luego}
              </span>
              {delta !== 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 !text-[9px] font-bold ${
                    delta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {delta > 0 ? t("audit.rise", { n: delta }) : t("audit.drop", { n: Math.abs(delta) })}
                </span>
              )}
            </>
          )}
        </span>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <ITFlex
        align="center"
        justify="between"
        wrap="wrap"
        gap={3}
        className="rounded-2xl border border-slate-200 !bg-white px-4 py-3 shadow-sm"
      >
        <ITFlex align="center" gap={3}>
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
              total ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"
            }`}
          >
            {total ? <FaExclamationTriangle size={14} /> : <FaCheckCircle size={14} />}
          </span>
          <ITFlex direction="column" gap={0}>
            <ITText className="!text-[13px] font-bold text-slate-800">
              {total ? t("audit.summary", { count: total }) : t("audit.noMismatchesShort")}
            </ITText>
            <ITText className="!text-[11px] text-slate-500">
              {total
                ? t("audit.summaryPending", { count: porRegistrar })
                : t("audit.checkedAt", { date: audit ? formatDateTime(audit.checkedAt) : "" })}
            </ITText>
          </ITFlex>
        </ITFlex>
        <ITButton variant="outlined" color="secondary" size="sm" disabled={loading} onClick={() => void reload()}>
          <ITFlex align="center" gap={1}>
            <FaSyncAlt size={11} className={loading ? "animate-spin" : ""} />
            <ITText className="!text-[11px] font-bold">{t("audit.run")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <div className="!grid gap-4 lg:!grid-cols-5">
        <div className="lg:col-span-2">
          <PanelCard title={t("audit.listTitle")} description={t("audit.listHint")}>
            {loading && !filas.length ? (
              <ITText className="!text-[12px] text-slate-400">{t("audit.loading")}</ITText>
            ) : filas.length === 0 ? (
              <ITFlex align="center" gap={2} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <FaCheckCircle className="text-emerald-600" size={14} />
                <ITText className="!text-[12px] font-semibold text-emerald-700">{t("audit.noMismatches")}</ITText>
              </ITFlex>
            ) : (
              <ITFlex direction="column" gap={2}>
                {filas.map((f) => {
                  const activo = f.movementItemId === sel?.movementItemId;
                  const falta = Math.max(0, (f.quantity ?? 0) - (f.linked ?? 0));
                  const sobra = Math.max(0, (f.linked ?? 0) - (f.quantity ?? 0));
                  return (
                    <button
                      key={f.movementItemId}
                      type="button"
                      data-testid="fila-descuadre"
                      aria-pressed={activo}
                      onClick={() => elegir(f)}
                      className={`flex w-full flex-col gap-2 rounded-xl border px-3 py-2.5 text-left transition ${
                        activo
                          ? "border-[#0D5777] !bg-[#0D5777]/5 shadow-sm"
                          : "border-slate-200 !bg-white hover:border-[#0D5777]/40 hover:!bg-slate-50"
                      }`}
                    >
                      <span className="flex w-full items-center gap-2">
                        <span className="rounded-full bg-amber-200/70 px-2 py-0.5 !text-[10px] font-bold text-amber-900">
                          {f.movementType}
                        </span>
                        <span className="!text-[11px] text-slate-500">{formatDay(f.date)}</span>
                        {activo && <FaCheckCircle className="ml-auto shrink-0 text-[#0D5777]" size={13} />}
                      </span>
                      <span className="!text-[13px] font-semibold text-slate-800">{f.device}</span>
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="!text-[11px] text-slate-500">
                          {t("audit.movementUnits", { quantity: f.quantity ?? 0, linked: f.linked ?? 0 })}
                        </span>
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 !text-[10px] font-bold text-amber-800">
                          {falta > 0 ? t("audit.chipMissing", { n: falta }) : t("audit.chipExtra", { n: sobra })}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </ITFlex>
            )}
            {error && <ITText className="!text-[11px] font-bold text-red-600">{error}</ITText>}
          </PanelCard>
        </div>

        <div className="lg:col-span-3">
          <PanelCard
            title={t("audit.resolveTitle")}
            description={sel ? undefined : t("audit.resolveHintPage")}
            actions={
              sel ? (
                <ITButton variant="text" color="secondary" size="sm" disabled={guardando} onClick={() => setSel(null)}>
                  <ITText className="!text-[11px] font-bold">{t("audit.close")}</ITText>
                </ITButton>
              ) : undefined
            }
          >
            {listo ? (
              <ITFlex direction="column" gap={1} className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                <ITFlex align="center" gap={2}>
                  <FaCheckCircle className="text-emerald-600" size={14} />
                  <ITText className="!text-[12px] font-semibold text-emerald-800">{listo}</ITText>
                </ITFlex>
                <ITText className="!text-[11px] text-emerald-700">{t("audit.nextHint")}</ITText>
              </ITFlex>
            ) : !sel ? (
              <ITFlex direction="column" gap={3}>
                <ITEmptyState
                  icon={<FaHandPointer size={34} />}
                  title={t("audit.pickOne")}
                  description={t("audit.pickOneHint")}
                />
                <ITFlex direction="column" gap={1} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <ITText className="!text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("audit.howTitle")}
                  </ITText>
                  <ITText className="!text-[11px] text-slate-600">{t("audit.howStep1")}</ITText>
                  <ITText className="!text-[11px] text-slate-600">{t("audit.howStep2")}</ITText>
                  <ITText className="!text-[11px] text-slate-600">{t("audit.howStep3")}</ITText>
                </ITFlex>
              </ITFlex>
            ) : (
              <ITFlex direction="column" gap={4}>
                {/* Qué movimiento es y por qué no cuadra. */}
                <ITFlex direction="column" gap={1}>
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <span className="rounded-full bg-amber-200/70 px-2 py-0.5 !text-[10px] font-bold text-amber-900">
                      {sel.movementType}
                    </span>
                    <ITText className="!text-[11px] text-slate-500">{formatDay(sel.date)}</ITText>
                  </ITFlex>
                  <ITText className="!text-[15px] font-bold text-slate-800">{sel.device}</ITText>
                  <ITText className="!text-[11px] font-semibold text-slate-600">{diagnostico}</ITText>
                </ITFlex>

                {/* Las salidas que sirven, sin repetir lo que hace cada una. */}
                <ITFlex direction="column" gap={2}>
                  <ITText className="!text-[11px] font-bold uppercase tracking-wide text-slate-400">
                    {t("audit.whatToDo")}
                  </ITText>
                  {opciones.map((o) => {
                    const activo = modo === o.mode;
                    const tonos = {
                      emerald: { icono: "bg-emerald-50 text-emerald-600", tag: "bg-emerald-50 text-emerald-700" },
                      amber: { icono: "bg-amber-50 text-amber-600", tag: "bg-amber-100 text-amber-800" },
                      slate: { icono: "bg-slate-100 text-slate-500", tag: "bg-slate-100 text-slate-600" },
                    } as const;
                    return (
                      <button
                        key={o.mode}
                        type="button"
                        disabled={guardando}
                        aria-pressed={activo}
                        onClick={() => setModo(o.mode)}
                        className={`flex w-full flex-col gap-1.5 rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
                          activo
                            ? "border-[#0D5777] !bg-[#0D5777]/5 ring-1 ring-[#0D5777]/30"
                            : "border-slate-200 !bg-white hover:border-slate-300 hover:!bg-slate-50"
                        }`}
                      >
                        <span className="flex w-full items-center gap-3">
                          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tonos[o.tono].icono}`}>
                            {o.icono}
                          </span>
                          <span className="!text-[12px] font-bold text-slate-800">{o.titulo}</span>
                          <span
                            className={`ml-auto shrink-0 rounded-full px-2 py-0.5 !text-[9px] font-bold uppercase ${tonos[o.tono].tag}`}
                          >
                            {o.etiqueta}
                          </span>
                          <span
                            className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                              activo ? "border-[#0D5777] bg-[#0D5777]" : "border-slate-300 bg-white"
                            }`}
                          >
                            {activo && <FaCheckCircle className="text-white" size={9} />}
                          </span>
                        </span>
                        <span className="!text-[11px] leading-snug text-slate-500 pl-11">{o.detalle}</span>
                      </button>
                    );
                  })}
                  {opciones.length === 1 && (
                    <ITText className="!text-[11px] text-slate-500">{t("audit.onlyReview")}</ITText>
                  )}
                </ITFlex>

                {/* Una sola comparación: cómo está hoy y cómo queda. */}
                <ITFlex direction="column" gap={2}>
                  <ITFlex direction="column" gap={0} className="overflow-hidden rounded-xl border border-slate-200">
                    <div className="flex items-center bg-slate-50 px-3 py-2">
                      <span className="min-w-0 flex-1 !text-[11px] font-bold uppercase tracking-wide text-slate-500">
                        {t("audit.compareTitle")}
                      </span>
                      <span className="w-14 shrink-0 text-center !text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {t("audit.colToday")}
                      </span>
                      <span className="w-28 shrink-0 text-center !text-[10px] font-bold uppercase tracking-wide text-slate-500">
                        {t("audit.colAfter")}
                      </span>
                    </div>
                    <Comparacion label={t("audit.rowSays")} hoy={dice} luego={despues?.dice} />
                    <Comparacion label={t("audit.rowRegistered")} hoy={registradas} luego={despues?.registradas} />
                    <Comparacion label={t("audit.rowAvailable")} hoy={disponible} luego={despues?.disponible} />
                  </ITFlex>
                  <ITText className="!text-[10px] text-slate-400">{t("audit.compareHint")}</ITText>
                </ITFlex>

                {/* Qué pasa con la salida marcada, en una frase, y qué sigue. */}
                {resultado ? (
                  <ITFlex
                    direction="column"
                    gap={1}
                    className={`rounded-xl border px-3 py-2 ${
                      modo === "quantity" ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
                    }`}
                  >
                    <ITFlex align="center" gap={2}>
                      <FaCheckCircle className={modo === "quantity" ? "shrink-0 text-amber-600" : "shrink-0 text-slate-400"} size={12} />
                      <ITText
                        className={`!text-[11px] font-semibold ${modo === "quantity" ? "text-amber-900" : "text-slate-600"}`}
                      >
                        {resultado}
                      </ITText>
                    </ITFlex>
                    {modo === "quantity" && (
                      <ITText className="!text-[11px] text-amber-800 pl-5">{t("audit.sayQuantityNext")}</ITText>
                    )}
                  </ITFlex>
                ) : (
                  <ITText className="!text-[11px] text-slate-400">{t("audit.afterPick")}</ITText>
                )}

                {fallo && (
                  <ITText className="!text-[11px] font-bold text-red-600">
                    {t("audit.resolveError")}: {fallo}
                  </ITText>
                )}

                <ITFlex align="center" justify="between" wrap="wrap" gap={2} className="border-t border-slate-100 pt-3">
                  <ITText className="!text-[11px] text-slate-500">
                    {modo ? t("audit.applyHint") : t("audit.pickOption")}
                  </ITText>
                  <ITButton variant="filled" color="primary" size="sm" disabled={!modo || guardando} onClick={aplicar}>
                    <ITText className="!text-[11px] font-bold">
                      {guardando ? t("audit.applying") : t("audit.apply")}
                    </ITText>
                  </ITButton>
                </ITFlex>
              </ITFlex>
            )}
          </PanelCard>
        </div>
      </div>

      <ITConfirmDialog
        isOpen={confirmar}
        onClose={() => {
          if (!guardando) setConfirmar(false);
        }}
        onConfirm={() => void resolver("quantity")}
        title={t("audit.confirmQuantityTitle")}
        message={
          <span className="flex flex-col gap-2">
            <span>
              {t("audit.confirmQuantityMessage", {
                device: sel?.device ?? "",
                quantity: dice,
                n: quedanRegistradas,
                from: disponible,
                to: sel?.ledgerIfQuantity ?? disponible,
              })}
            </span>
            <span>{t("audit.sayQuantityNext")}</span>
          </span>
        }
        confirmLabel={t("audit.confirmQuantityConfirm")}
        cancelLabel={t("common:actions.cancel")}
        variant="danger"
        loading={guardando}
      />
    </div>
  );
}
