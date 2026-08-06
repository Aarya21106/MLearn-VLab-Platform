export function displayNameOf(user: {
  displayName?: string | null;
  name?: string | null;
  email: string;
}): string {
  return user.displayName || user.name || user.email;
}
