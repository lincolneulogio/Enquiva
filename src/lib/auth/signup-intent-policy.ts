export function canUsePlatformOwnerSignupIntent(input: {
  preparedIntentType: string;
  existingUserRole?: string | null;
}): boolean {
  return (
    input.preparedIntentType === "platform_owner" ||
    input.existingUserRole === "super_admin"
  );
}
