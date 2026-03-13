import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { getI18n } from "@/lib/i18n/server";

interface MemberPaymentCheckoutPageProps {
    params: Promise<{ registrationId: string }>;
}

export default async function MemberPaymentCheckoutPage({ params }: MemberPaymentCheckoutPageProps) {
    const { t } = await getI18n();
    await params;

    redirect("/member/transport");

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/member/transport"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    {t("dashboard.member.transportTitle")}
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">{t("dashboard.member.transportTitle")}</h1>
                <p className="mt-1 text-muted-foreground">
                    {t("dashboard.member.transportSubtitle")}
                </p>
            </div>
        </div>
    );
}
