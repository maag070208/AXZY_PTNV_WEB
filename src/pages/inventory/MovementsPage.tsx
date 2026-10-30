import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITGrid, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaArrowDown, FaArrowRight, FaArrowUp, FaExchangeAlt, FaFilePdf, FaHistory, FaPlus, FaTrash, FaUndoAlt, FaWrench } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDateTime } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type Movement, type MovementType } from "@entities/inventory";
import { TYPE_BADGE_COLOR } from "@entities/inventory/model/movementColors";
import { downloadMovementPdf, downloadReportMovementsPdf } from "@widgets/movement-pdf";
import { KpiTile } from "@shared/ui/kpi-tile";
import { i18n } from "@shared/i18n";
import { useGoBack } from "@shared/lib/useGoBack";

interface StatCounts {
  total: number;
  retirements: number;
  maintenance: number;
}

type TypeGroup = "retirements" | "maintenance";

const GROUP_TYPES: Record<TypeGroup, MovementType[]> = {
  retirements: ["RETIREMENT"],
  maintenance: ["MAINTENANCE_IN", "MAINTENANCE_OUT"],
};

type ActionColor = "success" | "warning" | "danger" | "info";
const ACTION_VISUAL: Record<MovementType, { icon: ReactNode; color: ActionColor }> = {
  STOCK_IN: { icon: <FaArrowDown size={12} />, color: "success" },
  ADJUSTMENT_IN: { icon: <FaArrowDown size={12} />, color: "success" },
  RETURN: { icon: <FaArrowRight size={12} />, color: "success" },
  LOAN: { icon: <FaArrowUp size={12} />, color: "warning" },
  RETIREMENT: { icon: <FaTrash size={12} />, color: "danger" },
  ADJUSTMENT_OUT: { icon: <FaArrowUp size={12} />, color: "warning" },
  TRANSFER: { icon: <FaExchangeAlt size={12} />, color: "info" },
  MAINTENANCE_IN: { icon: <FaWrench size={12} />, color: "info" },
  MAINTENANCE_OUT: { icon: <FaWrench size={12} />, color: "warning" },
  REVERSAL: { icon: <FaUndoAlt size={12} />, color: "danger" },
};
const ACTION_DEFAULT: ActionColor = "warning";

/** Tipos de movimiento, para el filtro tipo catálogo. */
const MOVEMENT_TYPES = Object.keys(ACTION_VISUAL) as MovementType[];

interface MovementRow {
  id: string;
  movementId: string;
  date: string;
  type: MovementType;
  name: string;
  unit: string;
  /** Número de serie de la unidad, para buscar por él. */
  serial?: string | null;
  reason?: string | null;
  custodian?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  status: "ACTIVE" | "CANCELLED";
}

function flattenMovements(list: Movement[]): MovementRow[] {
  const out: MovementRow[] = [];
  for (const m of list) {
    for (const d of m.items ?? []) {
      const name = d.device?.name ?? "—";
      const units = d.units ?? [];
      if (units.length > 0) {
        for (const u of units) {
          out.push({
            id: `${m.id}:${d.id}:${u.id}`,
            movementId: m.id,
            date: m.date,
            type: m.type,
            name,
            unit: u.deviceUnit?.assetTag ?? "—",
            serial: u.deviceUnit?.serialNumber,
            reason: m.reason,
            custodian: m.custodian,
            user: m.createdBy,
            status: m.status,
          });
        }
      } else {
        out.push({
          id: `${m.id}:${d.id}`,
          movementId: m.id,
          date: m.date,
          type: m.type,
          name,
          unit: d.quantity > 1 ? `×${d.quantity}` : "—",
          reason: m.reason,
          custodian: m.custodian,
          user: m.createdBy,
          status: m.status,
        });
      }
    }
  }
  return out;
}

