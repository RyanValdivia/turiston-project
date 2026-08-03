import { createFileRoute, Link } from "@tanstack/react-router";

const LOGO =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAHC6cTHpk7mg5FmQdPzG-oyIoGvLeV1DoT7oFRBe8YhTe1WYJSnGfDUmqhtKdz-X-9nXto-s0640hmkvwvm5IrNLJ-XxTGYE2W_VxDMxW7m6u7sbKuJHqddhvgRFTpi5egycUO4vZer6GwWBKxS_4ep14eGChjZ8Qee-8oDy2QOKTJMRLEKyiQDTvGvOH947CamaT38NRFRlELrfpaKfhvey21Cvg1b_FC0H15gjpySdqZskjLTapSzA";

const DASHBOARD_IMG =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA1oKuR1ifUtbJeoFbeTVZEn7jCTJBuncf1KjuPhaHawUzOKyX9m6y2wo8WfTB-tedldJhWuuipxwwAmmcttH74dQ0ZLLzZxFENCG9K4wI22iMqJG8roL8wDKp3YNTlC4ZtSsSOMYKlrwfxZZ9nRYcU6vV4z1KV6TOzof-I00zjE45zIHchE8jfYQXkyo8xNjh-dkuBrfsTwsKZPH8pOPFWr1tFdY24Qz_-L_96aKMo2fhYbSZjE7xTog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RESTORA — Transform Restaurant Data Into Decisions" },
      {
        name: "description",
        content:
          "RESTORA turns restaurant data into decisions that reduce waste and increase efficiency, with predictive analytics built for culinary operations.",
      },
      { property: "og:title", content: "RESTORA — Transform Restaurant Data Into Decisions" },
      {
        property: "og:description",
        content:
          "Modern B2B intelligence for restaurants: cut waste, find losses, improve operations.",
      },
      { property: "og:image", content: DASHBOARD_IMG },
      { name: "twitter:image", content: DASHBOARD_IMG },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen antialiased flex flex-col">
      <header className="bg-surface shadow-[0_4px_12px_rgba(31,27,23,0.05)] top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-[64px]">
          <div className="flex items-center gap-sm">
            <img alt="RESTORA logo" className="h-8 w-8 object-cover rounded-md" src={LOGO} />
            <span className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
              RESTORA
            </span>
          </div>
          <div className="flex items-center gap-md">
            <a
              className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              href="#benefits"
            >
              Benefits
            </a>
            <Link
              to="/auth"
              className="bg-surface-container-lowest border border-outline-variant text-primary font-label-md text-label-md px-md py-sm rounded-lg hover:bg-surface-container transition-colors"
            >
              Access platform
            </Link>
            <Link
              to="/auth"
              className="bg-primary-container text-on-primary h-12 px-lg rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              Create account
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-grow">
        {/* Hero */}
        <section className="relative pt-xl pb-32 overflow-hidden px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-surface-container-lowest via-surface to-surface-variant opacity-70" />
          <div className="relative z-10 max-w-4xl mx-auto space-y-lg mt-xl">
            <div className="inline-flex items-center gap-sm px-md py-sm rounded-full bg-surface-container-highest border border-outline-variant text-on-surface-variant font-label-md text-label-md mx-auto mb-md">
              <span className="material-symbols-outlined text-[16px] text-secondary">eco</span>
              <span>Smart Restaurant Intelligence</span>
            </div>
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg md:text-[48px] md:leading-[56px] text-primary max-w-3xl mx-auto">
              Transform restaurant data into decisions to reduce waste and increase efficiency.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              RESTORA provides modern B2B SaaS intelligence designed specifically for the rigorous
              demands of culinary operations. Stop guessing and start optimizing.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-md pt-md">
              <Link
                to="/auth"
                className="w-full sm:w-auto bg-primary-container text-on-primary h-12 px-xl rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs"
              >
                Create account
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <button className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md h-12 px-xl rounded-lg hover:bg-surface-container transition-colors">
                Book a Demo
              </button>
            </div>
          </div>
        </section>

        {/* Problem / Solution */}
        <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-y border-outline-variant">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div className="space-y-md">
              <h2 className="font-headline-md text-headline-md text-primary">
                The Complexity of Culinary Operations
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Managing a restaurant involves balancing perishable inventory, unpredictable foot
                traffic, and tight margins. Without clear visibility into daily operations, valuable
                resources are lost, directly impacting profitability and sustainability.
              </p>
              <div className="p-md bg-surface-container rounded-xl border border-surface-variant mt-lg">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                  The RESTORA Solution
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Our tactile, minimalist dashboard brings precision to your data. By aggregating
                  sales, inventory, and staff metrics, RESTORA highlights inefficiencies instantly,
                  allowing you to act before waste occurs.
                </p>
              </div>
            </div>
            <div className="relative h-[400px] rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(31,27,23,0.1)] border border-surface-variant">
              <div
                className="bg-cover bg-center w-full h-full"
                role="img"
                aria-label="A modern minimalist dashboard interface on a tablet resting on a light wood restaurant table"
                style={{ backgroundImage: `url('${DASHBOARD_IMG}')` }}
              />
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface" id="benefits">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-xl">
              <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-headline-md md:text-headline-md text-primary">
                Operational Precision
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
                Key benefits designed for restaurant owners.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft hover:shadow-[0_8px_24px_rgba(31,27,23,0.08)] transition-shadow">
                <div className="flex items-start justify-between mb-lg">
                  <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" data-weight="fill">
                      delete_sweep
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-xs px-sm py-xs bg-secondary-container text-on-secondary-container rounded-full font-label-sm text-label-sm">
                    <span className="material-symbols-outlined text-[14px]">trending_down</span> 24%
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Reduce Waste
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Predictive analytics forecast demand with high accuracy, ensuring you order exactly
                  what you need, minimizing spoilage and maximizing resource efficiency.
                </p>
              </div>

              <div className="col-span-1 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft hover:shadow-[0_8px_24px_rgba(31,27,23,0.08)] transition-shadow">
                <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                  <span className="material-symbols-outlined" data-weight="fill">
                    monitoring
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Identify Losses
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Pinpoint exact operational leaks, from over-portioning to unrecorded comps,
                  instantly.
                </p>
              </div>

              <div className="col-span-1 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft hover:shadow-[0_8px_24px_rgba(31,27,23,0.08)] transition-shadow">
                <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                  <span className="material-symbols-outlined" data-weight="fill">
                    settings_suggest
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Improve Operations
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Streamline front and back-of-house communication with data-driven shift planning.
                </p>
              </div>

              <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft hover:shadow-[0_8px_24px_rgba(31,27,23,0.08)] transition-shadow flex flex-col md:flex-row gap-lg items-center">
                <div className="flex-1">
                  <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                    <span className="material-symbols-outlined" data-weight="fill">
                      energy_savings_leaf
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                    Manage Sustainability
                  </h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">
                    Track your environmental impact. Our sustainability dashboard provides actionable
                    metrics to help your restaurant operate greener while staying profitable.
                  </p>
                </div>
                <div className="w-full md:w-1/3 h-32 rounded-lg bg-surface-variant flex items-end justify-between p-sm relative overflow-hidden">
                  <div className="w-1/5 bg-secondary-fixed opacity-60 h-[40%] rounded-t-sm" />
                  <div className="w-1/5 bg-secondary-fixed opacity-70 h-[50%] rounded-t-sm" />
                  <div className="w-1/5 bg-secondary-fixed opacity-80 h-[70%] rounded-t-sm" />
                  <div className="w-1/5 bg-secondary h-[90%] rounded-t-sm relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-secondary font-label-sm text-label-sm">
                      +15%
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant py-xl px-margin-mobile md:px-margin-desktop">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm">
            <img
              alt="RESTORA logo"
              className="h-6 w-6 object-cover rounded-md grayscale opacity-70"
              src={LOGO}
            />
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">
              RESTORA
            </span>
          </div>
          <div className="flex gap-lg font-label-md text-label-md text-on-surface-variant">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Platform
            </Link>
            <a className="hover:text-primary transition-colors" href="#benefits">
              Benefits
            </a>
            <Link to="/auth" className="hover:text-primary transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
