import Image from "next/image";
import { Star, Quote, Sparkles } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatarUrl: string;
  quote: string;
  rating: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "Mariana Figueroa",
    role: "Directora de Operaciones",
    company: "TechSummit Perú",
    avatarUrl:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    quote:
      "Gestionar nuestro congreso anual con más de 1,500 personas fue increíblemente fácil. Los tickets QR funcionaron sin un solo retraso en los accesos y los pagos se procesaron al instante.",
    rating: 5,
  },
  {
    id: "test-2",
    name: "Carlos Mendoza",
    role: "Fundador & Director",
    company: "Lima Music Fest",
    avatarUrl:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    quote:
      "La sincronización de transporte y la analítica en tiempo real nos permitieron ahorrar más de 40 horas operativas en la semana del festival. Es por mucho la mejor plataforma de eventos.",
    rating: 5,
  },
  {
    id: "test-3",
    name: "Valeria Ramos",
    role: "Gerente de Marketing",
    company: "Innova Hub Latam",
    avatarUrl:
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    quote:
      "Pasamos de vender tickets por formularios manuales a tener una experiencia premium y automatizada. La tasa de conversión aumentó un 35% en solo dos meses con Enquiva.",
    rating: 5,
  },
];

export function SuccessStoriesSection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:py-24">
      <div className="mx-auto max-w-7xl">
        {/* Encabezado */}
        <div className="mb-14 text-center" data-aos="fade-up">
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Testimonios Reales
          </div>

          <h2 className="font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            Tú puedes ser la próxima historia de éxito
          </h2>

          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Descubre cómo organizadores y participantes transformaron sus eventos con Enquiva.
          </p>
        </div>

        {/* 3 Tarjetas de testimonios con estrellas */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3 lg:gap-8">
          {TESTIMONIALS.map((item, idx) => (
            <div
              key={item.id}
              className="flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 sm:p-8"
              data-aos="fade-up"
              data-aos-delay={String(80 + idx * 60)}
            >
              <div>
                {/* 5 estrellas */}
                <div className="mb-4 flex items-center gap-1 text-amber-500">
                  {Array.from({ length: item.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>

                {/* Cita */}
                <p className="mb-6 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  &ldquo;{item.quote}&rdquo;
                </p>
              </div>

              {/* Autor */}
              <div className="flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ring-primary/20">
                  <Image
                    src={item.avatarUrl}
                    alt={item.name}
                    fill
                    sizes="44px"
                    className="object-cover"
                  />
                </div>

                <div>
                  <h4 className="text-sm font-bold text-foreground">{item.name}</h4>
                  <p className="text-xs text-muted-foreground">
                    {item.role} • {item.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
