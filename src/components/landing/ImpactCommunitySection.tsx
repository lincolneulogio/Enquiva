import Image from "next/image";
import Link from "next/link";
import type { CommunityMetrics } from "@/actions/marketing";

interface ImpactCommunitySectionProps {
  metrics?: CommunityMetrics;
}

export function ImpactCommunitySection({ metrics }: ImpactCommunitySectionProps) {
  const stats = [
    {
      value: metrics?.registeredAttendees ?? "0",
      label: "Asistentes registrados",
      isOrange: true,
    },
    {
      value: metrics?.executedEvents ?? "0",
      label: "Eventos ejecutados",
      isOrange: false,
    },
    {
      value: metrics?.satisfactionRate ?? "99.8%",
      label: "Satisfacción de organizadores",
      isOrange: true,
    },
    {
      value: metrics?.connectedCities ?? "0 Organizaciones",
      label: "Organizaciones activas",
      isOrange: false,
    },
  ];

  const card1Title = metrics?.card1Title || "5+ años impulsando";
  const card1Subtitle =
    metrics?.card1Subtitle ||
    "Eventos de tecnología, negocios e innovación en Latinoamérica.";
  const card1ImageUrl = metrics?.card1ImageUrl || "";

  const card2Title = metrics?.card2Title || "Más de 250 empresas";
  const card2Subtitle =
    metrics?.card2Subtitle ||
    "Ya patrocinan y reclutan talento activamente en nuestros eventos.";
  const card2ImageUrl = metrics?.card2ImageUrl || "";

  return (
    <section className="relative w-full bg-[#121214] py-20 text-white lg:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Encabezado centrado */}
        <div className="mx-auto max-w-3xl text-center" data-aos="fade-up">
          <div className="mb-4 inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-[11px] font-bold tracking-widest text-primary">
            IMPACTO COMPROBADO
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px] lg:leading-tight">
            Miles de miembros y empresas confían en Enquiva
          </h2>

          <p className="mx-auto mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
            Conectamos organizadores con audiencias reales. Diseñado para que la experiencia sea fluida desde el primer clic.
          </p>
        </div>

        {/* 2 Grandes tarjetas visuales de impacto en contenedor oscuro */}
        <div
          className="mt-12 overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/40 p-3 sm:p-4 lg:p-5"
          data-aos="fade-up"
          data-aos-delay="100"
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Tarjeta 1 */}
            <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-950 shadow-xl">
              {card1ImageUrl ? (
                <Image
                  src={card1ImageUrl}
                  alt={card1Title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/15">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(245,158,11,0.12),transparent_70%)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                  {card1Title}
                </h3>
                <p className="mt-1 text-xs text-zinc-300 sm:text-sm">
                  {card1Subtitle}
                </p>
              </div>
            </div>

            {/* Tarjeta 2 */}
            <div className="group relative aspect-[16/10] overflow-hidden rounded-2xl border border-zinc-800/60 bg-zinc-950 shadow-xl">
              {card2ImageUrl ? (
                <Image
                  src={card2ImageUrl}
                  alt={card2Title}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105 opacity-85"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-primary/10">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(59,130,246,0.12),transparent_70%)]" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5 sm:bottom-6 sm:left-6 sm:right-6">
                <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                  {card2Title}
                </h3>
                <p className="mt-1 text-xs text-zinc-300 sm:text-sm">
                  {card2Subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Tarjetas individuales de estadísticas dinámicas */}
        <div
          className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center justify-center rounded-2xl border border-zinc-800/80 bg-zinc-900/50 px-4 py-6 text-center shadow-sm sm:py-7"
            >
              <p
                className={`font-display text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl ${
                  stat.isOrange ? "text-primary" : "text-white"
                }`}
              >
                {stat.value}
              </p>
              <p className="mt-2 text-xs font-medium text-zinc-400 sm:text-xs">
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Botones de acción CTA redondeados pill */}
        <div
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <Link
            href="/dashboard"
            className="inline-flex w-full items-center justify-center rounded-full bg-primary px-8 py-3.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/30 transition-all duration-200 active:scale-98 hover:bg-primary/95 hover:shadow-xl hover:shadow-primary/45 hover:brightness-105 sm:w-auto"
          >
            Empieza a organizar tu evento hoy
          </Link>

          <Link
            href="/contact"
            className="inline-flex w-full items-center justify-center rounded-full border border-zinc-700/80 bg-[#27272A] px-8 py-3.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#323238] sm:w-auto"
          >
            Hablar con un asesor
          </Link>
        </div>

        {/* Pie de seguridad */}
        <p className="mt-5 text-center text-xs text-zinc-500">
          Plataforma gratuita para eventos sin costo de entrada.
        </p>
      </div>
    </section>
  );
}
