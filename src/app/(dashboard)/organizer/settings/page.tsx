import { getRequestSession } from "@/lib/request-context";
import { User, Mail, Shield, Crown, ShieldCheck, Briefcase, UserRound, Building2, QrCode } from "lucide-react";
import { getI18n } from "@/lib/i18n/server";
import { getRoleLabel } from "@/lib/i18n/core";
import { ROLE_BADGE_STYLES, normalizeRole } from "@/lib/auth/rbac";
import { OrganizationService } from "@/lib/organizations/organization.service";
import { JoinEntityForm } from "@/components/dashboard/organizer/JoinEntityForm";
import { PersonalAppearancePreferences } from "@/components/dashboard/appearance/PersonalAppearancePreferences";
import { OrganizerWhatsAppContactCard } from "@/components/dashboard/organizer/OrganizerWhatsAppContactCard";
import { OrganizerCertificateSignatureCard } from "@/components/dashboard/organizer/OrganizerCertificateSignatureCard";
import { getSystemSettings } from "@/lib/settings";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const roleIcons = {
    super_admin: Crown,
    admin: ShieldCheck,
    organizer: Briefcase,
    member: UserRound,
    scanner: QrCode,
};

export default async function OrganizerSettingsPage() {
    const { locale, t } = await getI18n();
    const session = await getRequestSession();
    const user = session!.user;

    const normalizedRole = normalizeRole(user.role);
    const RoleIcon = roleIcons[normalizedRole];
    const organization = await OrganizationService.getOrganizationForUser(user.id);
    const platformSettings = await getSystemSettings();

    const [userRecord] = await db
        .select({
            phone: users.phone,
            signatureUrl: users.signatureUrl,
            signatureTitle: users.signatureTitle,
        })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1)
        .catch(() => []);
    const initialWhatsapp = organization?.whatsappNumber ?? userRecord?.phone ?? null;

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-display text-3xl font-semibold text-foreground">{t("common.settings")}</h1>
                <p className="mt-1 text-muted-foreground">{t("dashboard.settings.manageAccountDetails")}</p>
            </div>

            <div className="max-w-2xl space-y-6">
                <div className="flex flex-col items-start gap-5 rounded-xl border border-border bg-card p-6 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-primary/10 text-2xl font-semibold text-primary">
                        {user.name?.[0]?.toUpperCase() ?? "O"}
                    </div>
                    <div>
                        <p className="text-xl font-semibold text-foreground">{user.name}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                        <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${ROLE_BADGE_STYLES[normalizedRole]}`}>
                            <RoleIcon className="h-3.5 w-3.5" />
                            {getRoleLabel(normalizedRole, locale)}
                        </span>
                    </div>
                </div>

                <PersonalAppearancePreferences
                    platformDefaultAccent={platformSettings.defaultAccentColor}
                />

                <OrganizerWhatsAppContactCard
                    initialWhatsapp={initialWhatsapp}
                    organizerName={user.name ?? "Organizador"}
                    locale={locale}
                />

                <OrganizerCertificateSignatureCard
                    initialSignatureUrl={userRecord?.signatureUrl}
                    initialSignatureTitle={userRecord?.signatureTitle}
                    organizerName={user.name ?? "Organizador"}
                    organizationName={organization?.name ?? null}
                    locale={locale}
                />

                {organization ? (
                    <div className="rounded-xl border border-border bg-card p-6">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                <Building2 className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">{t("dashboard.organizer.linkedEntity")}</p>
                                <p className="font-semibold text-foreground">{organization.name}</p>
                            </div>
                        </div>
                    </div>
                ) : normalizedRole === "organizer" ? (
                    <JoinEntityForm />
                ) : null}

                <div className="rounded-xl border border-border bg-card divide-y divide-border">
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.fullName")}</p>
                            <p className="font-medium text-foreground">{user.name ?? "—"}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Mail className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.email")}</p>
                            <p className="font-medium text-foreground">{user.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 p-4">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <Shield className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">{t("common.role")}</p>
                            <p className="font-medium text-foreground capitalize">{getRoleLabel(user.role ?? "organizer", locale)}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
