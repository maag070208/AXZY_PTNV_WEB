import { useState } from "react";
import { useDispatch } from "react-redux";
import { useTranslation } from "react-i18next";
import { loginThunk } from "@entities/user";
import type { AppDispatch } from "@app/store";

export const useLogin = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { t: tt } = useTranslation(["auth"]);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({});
  const [deactivatedMsg, setDeactivatedMsg] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const validate = (): boolean => {
    const e: { username?: string; password?: string } = {};
    if (!username.trim()) e.username = "El usuario es obligatorio";
    else if (username.trim().length < 3) e.username = "El usuario debe tener al menos 3 caracteres";
    if (!password) e.password = "La contraseña es obligatoria";
    else if (password.length < 6) e.password = "La contraseña debe tener al menos 6 caracteres";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    if (!validate()) return false;
    setIsSubmitting(true);
    setDeactivatedMsg(null);
    const action = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(action)) {
      return true;
    }
    setIsSubmitting(false);
    // Diferenciamos cuenta dada de baja vs credenciales inválidas.
    const rejected = action.payload as unknown;
    if (
      rejected &&
      typeof rejected === "object" &&
      "code" in (rejected as Record<string, unknown>)
    ) {
      const code = (rejected as { code?: string }).code;
      if (code === "ACCOUNT_DEACTIVATED") {
        const motivo = (rejected as { details?: { motivo?: string } }).details?.motivo;
        setDeactivatedMsg(
          motivo
            ? `Tu cuenta fue dada de baja. Motivo: ${motivo}. Contacta al administrador para reactivarla.`
            : "Tu cuenta fue dada de baja. Contacta al administrador para reactivarla."
        );
        return false;
      }
    }
    setToast({ message: tt("login.invalidCredentials"), type: "error" });
    return false;
  };

  const canSubmit = !!username && !!password;

  return {
    username,
    password,
    setUsername,
    setPassword,
    errors,
    isSubmitting,
    canSubmit,
    deactivatedMsg,
    toast,
    dismissToast: () => setToast(null),
    handleSubmit,
  };
};