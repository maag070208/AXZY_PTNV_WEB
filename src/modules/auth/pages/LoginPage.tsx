import { ITAlert, ITButton, ITCard, ITFlex, ITInput, ITStack, ITText } from "@axzydev/axzy_ui_system";
import { useState } from "react";
import { FaSignInAlt } from "react-icons/fa";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { AppDispatch, RootState } from "@core/store/store";
import { loginThunk } from "@core/store/auth/auth.slice";

export default function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { token, loading, error } = useSelector((s: RootState) => s.auth);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const action = await dispatch(loginThunk({ username, password }));
    if (loginThunk.fulfilled.match(action)) {
      navigate("/");
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

              {error && (
                <ITAlert variant="error" dismissible onDismiss={() => undefined}>
                  {error}
                </ITAlert>
              )}

              <ITButton
                type="submit"
                variant="filled"
                color="primary"
                disabled={loading || !username || !password}
                className="w-full flex items-center justify-center gap-2"
              >
                <ITFlex align="center" gap={1}>
                  <FaSignInAlt size={14} />
                  <ITText className="font-bold text-[11px]">
                    {loading ? "Entrando…" : "Entrar"}
                  </ITText>
                </ITFlex>
              </ITButton>
            </form>

            <ITFlex direction="column" align="center" gap={1} className="mt-6 pt-5 border-t border-slate-100">
              <ITText className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Demo
              </ITText>
              <ITText className="text-[11px] font-mono text-slate-500">admin / admin123</ITText>
              <ITText className="text-[11px] font-mono text-slate-500">usuario / user123</ITText>
            </ITFlex>
          </ITCard>
        </ITFlex>
    </ITFlex>
  );
}