export const ENEMIES = [
    {
        key: "ice_rodent",
        name: "Ледяной грызун",
        type: "стая / зверь",
        hp: 8,
        attackDamage: 1,
        vulnerableDomains: ["strength"],
        resistantDomains: ["precision"],
        special: "Стая окружает самого шумного участника.",
        rewardWeight: 1
    },
    {
        key: "frost_wolf",
        name: "Морозный волк",
        type: "зверь / ловкач",
        hp: 12,
        attackDamage: 2,
        vulnerableDomains: ["strength", "precision"],
        resistantDomains: [],
        special: "Атакует самого раненого.",
        rewardWeight: 1.2
    },
    {
        key: "ice_golem",
        name: "Ледяной голем",
        type: "бронированный / колосс",
        hp: 18,
        attackDamage: 3,
        vulnerableDomains: ["magic"],
        resistantDomains: ["strength"],
        special: "Может наложить Оцепенение на питомца.",
        rewardWeight: 1.5
    },
    {
        key: "frozen_bully",
        name: "Оледеневший Бугай",
        type: "мини-босс / зверь / берсерк",
        hp: 22,
        attackDamage: 3,
        vulnerableDomains: ["strength"],
        resistantDomains: ["precision"],
        special: "На половине HP получает вторую атаку.",
        rewardWeight: 2
    }
];
export const ACT_THREE_BOSS = {
    key: "ice_cave_keeper",
    name: "Хранитель Ледяной Пещеры",
    phases: [
        {
            name: "Ледяной панцирь",
            vulnerableDomains: ["magic"],
            resistantDomains: ["strength"]
        },
        {
            name: "Звериный голод",
            vulnerableDomains: ["strength"],
            resistantDomains: ["precision"]
        },
        {
            name: "Сердце льда",
            vulnerableDomains: ["precision"],
            resistantDomains: ["magic"]
        }
    ]
};
export function getEnemyConfig(enemyKey) {
    const enemy = ENEMIES.find((item) => item.key === enemyKey);
    if (!enemy) {
        throw new Error(`Unknown enemy key: ${enemyKey}`);
    }
    return enemy;
}
