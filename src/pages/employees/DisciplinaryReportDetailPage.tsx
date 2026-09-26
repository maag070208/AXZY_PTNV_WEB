import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ITAlert, ITButton, ITFlex, ITGrid, ITLoader, ITPage, ITText } from "@axzydev/axzy_ui_system";
import { FaFilePdf, FaScroll } from "react-icons/fa6";
import { useTranslation } from "react-i18next";
import { formatFecha } from "@shared/utils/dates";
import { personalApi, type ActaAdministrativa } from "@entities/personal";
import { ActaAdministrativaPreview, descargarActaPDF } from "@widgets/acta-administrativa";

export default function ActaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { t: tt } = useTranslation(["actas", "common"]);
  const navigate = useNavigate();
  const [acta, setActa] = useState<ActaAdministrativa | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    personalApi
      .acta(id)
      .then(setActa)
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "No se pudo cargar el acta administrativa")
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <ITPage title={tt("preview.title")} loading backAction={() => navigate("/empleados/reportes")}>
        <ITFlex justify="center" align="center" className="py-20">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (error || !acta) {
    return (
      <ITPage
        title={tt("preview.title")}
        backAction={() => navigate("/empleados/reportes")}
        breadcrumbs={[
          { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
          { label: tt("breadcrumb"), onClick: () => navigate("/empleados/reportes") },
          { label: tt("preview.title") },
        ]}
      >
        <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
          {error ?? "No se encontró el acta administrativa"}
        </ITAlert>
      </ITPage>
    );
  }

  const area = acta.user.department?.name
    ? `${acta.user.department.name}${acta.user.subarea ? ` — ${acta.user.subarea.name}` : ""}`
    : "—";

  return (
    <ITPage
      title={tt("preview.title")}
      description={`${acta.user.name} · ${tt(`motivos.${acta.motivo}`)}`}
      icon={<FaScroll size={20} />}
      breadcrumbs={[
        { label: tt("common:breadcrumbs.home"), onClick: () => navigate("/") },
        { label: tt("breadcrumb"), onClick: () => navigate("/empleados/reportes") },
        { label: acta.user.name },
      ]}
      backAction={() => navigate("/empleados/reportes")}
      actions={
        <ITFlex gap={2}>
          <ITButton variant="outlined" color="secondary" onClick={() => void descargarActaPDF(acta)}>
            <ITFlex align="center" gap={1}>
              <FaFilePdf className="text-red-600" size={13} />
              <ITText className="font-bold text-[11px]">{tt("preview.descargar")}</ITText>
            </ITFlex>
          </ITButton>
        </ITFlex>
      }
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} lg={5}>
          <ITFlex as="section" direction="column" gap={3} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{tt("doc.tituloDocumento")}</ITText>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.empleado")}</ITText>
              <ITText className="text-sm font-bold text-slate-900">{acta.user.name}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.numeroEmpleado")}</ITText>
              <ITText className="text-sm text-slate-700">{acta.user.numeroEmpleado ?? "—"}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.puesto")}</ITText>
              <ITText className="text-sm text-slate-700">{acta.user.puesto ?? "—"}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.departamento")}</ITText>
              <ITText className="text-sm text-slate-700">{area}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.fechaIncidente")}</ITText>
              <ITText className="text-sm text-slate-700">{formatFecha(acta.fechaIncidente)}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.motivo")}</ITText>
              <ITText className="text-sm text-slate-700">{tt(`motivos.${acta.motivo}`)}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.descripcion")}</ITText>
              <ITText className="text-sm text-slate-600">{acta.descripcion}</ITText>
            </ITFlex>

            <ITFlex direction="column" gap={0.5}>
              <ITText className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tt("doc.sancion")}</ITText>
              <ITText className="text-sm text-slate-600">{acta.sancion || "—"}</ITText>
            </ITFlex>
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} lg={7}>
          <ITFlex as="section" direction="column" gap={2} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <ITText className="text-sm font-bold text-slate-800">{tt("preview.title")}</ITText>
            <ActaAdministrativaPreview acta={acta} />
          </ITFlex>
        </ITGrid>
      </ITGrid>
    </ITPage>
  );
}