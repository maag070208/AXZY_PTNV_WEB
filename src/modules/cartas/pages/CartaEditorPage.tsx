import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaDownload, FaFileSignature, FaRedo, FaSave } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { resetDraft, saveCarta } from "@core/store/cartas/cartas.slice";
import { downloadCartaPDF } from "../utils/pdf";
import { validateCartaDraft } from "../utils/validation";
import { type CartaResponsiva } from "@core/store/cartas/types";
import CartaForm from "../components/CartaForm";
import CartaPreview from "../components/CartaPreview";

export default function CartaEditorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [downloading, setDownloading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const totalPages = 1;

  const handleSave = async () => {
    const errors = validateCartaDraft(draft);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setToastType("error");
      setToast(firstError);
      return;
    }
    try {
      const action = await dispatch(saveCarta());
      if (saveCarta.fulfilled.match(action)) {
        const saved: any = action.payload;
        setToastType("success");
        setToast("Carta guardada · generando PDF…");

        // Normalizar el shape: el backend devuelve `consecutive` mientras que
        // el front y el PDF esperan `consecutivo`.
        const consecutivoFinal: string = saved.consecutive ?? saved.consecutivo;
        const cartaParaPdf: CartaResponsiva = {
          ...draft,
          id: saved.id,
          consecutivo: consecutivoFinal,
          responsable: saved.responsable ?? draft.responsable,
          encargado: saved.encargado ?? draft.encargado,
          items:
            saved.items?.map((it: any, idx: number) => ({
              ...(draft.items[idx] ?? {}),
              ...it,
              device: it.device ?? draft.items[idx]?.device,
            })) ?? draft.items,
        };

        // Genera el PDF con los datos frescos del backend (incluye device,
        // responsable y encargado hidratados) y redirige a la lista.
        try {
          await downloadCartaPDF(null, {
            consecutivo: consecutivoFinal,
            fecha: cartaParaPdf.fecha,
            carta: cartaParaPdf,
          });
        } catch (err) {
          console.error("Error generando PDF:", err);
          setToastType("error");
          setToast("Guardada, pero falló la generación del PDF");
        }
        dispatch(resetDraft());
        navigate("/cartas");
      } else {
        setToastType("error");
        setToast("Error al guardar");
      }
    } catch {
      setToastType("error");
      setToast("Error al guardar");
    }
  };

  const handleDownload = async () => {
    const errors = validateCartaDraft(draft);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setToastType("error");
      setToast("Completa todos los campos requeridos antes de descargar");
      return;
    }
    setDownloading(true);
    setToastType("success");
    setToast("Generando PDF…");
    try {
      await downloadCartaPDF(null, {
        consecutivo: draft.consecutivo,
        fecha: draft.fecha,
        carta: draft,
      });
      setToast("PDF descargado");
    } catch (err) {
      console.error(err);
      setToast("Error al generar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    dispatch(resetDraft());
    setToastType("success");
    setToast("Borrador reiniciado");
    setConfirmReset(false);
  };

  const formSection = (
    <CartaForm errors={validateCartaDraft(draft)} />
  );

  const actions = (
    <ITFlex gap={2} className="no-print">
      <ITButton
        variant="outlined"
        size="small"
        color="warning"
        onClick={() => setConfirmReset(true)}
      >
        <ITFlex align="center" gap={1}>
          <FaRedo size={12} />
          <ITText className="font-bold text-[11px]">Reiniciar</ITText>
        </ITFlex>
      </ITButton>
      <ITButton
        variant="outlined"
        size="small"
        color="secondary"
        onClick={handleSave}
      >
        <ITFlex align="center" gap={1}>
          <FaSave size={12} />
          <ITText className="font-bold text-[11px]">Guardar</ITText>
        </ITFlex>
      </ITButton>
      <ITButton
        variant="filled"
        size="small"
        color="primary"
        onClick={handleDownload}
        disabled={downloading || !!Object.values(validateCartaDraft(draft)).find(Boolean)}
      >
        <ITFlex align="center" gap={1}>
          <FaDownload size={12} />
          <ITText className="font-bold text-[11px]">
            {downloading ? "Generando…" : "Descargar PDF"}
          </ITText>
        </ITFlex>
      </ITButton>
    </ITFlex>
  );

  return (
    <ITPage
      title="Editor de Carta Responsiva"
      description={
        draft.consecutivo
          ? `Folio ${draft.consecutivo} · Mantenimiento`
          : "Folio — · Mantenimiento"
      }
      backAction={() => navigate(-1)}
      icon={<FaFileSignature size={20} />}
      breadcrumbs={[
        { label: "Cartas", onClick: () => navigate("/cartas") },
        { label: "Editor" },
      ]}
      actions={actions}
      className="print-area"
    >
      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} md={5}>
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8 sticky top-24">
            {formSection}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={7}>
          <ITFlex justify="end" className="mb-3 no-print">
            <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Vista previa · Carta Tamaño Carta (Letter)
            </ITText>
          </ITFlex>
          <CartaPreview carta={draft} pageIndex={1} totalPages={totalPages} />
        </ITGrid>
      </ITGrid>

      <ITConfirmDialog
        isOpen={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={handleReset}
        title="Reiniciar borrador"
        message="¿Reiniciar borrador? Se perderán los datos no guardados."
        confirmLabel="Reiniciar"
        cancelLabel="Cancelar"
        variant="warning"
      />

      {toast && (
        <ITToast
          message={toast}
          type={toastType}
          position="bottom-center"
          duration={2500}
          onClose={() => setToast(null)}
        />
      )}
    </ITPage>
  );
}
