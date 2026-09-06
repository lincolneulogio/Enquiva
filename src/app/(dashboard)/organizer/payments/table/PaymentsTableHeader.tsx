interface PaymentsTableHeaderProps {
  t: (key: string) => string;
}

export function PaymentsTableHeader({ t }: PaymentsTableHeaderProps) {
  return (
    <thead>
      <tr className="border-b border-border bg-muted/50">
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.event")}</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.attendee")}</th>
        <th className="px-4 py-3 text-right font-medium text-muted-foreground">{t("common.amount")}</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.method")}</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.status")}</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.receipt")}</th>
        <th className="px-4 py-3 text-left font-medium text-muted-foreground">{t("common.update")}</th>
      </tr>
    </thead>
  );
}
