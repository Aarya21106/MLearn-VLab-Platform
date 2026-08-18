export function displayNameOf(user: {
  displayName?: string | null;
  name?: string | null;
  registerNumber?: string | null;
  email?: string | null;
}): string {
  return user.displayName || user.name || user.registerNumber || user.email || "Unknown";
}
