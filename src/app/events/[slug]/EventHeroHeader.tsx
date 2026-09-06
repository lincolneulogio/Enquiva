interface EventHeroHeaderProps {
  categoryUpper: string;
  eventTitle: string;
  displayCoverImage: string;
  isVirtual: boolean;
}

export function EventHeroHeader({
  categoryUpper,
  eventTitle,
  displayCoverImage,
  isVirtual,
}: EventHeroHeaderProps) {
  return (
    <>
      {/* Píldora de Categoría & Titular Grande */}
      <div className="space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-white/90 px-3.5 py-1 text-xs font-bold tracking-wide text-foreground/80 uppercase shadow-2xs dark:bg-card/90">
          <span className="h-2 w-2 rounded-full bg-primary" />
          <span>{categoryUpper}</span>
        </div>

        <h1 className="font-display text-3xl font-black tracking-tight text-foreground sm:text-4xl lg:text-5xl leading-[1.15]">
          {eventTitle}
        </h1>
      </div>

      {/* Portada en alta resolución con Badges en esquina inferior izquierda */}
      <div className="relative aspect-[16/10] sm:aspect-[16/9] max-h-[460px] overflow-hidden rounded-2xl border border-border/70 bg-muted/40 shadow-sm sm:rounded-3xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={displayCoverImage}
          alt={eventTitle}
          className="h-full w-full object-cover object-center"
        />

        {/* Badges superpuestos idénticos a la captura */}
        <div className="absolute bottom-4 left-4 z-20 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#00C06D] px-3.5 py-1.5 text-xs font-bold text-white shadow-md">
            <span className="h-2 w-2 rounded-full bg-white" />
            INSCRIPCIONES ABIERTAS
          </span>
          <span className="inline-flex items-center rounded-full bg-white/95 px-3.5 py-1.5 text-xs font-bold text-zinc-900 shadow-md backdrop-blur-xs dark:bg-card/95 dark:text-zinc-100">
            {isVirtual
              ? "Edición Virtual Oficial"
              : "Edición Presencial Oficial"}
          </span>
        </div>
      </div>
    </>
  );
}
