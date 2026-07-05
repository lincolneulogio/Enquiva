type TranslateFn = (key: string) => string;

export type AuthErrorKind =
    | "network"
    | "forbidden_origin"
    | "email_already_in_use"
    | "invalid_credentials"
    | "account_not_verified"
    | "unknown";

const validationMessageMap: Record<string, string> = {
    "Name must be at least 2 characters": "auth.validationNameMin",
    "Invalid email address": "auth.validationInvalidEmail",
    "Password must be at least 8 characters": "auth.validationPasswordMin",
    "Must contain at least one uppercase letter": "auth.validationPasswordUppercase",
    "Must contain at least one number": "auth.validationPasswordNumber",
    "Please confirm your password": "auth.validationConfirmPasswordRequired",
    "Passwords do not match": "auth.validationPasswordsDoNotMatch",
    "Password is required": "auth.validationPasswordRequired",
    "Invite code is required": "auth.validationInviteCodeRequired",
    "Organization name is required": "auth.validationOrgNameRequired",
};

export function getValidationMessage(rawMessage: string | undefined, t: TranslateFn): string {
    if (!rawMessage) return t("auth.unexpectedAuthError");
    const key = validationMessageMap[rawMessage];
    return key ? t(key) : rawMessage;
}

export function getAuthErrorKind(rawMessage: string | undefined): AuthErrorKind {
    if (!rawMessage) return "unknown";

    const normalized = rawMessage.toLowerCase();

    if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("fetch")) {
        return "network";
    }

    if (
        normalized.includes("forbidden") ||
        normalized.includes("csrf") ||
        normalized.includes("origin")
    ) {
        return "forbidden_origin";
    }

    if (
        normalized.includes("user already exists") ||
        normalized.includes("already exists") ||
        normalized.includes("email already")
    ) {
        return "email_already_in_use";
    }

    if (normalized.includes("invalid email or password") || normalized.includes("invalid credentials")) {
        return "invalid_credentials";
    }

    if (normalized.includes("email not verified") || normalized.includes("verification") || normalized.includes("not verified")) {
        return "account_not_verified";
    }

    return "unknown";
}

export function getAuthErrorMessage(rawMessage: string | undefined, t: TranslateFn): string {
    if (!rawMessage) return t("auth.unexpectedAuthError");

    const errorKind = getAuthErrorKind(rawMessage);

    if (errorKind === "network") return t("auth.networkError");
    if (errorKind === "forbidden_origin") return t("auth.forbiddenOrigin");
    if (errorKind === "email_already_in_use") return t("auth.emailAlreadyInUse");
    if (errorKind === "invalid_credentials") return t("auth.invalidCredentials");
    if (errorKind === "account_not_verified") return t("auth.accountNotVerified");

    return rawMessage;
}