export default function MovementsPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const [reloadKey, setReloadKey] = useState(0);
  const [typeFilter, setTypeFilter] = useState<TypeGroup | null>(null);
  const [stats, setStats] = useState<StatCounts>({ total: 0, retirements: 0, maintenance: 0 });
  const [generatingPdf, setGeneratingPdf] = useState(false);

  useEffect(() => {
    inventoryApi.movements().then((list) => {
      const rows = flattenMovements(list);
      const counts: StatCounts = { total: rows.length, retirements: 0, maintenance: 0 };
      for (const r of rows) {
        if (GROUP_TYPES.retirements.includes(r.type)) counts.retirements += 1;
        else if (GROUP_TYPES.maintenance.includes(r.type)) counts.maintenance += 1;
      }
      setStats(counts);
    });
  }, [reloadKey]);

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<MovementRow>(
        async () => {
          const list = await inventoryApi.movements();
          const filtered = typeFilter ? list.filter((m) => GROUP_TYPES[typeFilter].includes(m.type)) : list;
          return flattenMovements(filtered);
        },
        {
          type: { match: "equals" },
          name: { value: (m) => [m.name, m.unit, m.serial] },
          custodian: { value: (m) => m.custodian?.name ?? m.user?.name },
          status: { match: "equals" },
        }
      ),
    [typeFilter]
  );

  const applyFilter = (group: TypeGroup | null) => {
    setTypeFilter((prev) => (prev === group ? null : group));
    setReloadKey((k) => k + 1);
  };

  const revert = async (movementId: string) => {
    if (!window.confirm(t("movements.confirmRevert"))) return;
    try {
      await inventoryApi.revert(movementId);
      setReloadKey((k) => k + 1);
    } catch (e: any) {
      window.alert(e.message || "Error");
    }
  };

  const generateReport = async () => {
    setGeneratingPdf(true);
    try {
      const list = await inventoryApi.movements();
      await downloadReportMovementsPdf(list);
    } catch {
      window.alert(i18n.t("common:errors.report"));
    } finally {
      setGeneratingPdf(false);
    }
  };

  const statCardActive = (group: TypeGroup | null) => typeFilter === group;

  /** Abre el PDF del movimiento de la fila (el botón "Reporte" es el global). */
  const openMovementPdf = async (movementId: string) => {
    try {
      const list = await inventoryApi.movements();
      const movement = list.find((m) => m.id === movementId);
      if (movement) await downloadMovementPdf(movement);
    } catch {
      window.alert(i18n.t("common:errors.report"));
    }
  };

  const columns: any[] = [
    {
      type: "date",
      key: "date",
      label: t("stockLedger.date"),
      width: 170,
      sortable: false,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      render: (m: MovementRow) => <ITText className="text-[11px] font-bold text-slate-600 whitespace-nowrap">{formatDateTime(m.date)}</ITText>,
    },
    {
      type: "catalog",
      key: "type",
      label: t("movements.colType"),
      width: 140,
      sortable: false,
      filter: "catalog",
      catalogOptions: {
        data: MOVEMENT_TYPES.map((id) => ({ id, name: t(`typeLabels.${id}`) })),
        loading: false,
        error: false,
      },
      render: (m: MovementRow) => (
        <ITBadget color={TYPE_BADGE_COLOR[m.type]} size="lg">
          {t(`typeLabels.${m.type}`)}
        </ITBadget>
      ),
    },
    {
      type: "string",
      key: "name",
      label: t("movements.colItem"),
      width: 270,
      filter: true,
      sortable: false,
      render: (m: MovementRow) => (
        <ITText className="text-[11px] text-slate-600 truncate">
          {m.name} {m.unit !== "—" && <b className="text-slate-800">· {m.unit}</b>}
        </ITText>
      ),
    },
    {
      type: "string",
      key: "reason",
      label: t("movements.colComment"),
      width: 270,
      filter: true,
      render: (m: MovementRow) => <ITText className="text-[11px] text-slate-500">{m.reason || "—"}</ITText>,
    },
    {
      type: "string",
      key: "custodian",
      label: t("movements.colCustodian"),
      width: 200,
      filter: true,
      sortable: false,
      render: (m: MovementRow) => <ITText className="text-[11px] text-slate-600">{m.custodian?.name ?? m.user?.name ?? "—"}</ITText>,
    },
    {
      type: "string",
      key: "status",
      label: t("movements.colStatus"),
      width: 130,
      filter: "catalog",
      catalogOptions: {
        data: [
          { id: "ACTIVE", name: t("movements.activeLabel") },
          { id: "CANCELLED", name: t("movements.cancelled") },
        ],
      },
      render: (m: MovementRow) =>
        m.status === "CANCELLED" ? (
          <ITBadget color="danger" size="lg">{t("movements.cancelled")}</ITBadget>
        ) : m.type === "RETIREMENT" ? (
          <ITBadget color="warning" size="lg">{t("movements.retiredLabel")}</ITBadget>
        ) : (
          <ITBadget color="success" size="lg">{t("movements.activeLabel")}</ITBadget>
        ),
    },
  ];

  return (
    <ITPage className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t("movements.title")}
      description={t("movements.description")}
      icon={<FaHistory size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("movements.title") }]}
      backAction={() => goBack("/inventory")}
      actions={
        <ITFlex align="center" gap={2}>
          <ITButton variant="outlined" color="primary" onClick={generateReport} disabled={generatingPdf}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{generatingPdf ? t("new.saving") : t("movements.report")}</ITText>
            </ITFlex>
          </ITButton>
          <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/movements/new")}>
            <ITFlex align="center" gap={1}>
              <FaPlus size={12} />
              <ITText className="font-bold text-[11px]">{t("movements.new")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <div className="bento-stagger grid grid-cols-2 gap-4 md:!grid-cols-3">
        <KpiTile size="sm"
          label={t("movements.stats.total")}
          value={stats.total}
          tone="sky"
          icon={<FaHistory size={16} />}
          onClick={() => applyFilter(null)}
        />
        <KpiTile size="sm"
          label={t("movements.stats.retirements")}
          value={stats.retirements}
          tone={stats.retirements > 0 || statCardActive("retirements") ? "rose" : "neutral"}
          icon={<FaTrash size={16} />}
          onClick={() => applyFilter("retirements")}
        />
        <KpiTile size="sm"
          label={t("movements.stats.maintenance")}
          value={stats.maintenance}
          tone={stats.maintenance > 0 || statCardActive("maintenance") ? "amber" : "neutral"}
          icon={<FaWrench size={16} />}
          onClick={() => applyFilter("maintenance")}
        />
      </div>

      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        reloadTrigger={reloadKey}
        onRowClick={(row) => void openMovementPdf((row as unknown as MovementRow).movementId)}
        defaultItemsPerPage={25}
        itemsPerPageOptions={[25, 50, 100]}
        layout="fixed"
        density="compact"
        rowHeight={50}
        virtualized
        virtualizedMaxHeight={460}
      />
    </ITPage>
  );
}