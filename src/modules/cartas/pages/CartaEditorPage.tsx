import {
  ITButton,
  ITConfirmDialog,
  ITFlex,
  ITGrid,
  ITPage,
  ITSegmentedControl,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { useEffect, useState } from "react";
import { FaDownload, FaFileSignature, FaRedo, FaSave } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import {
  resetDraft,
  saveCarta,
  setConsecutivo,
} from "@core/store/cartas/cartas.slice";
import { useConsecutivo } from "../hooks/useConsecutivo";
import { downloadCartaPDF } from "../utils/pdf";
import { validateCartaDraft } from "../utils/validation";
import CartaForm from "../components/CartaForm";
import CartaPreview from "../components/CartaPreview";

type Tab = "form" | "preview";

export default function CartaEditorPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const draft = useSelector((s: RootState) => s.cartas.draft);
  const { consume } = useConsecutivo();
  const [tab, setTab] = useState<Tab>("form");
  const [toast, setToast] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "error">("success");
  const [downloading, setDownloading] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (!draft.consecutivo) {
      consume().then((next) => dispatch(setConsecutivo(next)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2500);
    return () => clearTimeout(t);
  }, [toast]);

  const totalPages = 1;

  const handleGenerateNext = async () => {
    const next = await consume();
    dispatch(setConsecutivo(next));
    setToastType("success");
    setToast(`Folio generado: ${next}`);
  };

  const handleSave = async () => {
    const errors = validateCartaDraft(draft);
    const firstError = Object.values(errors).find(Boolean);
    if (firstError) {
      setTab("form");
      setToastType("error");
      setToast(firstError);
      return;
    }
    try {
      const action = await dispatch(saveCarta());
      if (saveCarta.fulfilled.match(action)) {
        setToastType("success");
        setToast("Carta guardada en el historial");
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

  const handleReset = async () => {
    const next = await consume();
    dispatch(resetDraft());
    dispatch(setConsecutivo(next));
    setToastType("success");
    setToast("Borrador reiniciado");
    setConfirmReset(false);
  };

  const formSection = (
    <CartaForm onConsumeConsecutivo={handleGenerateNext} errors={validateCartaDraft(draft)} />
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
        color="info"
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
        disabled={downloading}
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
      description={draft.consecutivo ? `Folio ${draft.consecutivo} · Mantenimiento` : "Folio — · Mantenimiento"}
      backAction={() => navigate("/")}
      icon={<FaFileSignature size={20} />}
      actions={actions}
      className="print-area"
      maxWidth="7xl"
    >
      <ITFlex justify="center" className="no-print md:hidden mb-4">
        <ITSegmentedControl
          options={[
            { value: "form", label: "Formulario" },
            { value: "preview", label: "Vista previa" },
          ]}
          value={tab}
          onChange={(v) => setTab(v as Tab)}
        />
      </ITFlex>

      <ITGrid container columns={12} spacing={6}>
        <ITGrid item xs={12} md={5} className={`print-area ${tab === "form" ? "block" : "hidden md:block"}`}>
          <ITFlex className="bg-white rounded-[24px] shadow-xl shadow-slate-200/40 border border-slate-100 p-6 md:p-8 sticky top-24">
            {formSection}
          </ITFlex>
        </ITGrid>

        <ITGrid item xs={12} md={7} className={`print-area ${tab === "preview" ? "block" : "hidden md:block"}`}>
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