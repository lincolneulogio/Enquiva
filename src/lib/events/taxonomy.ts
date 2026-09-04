/**
 * Taxonomía de eventos de Enquiva.
 * Define las 18 categorías principales, subtipos por categoría, modalidades y opciones de filtro.
 * Tipado estricto sin any.
 */

export interface EventTypeOption {
  slug: string;
  label: string;
  description?: string;
}

export interface EventCategoryDefinition {
  id: string;
  slug: string;
  iconName: string;
  labelEs: string;
  labelEn: string;
  shortLabelEs: string;
  shortLabelEn: string;
  description: string;
  examples: string[];
  colorClass: string;
  featured: boolean;
  sortOrder: number;
  types: EventTypeOption[];
}

export type EventModality = "all" | "in_person" | "online" | "hybrid";

export type EventDateFilter =
  | "all"
  | "today"
  | "tomorrow"
  | "this_week"
  | "this_month"
  | "upcoming"
  | "past";

export type EventPriceFilter = "all" | "free" | "paid";

export type EventAccessFilter = "all" | "free" | "paid" | "registration" | "invitation";

export type EventStatusFilter = "all" | "upcoming" | "ongoing" | "completed";

export const EVENT_CATEGORIES: readonly EventCategoryDefinition[] = [
  {
    id: "conferences",
    slug: "conferences",
    iconName: "Mic",
    labelEs: "Conferencias y congresos",
    labelEn: "Conferences & Congresses",
    shortLabelEs: "Conferencias",
    shortLabelEn: "Conferences",
    description: "Congresos, conferencias, convenciones, cumbres y foros profesionales.",
    examples: ["Congreso", "Conferencia", "Convención", "Cumbre", "Foro"],
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    featured: true,
    sortOrder: 1,
    types: [
      { slug: "congreso", label: "Congreso" },
      { slug: "conferencia", label: "Conferencia" },
      { slug: "convencion", label: "Convención" },
      { slug: "cumbre", label: "Cumbre" },
      { slug: "foro", label: "Foro" },
      { slug: "simposio", label: "Simposio" },
      { slug: "panel", label: "Panel" },
    ],
  },
  {
    id: "education",
    slug: "education",
    iconName: "GraduationCap",
    labelEs: "Educación y formación",
    labelEn: "Education & Training",
    shortLabelEs: "Educación",
    shortLabelEn: "Education",
    description: "Cursos, talleres, seminarios, capacitaciones y masterclasses.",
    examples: ["Curso", "Taller", "Seminario", "Capacitación", "Masterclass"],
    colorClass: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60",
    featured: true,
    sortOrder: 2,
    types: [
      { slug: "curso", label: "Curso" },
      { slug: "taller", label: "Taller" },
      { slug: "seminario", label: "Seminario" },
      { slug: "webinar", label: "Webinar" },
      { slug: "masterclass", label: "Masterclass" },
      { slug: "capacitacion", label: "Capacitación" },
      { slug: "clase", label: "Clase" },
      { slug: "diplomado", label: "Diplomado" },
    ],
  },
  {
    id: "business",
    slug: "business",
    iconName: "Briefcase",
    labelEs: "Negocios y emprendimiento",
    labelEn: "Business & Entrepreneurship",
    shortLabelEs: "Negocios",
    shortLabelEn: "Business",
    description: "Networking, ferias empresariales, rondas de pitch y reuniones de negocios.",
    examples: ["Networking", "Feria empresarial", "Pitch", "Reunión empresarial"],
    colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    featured: true,
    sortOrder: 3,
    types: [
      { slug: "networking", label: "Networking" },
      { slug: "feria_empresarial", label: "Feria empresarial" },
      { slug: "pitch", label: "Pitch" },
      { slug: "conferencia", label: "Conferencia de negocios" },
      { slug: "foro", label: "Foro empresarial" },
      { slug: "convencion", label: "Convención" },
      { slug: "reunion", label: "Reunión empresarial" },
      { slug: "lanzamiento", label: "Lanzamiento de producto" },
    ],
  },
  {
    id: "music",
    slug: "music",
    iconName: "Music",
    labelEs: "Música y entretenimiento",
    labelEn: "Music & Entertainment",
    shortLabelEs: "Música",
    shortLabelEn: "Music",
    description: "Conciertos, festivales, shows musicales y espectáculos en vivo.",
    examples: ["Concierto", "Festival", "Show", "Espectáculo"],
    colorClass: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-300 border-pink-200 dark:border-pink-900/60",
    featured: true,
    sortOrder: 4,
    types: [
      { slug: "concierto", label: "Concierto" },
      { slug: "festival", label: "Festival" },
      { slug: "show", label: "Show" },
      { slug: "presentacion", label: "Presentación musical" },
      { slug: "recital", label: "Recital" },
      { slug: "gira", label: "Gira" },
    ],
  },
  {
    id: "sports",
    slug: "sports",
    iconName: "Trophy",
    labelEs: "Deportes",
    labelEn: "Sports & Fitness",
    shortLabelEs: "Deportes",
    shortLabelEn: "Sports",
    description: "Campeonatos, torneos, carreras, partidos y exhibiciones deportivas.",
    examples: ["Campeonato", "Torneo", "Carrera", "Partido", "Exhibición"],
    colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    featured: true,
    sortOrder: 5,
    types: [
      { slug: "partido", label: "Partido" },
      { slug: "torneo", label: "Torneo" },
      { slug: "campeonato", label: "Campeonato" },
      { slug: "carrera", label: "Carrera" },
      { slug: "maraton", label: "Maratón" },
      { slug: "exhibicion", label: "Exhibición" },
      { slug: "clinica_deportiva", label: "Clínica deportiva" },
    ],
  },
  {
    id: "religion",
    slug: "religion",
    iconName: "Church",
    labelEs: "Religión y espiritualidad",
    labelEn: "Religion & Spirituality",
    shortLabelEs: "Religión",
    shortLabelEn: "Religion",
    description: "Cultos, retiros, congresos espirituales, vigilias y campañas.",
    examples: ["Culto", "Retiro", "Congreso", "Vigilia", "Campaña"],
    colorClass: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-900/60",
    featured: true,
    sortOrder: 6,
    types: [
      { slug: "culto", label: "Culto" },
      { slug: "congreso", label: "Congreso espiritual" },
      { slug: "conferencia", label: "Conferencia" },
      { slug: "retiro", label: "Retiro" },
      { slug: "vigilia", label: "Vigilia" },
      { slug: "campana", label: "Campaña" },
      { slug: "seminario", label: "Seminario bíblico" },
      { slug: "encuentro", label: "Encuentro de fe" },
      { slug: "convencion", label: "Convención" },
    ],
  },
  {
    id: "arts",
    slug: "arts",
    iconName: "Palette",
    labelEs: "Arte y cultura",
    labelEn: "Art & Culture",
    shortLabelEs: "Arte y cultura",
    shortLabelEn: "Art & Culture",
    description: "Exposiciones, teatro, danza, museos y presentaciones culturales.",
    examples: ["Exposición", "Museo", "Teatro", "Danza", "Presentación cultural"],
    colorClass: "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/60",
    featured: true,
    sortOrder: 7,
    types: [
      { slug: "exposicion", label: "Exposición" },
      { slug: "teatro", label: "Teatro" },
      { slug: "danza", label: "Danza" },
      { slug: "presentacion_cultural", label: "Presentación cultural" },
      { slug: "museo", label: "Visita a museo" },
      { slug: "recital_poetico", label: "Recital poético" },
      { slug: "cine_foro", label: "Cine foro" },
    ],
  },
  {
    id: "community",
    slug: "community",
    iconName: "Users",
    labelEs: "Comunidad y sociales",
    labelEn: "Community & Social",
    shortLabelEs: "Comunidad",
    shortLabelEn: "Community",
    description: "Reuniones comunitarias, encuentros, celebraciones y convivencia barrial.",
    examples: ["Reunión", "Encuentro", "Celebración", "Convivencia"],
    colorClass: "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/60",
    featured: false,
    sortOrder: 8,
    types: [
      { slug: "reunion", label: "Reunión comunitaria" },
      { slug: "encuentro", label: "Encuentro social" },
      { slug: "celebracion", label: "Celebración comunitaria" },
      { slug: "convivencia", label: "Convivencia" },
      { slug: "asamblea_vecinal", label: "Asamblea vecinal" },
      { slug: "actividad_barrial", label: "Actividad barrial" },
    ],
  },
  {
    id: "government",
    slug: "government",
    iconName: "Landmark",
    labelEs: "Gobierno y organizaciones",
    labelEn: "Government & NGOs",
    shortLabelEs: "Gobierno",
    shortLabelEn: "Government",
    description: "Asambleas cívicas, audiencias, ceremonias y actos institucionales.",
    examples: ["Asamblea", "Audiencia", "Ceremonia", "Acto institucional"],
    colorClass: "bg-slate-100 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200 border-slate-200 dark:border-slate-700",
    featured: false,
    sortOrder: 9,
    types: [
      { slug: "asamblea", label: "Asamblea" },
      { slug: "audiencia", label: "Audiencia pública" },
      { slug: "ceremonia", label: "Ceremonia oficial" },
      { slug: "acto_institucional", label: "Acto institucional" },
      { slug: "mesa_de_dialogo", label: "Mesa de diálogo" },
    ],
  },
  {
    id: "charity",
    slug: "charity",
    iconName: "HeartHandshake",
    labelEs: "Beneficencia y causas",
    labelEn: "Charity & Causes",
    shortLabelEs: "Beneficencia",
    shortLabelEn: "Charity",
    description: "Recaudaciones de fondos, voluntariados y campañas de apoyo solidario.",
    examples: ["Recaudación", "Voluntariado", "Campaña solidaria"],
    colorClass: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/60",
    featured: false,
    sortOrder: 10,
    types: [
      { slug: "recaudacion", label: "Recaudación de fondos" },
      { slug: "voluntariado", label: "Voluntariado" },
      { slug: "campana_solidaria", label: "Campaña solidaria" },
      { slug: "subasta_benefica", label: "Subasta benéfica" },
      { slug: "colecta", label: "Colecta" },
    ],
  },
  {
    id: "tradeshows",
    slug: "tradeshows",
    iconName: "Store",
    labelEs: "Ferias y exposiciones",
    labelEn: "Fairs & Expos",
    shortLabelEs: "Ferias",
    shortLabelEn: "Expos",
    description: "Ferias comerciales, artesanales, exposiciones temáticas y mercados locales.",
    examples: ["Feria comercial", "Feria artesanal", "Expo", "Mercado"],
    colorClass: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/60",
    featured: false,
    sortOrder: 11,
    types: [
      { slug: "feria_comercial", label: "Feria comercial" },
      { slug: "feria_artesanal", label: "Feria artesanal" },
      { slug: "expo", label: "Expo" },
      { slug: "mercado", label: "Mercado / Bazar" },
      { slug: "feria_gastronomica", label: "Feria gastronómica" },
    ],
  },
  {
    id: "technology",
    slug: "technology",
    iconName: "Cpu",
    labelEs: "Tecnología e innovación",
    labelEn: "Technology & Innovation",
    shortLabelEs: "Tecnología",
    shortLabelEn: "Technology",
    description: "Hackathons, meetups tech, demo days, lanzamientos y summits tecnológicos.",
    examples: ["Hackathon", "Meetup", "Demo day", "Lanzamiento"],
    colorClass: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/60",
    featured: true,
    sortOrder: 12,
    types: [
      { slug: "hackathon", label: "Hackathon" },
      { slug: "meetup", label: "Meetup" },
      { slug: "demo_day", label: "Demo day" },
      { slug: "lanzamiento", label: "Lanzamiento tech" },
      { slug: "conferencia_tech", label: "Conferencia tech" },
      { slug: "taller_tech", label: "Taller técnico" },
    ],
  },
  {
    id: "celebrations",
    slug: "celebrations",
    iconName: "PartyPopper",
    labelEs: "Celebraciones",
    labelEn: "Celebrations & Parties",
    shortLabelEs: "Celebraciones",
    shortLabelEn: "Celebrations",
    description: "Aniversarios, graduaciones, bodas, galas y fechas conmemorativas.",
    examples: ["Cumpleaños", "Aniversario", "Graduación", "Boda"],
    colorClass: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/60",
    featured: false,
    sortOrder: 13,
    types: [
      { slug: "cumpleanos", label: "Cumpleaños" },
      { slug: "aniversario", label: "Aniversario" },
      { slug: "graduacion", label: "Graduación" },
      { slug: "boda", label: "Boda" },
      { slug: "gala", label: "Gala" },
      { slug: "fiesta_tematica", label: "Fiesta temática" },
    ],
  },
  {
    id: "travel",
    slug: "travel",
    iconName: "Compass",
    labelEs: "Turismo y experiencias",
    labelEn: "Travel & Outdoor",
    shortLabelEs: "Turismo",
    shortLabelEn: "Travel",
    description: "Excursiones guiadas, tours, paseos ecológicos, rutas y viajes grupales.",
    examples: ["Excursión", "Tour", "Experiencia", "Viaje"],
    colorClass: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-900/60",
    featured: false,
    sortOrder: 14,
    types: [
      { slug: "excursion", label: "Excursión" },
      { slug: "tour", label: "Tour" },
      { slug: "experiencia", label: "Experiencia al aire libre" },
      { slug: "viaje", label: "Viaje" },
      { slug: "ruta_senderismo", label: "Ruta de senderismo" },
      { slug: "ecoturismo", label: "Ecoturismo" },
    ],
  },
  {
    id: "health",
    slug: "health",
    iconName: "HeartPulse",
    labelEs: "Salud y bienestar",
    labelEn: "Health & Wellness",
    shortLabelEs: "Salud",
    shortLabelEn: "Health",
    description: "Jornadas de salud, sesiones de fitness, yoga, meditación y bienestar integral.",
    examples: ["Jornada de salud", "Fitness", "Yoga", "Bienestar"],
    colorClass: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60",
    featured: false,
    sortOrder: 15,
    types: [
      { slug: "jornada_de_salud", label: "Jornada de salud" },
      { slug: "fitness", label: "Fitness" },
      { slug: "yoga", label: "Yoga" },
      { slug: "meditacion", label: "Meditación" },
      { slug: "bienestar", label: "Taller de bienestar" },
      { slug: "nutricion", label: "Charla nutricional" },
    ],
  },
  {
    id: "corporate",
    slug: "corporate",
    iconName: "Building2",
    labelEs: "Corporativos",
    labelEn: "Corporate & Enterprise",
    shortLabelEs: "Corporativos",
    shortLabelEn: "Corporate",
    description: "Convenciones empresariales, team buildings, kick-offs y capacitaciones internas.",
    examples: ["Convención empresarial", "Capacitación interna", "Reunión"],
    colorClass: "bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/60",
    featured: false,
    sortOrder: 16,
    types: [
      { slug: "convencion_empresarial", label: "Convención empresarial" },
      { slug: "capacitacion_interna", label: "Capacitación interna" },
      { slug: "reunion_ejecutiva", label: "Reunión ejecutiva" },
      { slug: "team_building", label: "Team building" },
      { slug: "kick_off", label: "Kick-off" },
    ],
  },
  {
    id: "family",
    slug: "family",
    iconName: "Smile",
    labelEs: "Infantiles y familiares",
    labelEn: "Kids & Family",
    shortLabelEs: "Familias",
    shortLabelEn: "Family",
    description: "Actividades infantiles, juegos didácticos, shows y encuentros familiares.",
    examples: ["Actividades infantiles", "Juegos", "Eventos familiares"],
    colorClass: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-900/60",
    featured: false,
    sortOrder: 17,
    types: [
      { slug: "actividades_infantiles", label: "Actividades infantiles" },
      { slug: "show_infantil", label: "Show infantil" },
      { slug: "juegos", label: "Juegos y dinámicas" },
      { slug: "evento_familiar", label: "Evento familiar" },
      { slug: "taller_infantil", label: "Taller para niños" },
    ],
  },
  {
    id: "other",
    slug: "other",
    iconName: "Sparkles",
    labelEs: "Otros",
    labelEn: "Other",
    shortLabelEs: "Otros",
    shortLabelEn: "Other",
    description: "Para eventos que no encajen en las categorías anteriores.",
    examples: ["Eventos especiales y diversos"],
    colorClass: "bg-gray-100 text-gray-800 dark:bg-gray-800/60 dark:text-gray-300 border-gray-200 dark:border-gray-700",
    featured: false,
    sortOrder: 18,
    types: [
      { slug: "general", label: "General" },
      { slug: "especial", label: "Especial" },
      { slug: "otro", label: "Otro" },
    ],
  },
] as const;

