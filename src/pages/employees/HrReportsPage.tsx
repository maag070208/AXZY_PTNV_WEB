import {
  ITAlert,
  ITButton,
  ITConfirmDialog,
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

export default function ReportesPersonalPage() {
  const { t: tt } = useTranslation(["actas", "common"]);
  const navigate = useNavigate();
  const fx = useActasReporte();
  const [actaParaBorrar, setActaParaBorrar] = useState<ActaAdministrativa | null>(null);

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
        onView={(acta) => navigate(`/empleados/reportes/${acta.id}`)}
        onDelete={(acta) => setActaParaBorrar(acta)}
      />

      <ActaAdministrativaForm
        isOpen={fx.showForm}
        saving={fx.saving}
        onClose={() => fx.setShowForm(false)}
        onSave={(input) => void fx.createActa(input)}
      />

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