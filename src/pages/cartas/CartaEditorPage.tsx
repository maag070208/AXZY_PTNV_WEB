import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaRedo, FaSave } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useCartaEditor } from "@features/carta/editor";
import { CartaForm } from "@features/carta/create-carta";
import { CartaPreview } from "@widgets/carta/carta-preview";
import { openCartaPDF } from "@widgets/carta/carta-pdf";

export default function CartaEditorPage() {
  const navigate = useNavigate();
  const { t } = useTranslation(["cartas", "common"]);
  const editor = useCartaEditor({
    download: (carta) =>
      openCartaPDF({
        consecutivo: carta.consecutivo,
        fecha: carta.fecha,
        carta,
      }),
    onSaved: () => navigate("/cartas"),
  });

  const actions = (
    <ITFlex gap={2} className="no-print">
      <ITButton
        variant="outlined"
        size="sm"
        color="warning"
        onClick={() => editor.setConfirmReset(true)}
      >
        <ITFlex align="center" gap={1}>
          <FaRedo size={12} />
          <ITText className="font-bold text-[11px]">{t("editor.reset")}</ITText>
        </ITFlex>
      </ITButton>
      <ITButton variant="outlined" size="sm" color="secondary" onClick={editor.handleSave} disabled={editor.saving}>
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">{t("editor.save")}</ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title={t("editor.title")}
      description="Mantenimiento · Cartas Responsivas"
      backAction={() => navigate(-1)}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: t("list.breadcrumb"), onClick: () => navigate("/cartas") },
        { label: t("editor.breadcrumb") },
      ]}
      actions={actions}
      className="print-area"
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} md={6}>
          <div className="sticky top-24">
            <CartaForm errors={editor.errors} />
          </div>
        </ITGrid>

        <ITGrid item xs={12} md={6}>
          <ITFlex justify="end" className="mb-3 no-print">
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {t("editor.previewNotice")}
            </ITText>
          </ITFlex>
          <CartaPreview carta={editor.draft} pageIndex={1} totalPages={editor.totalPages} />
        </ITGrid>
      </ITGrid>

      <ITConfirmDialog
        isOpen={editor.confirmReset}
        onClose={() => editor.setConfirmReset(false)}
        onConfirm={editor.handleReset}
        title={t("editor.resetDialogTitle")}
        message={t("editor.resetDialogMessage")}
        confirmLabel={t("editor.reset")}
        cancelLabel={t("common:actions.cancel")}
        variant="warning"
      />

      {editor.toast && (
        <ITToast
          message={editor.toast}
          type={editor.toastType}
          position="bottom-center"
          duration={2500}
          onClose={editor.dismissToast}
        />
      )}
    </ITPage>
  );
}