type TranslateFn = (key: string) => string;

export type AuthErrorKind =
    | "network"
    | "forbidden_origin"
    | "email_already_in_use"
    | "invalid_credentials"
    | "account_not_verified"
    | "verification_code_expired"
    | "verification_code_invalid"
    | "verification_code_not_found"
    | "invite_code_invalid"
    | "organizer_approval_pending"
    | "plan_limit"
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

    if (normalized.includes("email not verified") || normalized.includes("verification") && normalized.includes("not verified")) {
        return "account_not_verified";
    }

    if (normalized.includes("verification_code_expired") || normalized.includes("código expiró") || normalized.includes("code expired")) {
        return "verification_code_expired";
    }

    if (normalized.includes("verification_code_invalid") || normalized.includes("código incorrecto")) {
        return "verification_code_invalid";
    }

    if (normalized.includes("verification_code_not_found") || normalized.includes("solicita un código nuevo")) {
        return "verification_code_not_found";
    }

    if (normalized.includes("invite_code_invalid") || normalized.includes("código de entidad inválido")) {
        return "invite_code_invalid";
    }

    if (normalized.includes("organizer_approval_pending")) {
        return "organizer_approval_pending";
    }

    if (normalized.includes("plan_limit") || normalized.includes("plan ") && normalized.includes("organizador")) {
        return "plan_limit";
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
    if (errorKind === "verification_code_expired") return t("auth.verificationCodeExpired");
    if (errorKind === "verification_code_invalid") return t("auth.verificationCodeInvalid");
    if (errorKind === "verification_code_not_found") return t("auth.verificationCodeNotFound");
    if (errorKind === "invite_code_invalid") return t("auth.inviteCodeInvalid");
    if (errorKind === "organizer_approval_pending") return t("auth.organizerApprovalPending");
    if (errorKind === "plan_limit") return rawMessage;

    return rawMessage;
}
