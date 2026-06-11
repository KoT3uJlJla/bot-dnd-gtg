export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function compactLines(lines: Array<string | undefined | null | false>): string {
  return lines.filter(Boolean).join("\n");
}

export function formatTelegramUserName(user: {
  firstName?: string | null;
  lastName?: string | null;
  username?: string | null;
}): string {
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return fullName || (user.username ? `@${user.username}` : "игрок");
}
