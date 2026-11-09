import { FaChartBar, FaWarehouse } from "react-icons/fa";
import { ITPage } from "@axzydev/axzy_ui_system";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { hotelLinenApi, WRITEOFF_REASONS, type AmenityLine, type WeeklyWriteoffReport } from "@entities/hotel-linen";
import { LinenDashboardView } from "@features/hotel-linen/dashboard";
import { BlankFormsMenu, ReportsPanel, type BlankFormKind } from "@features/hotel-linen/reports";
import { downloadAmenityControlPdf } from "@features/hotel-linen/amenities/pdf/download";
import { downloadHrReportPdf } from "@widgets/reports";
import { downloadBlankFormPdf } from "@widgets/linen-blank-forms-pdf";
import { downloadWriteoffWeeklyPdf } from "@widgets/writeoff-weekly-pdf";
import { useGoBack } from "@shared/lib/useGoBack";

const pageClass = "m-0! p-0! px-8! min-w-full! pb-12!";

/** Formato en blanco con el catálogo vivo; reutiliza el PDF de bajas (F3) y el de amenidades (F5). */
const downloadBlank = async (kind: BlankFormKind): Promise<void> => {
  const products = await hotelLinenApi.products();
  if (kind === "writeoff") {
    const zero = Object.fromEntries(WRITEOFF_REASONS.map((c) => [c, 0])) as WeeklyWriteoffReport["totals"]["byReason"];
    const today = new Date().toISOString();
    await downloadWriteoffWeeklyPdf({
      from: today,
      to: today,
      writeoffs: 0,
      rows: products
        .filter((p) => p.active && p.kind === "LINEN")
        .sort((a, b) => a.code.localeCompare(b.code))
        .map((p) => ({ productId: p.id, code: p.code, name: p.name, size: p.size, byReason: { ...zero }, total: 0, cost: 0 })),
      totals: { byReason: { ...zero }, total: 0, cost: 0 },
    });
    return;
  }
  if (kind === "amenityWeekly") {
    const lines: AmenityLine[] = products
      .filter((p) => p.active && p.kind === "CONSUMABLE")
      .sort((a, b) => a.code.localeCompare(b.code))
      .map((p) => ({
        product: { id: p.id, code: p.code, name: p.name, unit: p.unit?.name ?? "" },
        standardPerRoom: 0,
        initialStock: 0,
        supplied: 0,
        extras: 0,
        finalStock: 0,
        systemFinalStock: 0,
        realConsumption: 0,
        expectedConsumption: 0,
        diffPct: null,
        flagged: false,
      }));
    const day = new Date().toISOString().slice(0, 10);
    await downloadAmenityControlPdf({ folio: null, areaName: " ", weekFrom: day, weekTo: day, occupiedNights: 0, lines, signatures: [] });
    return;
  }
  await downloadBlankFormPdf(kind, products);
};

/** Reportes de blancos: par e inversión, estado físico, merma, lavandería y kardex. */
export function LinenReportsPage() {
  const { t } = useTranslation(["hotel-linen-report", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("page.title")}
      description={t("page.description")}
      icon={<FaChartBar size={20} />}
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("common:nav.linen"), onClick: () => navigate("/linen") },
        { label: t("page.title") },
      ]}
      backAction={() => goBack("/linen")}
      actions={<BlankFormsMenu onDownload={downloadBlank} />}
    >
      <ReportsPanel exportPdf={(doc, name) => downloadHrReportPdf(doc, name)} />
    </ITPage>
  );
}

/** Inicio del módulo de blancos: tablero de contadores. */
export function LinenHomePage() {
  const { t } = useTranslation(["hotel-linen-report", "common"]);
  const navigate = useNavigate();
  return (
    <ITPage
      className={pageClass}
      noPadding
      title={t("dash.title")}
      description={t("dash.description")}
      icon={<FaWarehouse size={20} />}
      breadcrumbs={[{ label: t("common:breadcrumbs.home"), onClick: () => navigate("/") }, { label: t("common:nav.linen") }]}
    >
      <LinenDashboardView onNavigate={navigate} />
    </ITPage>
  );
}
