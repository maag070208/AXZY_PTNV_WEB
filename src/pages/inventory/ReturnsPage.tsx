import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ITBadget, ITButton, ITDataTable, ITFlex, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaUndoAlt } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import { formatDate } from "@shared/utils/dates";
import { makeClientTableFetch } from "@shared/api/clientTable";
import { inventoryApi, type LoanReturn } from "@entities/inventory";

export default function ReturnsPage() {
  const { t } = useTranslation(["inventory", "common"]);
  const navigate = useNavigate();

  const fetchData = useMemo(
    () =>
      makeClientTableFetch<LoanReturn>(() => inventoryApi.returns(), {
        loan: { value: (d) => d.loan?.number },
        assigned: { value: (d) => d.loan?.custodian?.name ?? d.loan?.department?.name },
        item: {
          value: (d) =>
            d.items.flatMap((x) => [
              x.device?.name,
              x.device?.brand,
              x.device?.model,
              t(`loanReturn.conditionLabels.${x.condition}`),
            ]),
        },
      }),
    [t]
  );

  const columns: any[] = [
    {
      type: "string",
      key: "number",
      label: t("loanReturn.colNumber"),
      width: 150,
      sortable: true,
      filter: true,
      render: (d: LoanReturn) => <ITText className="text-[11px] font-bold text-slate-800">{d.number}</ITText>,
    },
    {
      type: "string",
      key: "loan",
      label: t("loanReturn.colLoan"),
      width: 160,
      filter: true,
      sortable: true,
      render: (d: LoanReturn) => (
        <ITButton
          variant="text"
          color="primary"
          size="lg"
          onClick={() => navigate(`/inventory/loans/${d.loanId}`)}
        >
          <ITFlex align="center" gap={1}>
            <FaFileSignature size={11} />
            <ITText className="font-bold text-[11px] underline">{d.loan?.number ?? "—"}</ITText>
          </ITFlex>
        </ITButton>
      ),
    },
    {
      type: "string",
      key: "assigned",
      label: t("loanReturn.colAssigned"),
      width: 200,
      filter: true,
      sortable: true,
      render: (d: LoanReturn) => (
        <ITText className="text-[11px] text-slate-600">
          {d.loan?.custodian?.name ?? d.loan?.department?.name ?? "—"}
        </ITText>
      ),
    },
    {
      type: "date",
      key: "date",
      label: t("loanReturn.colDate"),
      width: 190,
      sortable: true,
      filter: "date-range",
      dateFilterOptions: { maxDate: new Date() },
      render: (d: LoanReturn) => <ITText className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(d.date)}</ITText>,
    },
    {
      type: "string",
      key: "item",
      label: t("loanReturn.colItem"),
      width: 300,
      filter: true,
      render: (d: LoanReturn) => (
        <ITFlex direction="column" gap={0.5} className="min-w-0">
          {d.items.map((x) => (
            <ITFlex key={x.id} align="center" gap={1.5} className="min-w-0">
              <ITText className="text-[11px] text-slate-600 truncate">{x.device?.name ?? "—"}</ITText>
              <ITBadget color="gray" size="lg">×{x.quantity}</ITBadget>
              <ITBadget
                size="lg"
                color={x.condition === "GOOD" ? "success" : x.condition === "FAIR" ? "warning" : x.condition === "POOR" ? "warning" : "danger"}
              >
                {t(`loanReturn.conditionLabels.${x.condition}`)}
              </ITBadget>
            </ITFlex>
          ))}
        </ITFlex>
      ),
    },
    {
      type: "string",
      key: "action",
      label: "",
      width: 140,
      render: (d: LoanReturn) => (
        <ITButton variant="outlined" color="secondary" size="lg" onClick={() => navigate(`/inventory/loans/${d.loanId}`)}>
          <ITText className="font-bold text-[10px]">{t("common:actions.view")}</ITText>
        </ITButton>
      ),
    },
  ];

  return (
    <ITPage
      title={t("loanReturn.title")}
      description={t("loanReturn.description")}
      icon={<FaUndoAlt size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("dashboard.title"), onClick: () => navigate("/inventory") }, { label: t("loanReturn.title") }]}
      backAction={() => navigate("/inventory")}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => navigate("/inventory/returns/new")}>
          <ITFlex align="center" gap={1}>
            <FaUndoAlt size={12} />
            <ITText className="font-bold text-[11px]">{t("loanReturn.new")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      <ITDataTable
        columns={columns as any}
        fetchData={fetchData as any}
        defaultItemsPerPage={100}
        itemsPerPageOptions={[50, 100, 150]}
        size="lg"
        virtualized
        virtualizedMaxHeight={420}
        rowHeight={50}
        onRowClick={(row) => navigate(`/inventory/loans/${(row as unknown as LoanReturn).loanId}`)}
      />
    </ITPage>
  );
}