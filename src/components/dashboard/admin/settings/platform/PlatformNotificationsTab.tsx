"use client";

import React from "react";
import {
  buildAlertList,
  PushNotificationCard,
  SystemAlertsSection,
} from "./notifications";

export interface PlatformNotificationsTabProps {
  locale: "es" | "en";
  pushNotificationTitle: string | null;
  platformOrgName: string;
  initialOrgName?: string;
  alertPayments: boolean;
  alertRegistrations: boolean;
  alertTransport: boolean;
  alertOrganizerRequests: boolean;
  alertEventPublished: boolean;
  alertSubscriptionPastDue: boolean;
  alertFinance: boolean;
  setSettingsValue: (key: string, value: any) => void;
  handleSaveNotifications: () => void;
  isSaving: boolean;
}

export function PlatformNotificationsTab({
  locale,
  pushNotificationTitle,
  platformOrgName,
  initialOrgName,
  alertPayments,
  alertRegistrations,
  alertTransport,
  alertOrganizerRequests,
  alertEventPublished,
  alertSubscriptionPastDue,
  alertFinance,
  setSettingsValue,
  handleSaveNotifications,
  isSaving,
}: PlatformNotificationsTabProps) {
  const alertList = buildAlertList({
    alertPayments,
    alertRegistrations,
    alertTransport,
    alertOrganizerRequests,
    alertEventPublished,
    alertSubscriptionPastDue,
    alertFinance,
    setSettingsValue,
  });

  const orgDisplay =
    (pushNotificationTitle && pushNotificationTitle.trim().length > 0
      ? pushNotificationTitle.trim()
      : platformOrgName.trim() || initialOrgName?.trim() || "Enquiva") || "Enquiva";
  const firstLetter = orgDisplay.charAt(0).toUpperCase() || "E";

  return (
    <div className="space-y-6">
      <PushNotificationCard
        locale={locale}
        pushNotificationTitle={pushNotificationTitle}
        orgDisplay={orgDisplay}
        firstLetter={firstLetter}
        setSettingsValue={setSettingsValue}
      />

      <SystemAlertsSection
        locale={locale}
        alertList={alertList}
        isSaving={isSaving}
        onSave={handleSaveNotifications}
      />
    </div>
  );
}
