import {
  ITButton,
  ITCard,
  ITFlex,
  ITInput,
  ITStack,
  ITText,
  ITToast,
} from "@axzydev/axzy_ui_system";
import { FaSignInAlt } from "react-icons/fa";

interface LoginFormProps {
  username: string;
  password: string;
  setUsername: React.Dispatch<React.SetStateAction<string>>;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  isSubmitting: boolean;
  canSubmit: boolean;
  toast: { message: string; type: "error" | "success" } | null;
  dismissToast: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function LoginForm({
  username,
  password,
  setUsername,
  setPassword,
  isSubmitting,
  canSubmit,
  toast,
  dismissToast,
  onSubmit,
}: LoginFormProps) {
  return (
    <>
      <ITCard className="w-full p-8 shadow-xl border border-slate-100 rounded-[24px]">
        <ITStack>
          <ITText as="h2" className="text-2xl font-bold text-slate-800 text-center">
            Iniciar sesión
          </ITText>
          <ITText className="text-sm text-slate-500 block text-center mt-1">
            Ingresa tus credenciales para acceder al sistema
          </ITText>
        </ITStack>

        <form onSubmit={onSubmit} className="space-y-4 mt-6">
          <ITFlex direction="column" gap={4}>
            <ITInput
              name="username"
              label="Usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              autoFocus
            />
            <ITInput
              name="password"
              type="password"
              label="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </ITFlex>

          <ITButton
            type="submit"
            variant="filled"
            color="primary"
            disabled={isSubmitting || !canSubmit}
            className="w-full flex items-center justify-center gap-2"
          >
            <ITFlex align="center" gap={1}>
              <FaSignInAlt size={14} />
              <ITText className="font-bold text-[11px]">
                {isSubmitting ? "Entrando…" : "Entrar"}
              </ITText>
            </ITFlex>
          </ITButton>
        </form>
      </ITCard>

      {toast && (
        <ITToast
          message={toast.message}
          type={toast.type}
          position="bottom-center"
          duration={2500}
          onClose={dismissToast}
        />
      )}
    </>
  );
}