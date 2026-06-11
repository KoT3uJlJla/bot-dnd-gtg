import { getClassConfig } from "../classes/catalog.js";
import { getDomainRollMode, rollModeLabel } from "../combat/domain.js";
import { getEnemyConfig } from "../combat/enemies.js";
import { damageFromOutcome, rollTelegramD6 } from "../dice/d6.js";
import { getScene, ICE_WASTELAND_EVENT } from "./iceWasteland.js";
import { awardEventRewards } from "../rewards/rewardService.js";
import { getItemConfig } from "../items/catalog.js";
import { telegramChatId } from "../../utils/ids.js";
const ACTIVE_EVENT_STATUSES = [
    "REGISTRATION",
    "ACT_1",
    "ACT_2",
    "ACT_3",
    "COMBAT",
    "SCENE_RESOLUTION"
];
export async function upsertGroupChat(prisma, input) {
    return prisma.groupChat.upsert({
        where: {
            telegramChatId: input.telegramChatId
        },
        update: {
            title: input.title ?? null
        },
        create: {
            telegramChatId: input.telegramChatId,
            title: input.title ?? null
        },
        select: {
            id: true,
            telegramChatId: true,
            title: true
        }
    });
}
export async function getActiveEventByChat(prisma, chatId) {
    return prisma.event.findFirst({
        where: {
            groupChat: {
                telegramChatId: chatId
            },
            status: {
                in: [...ACTIVE_EVENT_STATUSES]
            }
        },
        orderBy: {
            createdAt: "desc"
        }
    });
}
export async function startIceWastelandEvent(prisma, input) {
    const groupChat = await upsertGroupChat(prisma, input);
    const existing = await getActiveEventByChat(prisma, input.telegramChatId);
    if (existing) {
        return {
            ok: false,
            message: `Событие уже идет: ${existing.title}. Используй /event_status.`
        };
    }
    const firstScene = ICE_WASTELAND_EVENT.acts[0]?.scenes[0];
    const event = await prisma.event.create({
        data: {
            groupChatId: groupChat.id,
            moduleKey: ICE_WASTELAND_EVENT.key,
            title: ICE_WASTELAND_EVENT.title,
            status: "REGISTRATION",
            act: 1,
            sceneIndex: 0,
            progress: 0,
            currentEnemyKey: firstScene?.enemyKey ?? null,
            startedByTelegramId: input.startedByTelegramId
        }
    });
    return {
        ok: true,
        message: [
            `🧊 ${event.title}`,
            "Регистрация открыта. Игроки могут вступить, выбрать solo-риск или собрать звено.",
            firstScene ? `Первая сцена: ${firstScene.title}` : undefined
        ]
            .filter(Boolean)
            .join("\n")
    };
}
export async function stopActiveEvent(prisma, chatId) {
    const event = await getActiveEventByChat(prisma, chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет." };
    }
    await prisma.event.update({
        where: { id: event.id },
        data: {
            status: "CANCELLED",
            completedAt: new Date()
        }
    });
    return { ok: true, message: "Событие отменено." };
}
export async function joinActiveEvent(prisma, input) {
    const event = await getActiveEventByChat(prisma, input.chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет. Админ может начать его через /event_start." };
    }
    if (input.character.status === "DEAD") {
        return {
            ok: false,
            message: "Твой аватар погиб и не может действовать в этом событии."
        };
    }
    const otherActive = await prisma.eventParticipant.findFirst({
        where: {
            userId: input.userId,
            event: {
                id: {
                    not: event.id
                },
                status: {
                    in: [...ACTIVE_EVENT_STATUSES]
                }
            }
        }
    });
    if (otherActive) {
        return {
            ok: false,
            message: "Ты уже участвуешь в другом активном событии."
        };
    }
    await prisma.eventParticipant.upsert({
        where: {
            eventId_userId: {
                eventId: event.id,
                userId: input.userId
            }
        },
        update: {
            characterId: input.character.id
        },
        create: {
            eventId: event.id,
            userId: input.userId,
            characterId: input.character.id
        }
    });
    return {
        ok: true,
        message: `${input.character.name} присоединился к событию.`
    };
}
export async function leaveActiveEvent(prisma, input) {
    const event = await getActiveEventByChat(prisma, input.chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет." };
    }
    const deleted = await prisma.eventParticipant.deleteMany({
        where: {
            eventId: event.id,
            userId: input.userId
        }
    });
    if (deleted.count === 0) {
        return { ok: false, message: "Ты не участвуешь в текущем событии." };
    }
    return { ok: true, message: "Ты покинул событие." };
}
export async function setSoloMode(prisma, input) {
    const event = await getActiveEventByChat(prisma, input.chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет." };
    }
    const participant = await prisma.eventParticipant.findUnique({
        where: {
            eventId_userId: {
                eventId: event.id,
                userId: input.userId
            }
        },
        include: {
            character: true
        }
    });
    if (!participant) {
        return { ok: false, message: "Сначала присоединись к событию." };
    }
    await prisma.$transaction([
        prisma.squadMember.deleteMany({
            where: {
                participantId: participant.id
            }
        }),
        prisma.eventParticipant.update({
            where: { id: participant.id },
            data: {
                mode: "SOLO",
                squadId: null
            }
        })
    ]);
    return {
        ok: true,
        message: "Ты идёшь один. Награда выше, но риск смерти максимальный."
    };
}
export async function joinOpenSquad(prisma, input) {
    const event = await getActiveEventByChat(prisma, input.chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет." };
    }
    const participant = await prisma.eventParticipant.findUnique({
        where: {
            eventId_userId: {
                eventId: event.id,
                userId: input.userId
            }
        },
        include: {
            character: true
        }
    });
    if (!participant) {
        return { ok: false, message: "Сначала присоединись к событию." };
    }
    const squads = await prisma.squad.findMany({
        where: {
            eventId: event.id
        },
        include: {
            members: true
        },
        orderBy: {
            id: "asc"
        }
    });
    const openSquad = input.forceNew
        ? null
        : squads.find((squad) => squad.status === "OPEN" && squad.members.length < 3);
    const squad = openSquad ??
        (await prisma.squad.create({
            data: {
                eventId: event.id,
                name: `Звено ${squads.length + 1}`
            },
            include: {
                members: true
            }
        }));
    await prisma.$transaction(async (tx) => {
        await tx.squadMember.deleteMany({
            where: {
                participantId: participant.id
            }
        });
        await tx.squadMember.create({
            data: {
                squadId: squad.id,
                participantId: participant.id
            }
        });
        await tx.eventParticipant.update({
            where: { id: participant.id },
            data: {
                mode: "SQUAD",
                squadId: squad.id
            }
        });
        const memberCount = await tx.squadMember.count({
            where: {
                squadId: squad.id
            }
        });
        await tx.squad.update({
            where: { id: squad.id },
            data: {
                status: memberCount >= 3 ? "FULL" : "OPEN"
            }
        });
    });
    const nextCount = squad.members.length + 1;
    return {
        ok: true,
        message: nextCount >= 3
            ? "Полное звено собрано. Награда базовая, но выживаемость максимальная."
            : `${participant.character.name} вступил в ${squad.name}.`
    };
}
export async function eventStatusText(prisma, chatId) {
    const event = await getActiveEventByChat(prisma, chatId);
    if (!event) {
        return "Активного события нет.";
    }
    const scene = getScene(event.act, event.sceneIndex);
    const participants = await prisma.eventParticipant.findMany({
        where: {
            eventId: event.id
        },
        include: {
            character: true,
            squad: true
        },
        orderBy: {
            joinedAt: "asc"
        }
    });
    const rows = participants.map((participant) => {
        const mode = participant.mode === "SOLO"
            ? "solo"
            : participant.mode === "SQUAD"
                ? (participant.squad?.name ?? "звено")
                : "без звена";
        return `• ${participant.character.name} — ${mode}, вклад ${participant.contribution}`;
    });
    return [
        `🧊 ${event.title}`,
        `Статус: ${event.status}`,
        `Акт ${event.act}, сцена: ${scene.title}`,
        `Прогресс сцены: ${event.progress}/${scene.threshold}`,
        rows.length > 0 ? rows.join("\n") : "Участников пока нет."
    ].join("\n");
}
export async function performSceneAction(bot, prisma, input) {
    const event = await getActiveEventByChat(prisma, input.chatId);
    if (!event) {
        return { ok: false, message: "Активного события нет." };
    }
    const participant = await prisma.eventParticipant.findUnique({
        where: {
            eventId_userId: {
                eventId: event.id,
                userId: input.userId
            }
        },
        include: {
            character: true
        }
    });
    if (!participant) {
        return { ok: false, message: "Сначала присоединись к событию." };
    }
    if (participant.character.status === "DEAD") {
        return {
            ok: false,
            message: "Твой аватар погиб и не может действовать в этом событии."
        };
    }
    if (participant.character.status === "DYING") {
        return {
            ok: false,
            message: "Твой аватар при смерти. Используй /death_save или кнопку спасброска."
        };
    }
    const scene = getScene(event.act, event.sceneIndex);
    if (event.status === "REGISTRATION") {
        await prisma.event.update({
            where: { id: event.id },
            data: {
                status: scene.enemyKey ? "COMBAT" : "ACT_1"
            }
        });
    }
    if (scene.enemyKey) {
        return performAttack(bot, prisma, {
            chatId: input.chatId,
            eventId: event.id,
            userId: input.userId,
            participantId: participant.id,
            character: participant.character,
            sceneKey: scene.key,
            enemyKey: scene.enemyKey,
            failureDamage: scene.failureDamage
        });
    }
    const challengeInput = {
        chatId: input.chatId,
        eventId: event.id,
        userId: input.userId,
        participantId: participant.id,
        character: participant.character,
        sceneKey: scene.key,
        threshold: scene.threshold,
        failureDamage: scene.failureDamage
    };
    return performChallenge(bot, prisma, scene.challengeDomain
        ? {
            ...challengeInput,
            challengeDomain: scene.challengeDomain
        }
        : challengeInput);
}
export async function performDeathSave(bot, prisma, input) {
    if (input.character.status !== "DYING") {
        return { ok: false, message: "Death Save нужен только аватару в статусе dying." };
    }
    const event = await getActiveEventByChat(prisma, input.chatId);
    const rollInput = {
        chatId: input.chatId,
        userId: input.userId,
        characterId: input.character.id,
        context: "death_save",
        rollType: "DEATH_SAVE",
        publishInterpretation: false
    };
    const roll = await rollTelegramD6(bot, prisma, event ? { ...rollInput, eventId: event.id } : rollInput);
    if (roll.value === 6) {
        await prisma.character.update({
            where: { id: input.character.id },
            data: {
                status: "WOUNDED",
                hpCurrent: 1,
                deathSaveSuccesses: 0,
                deathSaveFailures: 0
            }
        });
        return {
            ok: true,
            message: `${input.character.name} выбрасывает 6 и встает с 1 HP.`
        };
    }
    const addedFailures = roll.value === 1 ? 2 : roll.value <= 3 ? 1 : 0;
    const addedSuccesses = roll.value >= 4 && roll.value <= 5 ? 1 : 0;
    const failures = input.character.deathSaveFailures + addedFailures;
    const successes = input.character.deathSaveSuccesses + addedSuccesses;
    if (failures >= 3) {
        await prisma.character.update({
            where: { id: input.character.id },
            data: {
                status: "DEAD",
                hpCurrent: 0,
                deathSaveSuccesses: successes,
                deathSaveFailures: failures
            }
        });
        return {
            ok: true,
            message: `${input.character.name}: ${roll.value} на death save. 3 провала — аватар погиб.`
        };
    }
    if (successes >= 3) {
        await prisma.character.update({
            where: { id: input.character.id },
            data: {
                status: "WOUNDED",
                hpCurrent: 1,
                deathSaveSuccesses: 0,
                deathSaveFailures: 0
            }
        });
        return {
            ok: true,
            message: `${input.character.name}: ${roll.value} на death save. 3 успеха — аватар стабилизирован с 1 HP.`
        };
    }
    await prisma.character.update({
        where: { id: input.character.id },
        data: {
            deathSaveSuccesses: successes,
            deathSaveFailures: failures
        }
    });
    return {
        ok: true,
        message: `${input.character.name}: ${roll.value} на death save. Успехи ${successes}/3, провалы ${failures}/3.`
    };
}
async function performChallenge(bot, prisma, input) {
    const bonus = await calculateSmallBonus(prisma, input.character, input.challengeDomain);
    const roll = await rollTelegramD6(bot, prisma, {
        chatId: input.chatId,
        eventId: input.eventId,
        userId: input.userId,
        characterId: input.character.id,
        context: `scene:${input.sceneKey}`,
        bonus
    });
    const progressGain = progressFromRoll(roll.effectiveValue);
    const [event] = await prisma.$transaction([
        prisma.event.update({
            where: { id: input.eventId },
            data: {
                progress: {
                    increment: progressGain
                }
            }
        }),
        prisma.eventParticipant.update({
            where: { id: input.participantId },
            data: {
                contribution: {
                    increment: progressGain
                }
            }
        })
    ]);
    const damageMessage = roll.effectiveValue <= 2
        ? await applyIncomingDamage(prisma, input.character, input.failureDamage)
        : null;
    if (event.progress >= input.threshold) {
        const advanced = await advanceScene(bot, prisma, input.chatId, input.eventId);
        return {
            ok: true,
            message: [`Проверка закрыта: +${progressGain} прогресса.`, damageMessage, advanced]
                .filter(Boolean)
                .join("\n")
        };
    }
    return {
        ok: true,
        message: [
            `Сцена продвинулась на ${progressGain}. Прогресс: ${event.progress}/${input.threshold}.`,
            damageMessage
        ]
            .filter(Boolean)
            .join("\n")
    };
}
async function performAttack(bot, prisma, input) {
    const classConfig = getClassConfig(input.character.classKey);
    const enemy = getEnemyConfig(input.enemyKey);
    const mode = getDomainRollMode(classConfig.domain, enemy);
    const bonus = await calculateSmallBonus(prisma, input.character, classConfig.domain);
    const roll = await rollTelegramD6(bot, prisma, {
        chatId: input.chatId,
        eventId: input.eventId,
        userId: input.userId,
        characterId: input.character.id,
        context: `attack:${input.sceneKey}:${enemy.key}`,
        mode,
        bonus
    });
    const combat = await ensureCombatSession(prisma, input.eventId, enemy.key);
    const enemyEntity = combat.enemyEntity;
    const damage = damageFromOutcome(roll);
    const nextEnemyHp = Math.max(0, enemyEntity.hpCurrent - damage);
    await prisma.$transaction([
        prisma.combatEntity.update({
            where: { id: enemyEntity.id },
            data: {
                hpCurrent: nextEnemyHp,
                status: nextEnemyHp <= 0 ? "defeated" : "active"
            }
        }),
        prisma.eventParticipant.update({
            where: { id: input.participantId },
            data: {
                contribution: {
                    increment: damage
                }
            }
        })
    ]);
    if (nextEnemyHp <= 0) {
        await prisma.combatSession.update({
            where: { id: combat.sessionId },
            data: {
                status: "WON"
            }
        });
        const advanced = await advanceScene(bot, prisma, input.chatId, input.eventId);
        return {
            ok: true,
            message: [
                `${input.character.name} наносит ${damage} урона. ${enemy.name} повержен.`,
                advanced
            ].join("\n")
        };
    }
    const counterDamage = roll.effectiveValue <= 3
        ? input.failureDamage + (enemy.key === "frozen_bully" && nextEnemyHp <= enemy.hp / 2 ? 1 : 0)
        : 0;
    const counterMessage = counterDamage > 0 ? await applyIncomingDamage(prisma, input.character, counterDamage) : null;
    return {
        ok: true,
        message: [
            `${input.character.name}: ${rollModeLabel(mode)}, ${damage} урона. ${enemy.name}: ${nextEnemyHp}/${enemy.hp} HP.`,
            counterMessage
        ]
            .filter(Boolean)
            .join("\n")
    };
}
async function ensureCombatSession(prisma, eventId, enemyKey) {
    const enemy = getEnemyConfig(enemyKey);
    const existing = await prisma.combatSession.findFirst({
        where: {
            eventId,
            enemyKey,
            status: "ACTIVE"
        },
        include: {
            entities: true
        },
        orderBy: {
            createdAt: "desc"
        }
    });
    if (existing) {
        const entity = existing.entities.find((candidate) => candidate.side === "ENEMY");
        if (entity) {
            return {
                sessionId: existing.id,
                enemyEntity: {
                    id: entity.id,
                    hpCurrent: entity.hpCurrent,
                    hpMax: entity.hpMax
                }
            };
        }
    }
    const created = await prisma.combatSession.create({
        data: {
            eventId,
            enemyKey,
            entities: {
                create: {
                    enemyKey,
                    name: enemy.name,
                    side: "ENEMY",
                    hpCurrent: enemy.hp,
                    hpMax: enemy.hp
                }
            }
        },
        include: {
            entities: true
        }
    });
    const entity = created.entities.find((candidate) => candidate.side === "ENEMY");
    if (!entity) {
        throw new Error("Combat session created without enemy entity.");
    }
    return {
        sessionId: created.id,
        enemyEntity: {
            id: entity.id,
            hpCurrent: entity.hpCurrent,
            hpMax: entity.hpMax
        }
    };
}
async function advanceScene(bot, prisma, chatId, eventId) {
    const event = await prisma.event.findUniqueOrThrow({
        where: {
            id: eventId
        }
    });
    const act = ICE_WASTELAND_EVENT.acts.find((candidate) => candidate.number === event.act);
    const nextScene = act?.scenes[event.sceneIndex + 1] ?? null;
    if (!nextScene) {
        await prisma.event.update({
            where: { id: eventId },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
                progress: 0
            }
        });
        const rewards = await awardEventRewards(prisma, eventId);
        const rewardText = rewards.length > 0 ? rewards.join("\n") : "Награды уже были выданы.";
        await bot.api.sendMessage(telegramChatId(chatId), `🏆 Акт 1 завершен. Вход к ледяной пещере открыт.\n${rewardText}`);
        return "Акт 1 завершен. Акт 2 и Акт 3 уже заложены как конфиги для расширения.";
    }
    await prisma.event.update({
        where: { id: eventId },
        data: {
            sceneIndex: event.sceneIndex + 1,
            progress: 0,
            currentEnemyKey: nextScene.enemyKey ?? null,
            status: nextScene.enemyKey ? "COMBAT" : "ACT_1"
        }
    });
    await bot.api.sendMessage(telegramChatId(chatId), `➡️ Следующая сцена: ${nextScene.title}\n${nextScene.publicText}`);
    return `Открыта сцена: ${nextScene.title}.`;
}
function progressFromRoll(value) {
    if (value <= 2) {
        return 0;
    }
    if (value === 3) {
        return 1;
    }
    if (value === 4) {
        return 2;
    }
    if (value === 5) {
        return 3;
    }
    return 4;
}
async function calculateSmallBonus(prisma, character, domain) {
    if (!domain) {
        return 0;
    }
    const classConfig = getClassConfig(character.classKey);
    let bonus = classConfig.domain === domain ? 1 : 0;
    const pet = character.activePetId
        ? await prisma.pet.findUnique({
            where: {
                id: character.activePetId
            }
        })
        : null;
    if (pet && pet.biome === "ice" && (pet.bonusType === domain || pet.bonusType === "survival")) {
        bonus += Math.min(1, pet.bonusValue);
    }
    const equipped = await prisma.equippedItem.findMany({
        where: {
            characterId: character.id
        }
    });
    for (const item of equipped) {
        const itemConfig = getItemConfig(item.itemKey);
        if (itemConfig.bonusType === domain) {
            bonus += Math.min(1, itemConfig.bonusValue ?? 0);
        }
    }
    return Math.min(2, bonus);
}
async function applyIncomingDamage(prisma, character, damage) {
    if (damage <= 0) {
        return "";
    }
    const hp = Math.max(0, character.hpCurrent - damage);
    const status = hp <= 0 ? "DYING" : hp <= Math.floor(character.hpMax / 2) ? "WOUNDED" : "ALIVE";
    await prisma.character.update({
        where: {
            id: character.id
        },
        data: {
            hpCurrent: hp,
            status,
            deathSaveSuccesses: hp <= 0 ? 0 : character.deathSaveSuccesses,
            deathSaveFailures: hp <= 0 ? 0 : character.deathSaveFailures
        }
    });
    if (status === "DYING") {
        return `${character.name} получает ${damage} урона и падает до 0 HP. Нужны death saves.`;
    }
    return `${character.name} получает ${damage} урона. HP: ${hp}/${character.hpMax}.`;
}
