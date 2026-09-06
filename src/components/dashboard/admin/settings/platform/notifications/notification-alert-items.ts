import {
  CreditCard,
  Ticket,
  Bus,
  UserPlus,
  CalendarDays,
  AlertTriangle,
  Wallet,
} from "lucide-react";

export interface AlertItem {
  key: string;
  checked: boolean;
  onChange: () => void;
  Icon: typeof CreditCard;
  tone: {
    row: string;
    icon: string;
    toggleOn: string;
    chip: string;
  };
  chipEs: string;
  chipEn: string;
  titleEs: string;
  titleEn: string;
  descEs: string;
  descEn: string;
}

interface BuildAlertListOptions {
  alertPayments: boolean;
  alertRegistrations: boolean;
  alertTransport: boolean;
  alertOrganizerRequests: boolean;
  alertEventPublished: boolean;
  alertSubscriptionPastDue: boolean;
  alertFinance: boolean;
  setSettingsValue: (key: string, value: any) => void;
}

export function buildAlertList(options: BuildAlertListOptions): AlertItem[] {
  const {
    alertPayments,
    alertRegistrations,
    alertTransport,
    alertOrganizerRequests,
    alertEventPublished,
    alertSubscriptionPastDue,
    alertFinance,
    setSettingsValue,
  } = options;

  return [
    {
      key: "payments",
      checked: alertPayments,
      onChange: () => setSettingsValue("alertPayments", !alertPayments),
      Icon: CreditCard,
      tone: {
        row: "border-emerald-500/25 bg-emerald-500/[0.06]",
        icon: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        toggleOn: "bg-emerald-600",
        chip: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
      },
      chipEs: "Pagos",
      chipEn: "Payments",
      titleEs: "Nuevos pagos de eventos",
      titleEn: "New event payments",
      descEs: "Aviso cuando se registre un pago de entrada o transporte (Culqi, efectivo u otros medios).",
      descEn: "Alert when a ticket or transport payment is registered (Culqi, cash, or other methods).",
    },
    {
      key: "registrations",
      checked: alertRegistrations,
      onChange: () => setSettingsValue("alertRegistrations", !alertRegistrations),
      Icon: Ticket,
      tone: {
        row: "border-violet-500/25 bg-violet-500/[0.06]",
        icon: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
        toggleOn: "bg-violet-600",
        chip: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
      },
      chipEs: "Registros",
      chipEn: "Registrations",
      titleEs: "Nuevos registros",
      titleEn: "New registrations",
      descEs: "Aviso cuando un asistente se inscriba en un evento.",
      descEn: "Alert when an attendee registers for an event.",
    },
    {
      key: "transport",
      checked: alertTransport,
      onChange: () => setSettingsValue("alertTransport", !alertTransport),
      Icon: Bus,
      tone: {
        row: "border-sky-500/25 bg-sky-500/[0.06]",
        icon: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
        toggleOn: "bg-sky-600",
        chip: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
      },
      chipEs: "Transporte",
      chipEn: "Transport",
      titleEs: "Aforo crítico de transporte (90%)",
      titleEn: "Transport route occupancy (90%)",
      descEs: "Alerta cuando una ruta alcance el 90% de capacidad.",
      descEn: "Alert when a route reaches 90% capacity.",
    },
    {
      key: "organizers",
      checked: alertOrganizerRequests,
      onChange: () => setSettingsValue("alertOrganizerRequests", !alertOrganizerRequests),
      Icon: UserPlus,
      tone: {
        row: "border-amber-500/25 bg-amber-500/[0.06]",
        icon: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        toggleOn: "bg-amber-600",
        chip: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
      },
      chipEs: "Organizadores",
      chipEn: "Organizers",
      titleEs: "Solicitudes de organizador",
      titleEn: "Organizer requests",
      descEs: "Aviso cuando un usuario solicite ser organizador de una entidad.",
      descEn: "Alert when a user requests to become an organizer for an entity.",
    },
    {
      key: "events",
      checked: alertEventPublished,
      onChange: () => setSettingsValue("alertEventPublished", !alertEventPublished),
      Icon: CalendarDays,
      tone: {
        row: "border-teal-500/25 bg-teal-500/[0.06]",
        icon: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
        toggleOn: "bg-teal-600",
        chip: "bg-teal-500/15 text-teal-700 dark:text-teal-300",
      },
      chipEs: "Eventos",
      chipEn: "Events",
      titleEs: "Eventos publicados",
      titleEn: "Published events",
      descEs: "Aviso cuando un organizador publique un evento en la plataforma.",
      descEn: "Alert when an organizer publishes an event on the platform.",
    },
    {
      key: "billing",
      checked: alertSubscriptionPastDue,
      onChange: () => setSettingsValue("alertSubscriptionPastDue", !alertSubscriptionPastDue),
      Icon: AlertTriangle,
      tone: {
        row: "border-rose-500/25 bg-rose-500/[0.06]",
        icon: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        toggleOn: "bg-rose-600",
        chip: "bg-rose-500/15 text-rose-700 dark:text-rose-300",
      },
      chipEs: "Facturación",
      chipEn: "Billing",
      titleEs: "Suscripciones vencidas (Past Due)",
      titleEn: "Past due subscriptions",
      descEs: "Alerta crítica cuando el cobro recurrente de un organizador falle.",
      descEn: "Critical alert when recurring payment for an organizer fails.",
    },
    {
      key: "finance",
      checked: alertFinance,
      onChange: () => setSettingsValue("alertFinance", !alertFinance),
      Icon: Wallet,
      tone: {
        row: "border-indigo-500/25 bg-indigo-500/[0.06]",
        icon: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
        toggleOn: "bg-indigo-600",
        chip: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
      },
      chipEs: "Finanzas",
      chipEn: "Finance",
      titleEs: "Comisiones y facturación de plataforma",
      titleEn: "Platform commissions & billing",
      descEs: "Aviso cuando se emita o liquide una factura de comisión al organizador.",
      descEn: "Alert when a commission invoice is issued or settled with an organizer.",
    },
  ];
}
