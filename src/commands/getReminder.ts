
import { InlineKeyboard } from 'grammy';
import {reminderDB} from '../../index'
import { COMMANDSENUM } from '../models/commands';
import { months } from '../constants/months'


export const getReminders = async (ctx) => {
    const reminders = reminderDB.getRemindersByChatId(ctx.chat.id);
    
    if (!reminders.length) {
        return await ctx.reply('Список напоминаний пуст');
    }

    let message = '📝 Ваши напоминания:\n\n';
    reminders.forEach(reminder => {
        message += `🔹 ID: ${reminder.id}\n` +
                   `🎉 Событие: ${reminder.occasion}\n` +
                   `📅 Дата: ${reminder.day}.${reminder.month}\n` +
                   `👤 Получатель: ${reminder.congratName}\n\n`;
    });

    await ctx.reply(message);
}
export const showCalendar = async (ctx) => {
    try {
        const reminders = reminderDB.getRemindersByChatId(ctx.chat.id)
        .sort((a, b) => {
            const currentYear = new Date().getFullYear();
            const dateA = new Date(currentYear, a.month - 1, a.day).getTime();
            const dateB = new Date(currentYear, b.month - 1, b.day).getTime();
            return dateA - dateB;
        });

        if (!reminders.length) {
            return await ctx.reply('📅 У вас нет запланированных поздравлений');
        }

        let message = '📅 Календарь поздравлений:\n\n';
        let currentMonth = -1;

        reminders.forEach(reminder => {
            if (reminder.month !== currentMonth) {
                currentMonth = reminder.month;
                message += `\n📌 *${months[currentMonth - 1]}*\n`;
            }
            
            message += `▫️ ${reminder.day} ${months[currentMonth - 1]} - ` +
                       `${reminder.congratName} (${reminder.occasion})` +
                       `${reminder.info ? ` [${reminder.info}]` : ''}\n`;
        });

        const keyboard = new InlineKeyboard()
            .text('Удалить напоминание', COMMANDSENUM.DELETE)
            .text('Добавить новое', COMMANDSENUM.ADD);

        await ctx.reply(message, {
            reply_markup: keyboard,
            parse_mode: 'Markdown'
        });

    } catch (error) {
        console.error('Ошибка при показе календаря:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке календаря');
    }
};