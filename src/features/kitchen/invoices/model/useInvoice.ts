import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { kitchenApi, type SupplierInvoiceDetail } from "@entities/kitchen";

/** Detalle de una factura y su cancelación. */
export const useInvoice = (id?: string) => {
  const { t } = useTranslation("kitchen");
  const [invoice, setInvoice] = useState<SupplierInvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const reload = useCallback(() => {
    if (!id) return;
    setLoading(true);
    kitchenApi
      .invoice(id)
      .then(setInvoice)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const cancel = useCallback(async () => {
    if (!id) return;
    setBusy(true);
    setError(null);
    try {
      await kitchenApi.cancelInvoice(id, null);
      setToast(t("invoices.cancelled"));
      reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [id, reload, t]);

  return { t, invoice, loading, busy, error, setError, toast, setToast, cancel };
};

export type UseInvoice = ReturnType<typeof useInvoice>;
