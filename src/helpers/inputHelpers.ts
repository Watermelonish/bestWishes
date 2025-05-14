import { Keyboard } from "grammy";
import { MyConversation, MyContext } from "../models/seccionData";
import { months } from "../constants/months"
// Типы для возвращаемых значений
interface DateSelectionResult {
    day: number;
    month: number;
    monthText: string;
}

/**
 * Запрашивает название события с валидацией
 */
export async function getOccasion(
    conversation: MyConversation,
    ctx: MyContext,
    options?: {
        customPrompt?: string;
        errorMessage?: string;
    }
): Promise<string> {
    const prompt = options?.customPrompt || "📝 Введите название события (например, 'День рождения'):";
    const errorMsg = options?.errorMessage || "❌ Название не может быть пустым. Попробуйте еще раз.";

    while (true) {
        await ctx.reply(prompt);
        const occasionCtx = await conversation.wait();
        const occasion = occasionCtx.message?.text?.trim();
        
        if (occasion && occasion.length > 0) {
            return occasion;
        }
        await ctx.reply(errorMsg);
    }
}

/**
 * Запрашивает дату с валидацией
 */
export async function getDate(
    conversation: MyConversation,
    ctx: MyContext,
    options?: {
        dayPrompt?: string;
        dayError?: string;
        monthPrompt?: string;
        monthError?: string;
    }
): Promise<DateSelectionResult> {
    const defaults = {
        dayPrompt: "📅 Введите число месяца (от 1 до 31):",
        dayError: "❌ Нужно ввести число от 1 до 31. Попробуйте еще раз.",
        monthPrompt: "📆 Выберите месяц:",
        monthError: "❌ Пожалуйста, выберите месяц из списка."
    };

    const config = { ...defaults, ...options };

    let day: number;
    while (true) {
        await ctx.reply(config.dayPrompt);
        const dayCtx = await conversation.wait();
        day = parseInt(dayCtx.message?.text || '');
        
        if (!isNaN(day) && day >= 1 && day <= 31) break;
        await ctx.reply(config.dayError);
    }

    let monthIndex: number;
    while (true) {
        await ctx.reply(config.monthPrompt, {
            reply_markup: new Keyboard()
                .text("Январь").text("Февраль").text("Март").row()
                .text("Апрель").text("Май").text("Июнь").row()
                .text("Июль").text("Август").text("Сентябрь").row()
                .text("Октябрь").text("Ноябрь").text("Декабрь")
                .oneTime()
        });

        const monthCtx = await conversation.wait();
        monthIndex = months.indexOf(monthCtx.message?.text || '');
        
        if (monthIndex >= 0) break;
        await ctx.reply(config.monthError);
    }

    return {
        day,
        month: monthIndex + 1,
        monthText: months[monthIndex]
    };
}
export async function getRecipient(conversation: MyConversation, ctx: MyContext): Promise<string> {
    while (true) {
        await ctx.reply("👤 Введите имя получателя поздравления:");
        const nameCtx = await conversation.wait();
        const congratName = nameCtx.message?.text?.trim();
        
        if (congratName && congratName.length > 0) {
            return congratName;
        }
        await ctx.reply("❌ Имя не может быть пустым. Попробуйте еще раз.");
    }
}

export async function getStyle(conversation: MyConversation, ctx: MyContext): Promise<string | undefined> {
    await ctx.reply("💬 Введите пожелание к стилю поздравления (например, 'тёплое', 'шуточное'). Можно пропустить:", {
        reply_markup: new Keyboard()
            .text("Пропустить")
            .oneTime()
    });

    const infoCtx = await conversation.wait();
    return infoCtx.message?.text === "Пропустить" 
        ? undefined 
        : infoCtx.message?.text;
}