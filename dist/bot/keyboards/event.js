import { InlineKeyboard } from "grammy";
export function eventRegistrationKeyboard() {
    return new InlineKeyboard()
        .text("Присоединиться", "event:join")
        .text("Играть solo", "event:solo")
        .row()
        .text("Найти звено", "event:find_squad")
        .text("Создать звено", "event:create_squad")
        .row()
        .text("Мой статус", "event:status");
}
export function eventActionKeyboard() {
    return new InlineKeyboard()
        .text("Действие", "event:action")
        .text("Атаковать", "event:attack")
        .row()
        .text("Питомец", "event:pet")
        .text("Расходник", "event:consumable")
        .row()
        .text("Death Save", "event:death_save")
        .text("Статус", "event:status");
}
