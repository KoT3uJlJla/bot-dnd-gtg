import type { PrismaClient } from "@prisma/client";
import type { Bot } from "grammy";
import type { RollMode } from "../combat/domain.js";
import { telegramChatId } from "../../utils/ids.js";

export type DiceOutcome = {
  value: number;
  effectiveValue: number;
  label: string;
  isSuccess: boolean;
  isCritical: boolean;
};

export type DiceRollResult = DiceOutcome & {
  rawValues: number[];
  messageIds: number[];
  mode: RollMode;
  bonus: number;
};

const OUTCOMES: Record<number, Omit<DiceOutcome, "value" | "effectiveValue">> = {
  1: {
    label: "критический провал",
    isSuccess: false,
    isCritical: true
  },
  2: {
    label: "провал",
    isSuccess: false,
    isCritical: false
  },
  3: {
    label: "частичный успех с осложнением",
    isSuccess: true,
    isCritical: false
  },
  4: {
    label: "успех",
    isSuccess: true,
    isCritical: false
  },
  5: {
    label: "сильный успех",
    isSuccess: true,
    isCritical: false
  },
  6: {
    label: "критический успех",
    isSuccess: true,
    isCritical: true
  }
};

export function clampD6(value: number): number {
  return Math.min(6, Math.max(1, value));
}

export function interpretD6(value: number, bonus = 0): DiceOutcome {
  const effectiveValue = clampD6(value + Math.min(2, Math.max(0, bonus)));
  const outcome = OUTCOMES[effectiveValue] ?? OUTCOMES[1]!;

  return {
    value,
    effectiveValue,
    ...outcome
  };
}

export async function rollTelegramD6(
  bot: Bot,
  prisma: PrismaClient,
  input: {
    chatId: bigint;
    context: string;
    eventId?: number;
    userId?: number;
    characterId?: number;
    mode?: RollMode;
    rollType?: "NORMAL" | "ADVANTAGE" | "DISADVANTAGE" | "DEATH_SAVE";
    bonus?: number;
    publishInterpretation?: boolean;
  }
): Promise<DiceRollResult> {
  const mode = input.mode ?? "normal";
  const rollCount = mode === "normal" ? 1 : 2;
  const rawValues: number[] = [];
  const messageIds: number[] = [];

  for (let index = 0; index < rollCount; index += 1) {
    const message = await bot.api.sendDice(telegramChatId(input.chatId), "🎲");
    const diceValue = message.dice?.value ?? 1;
    rawValues.push(diceValue);
    messageIds.push(message.message_id);
  }

  const value =
    mode === "advantage"
      ? Math.max(...rawValues)
      : mode === "disadvantage"
        ? Math.min(...rawValues)
        : rawValues[0] ?? 1;
  const bonus = Math.min(2, Math.max(0, input.bonus ?? 0));
  const interpreted = interpretD6(value, bonus);

  await prisma.diceRoll.create({
    data: {
      eventId: input.eventId ?? null,
      userId: input.userId ?? null,
      characterId: input.characterId ?? null,
      chatId: input.chatId,
      messageId: messageIds.at(-1) ?? null,
      context: input.context,
      rollType:
        input.rollType ??
        (mode === "advantage"
          ? "ADVANTAGE"
          : mode === "disadvantage"
            ? "DISADVANTAGE"
            : "NORMAL"),
      value,
      effectiveValue: interpreted.effectiveValue,
      metadata: {
        rawValues,
        bonus,
        mode
      }
    }
  });

  const result: DiceRollResult = {
    ...interpreted,
    rawValues,
    messageIds,
    mode,
    bonus
  };

  if (input.publishInterpretation ?? true) {
    const raw = rawValues.length > 1 ? ` (${rawValues.join(", ")})` : "";
    const bonusText = bonus > 0 ? `, бонус +${bonus}` : "";
    await bot.api.sendMessage(
      telegramChatId(input.chatId),
      `🎲 d6${raw}${bonusText}: ${result.effectiveValue} — ${result.label}.`
    );
  }

  return result;
}

export function damageFromOutcome(outcome: DiceOutcome): number {
  if (outcome.effectiveValue <= 2) {
    return 0;
  }

  if (outcome.effectiveValue === 3) {
    return 1;
  }

  if (outcome.effectiveValue === 4) {
    return 2;
  }

  if (outcome.effectiveValue === 5) {
    return 3;
  }

  return 5;
}
