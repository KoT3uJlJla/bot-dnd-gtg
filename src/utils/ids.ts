export function toTelegramId(value: number | string | bigint): bigint {
  return typeof value === "bigint" ? value : BigInt(value);
}

export function telegramChatId(value: bigint): string {
  return value.toString();
}