/** Mapa de categorías por slug canonical */
export const CATEGORIES_BY_SLUG: Readonly<Record<string, EventCategoryDefinition>> =
  Object.freeze(
    EVENT_CATEGORIES.reduce<Record<string, EventCategoryDefinition>>((acc, cat) => {
      acc[cat.slug] = cat;
      return acc;
    }, {})
  );

/**
 * Mapeo de categorías legadas hacia las nuevas categorías canónicas
 * para compatibilidad total de eventos existentes en base de datos.
 */
export const LEGACY_CATEGORY_MAP: Readonly<Record<string, string>> = Object.freeze({
  worship: "religion",
  retreat: "religion",
  youth: "family",
  prayer: "religion",
  bible_study: "education",
  outreach: "community",
  fellowship: "community",
  conference: "conferences",
  charity: "charity",
  other: "other",
});

/**
 * Normaliza cualquier slug o código de categoría a su versión canónica.
 */
export function canonicalCategorySlug(slug: string | null | undefined): string {
  if (!slug) return "other";
  const clean = slug.toLowerCase().trim().replace(/[\s-]+/g, "_");
  if (CATEGORIES_BY_SLUG[clean]) return clean;
  if (LEGACY_CATEGORY_MAP[clean]) return LEGACY_CATEGORY_MAP[clean]!;
  return clean;
}

