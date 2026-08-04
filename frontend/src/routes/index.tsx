import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "restora — Convierte los datos de tu restaurante en decisiones" },
      {
        name: "description",
        content:
          "restora transforma registros simples de residuos en información de costos, recomendaciones operativas y evidencia de valorización para restaurantes turísticos de Arequipa.",
      },
      { property: "og:title", content: "restora — Menos desperdicio, más eficiencia" },
      {
        property: "og:description",
        content:
          "Registra en menos de un minuto con un asistente de IA, descubre dónde pierdes dinero y valoriza tus residuos.",
      },
    ],
  }),
  component: Index,
});

function Marca({ size = 32 }: { size?: number }) {
  return (
    <span
      className="rounded-md bg-primary-container text-on-primary-container flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <span className="material-symbols-outlined" data-weight="fill" style={{ fontSize: size * 0.62 }}>
        eco
      </span>
    </span>
  );
}

function Index() {
  return (
    <div className="bg-background text-on-background font-body-md min-h-screen antialiased flex flex-col">
      <header className="bg-surface shadow-[0_4px_12px_rgba(31,27,23,0.05)] top-0 sticky z-50">
        <div className="flex justify-between items-center w-full px-margin-mobile md:px-margin-desktop h-[64px]">
          <div className="flex items-center gap-sm">
            <Marca size={32} />
            <span className="font-display-lg-mobile md:font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight">
              restora
            </span>
          </div>
          <div className="flex items-center gap-md">
            <a
              className="hidden md:block font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
              href="#beneficios"
            >
              Beneficios
            </a>
            <Link
              to="/auth"
              className="bg-surface-container-lowest border border-outline-variant text-primary font-label-md text-label-md px-md py-sm rounded-lg hover:bg-surface-container transition-colors"
            >
              Ingresar
            </Link>
            <Link
              to="/auth"
              className="bg-primary-container text-on-primary h-12 px-lg rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center"
            >
              Crear cuenta
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
              <span className="material-symbols-outlined text-[16px] text-secondary">smart_toy</span>
              <span>Registro con asistente de IA</span>
            </div>
            <h1 className="font-display-lg-mobile text-display-lg-mobile md:font-display-lg md:text-display-lg md:text-[48px] md:leading-[56px] text-primary max-w-3xl mx-auto">
              Convierte los datos de tu restaurante en decisiones que reducen el desperdicio.
            </h1>
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
              restora ayuda a restaurantes turísticos de Arequipa a registrar residuos en menos de un
              minuto, descubrir dónde pierden dinero y valorizar lo aprovechable. Sin sistemas
              complejos.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-md pt-md">
              <Link
                to="/auth"
                className="w-full sm:w-auto bg-primary-container text-on-primary h-12 px-xl rounded-lg font-label-md text-label-md hover:opacity-90 transition-opacity flex items-center justify-center gap-xs"
              >
                Crear cuenta
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
              <Link
                to="/auth"
                className="w-full sm:w-auto bg-surface-container-lowest border border-outline-variant text-on-surface font-label-md text-label-md h-12 px-xl rounded-lg hover:bg-surface-container transition-colors flex items-center justify-center"
              >
                Ver la demo
              </Link>
            </div>
          </div>
        </section>

        {/* Problema / Solución */}
        <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface-container-lowest border-y border-outline-variant">
          <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-xl items-center">
            <div className="space-y-md">
              <h2 className="font-headline-md text-headline-md text-primary">
                El problema: no saber qué residuo cuesta más
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant">
                Los restaurantes generan mermas, sobreproducción y residuos sin registrar de forma
                sistemática la cantidad, el tipo, la causa, el costo y el destino. Sin esa
                información, se pierde dinero y oportunidades de aprovechamiento cada día.
              </p>
              <div className="p-md bg-surface-container rounded-xl border border-surface-variant mt-lg">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm">
                  La solución restora
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Un asistente conversacional recopila los datos hablando contigo y completa los
                  formularios. restora convierte cada registro en costos estimados, recomendaciones
                  preventivas y evidencia de valorización.
                </p>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-[0_8px_24px_rgba(31,27,23,0.1)] border border-surface-variant bg-inverse-surface text-inverse-on-surface p-lg">
              <div className="flex items-center gap-2 mb-md">
                <span className="material-symbols-outlined text-tertiary-fixed-dim" data-weight="fill">
                  smart_toy
                </span>
                <span className="font-label-md text-label-md">Asistente restora</span>
              </div>
              <div className="space-y-2">
                <div className="ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-primary text-on-primary px-3 py-2 text-body-sm">
                  Ayer en la noche vendimos 40 lomo saltado y botamos 3 kg de arroz.
                </div>
                <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-surface-variant text-on-surface px-3 py-2 text-body-sm">
                  Anotado 🍽️ 40 Lomo Saltado y 🗑️ 3 kg de arroz (sobreproducción). ¿Confirmo el
                  registro del turno noche?
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios */}
        <section className="py-xl px-margin-mobile md:px-margin-desktop bg-surface" id="beneficios">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-xl">
              <h2 className="font-display-lg-mobile text-display-lg-mobile md:font-headline-md md:text-headline-md text-primary">
                Precisión operativa
              </h2>
              <p className="font-body-md text-body-md text-on-surface-variant mt-sm">
                Beneficios clave pensados para administradores de restaurantes.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
              <div className="col-span-1 md:col-span-2 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft transition-shadow">
                <div className="flex items-start justify-between mb-lg">
                  <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined" data-weight="fill">
                      delete_sweep
                    </span>
                  </div>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Reduce el desperdicio
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  La predicción de demanda por plato, entrenada con tu propio historial, te ayuda a
                  preparar exactamente lo necesario y minimizar la sobreproducción.
                </p>
              </div>

              <div className="col-span-1 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft transition-shadow">
                <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                  <span className="material-symbols-outlined" data-weight="fill">
                    monitoring
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Identifica pérdidas
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Convierte cada kilo desperdiciado en su costo real y descubre qué área, plato o
                  turno concentra la pérdida.
                </p>
              </div>

              <div className="col-span-1 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft transition-shadow">
                <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                  <span className="material-symbols-outlined" data-weight="fill">
                    recycling
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Valoriza y demuestra
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Registra entregas a recicladores con evidencia y mantén la trazabilidad de tus
                  residuos valorizables.
                </p>
              </div>

              <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-xl p-lg border border-outline-variant shadow-soft">
                <div className="bg-surface-container w-12 h-12 rounded-lg flex items-center justify-center text-primary mb-lg">
                  <span className="material-symbols-outlined" data-weight="fill">
                    energy_savings_leaf
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">
                  Sostenibilidad medible
                </h3>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  Indicadores de segregación, valorización, prevención y trazabilidad que muestran el
                  avance mes a mes, listos para reportes y reconocimiento.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-surface-container-lowest border-t border-outline-variant py-xl px-margin-mobile md:px-margin-desktop">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-md">
          <div className="flex items-center gap-sm">
            <Marca size={24} />
            <span className="font-headline-sm text-headline-sm text-on-surface-variant">restora</span>
          </div>
          <div className="flex gap-lg font-label-md text-label-md text-on-surface-variant">
            <Link to="/dashboard" className="hover:text-primary transition-colors">
              Plataforma
            </Link>
            <a className="hover:text-primary transition-colors" href="#beneficios">
              Beneficios
            </a>
            <Link to="/auth" className="hover:text-primary transition-colors">
              Ingresar
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
