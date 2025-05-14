import { Keyboard } from "grammy";
import { reminderDB } from "../..";
import { Reminder } from "../models/reminder";
import { MyConversation, MyContext } from "../models/seccionData";
import { getDate, getOccasion, getRecipient, getStyle } from "../helpers/inputHelpers";
import { generateCongratulation } from "../api/llm.api";

export const quickGeneration = async (ctx) => {
    await ctx.conversation.enter("quickReminderConversation");
}

export async function quickReminderConversation(conversation: MyConversation, ctx: MyContext) {
    let occasion: string;
    let congratName: string;
    let info: string | undefined;
        try {
            occasion = await getOccasion(conversation, ctx);
            congratName = await getRecipient(conversation, ctx);
            info = await getStyle(conversation, ctx);
    
            let isConfirmed = false;
            while (!isConfirmed) {
                const confirmationText = `Проверьте данные:\n
    🎉 Событие: ${occasion}
    👤 Получатель: ${congratName}
    💬 Стиль: ${info || 'не указан'}`;
    
                await ctx.reply(confirmationText, {
                    reply_markup: new Keyboard()
                        .text("✅ Всё верно")
                        .text("✏️ Редактировать")
                        .text("❌ Отмена")
                        .oneTime()
                });
    
                const confirmCtx = await conversation.wait();
                if (confirmCtx.message?.text === "❌ Отмена"){
                    await ctx.reply("❌ Быстрое поздравление отменено.");
                    return
                }
                if (confirmCtx.message?.text === "✅ Всё верно") {
                    isConfirmed = true;
                } else {
                    await ctx.reply("Что хотите изменить?", {
                        reply_markup: new Keyboard()
                            .text("Событие").row()
                            .text("Получателя").row()
                            .text("Стиль").row()
                            .text("✅ Всё верно")
                            .oneTime()
                    });
    
                    const editCtx = await conversation.wait();
                    switch (editCtx.message?.text) {
                        case "Событие": 
                        occasion = await getOccasion(conversation, ctx);
                        break;
                        case "Получателя": 
                        congratName = await getRecipient(conversation, ctx);
                        break;
                        case "Стиль": 
                        info = await getStyle(conversation, ctx);
                        break;
                        case "✅ Всё верно":
                            isConfirmed = true;
                            break;
                    }
                }
            }
    
            const reminder: Omit<Reminder, 'id'> = {
                chatid: ctx.chat.id,
                occasion,
                day:0,
                month:0,
                congratName,
                info,
            };
            const result = await generateCongratulation(reminder)
            await ctx.reply(result);
        } catch (error) {
            console.error("Ошибка при генерации поздравления:", error);
            await ctx.reply("❌ Произошла ошибка при генерации поздравления. Пожалуйста, попробуйте позже.");
        }
}
