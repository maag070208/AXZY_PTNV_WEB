import {
  ITAlert,
  ITButton,
  ITCard,
  ITConfirmDialog,
  ITFlex,
  ITInput,
  ITLoader,
  ITPage,
  ITStack,
  ITText,
  ITTextarea,
} from "@axzydev/axzy_ui_system";
import { FaFileSignature, FaUndo } from "react-icons/fa";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import type { AppDispatch } from "@core/store/store";
import { cartasApi, type CartaResponsiva } from "@core/api/cartas.api";
import {
  returnCartaThunk,
  undoReturnThunk,
} from "@core/store/cartas/cartas.slice";
import { formatFecha } from "@core/store/cartas/types";

export default function DevolverCartaPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const [carta, setCarta] = useState<CartaResponsiva | null>(null);
  const [loading, setLoading] = useState(true);
  const [returnedBy, setReturnedBy] = useState("");
  const [returnCondition, setReturnCondition] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmUndo, setConfirmUndo] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    cartasApi
      .get(id)
      .then(setCarta)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const isReturned = !!carta?.returnDate;

  const handleReturn = async () => {
    if (!id || !returnedBy.trim() || !returnCondition.trim()) return;
    setSubmitting(true);
    try {
      await dispatch(
        returnCartaThunk({
          id,
          returnedBy,
          returnCondition,
        })
      ).unwrap();
      navigate(`/cartas`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async () => {
    if (!id) return;
    setSubmitting(true);
    setConfirmUndo(false);
    try {
      await dispatch(undoReturnThunk(id)).unwrap();
      navigate(`/cartas`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <ITPage title="Devolución" loading>
        <ITFlex justify="center" align="center">
          <ITLoader variant="spinner" size="lg" color="primary" />
        </ITFlex>
      </ITPage>
    );
  }

  if (!carta) {
    return (
      <ITPage title="Devolución" backAction={() => navigate("/")}>
        <ITAlert variant="error">Carta no encontrada</ITAlert>
      </ITPage>
    );
  }

  return (
    <ITPage
      title={isReturned ? "Cancelar devolución" : "Marcar devolución"}
      description={`Folio ${carta.consecutivo} · ${formatFecha(carta.fecha)}`}
      backAction={() => navigate("/")}
      maxWidth="3xl"
      icon={<FaFileSignature size={20} />}
    >
      <ITStack direction="column" spacing={6}>
        {isReturned && (
          <ITAlert variant="success" title="Devolución registrada">
            <ITStack direction="column" spacing={1}>
              <ITText as="span" muted>
                <strong>Fecha:</strong>{" "}
                {carta.returnDate
                  ? new Date(carta.returnDate).toLocaleDateString("es-MX")
                  : "—"}
              </ITText>
              <ITText as="span" muted>
                <strong>Resguardó:</strong> {carta.returnedBy}
              </ITText>
              <ITText as="span" muted>
                <strong>Condiciones:</strong> {carta.returnCondition}
              </ITText>
            </ITStack>
          </ITAlert>
        )}

        {error && (
          <ITAlert variant="error" dismissible onDismiss={() => setError(null)}>
            {error}
          </ITAlert>
        )}

        {!isReturned && (
          <ITCard className="p-6 shadow-xl shadow-slate-200/40 border border-slate-100 rounded-[24px]">
            <ITStack direction="column" spacing={4}>
              <ITInput
                name="returnedBy"
                label="Nombre de quien resguarda *"
                value={returnedBy}
                onChange={(e) => setReturnedBy(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
              />
              <ITTextarea
                name="returnCondition"
                label="Condiciones en las que se devuelve *"
                value={returnCondition}
                onChange={setReturnCondition}
                placeholder="Bueno, con detalles menores en pantalla..."
                rows={4}
              />

              <ITFlex justify="end" gap={2}>
                <ITButton variant="outlined" onClick={() => navigate("/cartas")}>
                  Cancelar
                </ITButton>
                <ITButton
                  variant="filled"
                  color="primary"
                  onClick={handleReturn}
                  disabled={
                    submitting ||
                    !returnedBy.trim() ||
                    !returnCondition.trim()
                  }
                >
                  <ITFlex align="center" gap={1}>
                    <FaUndo size={12} />
                    <ITText className="font-bold text-[11px]">
                      {submitting ? "Procesando…" : "Marcar devuelto"}
                    </ITText>
                  </ITFlex>
                </ITButton>
              </ITFlex>
            </ITStack>
          </ITCard>
        )}

        {isReturned && (
          <ITFlex justify="end">
            <ITButton
              variant="outlined"
              color="warning"
              onClick={() => setConfirmUndo(true)}
              disabled={submitting}
            >
              <ITFlex align="center" gap={1}>
                <FaUndo size={12} />
                <ITText className="font-bold text-[11px]">Cancelar devolución</ITText>
              </ITFlex>
            </ITButton>
          </ITFlex>
        )}
      </ITStack>

      <ITConfirmDialog
        isOpen={confirmUndo}
        onClose={() => setConfirmUndo(false)}
        onConfirm={handleUndo}
        title="Cancelar devolución"
        message="¿Cancelar la devolución? El device volverá a ASIGNADO."
        confirmLabel="Cancelar devolución"
        cancelLabel="Volver"
        variant="warning"
        loading={submitting}
      />
    </ITPage>
  );
}