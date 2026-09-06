import React from "react";
import type { PaymentsTableLabels } from "./types";

interface PaymentsTableEmptyProps {
  isFiltered: boolean;
  labels: PaymentsTableLabels;
}

export function PaymentsTableEmpty({ isFiltered, labels }: PaymentsTableEmptyProps) {
  return (
    <div className="p-12 text-center">
      <p className="font-medium text-foreground">{labels.noPaymentsYet}</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {isFiltered ? labels.noPaymentsFilter : labels.noPaymentsDefault}
      </p>
    </div>
  );
}
