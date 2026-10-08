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
  quantity?: number;
  linked?: number;
};

type Mode = "link" | "quantity" | "review";

/** `YYYY-MM-DD` → `DD/MM/AAAA` sin pasar por `Date`. */
const formatDay = (day?: string): string => (day ? day.split("-").reverse().join("/") : "");

/** Etiqueta compacta de conteo (dice / registradas / faltan). */
const Chip = ({ children, tone = "slate" }: { children: ReactNode; tone?: "slate" | "amber" | "sky" }) => {
  const tones = {
    slate: "bg-slate-100 text-slate-600",
    sky: "bg-sky-50 text-sky-700",
    amber: "bg-amber-100 text-amber-800",
  } as const;
  return <span className={`rounded-full px-2 py-0.5 !text-[10px] font-bold ${tones[tone]}`}>{children}</span>;
};

/** Número grande del resumen del descuadre. */
const Num = ({ label, value, tone }: { label: string; value: number; tone: "slate" | "sky" | "amber" }) => {
  const tones = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    sky: "border-sky-200 bg-sky-50 text-sky-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
  } as const;
  return (
    <div className={`flex flex-col items-center rounded-xl border px-2 py-2 ${tones[tone]}`}>
      <span className="!text-[10px] font-semibold uppercase tracking-wide opacity-80">{label}</span>
      <span className="!text-[20px] font-black leading-tight tabular-nums">{value}</span>
    </div>
  );
};

