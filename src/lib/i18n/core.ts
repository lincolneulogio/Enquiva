export * from "./types";
import type { Locale, TranslationDictionary, TranslationParams, TranslationValue } from "./types";
import { defaultLocale } from "./types";
import { es } from "./locales/es";
import { en } from "./locales/en";

const translations: Record<Locale, TranslationDictionary> = {
    es,
    en,
};

export function resolveLocale(value?: string | null): Locale {
    return value === "en" ? "en" : defaultLocale;
}

function getNestedValue(dictionary: TranslationDictionary, key: string): string | undefined {
    const value = key.split(".").reduce<TranslationValue | undefined>((acc, segment) => {
        if (typeof acc !== "object" || acc === null) return undefined;
        return acc[segment];
    }, dictionary);

    return typeof value === "string" ? value : undefined;
}

export function translate(locale: Locale, key: string, params?: TranslationParams): string {
    const template =
        getNestedValue(translations[locale], key) ??
        getNestedValue(translations[defaultLocale], key) ??
        key;

    if (!params) return template;

    return Object.entries(params).reduce((result, [paramKey, paramValue]) => {
        return result.replaceAll(`{${paramKey}}`, String(paramValue));
    }, template);
}

export function getIntlLocale(locale: Locale): string {
    return locale === "en" ? "en-US" : "es-PE";
}

export function getRoleLabel(role: string | null | undefined, locale: Locale): string {
    return translate(locale, `roles.${role ?? "member"}`);
}

export function getRoleDescription(role: string | null | undefined, locale: Locale): string {
    const key = `roleDescriptions.${role ?? "member"}`;
    const value = translate(locale, key);
    return value === key ? "" : value;
}

export function getPermissionLabel(permission: string, locale: Locale): string {
    return translate(locale, `permissions.${permission}`);
}

export function getPermissionDescription(permission: string, locale: Locale): string {
    const key = `permissionDescriptions.${permission}`;
    const value = translate(locale, key);
    return value === key ? "" : value;
}

export function getPermissionGroupLabel(groupId: string, locale: Locale): string {
    return translate(locale, `permissionGroups.${groupId}`);
}

