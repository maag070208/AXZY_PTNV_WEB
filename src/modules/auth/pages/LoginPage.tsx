import { ITButton, ITCard, ITFlex, ITInput, ITStack, ITText, ITToast } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaSignInAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { loginThunk } from "@core/store/auth/auth.slice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token } = useSelector((s: RootState) => s.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "error" | "success" } | null>(null);

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    const action = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(action)) {
      navigate("/");
    } else {
      setIsSubmitting(false);
      setToast({ message: "Credenciales inválidas", type: "error" });
    }
  };

  return (
    <ITFlex
      as="div"
      align="center"
      justify="center"
      grow
      className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4"
    >
      <ITFlex direction="column" align="center" gap={6} className="w-full max-w-md">
          <img
            src="/logo-puerto-nuevo.png"
            alt="Puerto Nuevo Hotel y Villas"
            className="h-16 w-auto"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          <ITCard className="w-full p-8 shadow-xl border border-slate-100 rounded-[24px]">
            <ITStack>
              <ITText as="h2" className="text-2xl font-bold text-slate-800 text-center">
                Iniciar sesión
              </ITText>
              <ITText className="text-sm text-slate-500 block text-center mt-1">
                Cartas Responsivas · Mantenimiento
              </ITText>
            </ITStack>

            <form onSubmit={handleSubmit} className="space-y-4 mt-6">
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
                disabled={isSubmitting || !username || !password}
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
              onClose={() => setToast(null)}
            />
          )}
        </ITFlex>
    </ITFlex>
  );
}