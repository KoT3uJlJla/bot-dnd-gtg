export const ITEMS = [
    {
        key: "small_healing_potion",
        name: "Малое зелье лечения",
        slot: "consumable",
        description: "Восстанавливает 4 HP.",
        consumableEffect: "heal_hp"
    },
    {
        key: "mana_potion",
        name: "Зелье маны",
        slot: "consumable",
        description: "Восстанавливает 4 Mana.",
        consumableEffect: "restore_mana"
    },
    {
        key: "stamina_tonic",
        name: "Настой выносливости",
        slot: "consumable",
        description: "Восстанавливает 4 Stamina.",
        consumableEffect: "restore_stamina"
    },
    {
        key: "cleansing_scroll",
        name: "Свиток очищения",
        slot: "consumable",
        description: "Снимает один негативный эффект.",
        consumableEffect: "cleanse"
    },
    {
        key: "rebirth_scroll",
        name: "Свиток Перерождения",
        slot: "consumable",
        description: "Позволяет сменить класс после бесплатной смены.",
        consumableEffect: "rebirth"
    },
    {
        key: "ice_amulet",
        name: "Ледяной амулет",
        slot: "accessory",
        description: "Дает +1 к магическим проверкам во льду.",
        bonusType: "magic",
        bonusValue: 1
    },
    {
        key: "simple_sword",
        name: "Простой меч",
        slot: "weapon",
        description: "Дает +1 к силовым атакам.",
        bonusType: "strength",
        bonusValue: 1
    },
    {
        key: "student_staff",
        name: "Посох ученика",
        slot: "weapon",
        description: "Дает +1 к магическим действиям.",
        bonusType: "magic",
        bonusValue: 1
    },
    {
        key: "light_armor",
        name: "Легкая броня",
        slot: "armor",
        description: "Немного повышает выживаемость.",
        bonusType: "hp",
        bonusValue: 1
    },
    {
        key: "heavy_shield",
        name: "Тяжелый щит",
        slot: "accessory",
        description: "Дает +1 к силовой защите.",
        bonusType: "strength",
        bonusValue: 1
    }
];
export const STARTER_ITEM_KEYS = [
    "small_healing_potion",
    "stamina_tonic",
    "simple_sword",
    "light_armor"
];
export function getItemConfig(itemKey) {
    const item = ITEMS.find((candidate) => candidate.key === itemKey);
    if (!item) {
        throw new Error(`Unknown item key: ${itemKey}`);
    }
    return item;
}
