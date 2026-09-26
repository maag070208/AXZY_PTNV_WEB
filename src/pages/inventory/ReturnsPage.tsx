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
      makeClientTableFetch<Record<string, unknown>>(async () => {
        const list = await inventoryApi.returns();
        return list as unknown as Record<string, unknown>[];
      }),
    []
  );

  const columns: any[] = [
    {
      type: "string",
      key: "number",
      label: t("loanReturn.colNumber"),
      sortable: false,
      filter: true,
      render: (d: LoanReturn) => <ITText className="text-[11px] font-bold text-slate-800">{d.number}</ITText>,
    },
    {
      type: "string",
      key: "loan",
      label: t("loanReturn.colLoan"),
      filter: true,
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
      sortable: false,
      render: (d: LoanReturn) => <ITText className="text-[11px] text-slate-500 whitespace-nowrap">{formatDate(d.date)}</ITText>,
    },
    {
      type: "string",
      key: "item",
      label: t("loanReturn.colItem"),
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
      />
    </ITPage>
  );
}