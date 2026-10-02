import { ITBadget } from "@axzydev/axzy_ui_system";
import { useTranslation } from "react-i18next";
import { invoiceStatusColor, type InvoiceStatus } from "@entities/kitchen";
import { dyn } from "@shared/i18n/dyn";

/** Chip de estado de una factura. */
export default function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation("kitchen");
  return (
    <ITBadget color={invoiceStatusColor(status)} size="sm">
      {dyn(t)(`invoices.status.${status}`)}
    </ITBadget>
  );
}
