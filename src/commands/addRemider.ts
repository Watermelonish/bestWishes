import { Keyboard } from "grammy";
import { reminderDB } from "../../";
import { Reminder } from "../models/reminder";
import { MyConversation, MyContext } from "../models/seccionData";
import { getDate, getOccasion, getRecipient, getStyle } from "../helpers/inputHelpers";
export async function addReminderConversation(conversation: MyConversation, ctx: MyContext) {
    // Инициализируем переменные для хранения данных
    let occasion: string;
    let day: number;
    let month: number;
    let monthText: string;
    let congratName: string;
    let info: string | undefined;
    

    // Основной процесс
    try {
        // Получаем все данные
        occasion = await getOccasion(conversation, ctx);
        ({ day, month, monthText } = await getDate(conversation, ctx))        
        congratName = await getRecipient(conversation, ctx);
        info = await getStyle(conversation, ctx);

        // Подтверждение и редактирование
        let isConfirmed = false;
        while (!isConfirmed) {
            const confirmationText = `Проверьте данные:\n
🎉 Событие: ${occasion}
📅 Дата: ${day} ${monthText}
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
                await ctx.reply("❌ Создание напоминания отменено.");
                return
            }
            if (confirmCtx.message?.text === "✅ Всё верно") {
                isConfirmed = true;
            } else {
                await ctx.reply("Что хотите изменить?", {
                    reply_markup: new Keyboard()
                        .text("Событие").text("Дату").row()
                        .text("Получателя").text("Стиль").row()
                        .text("✅ Всё верно")
                        .oneTime()
                });

                const editCtx = await conversation.wait();
                switch (editCtx.message?.text) {
                    case "Событие": 
                    occasion = await getOccasion(conversation, ctx);
                    break;
                    case "Дату": 
                    ({ day, month, monthText } = await getDate(conversation, ctx))        
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

        // Сохранение в БД
        if (!ctx.chat?.id) throw new Error("Не удалось определить чат");

        const reminder: Omit<Reminder, 'id'> = {
            chatid: ctx.chat.id,
            occasion,
            day,
            month,
            congratName,
            info,
        };

        const result = reminderDB.addReminder(reminder);
        await ctx.reply(`✅ Напоминание успешно создано! (ID: ${result.id})`);

    } catch (error) {
        console.error("Ошибка в addReminderConversation:", error);
        await ctx.reply("❌ Произошла ошибка при создании напоминания. Пожалуйста, попробуйте позже.");
    }
}
export const addReminder = async (ctx) => {
    await ctx.conversation.enter("addReminderConversation");
}