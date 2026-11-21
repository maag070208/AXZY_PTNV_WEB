import { useState } from "react";
import { ITButton, ITDatePicker, ITFlex, ITInput, ITSelect, ITStack, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { PDFViewer } from "@react-pdf/renderer";
import { LuFileText, LuPencilLine, LuPlus, LuTrash2 } from "react-icons/lu";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useDebouncedValue } from "@shared/lib/useDebouncedValue";
import { useGoBack } from "@shared/lib/useGoBack";
import { AppPage } from "@shared/ui/app-page";
import { FormSection } from "@shared/ui/form-section";
import { PanelCard } from "@shared/ui/panel-card";
import { parseLocalDay, toDayString } from "@shared/utils/dates";
import {
  emptyPurchaseRequest,
  emptyQuotationRequest,
  emptyRequestItem,
  type PurchaseExpenseType,
  type PurchaseRequestData,
  type QuotationRequestData,
  type RequestItem,
} from "../model/types";
import { downloadPurchaseRequestPdf, downloadQuotationRequestPdf } from "../model/pdf";
import PurchaseRequestPdf from "./PurchaseRequestPdf";
import QuotationRequestPdf from "./QuotationRequestPdf";

const BACK = "/hr/formats";

type RequestKind = "purchaseRequest" | "quotationRequest";

