import type { GameDomain } from "../classes/catalog.js";
import type { EnemyConfig } from "./enemies.js";

export type RollMode = "normal" | "advantage" | "disadvantage";

const DOMAIN_NAMES: Record<GameDomain, string> = {
  strength: "Сила",
  precision: "Точность",
  magic: "Магия"
};

export function domainName(domain: GameDomain): string {
  return DOMAIN_NAMES[domain];
}

export function getDomainRollMode(domain: GameDomain, enemy: EnemyConfig): RollMode {
  if (enemy.vulnerableDomains.includes(domain)) {
    return "advantage";
  }

  if (enemy.resistantDomains.includes(domain)) {
    return "disadvantage";
  }

  return "normal";
}

export function rollModeLabel(mode: RollMode): string {
  if (mode === "advantage") {
    return "преимущество";
  }

  if (mode === "disadvantage") {
    return "помеха";
  }

  return "обычный бросок";
}
