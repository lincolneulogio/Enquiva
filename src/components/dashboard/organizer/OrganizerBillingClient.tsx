"use client";

import { useState, useTransition, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { requestPlanUpgrade, wipeWorkspaceAndStartFresh } from "@/actions/billing";
import type { Plan } from "@/lib/db/schema";
import { PlanUpgradeCheckout } from "@/components/dashboard/organizer/PlanUpgradeCheckout";
import { PlanChangeConfirmDialog } from "@/components/dashboard/organizer/PlanChangeConfirmDialog";
import { AutoRenewSettings } from "@/components/dashboard/organizer/AutoRenewSettings";
import { useLocale, useTranslations } from "@/components/providers/LocaleProvider";
import type { PlanChangePreview } from "@/lib/billing/types";
import {
  closeActiveCulqiCheckout,
  resetCulqiCheckoutUi,
  loadCulqiCheckoutScript,
} from "@/lib/culqi/open-checkout";
import { filterPublicBillingPlans } from "@/lib/billing/plans";
import Swal from "@/lib/ui/swal-client";
import { confirmWithPasswordAction } from "@/lib/ui/confirm";
import { passwordErrorMessage } from "@/lib/auth/password-error-message";
import {
  type OrganizerBillingClientProps,
  BillingAlertsBanner,
  CurrentPlanCard,
  PaymentHistoryTable,
  PlanSelectorGrid,
  WipeWorkspaceCard,
} from "./billing";

export function OrganizerBillingClient({
  subscription,
  availablePlans,
  platformMethods,
  culqiPublicKey,
  userEmail,
  culqiAvailable,
  pendingPayment,
  paymentHistory,
  readOnly = false,
  pageVariant = "organizer",
}: OrganizerBillingClientProps) {
  const t = useTranslations();
  const { locale } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const [isPending, startTransition] = useTransition();
  const [checkoutPlan, setCheckoutPlan] = useState<{
    plan: Plan;
    newPeriodEnd: string | null;
  } | null>(null);
  const [planChangeConfirm, setPlanChangeConfirm] = useState<{
    target: Plan;
    preview: PlanChangePreview;
  } | null>(null);
  const [openingCheckout, setOpeningCheckout] = useState(false);
  const { plan, billedPlan } = subscription;
  const displayPlanName = billedPlan?.name ?? plan.name;
  const plansReady = subscription.plansConfigured !== false;
  const selectablePlans = filterPublicBillingPlans(availablePlans);

  useEffect(() => {
    if (!culqiPublicKey || !culqiAvailable || !plansReady) return;
    void loadCulqiCheckoutScript().catch(() => {});
  }, [culqiPublicKey, culqiAvailable, plansReady]);

  useEffect(() => {
    if (prevPathname.current === pathname) return;
    prevPathname.current = pathname;
    closeActiveCulqiCheckout();
    resetCulqiCheckoutUi();
    setCheckoutPlan(null);
    setPlanChangeConfirm(null);
  }, [pathname]);

  const refreshBillingQuietly = () => {
    startTransition(() => {
      router.refresh();
    });
  };

  const openCheckoutForPlan = (target: Plan, newPeriodEnd: string | null) => {
    closeActiveCulqiCheckout();
    resetCulqiCheckoutUi();
    setPlanChangeConfirm(null);
    setCheckoutPlan({ plan: target, newPeriodEnd });
  };

  const proceedPlanChange = (target: Plan, confirmed: boolean) => {
    const planTarget = target;
    const isConfirmed = confirmed;
    setOpeningCheckout(true);
    startTransition(async () => {
      try {
        const res = await requestPlanUpgrade(planTarget.slug, isConfirmed);
        if (res.mode === "confirm" && res.preview) {
          setPlanChangeConfirm({ target: planTarget, preview: res.preview });
          return;
        }
        if (res.mode === "assigned") {
          setPlanChangeConfirm(null);
          toast.success(t("billing.organizer.planUpdated"));
          refreshBillingQuietly();
        } else if (res.mode === "checkout") {
          openCheckoutForPlan(planTarget, res.preview?.newPeriodEnd ?? null);
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("billing.organizer.planChangeFailed"));
      } finally {
        setOpeningCheckout(false);
      }
    });
  };

  const onSelectPlan = (target: Plan) => {
    if (target.slug === plan.slug && !billedPlan) return;
    if (pendingPayment) {
      toast.info(t("billing.organizer.pendingExists"));
      return;
    }
    resetCulqiCheckoutUi();
    proceedPlanChange(target, false);
  };

  const handleWipeFreshStart = async () => {
    const password = await confirmWithPasswordAction({
      title: t("billing.organizer.wipeTitle"),
      text: t("billing.organizer.wipeWarning"),
      confirmText: t("billing.organizer.wipeConfirm"),
      cancelText: t("common.cancel"),
      tone: "danger",
      passwordPlaceholder: t("billing.organizer.wipePasswordPlaceholder"),
      passwordRequiredMessage: t("billing.organizer.wipePasswordRequired"),
    });

    if (!password) return;

    startTransition(async () => {
      try {
        const wipeResult = await wipeWorkspaceAndStartFresh(password);
        toast.success(
          t("billing.organizer.wipeSuccess", { count: String(wipeResult.deletedEvents) }),
        );
        refreshBillingQuietly();
      } catch (error) {
        const message = error instanceof Error ? error.message : t("billing.organizer.wipeFailed");
        await Swal.fire({
          title: t("billing.organizer.wipeSecurityErrorTitle"),
          text: passwordErrorMessage(t, message, "wipe"),
          icon: "error",
          confirmButtonText: t("common.deleteEventUnderstood"),
          buttonsStyling: false,
          customClass: {
            popup: "fe-swal-popup fe-swal-popup--danger",
            title: "fe-swal-title",
            htmlContainer: "fe-swal-text",
            actions: "fe-swal-actions",
            confirmButton: "fe-swal-confirm fe-swal-confirm--danger",
          },
        });
      }
    });
  };

  const dateLocale = locale === "en" ? "en-US" : "es-PE";
  const renewalDate = new Date(subscription.currentPeriodEnd).toLocaleDateString(dateLocale);
  const pendingPlanDate = subscription.pendingPlanEffectiveAt
    ? new Date(subscription.pendingPlanEffectiveAt).toLocaleDateString(dateLocale)
    : null;
  const historyWithoutActivePending = paymentHistory.filter(
    (row) => !(row.payment.status === "pending" && pendingPayment?.payment.id === row.payment.id),
  );

  if (!plansReady) {
    return (
      <div className="rounded-2xl border border-sky-200/70 bg-sky-50/80 p-6 dark:border-sky-900/40 dark:bg-sky-950/25">
        <h2 className="text-lg font-semibold text-foreground">
          {t("billing.organizer.plansPendingTitle")}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {pageVariant === "entity"
            ? t("billing.organizer.plansPendingBodyAdmin")
            : t("billing.organizer.plansPendingBodyOrganizer")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BillingAlertsBanner
        subscription={subscription}
        pendingPayment={pendingPayment}
        readOnly={readOnly}
        pageVariant={pageVariant}
        displayPlanName={displayPlanName}
        renewalDate={renewalDate}
        pendingPlanDate={pendingPlanDate}
      />

      <CurrentPlanCard
        subscription={subscription}
        displayPlanName={displayPlanName}
        renewalDate={renewalDate}
      />

      {!readOnly && <AutoRenewSettings subscription={subscription} culqiAvailable={culqiAvailable} />}

      <PaymentHistoryTable
        history={historyWithoutActivePending}
        dateLocale={dateLocale}
      />

      {!readOnly && (
        <>
          <PlanSelectorGrid
            selectablePlans={selectablePlans}
            subscription={subscription}
            isPending={isPending}
            openingCheckout={openingCheckout}
            pendingPayment={pendingPayment}
            onSelectPlan={onSelectPlan}
          />

          {planChangeConfirm && (
            <PlanChangeConfirmDialog
              targetPlan={planChangeConfirm.target}
              preview={planChangeConfirm.preview}
              isPending={isPending}
              onCancel={() => setPlanChangeConfirm(null)}
              onConfirm={() => proceedPlanChange(planChangeConfirm.target, true)}
            />
          )}

          {checkoutPlan && (
            <PlanUpgradeCheckout
              plan={checkoutPlan.plan}
              newPeriodEnd={checkoutPlan.newPeriodEnd}
              platformMethods={platformMethods}
              culqiPublicKey={culqiPublicKey}
              userEmail={userEmail}
              onClose={() => {
                closeActiveCulqiCheckout();
                resetCulqiCheckoutUi();
                setCheckoutPlan(null);
              }}
              onSuccess={() => {
                closeActiveCulqiCheckout();
                resetCulqiCheckoutUi();
                setCheckoutPlan(null);
                refreshBillingQuietly();
              }}
            />
          )}

          <WipeWorkspaceCard
            isPending={isPending}
            onWipe={handleWipeFreshStart}
          />
        </>
      )}
    </div>
  );
}
