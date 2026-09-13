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
  const [toast, setToast] = useState<{
    message: string;
    type: "error" | "success";
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<boolean> => {
    e.preventDefault();
    setIsSubmitting(true);
    const action = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(action)) {
      return true;
    }
    setIsSubmitting(false);
    setToast({ message: tt("login.invalidCredentials"), type: "error" });
    return false;
  };

  const canSubmit = !!username && !!password;

  return {
    username,
    password,
    setUsername,
    setPassword,
    isSubmitting,
    canSubmit,
    toast,
    dismissToast: () => setToast(null),
    handleSubmit,
  };
};