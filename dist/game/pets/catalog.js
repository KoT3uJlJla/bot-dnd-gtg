export const PETS = [
    {
        key: "spark_cat",
        name: "Искряной котенок",
        biome: "ice",
        bonusType: "magic",
        bonusValue: 1,
        description: "Чувствует древние руны под снегом."
    },
    {
        key: "snow_fox",
        name: "Снежный лис",
        biome: "ice",
        bonusType: "precision",
        bonusValue: 1,
        description: "Проводит по тропам, где лед еще держит."
    },
    {
        key: "stone_pup",
        name: "Каменный щенок",
        biome: "cave",
        bonusType: "strength",
        bonusValue: 1,
        description: "Упрямо держит проход и отвлекает мелких врагов."
    }
];
export const STARTER_PET_KEY = "spark_cat";
export function getPetConfig(petKey) {
    const pet = PETS.find((candidate) => candidate.key === petKey);
    if (!pet) {
        throw new Error(`Unknown pet key: ${petKey}`);
    }
    return pet;
}
