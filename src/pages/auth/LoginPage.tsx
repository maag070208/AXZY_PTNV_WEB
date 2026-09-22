import { ITFlex, ITText } from "@axzydev/axzy_ui_system";
import { useSelector } from "react-redux";
import { Navigate, useNavigate } from "react-router-dom";
import type { RootState } from "@app/store";
import { LoginForm, useLogin } from "@features/auth/login";

export default function LoginPage() {
  const navigate = useNavigate();
  const { token } = useSelector((s: RootState) => s.auth);
  const login = useLogin();

  if (token) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    const ok = await login.handleSubmit(e);
    if (ok) navigate("/");
  };

  return (
    <ITFlex
      as="div"
      align="center"
      justify="center"
      grow
      className="relative min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50 p-4"
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
        <LoginForm
          username={login.username}
          password={login.password}
          setUsername={login.setUsername}
          setPassword={login.setPassword}
          errors={login.errors}
          deactivatedMsg={login.deactivatedMsg}
          isSubmitting={login.isSubmitting}
          canSubmit={login.canSubmit}
          toast={login.toast}
          dismissToast={login.dismissToast}
          onSubmit={handleSubmit}
        />
      </ITFlex>

      <ITText
        as="p"
        className="absolute bottom-4 text-xs font-medium text-slate-400"
      >
        v{__APP_VERSION__}
      </ITText>
    </ITFlex>
  );
}