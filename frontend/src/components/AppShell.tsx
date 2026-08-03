import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const AVATAR =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAg2XVkx6Hb-jErnyT_Np7Shx3_WBedVg9gOSiH6Wt81TAhJlKjryyx5rVIcPr0T9MonkPoi7sUt8UrjzB1HvOyc-bZTRXwEEpB84qyghIR1dGthP0LqCk4vgBtJnlpb8cI3uPsN37FdBjFAM6KLxT0ttpv1rxQlpsiYKa5DMNzrCPZ_D1FBfIUVfrHFwCBnEXHy-99vMIrzMFbZfryQOKlbTs6HJq6sT-H2EUwdebt7a-hJUJlTM2dWQ";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { to: "/register", label: "Register", icon: "edit_note" },
  { to: "/history", label: "History", icon: "history" },
  { to: "/analytics", label: "Analytics", icon: "leaderboard" },
  { to: "/reports", label: "Reports", icon: "description" },
  { to: "/predict", label: "AI Predict", icon: "auto_awesome" },
  { to: "/profile", label: "Profile", icon: "person" },
] as const;

const MOBILE_NAV = NAV.filter((item) =>
  ["/dashboard", "/register", "/history", "/analytics", "/profile"].includes(item.to),
);

export function AppShell({
  children,
  active,
}: {
  children: ReactNode;
  active: string;
}) {
  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col md:flex-row pb-safe md:pb-0">
      {/* Navigation Drawer (Desktop) */}
      <nav className="hidden lg:flex flex-col py-lg pr-md bg-surface-container border-r border-outline-variant fixed h-full left-0 top-0 w-[240px] z-50">
        <div className="px-md mb-lg">
          <Link to="/" className="font-display-lg text-display-lg text-primary">
            RESTORA
          </Link>
        </div>
        <div className="px-md mb-xl">
          <div className="flex items-center gap-sm">
            <div className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden shrink-0">
              <img
                className="w-full h-full object-cover"
                alt="Restaurant manager portrait"
                src={AVATAR}
              />
            </div>
            <div>
              <div className="font-label-md text-label-md font-bold text-on-surface">
                Arequipa Central
              </div>
              <div className="font-label-sm text-label-sm text-on-surface-variant">
                Manager View
              </div>
            </div>
          </div>
        </div>
        <ul className="flex flex-col gap-xs font-body-md text-body-md">
          {NAV.map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                className={`rounded-r-full py-3 pl-md pr-4 flex items-center gap-3 transition-all duration-200 active:opacity-80 ${
                  active === item.to
                    ? "bg-primary-container text-on-primary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  data-weight={active === item.to ? "fill" : undefined}
                >
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Top App Bar (Mobile) */}
      <header className="flex justify-between items-center w-full px-margin-mobile h-[64px] z-50 bg-surface shadow-[0_4px_12px_rgba(31,27,23,0.05)] top-0 lg:hidden sticky">
        <div className="flex items-center gap-2 text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 duration-150 p-2 rounded-full cursor-pointer">
          <span className="material-symbols-outlined">restaurant</span>
        </div>
        <Link
          to="/"
          className="font-display-lg-mobile text-display-lg-mobile text-primary tracking-tight font-bold"
        >
          RESTORA
        </Link>
        <div className="flex items-center gap-2 text-on-surface-variant hover:bg-surface-container transition-colors active:scale-95 duration-150 p-2 rounded-full cursor-pointer">
          <span className="material-symbols-outlined">notifications</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-7xl mx-auto lg:ml-[240px] p-margin-mobile lg:p-margin-desktop space-y-lg mb-[80px] lg:mb-0">
        {children}
      </main>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-[72px] px-2 pb-safe bg-surface-container-lowest border-t border-outline-variant shadow-[0_-4px_12px_rgba(31,27,23,0.05)] rounded-t-xl lg:hidden">
        {MOBILE_NAV.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex flex-col items-center justify-center active:scale-90 transition-transform duration-200 ${
              active === item.to
                ? "text-primary font-bold after:content-[''] after:w-8 after:h-1 after:bg-primary after:rounded-full after:mt-1"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            <span
              className="material-symbols-outlined"
              data-weight={active === item.to ? "fill" : undefined}
            >
              {item.icon}
            </span>
            <span className="font-label-sm text-label-sm mt-1">{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}