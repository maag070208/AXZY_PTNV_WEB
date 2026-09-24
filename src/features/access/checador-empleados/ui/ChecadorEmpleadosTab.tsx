import { useMemo } from "react";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITCard,
  ITDataTable,
  ITDialog,
  ITFlex,
  ITGrid,
  ITInput,
  ITSearchSelect,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import type {
  Column,
  ITDataTableFetchParams,
  ITDataTableResponse,
} from "@axzydev/axzy_ui_system";
import { FaCheck, FaLink, FaMagic, FaUnlink } from "react-icons/fa";
import type { ChecadorEmpleado, ChecadorEmpleadoEstado } from "@entities/checador";
import { formatFechaHora } from "@shared/utils/dates";
import type { UseChecadorEmpleados } from "../model/useChecadorEmpleados";

const ESTADOS: ChecadorEmpleadoEstado[] = ["VINCULADO", "SIN_VINCULAR", "SUGERIDO"];

export default function ChecadorEmpleadosTab({ fx }: { fx: UseChecadorEmpleados }) {
  const {
    t,
    canLink,
    q,
    setQ,
    estado,
    setEstado,
    externalFilters,
    fetchTableData,
    reloadKey,
    summary,
    usuarios,
    target,
    setTarget,
    userId,
    setUserId,
    saving,
    abrirVincular,
    confirmar,
    aceptarSugerencia,
    desvincular,
    vincularSugeridos,
    error,
    setError,
    toast,
    setToast,
  } = fx;

  const estadoOptions = useMemo(
    () => [
      { value: "", label: t("empleados.filters.todos") },
      ...ESTADOS.map((e) => ({ value: e, label: t(`empleados.estados.${e}`) })),
    ],
    [t]
  );

  const usuarioOptions = useMemo(
    () =>
      usuarios.map((u) => ({
        value: u.id,
        label: u.numeroEmpleado ? `${u.name} · #${u.numeroEmpleado}` : u.name,
      })),
    [usuarios]
  );

  const kpis = [
    { key: "total", value: summary?.total ?? 0, tint: "bg-[#0D5777]/10 text-[#0D5777]" },
    { key: "vinculados", value: summary?.vinculados ?? 0, tint: "bg-emerald-50 text-emerald-600" },
    { key: "sinVincular", value: summary?.sinVincular ?? 0, tint: "bg-slate-100 text-slate-500" },
    { key: "sugeridosAlta", value: summary?.sugeridosAlta ?? 0, tint: "bg-amber-50 text-amber-600" },
  ] as const;

  const columns = useMemo<Column<ChecadorEmpleado>[]>(
    () => [
      {
        key: "numeroEmpleado",
        label: t("empleados.columns.numero"),
        type: "string",
        sortable: true,
        render: (r) => (
          <ITText className="text-[12px] font-black text-slate-800 whitespace-nowrap">
            #{r.numeroEmpleado}
          </ITText>
        ),
      },
      {
        key: "nombre",
        label: t("empleados.columns.nombre"),
        type: "string",
        sortable: true,
        render: (r) => <ITText className="text-[12px] font-bold text-slate-700">{r.nombre}</ITText>,
      },
      {
        key: "checadas",
        label: t("empleados.columns.checadas"),
        type: "number",
        sortable: true,
        render: (r) => (
          <ITFlex direction="column" gap={0.5}>
            <ITText className="text-[12px] font-bold text-slate-700">{r.checadas}</ITText>
            <ITText className="text-[9px] font-bold text-slate-400 whitespace-nowrap">
              {formatFechaHora(r.ultimaChecada)}
            </ITText>
          </ITFlex>
        ),
      },
      {
        key: "vinculo",
        label: t("empleados.columns.usuario"),
        type: "string",
        render: (r) => {
          if (r.vinculo) {
            return (
              <ITFlex direction="column" gap={0.5}>
                <ITText className="text-[12px] font-black text-emerald-700">{r.vinculo.name}</ITText>
                <ITText className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                  {r.vinculo.numeroEmpleado ? `#${r.vinculo.numeroEmpleado}` : "—"}
                  {!r.vinculo.active && ` · ${t("empleados.baja")}`}
                </ITText>
              </ITFlex>
            );
          }
          if (r.sugerencia) {
            return (
              <ITFlex direction="column" gap={0.5}>
                <ITFlex align="center" gap={1}>
                  <ITBadget color={r.sugerencia.confianza === "ALTA" ? "success" : "warning"} size="sm">
                    {t("empleados.sugerencia")}
                  </ITBadget>
                  <ITText className="text-[12px] font-bold text-slate-700">{r.sugerencia.name}</ITText>
                </ITFlex>
                <ITText className="text-[9px] font-bold text-slate-400">
                  {r.sugerencia.numeroEmpleado ? `#${r.sugerencia.numeroEmpleado} · ` : ""}
                  {!r.sugerencia.active && `${t("empleados.baja")} · `}
                  {t(`empleados.confianza.${r.sugerencia.confianza}`)}
                </ITText>
              </ITFlex>
            );
          }
          return (
            <ITBadget color="gray" size="sm">
              {t("empleados.sinVinculo")}
            </ITBadget>
          );
        },
      },
      ...(canLink
        ? [
            {
              key: "acciones",
              label: t("empleados.columns.acciones"),
              type: "actions" as const,
              actions: (r: ChecadorEmpleado) => (
                <ITFlex align="center" gap={1}>
                  {!r.vinculo && r.sugerencia && (
                    <ITButton variant="filled" color="primary" size="sm" onClick={() => aceptarSugerencia(r)}>
                      <ITFlex align="center" gap={1}>
                        <FaCheck size={10} />
                        <ITText className="font-bold text-[11px]">{t("empleados.actions.aceptar")}</ITText>
                      </ITFlex>
                    </ITButton>
                  )}
                  <ITButton variant="outlined" color="secondary" size="sm" onClick={() => abrirVincular(r)}>
                    <ITFlex align="center" gap={1}>
                      <FaLink size={10} />
                      <ITText className="font-bold text-[11px]">
                        {r.vinculo ? t("empleados.actions.cambiar") : t("empleados.actions.vincular")}
                      </ITText>
                    </ITFlex>
                  </ITButton>
                  {r.vinculo && (
                    <ITButton variant="text" color="danger" size="sm" onClick={() => void desvincular(r)}>
                      <ITFlex align="center" gap={1}>
                        <FaUnlink size={10} />
                        <ITText className="font-bold text-[11px]">{t("empleados.actions.desvincular")}</ITText>
                      </ITFlex>
                    </ITButton>
                  )}
                </ITFlex>
              ),
            },
          ]
        : []),
    ],
    [t, canLink, abrirVincular, aceptarSugerencia, desvincular]
  );

  return (
    <ITFlex direction="column" gap={4}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      {/* KPIs */}
      <ITFlex wrap="wrap" gap={3}>
        {kpis.map((k) => (
          <ITFlex
            key={k.key}
            grow={1}
            basis="160px"
            align="center"
            gap={3}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
          >
            <ITFlex align="center" justify="center" className={`h-10 w-10 shrink-0 rounded-xl ${k.tint}`}>
              <ITText className="text-sm font-black">{k.value}</ITText>
            </ITFlex>
            <ITText className="truncate text-[10px] font-bold uppercase tracking-widest text-slate-400">
              {t(`empleados.kpis.${k.key}`)}
            </ITText>
          </ITFlex>
        ))}
      </ITFlex>

      {/* Filtros + vincular sugerencias */}
      <ITCard className="!p-5 border border-slate-200">
        <ITGrid container columns={12} spacing={4}>
          <ITGrid item xs={12} md={5}>
            <ITInput
              name="checadorEmpleadosQ"
              label={t("empleados.filters.q")}
              placeholder={t("empleados.filters.qPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full min-w-0"
            />
          </ITGrid>
          <ITGrid item xs={12} md={4}>
            <ITSearchSelect
              name="checadorEmpleadosEstado"
              label={t("empleados.filters.estado")}
              options={estadoOptions}
              value={estado}
              onChange={(value) => setEstado(String(value) as ChecadorEmpleadoEstado | "")}
              className="w-full min-w-0"
            />
          </ITGrid>
          {canLink && (
            <ITGrid item xs={12} md={3}>
              <ITFlex align="end" className="h-full pb-1">
                <ITButton
                  variant="filled"
                  color="primary"
                  size="sm"
                  disabled={saving || !summary?.sugeridosAlta}
                  onClick={() => void vincularSugeridos()}
                >
                  <ITFlex align="center" gap={1}>
                    <FaMagic size={11} />
                    <ITText className="font-bold text-[11px]">
                      {t("empleados.actions.vincularSugeridos", { count: summary?.sugeridosAlta ?? 0 })}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITGrid>
          )}
        </ITGrid>
      </ITCard>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={
          fetchTableData as unknown as (
            p: ITDataTableFetchParams
          ) => Promise<ITDataTableResponse<Record<string, unknown>>>
        }
        externalFilters={externalFilters}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[10, 25, 50, 100]}
        debounceMs={350}
        size="lg"
      />

      <ITDialog
        isOpen={!!target}
        onClose={() => setTarget(null)}
        title={t("empleados.dialog.title", { numero: target?.numeroEmpleado ?? "" })}
        className="max-w-md"
      >
        <ITFlex direction="column" gap={3} className="mt-2">
          <ITText className="text-[12px] text-slate-600">
            {t("empleados.dialog.reloj", { nombre: target?.nombre ?? "" })}
          </ITText>
          <ITSearchSelect
            name="checadorVinculoUsuario"
            label={t("empleados.dialog.usuario")}
            placeholder={t("empleados.dialog.usuarioPlaceholder")}
            options={usuarioOptions}
            value={userId}
            onChange={(value) => setUserId(String(value))}
            className="w-full min-w-0"
          />
          <ITFlex justify="end" gap={2}>
            <ITButton variant="outlined" color="secondary" onClick={() => setTarget(null)}>
              {t("empleados.actions.cancelar")}
            </ITButton>
            <ITButton variant="filled" color="primary" disabled={!userId || saving} onClick={confirmar}>
              {t("empleados.actions.guardar")}
            </ITButton>
          </ITFlex>
        </ITFlex>
      </ITDialog>

      {toast && (
        <ITToast
          message={toast}
          type="success"
          position="top-right"
          duration={3000}
          onClose={() => setToast(null)}
        />
      )}
    </ITFlex>
  );
}
