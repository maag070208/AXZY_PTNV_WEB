import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
  ITDialog,
  ITFlex,
  ITPage,
  ITText,
} from "@axzydev/axzy_ui_system";
import { FaPlus, FaScroll } from "react-icons/fa6";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ActaAdministrativa } from "@entities/personal";
import {
  useActasReporte,
  ActasTable,
  ActaAdministrativaForm,
} from "@features/personal/actas-reporte";
import { ActaAdministrativaPreview, descargarActaPDF } from "@widgets/acta-administrativa";

export default function ReportesPersonalPage() {
  const { t: tt } = useTranslation(["actas", "common"]);
  const navigate = useNavigate();
  const fx = useActasReporte();
  const [actaParaBorrar, setActaParaBorrar] = useState<ActaAdministrativa | null>(null);
  const [actaVista, setActaVista] = useState<ActaAdministrativa | null>(null);

  return (
    <ITPage
      title={tt("title")}
      description={tt("description")}
      backAction={() => navigate(-1)}
      icon={<FaScroll size={20} />}
      breadcrumbs={[
        { label: tt("common:nav.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb") },
      ]}
      actions={
        <ITButton variant="filled" color="primary" onClick={() => fx.setShowForm(true)}>
          <ITFlex align="center" gap={1}>
            <FaPlus size={12} />
            <ITText className="font-bold text-[11px]">{tt("newActa")}</ITText>
          </ITFlex>
        </ITButton>
      }
    >
      {fx.error && (
        <ITAlert variant="error" dismissible onDismiss={() => fx.setError(null)}>
          {fx.error}
        </ITAlert>
      )}

      <ActasTable
        fetchData={fx.fetchTableData}
        reloadKey={fx.reloadKey}
        onView={(acta) => setActaVista(acta)}
        onDownload={(acta) => void descargarActaPDF(acta)}
        onDelete={(acta) => setActaParaBorrar(acta)}
      />

      <ActaAdministrativaForm
        isOpen={fx.showForm}
        saving={fx.saving}
        onClose={() => fx.setShowForm(false)}
        onSave={(input) => void fx.createActa(input)}
      />

      <ITDialog
        isOpen={!!actaVista}
        onClose={() => setActaVista(null)}
        className="w-full max-w-3xl"
        title={tt("preview.title")}
      >
        {actaVista && (
          <>
            <ITFlex justify="end" className="mb-3">
              <ITButton
                variant="filled"
                color="primary"
                onClick={() => void descargarActaPDF(actaVista)}
              >
                <ITText className="font-bold text-[11px]">{tt("preview.descargar")}</ITText>
              </ITButton>
            </ITFlex>
            <ActaAdministrativaPreview acta={actaVista} />
          </>
        )}
      </ITDialog>

      <ITConfirmDialog
        isOpen={!!actaParaBorrar}
        onClose={() => setActaParaBorrar(null)}
        onConfirm={() => {
          if (actaParaBorrar) void fx.deleteActa(actaParaBorrar.id);
          setActaParaBorrar(null);
        }}
        title={tt("actions.eliminar")}
        message={tt("form.eliminarConfirm", {
          name: actaParaBorrar?.user.name ?? "",
        })}
        confirmLabel={tt("actions.eliminar")}
        cancelLabel={tt("common:actions.cancel")}
        variant="danger"
      />
    </ITPage>
  );
}