/**
 * Obtiene la definición completa de una categoría por slug.
 */
export function getCategoryDefinition(slug: string | null | undefined): EventCategoryDefinition | undefined {
  if (!slug) return undefined;
  const canonical = canonicalCategorySlug(slug);
  return CATEGORIES_BY_SLUG[canonical];
}

/**
 * Obtiene la lista de tipos / subtipos disponibles para una categoría.
 */
export function getTypesForCategory(categorySlug: string | null | undefined): EventTypeOption[] {
  if (!categorySlug) {
    return [
      { slug: "conferencia", label: "Conferencia" },
      { slug: "taller", label: "Taller" },
      { slug: "curso", label: "Curso" },
      { slug: "concierto", label: "Concierto" },
      { slug: "networking", label: "Networking" },
      { slug: "torneo", label: "Torneo" },
      { slug: "feria", label: "Feria" },
      { slug: "festival", label: "Festival" },
      { slug: "webinar", label: "Webinar" },
      { slug: "masterclass", label: "Masterclass" },
      { slug: "hackathon", label: "Hackathon" },
      { slug: "reunion", label: "Reunión" },
    ];
  }
  const def = getCategoryDefinition(categorySlug);
  return def ? [...def.types] : [];
}

/**
 * Lista de categorías destacadas (primeras para mostrar en pills rápidas).
 */
