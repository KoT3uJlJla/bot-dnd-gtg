import { InlineKeyboard } from "grammy";
import { GAME_CLASSES } from "../../game/classes/catalog.js";
export function classKeyboard(prefix) {
    const keyboard = new InlineKeyboard();
    GAME_CLASSES.forEach((gameClass, index) => {
        keyboard.text(gameClass.name, `${prefix}:${gameClass.key}`);
        if (index % 2 === 1) {
            keyboard.row();
        }
    });
    return keyboard;
}
export function privateHomeKeyboard() {
    return new InlineKeyboard()
        .text("Профиль", "private:profile")
        .text("Классы", "private:classes")
        .row()
        .text("Инвентарь", "private:inventory")
        .text("Питомец", "private:pet");
}
