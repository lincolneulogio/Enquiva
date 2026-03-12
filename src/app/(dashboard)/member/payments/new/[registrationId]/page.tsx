import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";

interface MemberPaymentCheckoutPageProps {
    params: Promise<{ registrationId: string }>;
}

export default async function MemberPaymentCheckoutPage({ params }: MemberPaymentCheckoutPageProps) {
    const { registrationId } = await params;

    redirect("/member/transport");

    return (
        <div className="space-y-6">
            <div>
                <Link
                    href="/member/transport"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Ir a transporte
                </Link>
                <h1 className="mt-3 font-display text-3xl font-semibold text-foreground">Pago de transporte</h1>
                <p className="mt-1 text-muted-foreground">
                    El flujo de pagos del evento fue reemplazado por pago único de movilidad.
                </p>
            </div>
        </div>
    );
}
