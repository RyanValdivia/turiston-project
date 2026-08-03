import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "RESTORA - Login / Register" },
      { name: "description", content: "Sign in, register, or reset your password for RESTORA restaurant operations." },
      { property: "og:title", content: "RESTORA - Login / Register" },
      { property: "og:description", content: "Sign in, register, or reset your password for RESTORA restaurant operations." },
    ],
  }),
  component: AuthPage,
});

type View = "login" | "register" | "recovery";

function AuthPage() {
  const [view, setView] = useState<View>("login");
  const [loginPwVisible, setLoginPwVisible] = useState(false);
  const [regPwVisible, setRegPwVisible] = useState(false);
  const [recoverySent, setRecoverySent] = useState(false);
  const [recEmail, setRecEmail] = useState("");

  const switchForm = (v: View) => {
    setView(v);
    if (v !== "recovery") {
      setRecoverySent(false);
      setRecEmail("");
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
          <div className="w-[120px] h-[120px] mb-lg rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(31,27,23,0.08)] bg-white p-2">
            <img
              alt="RESTORA Logo"
              className="w-full h-full object-contain rounded-lg"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAHC6cTHpk7mg5FmQdPzG-oyIoGvLeV1DoT7oFRBe8YhTe1WYJSnGfDUmqhtKdz-X-9nXto-s0640hmkvwvm5IrNLJ-XxTGYE2W_VxDMxW7m6u7sbKuJHqddhvgRFTpi5egycUO4vZer6GwWBKxS_4ep14eGChjZ8Qee-8oDy2QOKTJMRLEKyiQDTvGvOH947CamaT38NRFRlELrfpaKfhvey21Cvg1b_FC0H15gjpySdqZskjLTapSzA"
            />
          </div>
          <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg text-primary tracking-tight text-center">
            RESTORA
          </h1>
          <p className="font-body-md text-body-md text-on-surface-variant text-center mt-sm max-w-[280px]">
            Intelligent operations for modern Arequipa restaurants.
          </p>
        </header>

        <div className="w-full bg-surface-container-lowest rounded-xl shadow-[0_4px_12px_rgba(31,27,23,0.05)] border border-outline-variant/30 overflow-hidden relative min-h-[420px]">
          {/* Login */}
          <div className={panelClass("login")}>
            <div className="mb-lg">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-xs">Welcome Back</h2>
              <p className="font-body-md text-body-md text-on-surface-variant">Sign in to manage your restaurant.</p>
            </div>
            <form className="flex flex-col gap-md" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="login-email">Email Address</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">mail</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="login-email" placeholder="admin@restaurant.com" required type="email" />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="login-password">Password</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">lock</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="login-password" placeholder="••••••••" required type={loginPwVisible ? "text" : "password"} />
                  <button className="pr-md h-full flex items-center text-on-surface-variant hover:text-primary transition-colors" onClick={() => setLoginPwVisible((v) => !v)} type="button">
                    <span className="material-symbols-outlined text-[20px]">{loginPwVisible ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-[-8px]">
                <button className="font-label-md text-label-md text-primary hover:text-primary-container transition-colors" onClick={() => switchForm("recovery")} type="button">Forgot password?</button>
              </div>
              <button className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg mt-sm shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-sm" type="submit">
                <span>Log In</span>
                <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
            </form>
            <div className="mt-lg text-center pt-md border-t border-outline-variant/30">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Don't have an account?
                <button className="font-headline-sm text-headline-sm text-primary hover:text-primary-container ml-xs transition-colors" onClick={() => switchForm("register")} type="button">Register here</button>
              </p>
            </div>
          </div>

          {/* Register */}
          <div className={panelClass("register")}>
            <div className="mb-lg flex items-center gap-sm">
              <button className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant text-on-surface transition-colors" onClick={() => switchForm("login")} type="button">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Create Account</h2>
              </div>
            </div>
            <form className="flex flex-col gap-md" onSubmit={(e) => e.preventDefault()}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reg-restaurant">Restaurant Name</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">storefront</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="reg-restaurant" placeholder="e.g. La Nueva Palomino" required type="text" />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reg-admin">Administrator Name</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">person</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="reg-admin" placeholder="Full Name" required type="text" />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reg-email">Email Address</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">mail</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="reg-email" placeholder="admin@restaurant.com" required type="email" />
                </div>
              </div>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="reg-password">Password</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">lock</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="reg-password" placeholder="Min. 8 characters" required type={regPwVisible ? "text" : "password"} />
                  <button className="pr-md h-full flex items-center text-on-surface-variant hover:text-primary transition-colors" onClick={() => setRegPwVisible((v) => !v)} type="button">
                    <span className="material-symbols-outlined text-[20px]">{regPwVisible ? "visibility" : "visibility_off"}</span>
                  </button>
                </div>
              </div>
              <p className="font-label-sm text-label-sm text-on-surface-variant text-center my-xs">
                By registering, you agree to our <a className="text-primary hover:underline" href="#">Terms</a> &amp; <a className="text-primary hover:underline" href="#">Privacy Policy</a>.
              </p>
              <button className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg shadow-sm active:scale-[0.98] transition-all flex justify-center items-center gap-sm" type="submit">
                <span>Create Account</span>
              </button>
            </form>
          </div>

          {/* Recovery */}
          <div className={panelClass("recovery")}>
            <div className="mb-lg flex items-center gap-sm">
              <button className="h-8 w-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-variant text-on-surface transition-colors" onClick={() => switchForm("login")} type="button">
                <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              </button>
              <div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Reset Password</h2>
              </div>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-lg">
              Enter the email address associated with your account and we'll send you a link to reset your password.
            </p>
            <form className="flex flex-col gap-md" onSubmit={(e) => { e.preventDefault(); setRecoverySent(true); }}>
              <div className="flex flex-col gap-xs">
                <label className="font-label-md text-label-md text-on-surface-variant" htmlFor="rec-email">Email Address</label>
                <div className="relative flex items-center h-[48px] bg-white rounded-lg border border-outline-variant input-focus-ring overflow-hidden">
                  <span className="material-symbols-outlined text-on-surface-variant pl-md pr-sm">mail</span>
                  <input className="w-full h-full bg-transparent border-none outline-none font-body-md text-on-surface placeholder:text-outline/60 pr-md" id="rec-email" placeholder="admin@restaurant.com" required type="email" value={recEmail} onChange={(e) => setRecEmail(e.target.value)} />
                </div>
              </div>
              <button className="w-full h-[48px] bg-primary-container hover:bg-primary text-white font-headline-sm text-headline-sm rounded-lg mt-md shadow-sm active:scale-[0.98] transition-all flex justify-center items-center" type="submit">
                <span>Send Reset Link</span>
              </button>
            </form>
            {recoverySent && (
              <div className="flex flex-col items-center text-center mt-xl pt-lg border-t border-outline-variant/30">
                <div className="w-12 h-12 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center mb-sm">
                  <span className="material-symbols-outlined">check_circle</span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Email Sent</h3>
                <p className="font-body-md text-body-md text-on-surface-variant mb-md">Check your inbox for instructions.</p>
                <button className="h-[40px] px-lg border border-outline-variant rounded-lg font-label-md text-label-md text-on-surface hover:bg-surface-variant transition-colors" onClick={() => switchForm("login")} type="button">
                  Return to Login
                </button>
              </div>
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
