import { Users, Calendar, Building2 } from "lucide-react";
import type { Control, FieldErrors, UseFormRegister } from "react-hook-form";
import type { SignUpInput } from "@/lib/validations";

export const ACCOUNT_TYPES = [
  {
    value: "member" as const,
    icon: Users,
    tabKey: "auth.accountTypeMemberTab",
    helpKey: "auth.accountTypeMemberHelp",
  },
  {
    value: "organizer" as const,
    icon: Calendar,
    tabKey: "auth.accountTypeOrganizerTab",
    helpKey: "auth.accountTypeOrganizerHelp",
  },
  {
    value: "entity_admin" as const,
    icon: Building2,
    tabKey: "auth.accountTypeEntityAdminTab",
    helpKey: "auth.accountTypeEntityAdminHelp",
  },
];

export const inputClassName =
  "w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-hidden focus:ring-1 focus:ring-primary";

export interface AccountTypeSelectorProps {
  control: Control<SignUpInput>;
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  accountType: "member" | "organizer" | "entity_admin";
  organizerLinkMode?: "independent" | "entity";
  t: (key: string) => string;
}

export interface PasswordFieldsProps {
  register: UseFormRegister<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  t: (key: string) => string;
}
