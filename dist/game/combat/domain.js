const DOMAIN_NAMES = {
    strength: "Сила",
    precision: "Точность",
    magic: "Магия"
};
export function domainName(domain) {
    return DOMAIN_NAMES[domain];
}
export function getDomainRollMode(domain, enemy) {
    if (enemy.vulnerableDomains.includes(domain)) {
        return "advantage";
    }
    if (enemy.resistantDomains.includes(domain)) {
        return "disadvantage";
    }
    return "normal";
}
export function rollModeLabel(mode) {
    if (mode === "advantage") {
        return "преимущество";
    }
    if (mode === "disadvantage") {
        return "помеха";
    }
    return "обычный бросок";
}
