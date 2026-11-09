import { useState } from "react";
import { ITAlert, ITButton, ITDialog, ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaPrint } from "react-icons/fa";
import { useTranslation } from "react-i18next";

import { BLANK_FORMS, type BlankFormKind } from "../forms";

interface Props {
  /** Genera el PDF en blanco con el catálogo vivo (lo provee la página). */
  onDownload: (kind: BlankFormKind) => Promise<void>;
}

/** Botón "Formatos de respaldo": descarga cada formato impreso en blanco (págs. 13–19). */
export default function BlankFormsMenu({ onDownload }: Props) {
  const { t } = useTranslation("hotel-linen-report");
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<BlankFormKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  const download = async (kind: BlankFormKind) => {
    setBusy(kind);
    setError(null);
    try {
      await onDownload(kind);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <ITButton variant="outlined" color="secondary" icon={<FaPrint size={12} />} label={t("blank.button")} onClick={() => setOpen(true)} />
      <ITDialog isOpen={open} onClose={() => setOpen(false)} title={t("blank.title")}>
        <ITFlex direction="column" gap={3} className="min-w-[480px]">
          <ITText muted className="text-[12px]">{t("blank.description")}</ITText>
          {error && <ITAlert variant="error">{error}</ITAlert>}
          {BLANK_FORMS.map((kind) => (
            <ITFlex key={kind} justify="between" align="center" gap={3}>
              <ITText className="text-[13px]">{t(`blank.form.${kind}`)}</ITText>
              <ITButton variant="outlined" color="secondary" size="sm" icon={<FaFilePdf size={12} />} label={t("export.pdf")} disabled={busy !== null} onClick={() => void download(kind)} />
            </ITFlex>
          ))}
        </ITFlex>
      </ITDialog>
    </>
  );
}
