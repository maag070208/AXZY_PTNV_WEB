import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import type { AppDispatch } from "@app/store";
import { showToast } from "./toast.slice";

/**
 * Confirmación breve y consistente al guardar una acción (usa el toast global de la app).
 * Sin argumento muestra "Guardado".
 */
export function useSuccessToast() {
  const dispatch = useDispatch<AppDispatch>();
  const { t } = useTranslation("common");
  return useCallback(
    (message?: string) => dispatch(showToast({ message: message ?? t("actions.saved"), type: "success" })),
    [dispatch, t]
  );
}