export const FEATURED_CATEGORY_SLUGS: readonly string[] = [
  "conferences",
  "education",
  "business",
  "music",
  "sports",
  "religion",
  "arts",
  "technology",
] as const;

/**
 * Opciones de modalidad tipadas.
 */
export const MODALITY_OPTIONS = [
  { value: "all", labelEs: "Todas", labelEn: "All" },
  { value: "in_person", labelEs: "Presencial", labelEn: "In person" },
  { value: "online", labelEs: "Online", labelEn: "Online" },
  { value: "hybrid", labelEs: "Híbrido", labelEn: "Hybrid" },
] as const;

/**
 * Opciones de filtro de fecha tipadas.
 */
export const DATE_FILTER_OPTIONS = [
  { value: "all", labelEs: "Cualquier fecha", labelEn: "Any date" },
  { value: "today", labelEs: "Hoy", labelEn: "Today" },
  { value: "tomorrow", labelEs: "Mañana", labelEn: "Tomorrow" },
  { value: "this_week", labelEs: "Esta semana", labelEn: "This week" },
  { value: "this_month", labelEs: "Este mes", labelEn: "This month" },
  { value: "upcoming", labelEs: "Próximamente", labelEn: "Upcoming" },
  { value: "past", labelEs: "Finalizados", labelEn: "Past events" },
] as const;

/**
 * Opciones de filtro de precio tipadas.
 */
export const PRICE_FILTER_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "free", labelEs: "Gratis", labelEn: "Free" },
  { value: "paid", labelEs: "De pago", labelEn: "Paid" },
] as const;

/**
 * Opciones de tipo de acceso tipadas.
 */
export const ACCESS_TYPE_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "free", labelEs: "Entrada gratuita", labelEn: "Free entry" },
  { value: "paid", labelEs: "Entrada de pago", labelEn: "Paid ticket" },
  { value: "registration", labelEs: "Registro", labelEn: "Registration" },
  { value: "invitation", labelEs: "Invitación", labelEn: "Invitation" },
] as const;

/**
 * Opciones de estado tipadas.
 */
export const STATUS_FILTER_OPTIONS = [
  { value: "all", labelEs: "Todos", labelEn: "All" },
  { value: "upcoming", labelEs: "Próximos", labelEn: "Upcoming" },
  { value: "ongoing", labelEs: "En curso", labelEn: "Ongoing" },
  { value: "completed", labelEs: "Finalizados", labelEn: "Completed" },
] as const;
