export function toTelegramId(value) {
    return typeof value === "bigint" ? value : BigInt(value);
}
export function telegramChatId(value) {
    return value.toString();
}
