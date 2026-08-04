import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { login, register, forgotPassword, resetPassword, ApiError } from "@/lib/api";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "restora - Ingresar / Registrarse" },
      {
        name: "description",
        content: "Inicia sesión, regístrate o recupera tu contraseña en restora.",
      },
      { property: "og:title", content: "restora - Ingresar / Registrarse" },
    ],
  }),
  component: AuthPage,
});

type View = "login" | "register" | "recovery";

function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return "Algo salió mal. Inténtalo de nuevo.";
}

function AuthPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [view, setView] = useState<View>("login");
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [regPwVisible, setRegPwVisible] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "confirm">("request");
  const [recEmail, setRecEmail] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [registerForm, setRegisterForm] = useState({
    nombreRestaurante: "",
    nombreUsuario: "",
    email: "",
    password: "",
  });

  const goToApp = () => {
    queryClient.invalidateQueries({ queryKey: ["session"] });
    navigate({ to: "/dashboard" });
  };

  const loginMutation = useMutation({
    mutationFn: () => login(loginForm),
    onSuccess: goToApp,
  });

  const registerMutation = useMutation({
    mutationFn: async () => {
      await register(registerForm);
      // El backend no inicia sesión automáticamente al registrar; lo hacemos
      // acá para no obligar al usuario a volver a escribir sus credenciales.
      await login({ email: registerForm.email, password: registerForm.password });
    },
    onSuccess: goToApp,
  });

  const forgotMutation = useMutation({
    mutationFn: () => forgotPassword(recEmail),
    onSuccess: (data) => {
      // Sin servicio de email: el backend devuelve el token directo. Se
      // precarga para que el usuario no tenga que copiarlo a mano en la demo.
      if (data.resetToken) setResetToken(data.resetToken);
      setRecoveryStep("confirm");
    },
  });

  const resetMutation = useMutation({
    mutationFn: () => resetPassword(resetToken, newPassword),
    onSuccess: () => {
      switchForm("login");
    },
  });

  const switchForm = (v: View) => {
    setView(v);
    if (v !== "recovery") {
      setRecoveryStep("request");
      setRecEmail("");
      setResetToken("");
      setNewPassword("");
    }
  };

  const panelClass = (v: View) =>
    `form-panel p-lg w-full transition-all duration-300 ${
      view === v
        ? "opacity-100 pointer-events-auto relative translate-y-0"
        : "opacity-0 pointer-events-none absolute translate-y-[10px]"
    }`;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-body-md antialiased overflow-x-hidden selection:bg-primary-container selection:text-white">
      <main className="flex-grow flex flex-col pt-safe pb-safe px-margin-mobile relative z-10 w-full max-w-[480px] mx-auto min-h-screen justify-center">
        <header className="w-full flex flex-col items-center justify-center mb-xl mt-lg">
          <div className="w-[96px] h-[96px] mb-lg rounded-2xl shadow-[0_8px_24px_rgba(31,27,23,0.08)] bg-primary-container text-on-primary-container flex items-center justify-center">
            <span className="material-symbols-outlined" data-weight="fill" style={{ fontSize: 48 }}>
              eco
            </span>
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary tracking-tight text-center">
            restora
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm max-w-[280px]">
            Operación inteligente para restaurantes turísticos de Arequipa.
          </p>
        </header>

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(31,27,23,0.05)] border border-outline-variant/30 overflow-hidden relative min-h-[420px]">
          {/* Login */}
          <div className={panelClass("login")}>
            <div className="mb-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">
                Bienvenido de nuevo
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Inicia sesión para gestionar tu restaurante.
              </p>
            </div>
            <form
              className="flex flex-col gap-md"
              onSubmit={(e) => {
                e.preventDefault();
                loginMutation.mutate();
              }}
            >
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="login-email"
                >
                  Correo electrónico
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    mail
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="login-email"
                    placeholder="admin@restaurant.com"
                    required
                    type="email"
                    value={loginForm.email}
                    onChange={(e) => setLoginForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="login-password"
                >
                  Contraseña
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    lock
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="login-password"
                    placeholder="••••••••"
                    required
                    type={loginPwVisible ? "text" : "password"}
                    value={loginForm.password}
                    onChange={(e) => setLoginForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    className="pr-md h-full flex items-center text-on-surface-variant hover:text-primary transition-colors"
                    onClick={() => setLoginPwVisible((v) => !v)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {loginPwVisible ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-[-8px]">
                <button
                  className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors"
                  onClick={() => switchForm("recovery")}
                  type="button"
                >
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              {loginMutation.isError && (
                <p className="text-sm text-red-600">{errorMessage(loginMutation.error)}</p>
              )}
              <button
                className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg mt-sm shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-sm disabled:opacity-60"
                disabled={loginMutation.isPending}
                type="submit"
              >
                <span>{loginMutation.isPending ? "Ingresando…" : "Iniciar sesión"}</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>
            <div className="mt-lg text-center pt-md border-t border-outline-variant/30">
              <p className="font-body-md text-body-md text-on-surface-variant">
                ¿No tienes una cuenta?
                <button
                  className="font-headline-sm text-headline-sm text-primary hover:text-primary-container ml-xs transition-colors"
                  onClick={() => switchForm("register")}
                  type="button"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>

          {/* Register */}
          <div className={panelClass("register")}>
            <div className="mb-lg flex items-center gap-sm">
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant text-on-surface transition-colors"
                onClick={() => switchForm("login")}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Crear cuenta
                </h2>
              </div>
            </div>
            <form
              className="flex flex-col gap-md"
              onSubmit={(e) => {
                e.preventDefault();
                registerMutation.mutate();
              }}
            >
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reg-restaurant"
                >
                  Nombre del restaurante
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    storefront
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="reg-restaurant"
                    placeholder="e.g. La Nueva Palomino"
                    required
                    type="text"
                    value={registerForm.nombreRestaurante}
                    onChange={(e) =>
                      setRegisterForm((f) => ({ ...f, nombreRestaurante: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reg-admin"
                >
                  Nombre del administrador
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    person
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="reg-admin"
                    placeholder="Nombre completo"
                    required
                    type="text"
                    value={registerForm.nombreUsuario}
                    onChange={(e) =>
                      setRegisterForm((f) => ({ ...f, nombreUsuario: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reg-email"
                >
                  Correo electrónico
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    mail
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="reg-email"
                    placeholder="admin@restaurant.com"
                    required
                    type="email"
                    value={registerForm.email}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label
                  className="font-label-md text-label-md text-on-surface-variant"
                  htmlFor="reg-password"
                >
                  Contraseña
                </label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                    lock
                  </span>
                  <input
                    className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                    id="reg-password"
                    placeholder="Mín. 8 caracteres"
                    required
                    minLength={8}
                    type={regPwVisible ? "text" : "password"}
                    value={registerForm.password}
                    onChange={(e) => setRegisterForm((f) => ({ ...f, password: e.target.value }))}
                  />
                  <button
                    className="pr-md h-full flex items-center text-on-surface-variant hover:text-primary transition-colors"
                    onClick={() => setRegPwVisible((v) => !v)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {regPwVisible ? "visibility" : "visibility_off"}
                    </span>
                  </button>
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center my-xs">
                Al registrarte, aceptas nuestros{" "}
                <a className="text-primary hover:underline" href="#">
                  Términos
                </a>{" "}
                y{" "}
                <a className="text-primary hover:underline" href="#">
                  Política de privacidad
                </a>
                .
              </p>
              {registerMutation.isError && (
                <p className="text-sm text-red-600">{errorMessage(registerMutation.error)}</p>
              )}
              <button
                className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-sm disabled:opacity-60"
                disabled={registerMutation.isPending}
                type="submit"
              >
                <span>{registerMutation.isPending ? "Creando…" : "Crear cuenta"}</span>
              </button>
            </form>
          </div>

          {/* Recovery */}
          <div className={panelClass("recovery")}>
            <div className="mb-lg flex items-center gap-sm">
              <button
                className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant text-on-surface transition-colors"
                onClick={() => switchForm("login")}
                type="button"
              >
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">
                  Recuperar contraseña
                </h2>
              </div>
            </div>

            {recoveryStep === "request" && (
              <>
                <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
                  Ingresa el correo asociado a tu cuenta y te generaremos un código de recuperación.
                </p>
                <form
                  className="flex flex-col gap-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    forgotMutation.mutate();
                  }}
                >
                  <div className="flex flex-col gap-xs">
                    <label
                      className="font-label-md text-label-md text-on-surface-variant"
                      htmlFor="rec-email"
                    >
                      Email Address
                    </label>
                    <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                      <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                        mail
                      </span>
                      <input
                        className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                        id="rec-email"
                        placeholder="admin@restaurant.com"
                        required
                        type="email"
                        value={recEmail}
                        onChange={(e) => setRecEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  {forgotMutation.isError && (
                    <p className="text-sm text-red-600">{errorMessage(forgotMutation.error)}</p>
                  )}
                  <button
                    className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg mt-md shadow-sm active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-60"
                    disabled={forgotMutation.isPending}
                    type="submit"
                  >
                    <span>{forgotMutation.isPending ? "Enviando…" : "Enviar código"}</span>
                  </button>
                </form>
              </>
            )}

            {recoveryStep === "confirm" && (
              <>
                <div className="flex flex-col items-center text-center mb-lg">
                  <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-sm">
                    <span className="material-symbols-outlined">check_circle</span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                    Código listo
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Esta demo no tiene servicio de correo — ingresa tu nueva contraseña abajo (el
                    código ya está precargado).
                  </p>
                </div>
                <form
                  className="flex flex-col gap-md"
                  onSubmit={(e) => {
                    e.preventDefault();
                    resetMutation.mutate();
                  }}
                >
                  <div className="flex flex-col gap-xs">
                    <label
                      className="font-label-md text-label-md text-on-surface-variant"
                      htmlFor="rec-token"
                    >
                      Código de recuperación
                    </label>
                    <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                      <input
                        className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface px-md"
                        id="rec-token"
                        required
                        type="text"
                        value={resetToken}
                        onChange={(e) => setResetToken(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-xs">
                    <label
                      className="font-label-md text-label-md text-on-surface-variant"
                      htmlFor="rec-new-password"
                    >
                      Nueva contraseña
                    </label>
                    <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                      <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">
                        lock
                      </span>
                      <input
                        className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md"
                        id="rec-new-password"
                        placeholder="Mín. 8 caracteres"
                        required
                        minLength={8}
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  {resetMutation.isError && (
                    <p className="text-sm text-red-600">{errorMessage(resetMutation.error)}</p>
                  )}
                  <button
                    className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg mt-md shadow-sm active:scale-[0.98] transition-all flex justify-center items-center disabled:opacity-60"
                    disabled={resetMutation.isPending}
                    type="submit"
                  >
                    <span>{resetMutation.isPending ? "Guardando…" : "Guardar contraseña"}</span>
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </main>

      <div aria-hidden="true" className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-container/5 blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-surface-dim/30 blur-[80px]" />
      </div>
    </div>
  );
}
