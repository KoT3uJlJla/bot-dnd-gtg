export function escapeHtml(value) {
    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
export function compactLines(lines) {
    return lines.filter(Boolean).join("\n");
}
export function formatTelegramUserName(user) {
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    return fullName || (user.username ? `@${user.username}` : "игрок");
}
