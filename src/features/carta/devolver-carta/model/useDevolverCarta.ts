import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import type { AppDispatch } from "@core/store/store";
import {
  cartasApi,
  returnCartaThunk,
  undoReturnThunk,
  type CartaResponsiva,
} from "@entities/carta";

export const useDevolverCarta = () => {
  const { id } = useParams<{ id: string }>();
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

  const handleReturn = async (): Promise<string | null> => {
    if (!id || !returnedBy.trim() || !returnCondition.trim()) return null;
    setSubmitting(true);
    try {
      await dispatch(
        returnCartaThunk({
          id,
          returnedBy,
          returnCondition,
        })
      ).unwrap();
      return id;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  const handleUndo = async (): Promise<string | null> => {
    if (!id) return null;
    setSubmitting(true);
    setConfirmUndo(false);
    try {
      await dispatch(undoReturnThunk(id)).unwrap();
      return id;
    } catch (e: any) {
      setError(e.message);
      return null;
    } finally {
      setSubmitting(false);
    }
  };

  return {
    carta,
    loading,
    returnedBy,
    setReturnedBy,
    returnCondition,
    setReturnCondition,
    submitting,
    error,
    setError,
    isReturned,
    confirmUndo,
    setConfirmUndo,
    handleReturn,
    handleUndo,
  };
};