export const GAME_CLASSES = [
    {
        key: "guardian",
        name: "Страж",
        description: "Тяжелый защитник, который держит линию и принимает удар.",
        role: "танк и контроль угроз",
        domain: "strength",
        hpMax: 16,
        manaMax: 2,
        staminaMax: 9,
        strength: 3,
        agility: 1,
        mind: 1,
        will: 2,
        abilities: [
            {
                key: "shield_bash",
                name: "Удар щитом",
                description: "Атака, которая при успехе снижает следующую атаку врага.",
                resource: "stamina",
                cost: 1
            },
            {
                key: "intercept",
                name: "Принять удар",
                description: "Часть урона по союзнику переходит на Стража.",
                resource: "stamina",
                cost: 1
            },
            {
                key: "taunt",
                name: "Провокация",
                description: "Враг чаще атакует Стража в следующем обмене."
            }
        ]
    },
    {
        key: "warrior",
        name: "Воин",
        description: "Прямой боец, который быстро ломает защиту врага.",
        role: "урон и давление",
        domain: "strength",
        hpMax: 14,
        manaMax: 1,
        staminaMax: 11,
        strength: 3,
        agility: 2,
        mind: 1,
        will: 1,
        abilities: [
            {
                key: "power_strike",
                name: "Силовой удар",
                description: "Повышенный физический урон за Stamina.",
                resource: "stamina",
                cost: 2
            },
            {
                key: "armor_split",
                name: "Раскол брони",
                description: "Снижает защиту врага для следующего союзника.",
                resource: "stamina",
                cost: 1
            },
            {
                key: "battle_dash",
                name: "Боевой рывок",
                description: "Дает бонус к инициативе или следующему действию.",
                resource: "stamina",
                cost: 1
            }
        ]
    },
    {
        key: "rogue",
        name: "Разбойник",
        description: "Ловкий аватар для точных ударов и опасных сцен.",
        role: "точечный урон и ловушки",
        domain: "precision",
        hpMax: 10,
        manaMax: 2,
        staminaMax: 12,
        strength: 1,
        agility: 3,
        mind: 2,
        will: 1,
        abilities: [
            {
                key: "weak_spot",
                name: "Удар в слабое место",
                description: "Повышенный урон, особенно на 6.",
                resource: "stamina",
                cost: 1
            },
            {
                key: "disarm_trap",
                name: "Обезвредить ловушку",
                description: "Используется в сценах с опасной местностью."
            },
            {
                key: "fade",
                name: "Уход в тень",
                description: "Дает преимущество на следующий бросок.",
                resource: "stamina",
                cost: 1
            }
        ]
    },
    {
        key: "ranger",
        name: "Следопыт",
        description: "Проводник, стрелок и охотник на опасных существ.",
        role: "разведка и стабильный урон",
        domain: "precision",
        hpMax: 12,
        manaMax: 3,
        staminaMax: 10,
        strength: 2,
        agility: 3,
        mind: 1,
        will: 1,
        abilities: [
            {
                key: "aimed_shot",
                name: "Прицельный выстрел",
                description: "Надежная атака по уязвимому месту.",
                resource: "stamina",
                cost: 1
            },
            {
                key: "trail_reading",
                name: "Чтение следов",
                description: "Помогает в сценах поиска и преследования."
            },
            {
                key: "snare",
                name: "Силок",
                description: "Замедляет врага или уменьшает его атаку.",
                resource: "stamina",
                cost: 1
            }
        ]
    },
    {
        key: "mage",
        name: "Маг",
        description: "Хрупкий, но сильный источник магического влияния.",
        role: "магический урон и сцены знания",
        domain: "magic",
        hpMax: 8,
        manaMax: 12,
        staminaMax: 5,
        strength: 1,
        agility: 1,
        mind: 3,
        will: 2,
        abilities: [
            {
                key: "ice_spark",
                name: "Ледяная искра",
                description: "Магическая атака с шансом замедлить врага.",
                resource: "mana",
                cost: 2
            },
            {
                key: "arcane_barrier",
                name: "Чародейский барьер",
                description: "Снижает следующий урон по звену.",
                resource: "mana",
                cost: 2
            },
            {
                key: "rune_sight",
                name: "Рунное зрение",
                description: "Открывает скрытую магическую деталь сцены."
            }
        ]
    },
    {
        key: "priest",
        name: "Жрец",
        description: "Поддержка, стабилизация и светлая магия против тьмы.",
        role: "лечение и поддержка",
        domain: "magic",
        hpMax: 11,
        manaMax: 10,
        staminaMax: 6,
        strength: 1,
        agility: 1,
        mind: 2,
        will: 3,
        abilities: [
            {
                key: "mend",
                name: "Исцеление",
                description: "Восстанавливает HP союзника или себя.",
                resource: "mana",
                cost: 2
            },
            {
                key: "blessing",
                name: "Благословение",
                description: "Дает преимущество союзнику на следующий бросок.",
                resource: "mana",
                cost: 1
            },
            {
                key: "last_light",
                name: "Последний свет",
                description: "Помогает стабилизировать умирающего аватара.",
                resource: "mana",
                cost: 2
            }
        ]
    }
];
export function getClassConfig(classKey) {
    const config = GAME_CLASSES.find((item) => item.key === classKey);
    if (!config) {
        throw new Error(`Unknown class key: ${classKey}`);
    }
    return config;
}
export function classListText() {
    return GAME_CLASSES.map((item) => `• ${item.name}: ${item.role}`).join("\n");
}