/** Editor de las solicitudes de compra y cotización: todos los campos son opcionales (se puede imprimir en blanco). */
export default function RequestFormEditor({ kind }: { kind: RequestKind }) {
  const { t } = useTranslation(["hr-formats", "common"]);
  const navigate = useNavigate();
  const goBack = useGoBack();
  const today = toDayString(new Date());
  const isPurchase = kind === "purchaseRequest";

  const [purchase, setPurchase] = useState<PurchaseRequestData>(() => emptyPurchaseRequest(today));
  const [quotation, setQuotation] = useState<QuotationRequestData>(() => emptyQuotationRequest(today));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const data = isPurchase ? purchase : quotation;
  const previewData = useDebouncedValue(data, 500);

  /** Actualiza el formulario activo sin duplicar los campos comunes. */
  const patch = (changes: Partial<PurchaseRequestData & QuotationRequestData>) => {
    if (isPurchase) setPurchase((d) => ({ ...d, ...changes }) as PurchaseRequestData);
    else setQuotation((d) => ({ ...d, ...changes }) as QuotationRequestData);
  };

  const text = (key: string, label: string, hint?: string) => ({
    name: `req-${key}`,
    label,
    placeholder: hint,
    value: ((data as unknown as Record<string, string>)[key] ?? "") as string,
    onChange: (e: { target: { value: string } }) => patch({ [key]: e.target.value }),
  });
  const area = (key: string, label: string, rows: number) => (
    <ITTextarea
      name={`req-${key}`}
      label={label}
      rows={rows}
      value={((data as unknown as Record<string, string>)[key] ?? "") as string}
      onChange={(v) => patch({ [key]: v })}
    />
  );
  const dateField = (key: string, label: string) => (
    <ITDatePicker
      name={`req-${key}`}
      label={label}
      value={parseLocalDay((data as unknown as Record<string, string>)[key] ?? "")}
      onChange={(e: { target: { value: unknown } }) => {
        const v = e.target.value;
        patch({ [key]: v instanceof Date ? toDayString(v) : "" });
      }}
    />
  );

  const setItem = (index: number, changes: Partial<RequestItem>) =>
    patch({ items: data.items.map((it, i) => (i === index ? { ...it, ...changes } : it)) });

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      if (isPurchase) await downloadPurchaseRequestPdf(purchase);
      else await downloadQuotationRequestPdf(quotation);
      goBack(BACK);
    } catch {
      setError(t("errors.generate"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage
      className="m-0! p-0! px-8! min-w-full! pb-12!"
      noPadding
      title={t(`${kind}.title`)}
      description={t(`${kind}.description`)}
      icon={<LuFileText size={20} />}
      backAction={() => goBack(BACK)}
      actions={
        <ITFlex gap={2} align="center">
          <ITButton label={t("cancel")} variant="outlined" color="gray" size="sm" className="!rounded-full" onClick={() => goBack(BACK)} disabled={busy} />
          <ITButton label={t("downloadPdf")} variant="rounded" color="primary" size="sm" onClick={() => void run()} disabled={busy} />
        </ITFlex>
      }
      breadcrumbs={[
        { label: t("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: t("hr"), onClick: () => navigate("/hr") },
        { label: t("breadcrumb"), onClick: () => navigate(BACK) },
        { label: t(`${kind}.title`) },
      ]}
    >
      <div className="grid grid-cols-1 items-start gap-4 lg:!grid-cols-2">
        <div className="flex min-w-0 flex-col gap-4">
          <FormSection number={1} icon={<LuPencilLine size={16} />} title={t("request.sectionGeneral")} description={t("request.optionalHint")} complete>
            <ITStack spacing={4}>
              {dateField("requestDate", t("request.requestDate"))}
              {isPurchase ? (
                <>
                  <ITInput {...text("priority", t("request.priority"), t("request.priorityHint"))} />
                  <ITInput {...text("requestingArea", t("request.requestingArea"))} />
                  {dateField("requiredDate", t("request.requiredDate"))}
                  <ITInput {...text("costCenter", t("request.costCenter"))} />
                  <ITInput {...text("availableBudget", t("request.availableBudget"))} />
                  <ITSelect
                    name="req-expenseType"
                    label={t("request.expenseType")}
                    value={purchase.expenseType}
                    options={[
                      { value: "", label: "—" },
                      { value: "operativo", label: t("request.expenseOperating") },
                      { value: "capex", label: t("request.expenseCapex") },
                      { value: "mantenimiento", label: t("request.expenseMaintenance") },
                    ]}
                    onChange={(e: { target: { value: string } }) => patch({ expenseType: e.target.value as PurchaseExpenseType })}
                  />
                  <ITInput {...text("requesterName", t("request.requesterName"))} />
                </>
              ) : (
                <>
                  <ITInput {...text("folio", t("request.folio"))} />
                  <ITInput {...text("requestingArea", t("request.requestingArea"))} />
                  <ITInput {...text("requesterName", t("request.requesterName"))} />
                  <ITInput {...text("supplierName", t("request.supplierName"))} />
                  <ITInput {...text("supplierContact", t("request.supplierContact"))} />
                  <ITInput {...text("supplierPhone", t("request.supplierPhone"))} />
                  <ITInput {...text("supplierEmail", t("request.supplierEmail"))} />
                  {dateField("responseDeadline", t("request.responseDeadline"))}
                  {area("deliveryTerms", t("request.deliveryTerms"), 3)}
                </>
              )}
            </ITStack>
          </FormSection>

          <FormSection number={2} icon={<LuPencilLine size={16} />} title={t("request.sectionItems")} description={t("request.itemsHint")} complete>
            <ITStack spacing={4}>
              {data.items.map((item, i) => (
                <div key={i} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3">
                  <ITFlex align="center" justify="between">
                    <ITText className="!text-[12px] font-bold">{t("request.item", { n: i + 1 })}</ITText>
                    <ITButton
                      label={t("request.removeItem")}
                      icon={<LuTrash2 size={14} />}
                      variant="outlined"
                      color="gray"
                      size="sm"
                      onClick={() => patch({ items: data.items.filter((_, j) => j !== i) })}
                    />
                  </ITFlex>
                  <ITInput name={`req-item-${i}-product`} label={t("request.product")} value={item.product} onChange={(e: { target: { value: string } }) => setItem(i, { product: e.target.value })} />
                  <ITInput name={`req-item-${i}-description`} label={t("request.description")} value={item.description} onChange={(e: { target: { value: string } }) => setItem(i, { description: e.target.value })} />
                  <ITFlex gap={2}>
                    <ITInput name={`req-item-${i}-quantity`} label={t("request.quantity")} value={item.quantity} onChange={(e: { target: { value: string } }) => setItem(i, { quantity: e.target.value })} />
                    <ITInput name={`req-item-${i}-unit`} label={t("request.unit")} value={item.unit} onChange={(e: { target: { value: string } }) => setItem(i, { unit: e.target.value })} />
                  </ITFlex>
                </div>
              ))}
              <ITButton
                label={t("request.addItem")}
                icon={<LuPlus size={14} />}
                variant="outlined"
                color="secondary"
                size="sm"
                onClick={() => patch({ items: [...data.items, emptyRequestItem()] })}
              />
            </ITStack>
          </FormSection>

          <FormSection number={3} icon={<LuPencilLine size={16} />} title={t("request.sectionNotes")} complete>
            <ITStack spacing={4}>
              {isPurchase ? (
                <>
                  {area("urgencyReason", t("request.urgencyReason"), 3)}
                  {area("justification", t("request.justification"), 4)}
                  <ITInput {...text("suggestedSupplier", t("request.suggestedSupplier"))} />
                </>
              ) : (
                area("notes", t("request.notes"), 4)
              )}
              {error && <ITText className="!text-[12px] text-red-600">{error}</ITText>}
            </ITStack>
          </FormSection>
        </div>

        <div className="min-w-0 lg:sticky lg:top-4">
          <PanelCard title={t("preview")} icon={<LuFileText size={16} />}>
            <PDFViewer
              style={{ width: "100%", height: "calc(100vh - 220px)", minHeight: 560, border: "none", borderRadius: 16 }}
              showToolbar={false}
            >
              {isPurchase ? (
                <PurchaseRequestPdf data={previewData as PurchaseRequestData} />
              ) : (
                <QuotationRequestPdf data={previewData as QuotationRequestData} />
              )}
            </PDFViewer>
          </PanelCard>
        </div>
      </div>
    </AppPage>
  );
}
