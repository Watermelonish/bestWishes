import { bot, reminderDB } from "../..";
import { generateCongratulation } from "../api/llm.api";

export const checkTodayReminders = async () => {
    const today = new Date();
    const month = today.getMonth() + 1;
    const day = today.getDate();
    console.log(month, day)
    const reminders = reminderDB.getRemindersByDate(month, day);
    console.log(reminders)
    for (const reminder of reminders) {
        try {
            await bot.api.sendMessage(
                reminder.chatid,
                `Напоминание:\n${reminder.occasion} у ${reminder.congratName}\nВ течение пары минут придёт текст поздравления.`
            );
            const  message = await generateCongratulation(reminder);
            await bot.api.sendMessage(
                reminder.chatid,
                message
            );
        } catch (e) {
            await bot.api.sendMessage(
                reminder.chatid,
                'Не получилось сгенерировать поздравление. Попробуйте позже при помощи команды /quick'    
            );
            console.error(`Неудача:`, e);
        }
    }
}