export function getCategoryLabel(category: string, locale: Locale): string {
    if (!category) return "";
    let clean = category.toLowerCase().trim().replace(/[_-]+/g, " ");
    
    // Mapeo de términos alternativos en español/inglés a la clave canónica
    const keyMap: Record<string, string> = {
        conferences: "conferences",
        conferencias: "conferences",
        "conferencias y congresos": "conferences",
        congreso: "conferences",
        congresos: "conferences",
        
        education: "education",
        educacion: "education",
        educación: "education",
        "educacion y formacion": "education",
        "educación y formación": "education",
        talleres: "education",
        
        business: "business",
        negocios: "business",
        "negocios y emprendimiento": "business",
        emprendimiento: "business",
        
        music: "music",
        musica: "music",
        música: "music",
        "musica y entretenimiento": "music",
        "música y entretenimiento": "music",
        concierto: "music",
        conciertos: "music",
        
        sports: "sports",
        deportes: "sports",
        deporte: "sports",
        
        religion: "religion",
        religión: "religion",
        "religion y espiritualidad": "religion",
        "religión y espiritualidad": "religion",
        espiritualidad: "religion",
        
        arts: "arts",
        arte: "arts",
        cultura: "arts",
        "arte y cultura": "arts",
        
        community: "community",
        comunidad: "community",
        "comunidad y sociales": "community",
        sociales: "community",
        social: "community",
        
        government: "government",
        gobierno: "government",
        "gobierno y organizaciones": "government",
        organizaciones: "government",
        
        charity: "charity",
        beneficencia: "charity",
        "beneficencia y causas": "charity",
        caridad: "charity",
        
        tradeshows: "tradeshows",
        ferias: "tradeshows",
        "ferias y exposiciones": "tradeshows",
        exposiciones: "tradeshows",
        
        technology: "technology",
        tecnologia: "technology",
        tecnología: "technology",
        "tecnologia e innovacion": "technology",
        "tecnología e innovación": "technology",
        innovacion: "technology",
        innovación: "technology",
        
        celebrations: "celebrations",
        celebraciones: "celebrations",
        fiestas: "celebrations",
        
        travel: "travel",
        turismo: "travel",
        "turismo y experiencias": "travel",
        experiencias: "travel",
        
        health: "health",
        salud: "health",
        "salud y bienestar": "health",
        bienestar: "health",
        
        corporate: "corporate",
        corporativos: "corporate",
        corporativo: "corporate",
        
        family: "family",
        infantiles: "family",
        "infantiles y familiares": "family",
        familia: "family",
        familiar: "family",
        
        other: "other",
        otros: "other",
        otro: "other",
        
        // Slugs legados
        worship: "worship",
        adoración: "worship",
        adoracion: "worship",
        retreat: "retreat",
        retiro: "retreat",
        youth: "youth",
        juventud: "youth",
        conference: "conference",
        conferencia: "conference",
        prayer: "prayer",
        oración: "prayer",
        oracion: "prayer",
        bible_study: "bible_study",
        "bible study": "bible_study",
        estudio_bíblico: "bible_study",
        estudio_biblico: "bible_study",
        outreach: "outreach",
        misiones: "outreach",
        alcance_comunitario: "outreach",
        fellowship: "fellowship",
        comunión: "fellowship",
        comunion: "fellowship",
    };

    const canonicalKey = keyMap[clean] || clean.replace(/\s+/g, "_").replace(/[_-]+/g, "_");
    
    const translated = translate(locale, `categories.${canonicalKey}`);
    if (translated !== `categories.${canonicalKey}`) {
        return translated;
    }

    return category
        .replace(/^categories\./, "")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function getEventStatusLabel(status: string, locale: Locale): string {
    return translate(locale, `eventStatus.${status}`);
}

export function getRegistrationStatusLabel(status: string, locale: Locale): string {
    return translate(locale, `registrationStatus.${status}`);
}

export function getPaymentStatusLabel(status: string, locale: Locale): string {
    return translate(locale, `paymentStatus.${status}`);
}

export function getPluralLabel(locale: Locale, singular: string, plural: string, count: number): string {
    return count === 1 ? singular : plural;
}

export function translateNotification(
    type: string,
    title: string,
    message: string,
    locale: string
): { title: string; message: string } {
    if (locale !== "es") {
        // En inglés mantenemos los textos tal como se guardaron originalmente
        return { title, message };
    }

    let translatedTitle = title;
    let translatedMessage = message;

    switch (type) {
        case "registration_confirmed":
            if (title === "Registration Confirmed!") {
                translatedTitle = "¡Inscripción confirmada!";
            }
            translatedMessage = message.replace("You're registered for", "Te has inscrito en");
            break;

        case "waitlist_promoted":
            if (title === "Great news! You're in!") {
                translatedTitle = "¡Buenas noticias! ¡Ya estás dentro!";
            }
            if (message === "A spot opened up and you've been registered from the waitlist.") {
                translatedMessage = "Se liberó un cupo y te has inscrito desde la lista de espera.";
            }
            break;

        case "event_published":
            if (title === "New Event Published") {
                translatedTitle = "Nuevo evento publicado";
            }
            translatedMessage = message.replace("Check out", "Descubre").replace("!", "!");
            break;

        case "event_cancelled":
            if (title === "Event Cancelled") {
                translatedTitle = "Evento cancelado";
            }
            translatedMessage = message.replace("has been cancelled.", "ha sido cancelado.");
            break;

        case "event_updated":
            if (title === "Event Details Updated" || title === "Nuevo registro en evento") {
                translatedTitle = title === "Event Details Updated" ? "Detalles del evento actualizados" : "Nuevo registro en evento";
            }
            translatedMessage = message
                .replace("Check for changes in", "Revisa los cambios en")
                .replace("se registró en", "se registró en");
            break;

        case "event_reminder":
            if (title === "Event Reminder") {
                translatedTitle = "Recordatorio de evento";
            }
            translatedMessage = message.replace("is coming up soon!", "comenzará pronto!");
            break;

        case "payment_submitted":
            if (title === "Payment Submitted") {
                translatedTitle = "Pago registrado";
            }
            translatedMessage = message
                .replace("Your payment of", "Tu pago de")
                .replace("is pending review.", "está pendiente de revisión.");
            break;

        case "payment_status_updated":
            if (title === "Payment Status Updated") {
                translatedTitle = "Estado de pago actualizado";
            }
            translatedMessage = message
                .replace("Your payment of", "Tu pago de")
                .replace("has been approved.", "ha sido aprobado.")
                .replace("has been rejected.", "ha sido rechazado.")
                .replace("has been approved", "ha sido aprobado")
                .replace("has been rejected", "ha sido rechazado");
            break;

        case "organizer_request":
            if (title === "New organizer request") {
                translatedTitle = "Nueva solicitud de organizador";
            }
            break;

        case "organizer_approved":
            if (title === "Organizer request approved") {
                translatedTitle = "Solicitud de organizador aprobada";
            }
            break;

        case "organizer_rejected":
            if (title === "Organizer request declined") {
                translatedTitle = "Solicitud de organizador rechazada";
            }
            break;

        case "subscription_alert":
            if (title === "Your plan expires soon") {
                translatedTitle = "Tu plan vence pronto";
            } else if (title === "Past-due subscription" || title === "Suscripción en mora") {
                translatedTitle = "Suscripción en mora";
            }
            break;

        case "transport_alert":
            if (title === "Transport route almost full") {
                translatedTitle = "Ruta de transporte casi llena";
            }
            break;

        case "finance_digest":
            if (title.startsWith("Daily finance digest")) {
                translatedTitle = title.replace("Daily finance digest", "Resumen financiero");
            }
            break;
    }

    return { title: translatedTitle, message: translatedMessage };
}

