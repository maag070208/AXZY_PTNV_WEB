import { useEffect, useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITInput, ITText, ITTextarea } from "@axzydev/axzy_ui_system";
import { FaPaperPlane } from "react-icons/fa";
import { useTranslation } from "react-i18next";
import type { PurchaseOrderDetail } from "@entities/kitchen";

interface Props {
  isOpen: boolean;
  order: PurchaseOrderDetail;
  busy: boolean;
  /** Genera el PDF de la orden (lo provee el widget desde la página). */
  buildPdf: (order: PurchaseOrderDetail) => Promise<Blob>;
  onClose: () => void;
  /** Recibe el `FormData` listo (PDF + destinatarios + asunto + mensaje). */
  onSubmit: (form: FormData) => void;
}

/**
 * Confirmación del envío de la OC al proveedor: vista previa del PDF,
 * destinatarios (default el contacto principal o el correo del proveedor),
 * asunto y mensaje editables. Nunca se envía sin confirmar.
 */
export default function PurchaseOrderEmailDialog({ isOpen, order, busy, buildPdf, onClose, onSubmit }: Props) {
  const { t } = useTranslation("kitchen");
  const defaultTo = order.supplier.primaryContact?.email ?? order.supplier.email ?? "";
  const [to, setTo] = useState(defaultTo);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setTo(defaultTo);
    setSubject(t("purchaseOrders.email.defaultSubject", { number: order.number }));
    setMessage(t("purchaseOrders.email.defaultMessage", { supplier: order.supplier.name }));
    setError(null);
    // Vista previa del PDF que se enviará.
    let url: string | null = null;
    let active = true;
    buildPdf(order)
      .then((generated) => {
        if (!active) return;
        url = URL.createObjectURL(generated);
        setBlob(generated);
        setPreviewUrl(url);
      })
      .catch((e: Error) => active && setError(e.message));
    return () => {
      active = false;
      if (url) URL.revokeObjectURL(url);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, order.id]);

  const noEmail = to.trim() === "";
  const canSend = to.trim() !== "" && subject.trim() !== "" && message.trim() !== "" && !busy && !building;

  const submit = async () => {
    if (!canSend) return;
    setBuilding(true);
    setError(null);
    try {
      const pdfBlob = blob ?? (await buildPdf(order));
      const form = new FormData();
      form.append("file", new File([pdfBlob], `${order.number}.pdf`, { type: "application/pdf" }));
      form.append("to", to.trim());
      form.append("subject", subject.trim());
      form.append("message", message.trim());
      onSubmit(form);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBuilding(false);
    }
  };

  return (
    <ITDialog
      isOpen={isOpen}
      onClose={() => !busy && onClose()}
      title={t("purchaseOrders.email.title", { number: order.number })}
      className="max-w-3xl"
    >
      <ITFlex direction="column" gap={3} className="pt-1">
        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}
        {noEmail && <ITAlert variant="warning">{t("purchaseOrders.email.noEmail")}</ITAlert>}
        <ITInput
          name="poEmailTo"
          label={t("purchaseOrders.email.to")}
          value={to}
          onChange={(e) => setTo(e.target.value)}
          placeholder="proveedor@ejemplo.com"
        />
        <ITText className="-mt-1 text-[10px] text-slate-500">{t("purchaseOrders.email.toHint")}</ITText>
        <ITInput name="poEmailSubject" label={t("purchaseOrders.email.subject")} value={subject} onChange={(e) => setSubject(e.target.value)} />
        <ITTextarea name="poEmailMessage" label={t("purchaseOrders.email.message")} value={message} onChange={setMessage} rows={4} />
        <ITText className="text-[11px] text-slate-500">{t("purchaseOrders.email.pdfAttached", { number: order.number })}</ITText>
        {previewUrl && (
          <iframe
            title={t("purchaseOrders.email.preview")}
            src={previewUrl}
            className="h-72 w-full rounded-lg border border-slate-200"
          />
        )}
        <ITFlex justify="end" gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={onClose} disabled={busy}>
            {t("common.cancel")}
          </ITButton>
          <ITButton
            variant="filled"
            color="primary"
            icon={<FaPaperPlane size={11} />}
            label={building || busy ? t("purchaseOrders.email.sending") : t("purchaseOrders.email.send")}
            onClick={() => void submit()}
            disabled={!canSend}
          />
        </ITFlex>
      </ITFlex>
    </ITDialog>
  );
}
