import { ICE_WASTELAND_EVENT } from "../events/iceWasteland.js";
function roundReward(value) {
    return Math.max(0, Math.round(value));
}
function survivalModifier(status) {
    if (status === "DEAD") {
        return 0.4;
    }
    if (status === "DYING") {
        return 0.7;
    }
    return 1;
}
function performanceModifier(contribution) {
    return 1 + Math.min(10, Math.max(0, contribution)) * 0.03;
}
function squadMultiplier(mode, squadSize) {
    if (mode === "SOLO") {
        return 1.6;
    }
    if (mode === "SQUAD" && squadSize <= 2) {
        return 1.25;
    }
    return 1;
}
export async function awardEventRewards(prisma, eventId) {
    const event = await prisma.event.findUnique({
        where: { id: eventId },
        include: {
            participants: {
                include: {
                    character: true,
                    squad: {
                        include: {
                            members: true
                        }
                    },
                    user: true
                }
            }
        }
    });
    if (!event) {
        return [];
    }
    const summaries = [];
    for (const participant of event.participants) {
        const existing = await prisma.reward.findUnique({
            where: {
                eventId_userId: {
                    eventId,
                    userId: participant.userId
                }
            }
        });
        if (existing) {
            continue;
        }
        const squadSize = participant.squad?.members.length ?? 1;
        const multiplier = squadMultiplier(participant.mode, squadSize) *
            survivalModifier(participant.character.status) *
            performanceModifier(participant.contribution);
        const xp = roundReward(ICE_WASTELAND_EVENT.baseReward.xp * multiplier);
        const coins = roundReward(ICE_WASTELAND_EVENT.baseReward.coins * multiplier);
        const eventPoints = roundReward(ICE_WASTELAND_EVENT.baseReward.eventPoints * multiplier);
        const iceShards = roundReward(ICE_WASTELAND_EVENT.baseReward.iceShards * multiplier);
        await prisma.$transaction([
            prisma.reward.create({
                data: {
                    eventId,
                    userId: participant.userId,
                    characterId: participant.characterId,
                    xp,
                    coins,
                    eventPoints,
                    iceShards,
                    title: ICE_WASTELAND_EVENT.rewardTitle,
                    items: {
                        granted: ["small_healing_potion"],
                        multiplier
                    }
                }
            }),
            prisma.character.update({
                where: { id: participant.characterId },
                data: {
                    xp: {
                        increment: xp
                    },
                    coins: {
                        increment: coins
                    },
                    eventPoints: {
                        increment: eventPoints
                    },
                    iceShards: {
                        increment: iceShards
                    }
                }
            }),
            prisma.inventoryItem.upsert({
                where: {
                    characterId_itemKey: {
                        characterId: participant.characterId,
                        itemKey: "small_healing_potion"
                    }
                },
                update: {
                    quantity: {
                        increment: 1
                    }
                },
                create: {
                    userId: participant.userId,
                    characterId: participant.characterId,
                    itemKey: "small_healing_potion",
                    name: "Малое зелье лечения",
                    slot: "consumable",
                    quantity: 1
                }
            })
        ]);
        summaries.push(`${participant.character.name}: +${xp} XP, +${coins} монет, +${eventPoints} очков, +${iceShards} оск.`);
    }
    return summaries;
}