/**
 * Pantalla para resolver un descuadre del auditor. A la izquierda la lista de
 * movimientos que no cuadran; a la derecha, el elegido con lo que dice el
 * movimiento, las piezas que tiene y las tres salidas posibles, cada una con
 * lo que le hace al inventario. Se elige una y se aplica: la que mueve las
 * existencias pide confirmación.
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
  const porRegistrar = filas.reduce((s, f) => s + Math.max(0, (f.quantity ?? 0) - (f.linked ?? 0)), 0);

  const faltan = Math.max(0, (sel?.quantity ?? 0) - (sel?.linked ?? 0));
  const sobran = Math.max(0, (sel?.linked ?? 0) - (sel?.quantity ?? 0));

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

  /** Aplica lo elegido; dejar la cantidad cambia existencias, así que confirma. */
  const aplicar = () => {
    if (!modo) return;
    if (modo === "quantity") {
      setConfirmar(true);
      return;
    }
    void resolver(modo);
  };

  const opcion = (opts: {
    mode: Mode;
    icono: ReactNode;
    titulo: string;
    aviso: string;
    etiqueta: string;
    tono: "emerald" | "amber" | "slate";
    enabled?: boolean;
  }) => {
    const activo = modo === opts.mode;
    const deshabilitado = guardando || opts.enabled === false;
    const tonos = {
      emerald: { icono: "bg-emerald-50 text-emerald-600", tag: "bg-emerald-50 text-emerald-700" },
      amber: { icono: "bg-amber-50 text-amber-600", tag: "bg-amber-100 text-amber-800" },
      slate: { icono: "bg-slate-100 text-slate-500", tag: "bg-slate-100 text-slate-600" },
    } as const;
    return (
      <button
        type="button"
        disabled={deshabilitado}
        aria-pressed={activo}
        onClick={() => setModo(opts.mode)}
        className={`flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-50 ${
          activo
            ? "border-[#0D5777] !bg-[#0D5777]/5 ring-1 ring-[#0D5777]/30"
            : "border-slate-200 !bg-white hover:border-slate-300 hover:!bg-slate-50"
        }`}
      >
        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${tonos[opts.tono].icono}`}>
          {opts.icono}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="!text-[12px] font-bold text-slate-800">{opts.titulo}</span>
            <span className={`rounded-full px-2 py-0.5 !text-[9px] font-bold uppercase ${tonos[opts.tono].tag}`}>
              {opts.etiqueta}
            </span>
            {activo && <FaCheckCircle className="ml-auto shrink-0 text-[#0D5777]" size={13} />}
          </span>
          <span className="!text-[11px] leading-snug text-slate-500">{opts.aviso}</span>
        </span>
      </button>
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
              {total ? t("audit.summary", { count: total }) : t("audit.noMismatches")}
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
                      <span className="flex flex-wrap items-center gap-1.5">
                        <Chip>{t("audit.chipSays", { n: f.quantity ?? 0 })}</Chip>
                        <Chip tone="sky">{t("audit.chipLinked", { n: f.linked ?? 0 })}</Chip>
                        {falta > 0 ? (
                          <Chip tone="amber">{t("audit.chipMissing", { n: falta })}</Chip>
                        ) : (
                          <Chip tone="amber">{t("audit.chipExtra", { n: sobra })}</Chip>
                        )}
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
              <ITFlex direction="column" gap={3}>
                <ITFlex direction="column" gap={2} className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <ITFlex align="center" gap={2} wrap="wrap">
                    <span className="rounded-full bg-amber-200/70 px-2 py-0.5 !text-[10px] font-bold text-amber-900">
                      {sel.movementType}
                    </span>
                    <ITText className="!text-[11px] text-slate-500">{formatDay(sel.date)}</ITText>
                  </ITFlex>
                  <ITText className="!text-[14px] font-bold text-slate-800">{sel.device}</ITText>
                  <ITText className="!text-[11px] text-slate-500">
                    {t("audit.resolveHint", { quantity: sel.quantity ?? 0, linked: sel.linked ?? 0 })}
                  </ITText>
                </ITFlex>

                <div className="!grid grid-cols-3 gap-2">
                  <Num label={t("audit.statSays")} value={sel.quantity ?? 0} tone="slate" />
                  <Num label={t("audit.statLinked")} value={sel.linked ?? 0} tone="sky" />
                  {faltan > 0 ? (
                    <Num label={t("audit.statMissing")} value={faltan} tone="amber" />
                  ) : (
                    <Num label={t("audit.statExtra")} value={sobran} tone="amber" />
                  )}
                </div>

                {fallo && (
                  <ITText className="!text-[11px] font-bold text-red-600">
                    {t("audit.resolveError")}: {fallo}
                  </ITText>
                )}

                <ITFlex direction="column" gap={2}>
                  {opcion({
                    mode: "link",
                    icono: <FaLink size={13} />,
                    titulo: t("audit.optLink", { n: faltan }),
                    aviso: t("audit.optLinkHint", { n: faltan }),
                    etiqueta: t("audit.tagNoStock"),
                    tono: "emerald",
                    enabled: faltan > 0,
                  })}
                  {opcion({
                    mode: "quantity",
                    icono: <FaBalanceScale size={13} />,
                    titulo: t("audit.optQuantity", { n: sel.linked ?? 0 }),
                    aviso: t("audit.optQuantityHint", { n: sel.linked ?? 0 }),
                    etiqueta: t("audit.tagStock"),
                    tono: "amber",
                  })}
                  {opcion({
                    mode: "review",
                    icono: <FaClipboardCheck size={13} />,
                    titulo: t("audit.optReview"),
                    aviso: t("audit.optReviewHint"),
                    etiqueta: t("audit.tagNothing"),
                    tono: "slate",
                  })}
                </ITFlex>

                <ITFlex
                  align="center"
                  justify="between"
                  wrap="wrap"
                  gap={2}
                  className="border-t border-slate-100 pt-3"
                >
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
        message={t("audit.confirmQuantityMessage", {
          device: sel?.device ?? "",
          quantity: sel?.quantity ?? 0,
          n: sel?.linked ?? 0,
        })}
        confirmLabel={t("audit.confirmQuantityConfirm")}
        cancelLabel={t("common:actions.cancel")}
        variant="danger"
        loading={guardando}
      />
    </div>
  );
}
