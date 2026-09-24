import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ITAlert,
  ITBadget,
  ITButton,
  ITDataTable,
  ITFlex,
  ITText,
} from "@axzydev/axzy_ui_system";
import type { Column } from "@axzydev/axzy_ui_system";
import { FaEdit, FaPlus, FaTrashRestore } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { scheduleApi, type Horario, type HorarioDia } from "@entities/schedule";
import { makeClientTableFetch } from "@shared/api/clientTable";

const DAY_ABBR = ["L", "M", "M", "J", "V", "S", "D"];

const diaKey = (d: HorarioDia): string =>
  d.descanso
    ? "rest"
    : `${d.entrada}-${d.salida}${d.entrada2 && d.salida2 ? ` + ${d.entrada2}-${d.salida2}` : ""}`;

/** "L-V 08:00-16:00 · S 08:00-14:00 · D descansa" */
function formatDays(dias: HorarioDia[]): string {
  const sorted = [...dias].sort((a, b) => a.diaSemana - b.diaSemana);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    const k = diaKey(sorted[i]);
    let j = i;
    while (j + 1 < sorted.length && diaKey(sorted[j + 1]) === k && sorted[j + 1].diaSemana === sorted[j].diaSemana + 1) {
      j += 1;
    }
    const label =
      sorted[i].diaSemana === sorted[j].diaSemana
        ? DAY_ABBR[sorted[i].diaSemana - 1]
        : `${DAY_ABBR[sorted[i].diaSemana - 1]}-${DAY_ABBR[sorted[j].diaSemana - 1]}`;
    parts.push(`${label} ${k === "rest" ? "descansa" : k}`);
    i = j + 1;
  }
  return parts.join(" · ");
}

export default function SchedulesTable() {
  const { t } = useTranslation("schedules");
  const navigate = useNavigate();
  const [reloadKey, setReloadKey] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // El fetcher corre en cada refetch; `reloadTrigger` fuerza a ITDataTable a
  // volver a pedir los datos tras un cambio.
  const fetchData = useMemo(
    () => makeClientTableFetch<Horario>(() => scheduleApi.list(true)),
    []
  );

  const toggleActive = async (h: Horario) => {
    try {
      await scheduleApi.update(h.id, { activo: !h.activo });
      setReloadKey((k) => k + 1);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const columns: Column<Horario>[] = [
    {
      key: "nombre",
      label: t("name"),
      type: "string",
      filter: true,
      sortable: true,
      render: (h) => <ITText className="text-[12px] font-black text-slate-800">{h.nombre}</ITText>,
    },
    {
      key: "dias",
      label: t("days"),
      type: "string",
      sortable: false,
      render: (h) => (
        <ITText className="text-[11px] text-slate-600">{formatDays(h.dias)}</ITText>
      ),
    },
    {
      key: "reglas",
      label: t("tolEntrada"),
      type: "string",
      sortable: false,
      render: (h) => (
        <ITText className="text-[11px] text-slate-500 whitespace-nowrap">
          E{h.toleranciaEntradaMin} / S{h.toleranciaSalidaMin} · {t("comida")} {h.comidaMin}
        </ITText>
      ),
    },
    {
      key: "asignados",
      label: t("assignedLabel"),
      type: "number",
      sortable: false,
      render: (h) => <ITText className="text-[12px] font-bold text-slate-700">{h.asignados ?? 0}</ITText>,
    },
    {
      key: "activo",
      label: t("active"),
      type: "boolean",
      sortable: false,
      render: (h) => (
        <ITBadget color={h.activo ? "success" : "danger"} size="sm">
          {h.activo ? t("active") : t("inactive")}
        </ITBadget>
      ),
    },
    {
      key: "actions",
      label: "",
      type: "actions",
      actions: (h) => (
        <ITFlex align="center" gap={1}>
          <ITButton
            variant="outlined"
            size="lg"
            color="primary"
            title={t("edit")}
            onClick={() => navigate(`/horarios/${h.id}/editar`)}
          >
            <FaEdit size={12} />
          </ITButton>
          <ITButton
            variant="outlined"
            size="lg"
            color={h.activo ? "secondary" : "success"}
            title={h.activo ? t("delete") : t("reactivate")}
            onClick={() => toggleActive(h)}
          >
            <FaTrashRestore size={12} />
          </ITButton>
        </ITFlex>
      ),
    },
  ];

  return (
    <ITFlex direction="column" gap={3}>
      {error && (
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error}
        </ITAlert>
      )}

      <ITFlex justify="end">
        <ITButton variant="filled" color="primary" onClick={() => navigate("/horarios/nuevo")}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{t("new")}</ITText>
          </ITFlex>
        </ITButton>
      </ITFlex>

      <ITDataTable
        columns={columns as unknown as Column<Record<string, unknown>>[]}
        fetchData={fetchData as never}
        reloadTrigger={reloadKey}
        defaultItemsPerPage={10}
        itemsPerPageOptions={[10, 25, 50]}
        size="lg"
      />
    </ITFlex>
  );
}
