
import { InlineKeyboard } from 'grammy';
import {reminderDB} from '../../index'
import { getReminders } from './getReminder';
export const deleteReminder = async (ctx) => {
    try {
        const reminders = reminderDB.getRemindersByChatId(ctx.chat.id);
        
        if (!reminders.length) {
            return await ctx.reply('❌ У вас нет активных напоминаний для удаления');
        }

        const keyboard = new InlineKeyboard();
        reminders.forEach(reminder => {
            keyboard.text(
                `${reminder.id}: ${reminder.occasion} (${reminder.day}.${reminder.month})`,
                `delete_${reminder.id}`
            ).row();
        });

        keyboard.text('❌ Отменить', 'cancel_delete');

        await ctx.reply('Выберите напоминание для удаления:', {
            reply_markup: keyboard
        });

    } catch (error) {
        console.error('Ошибка при получении напоминаний:', error);
        await ctx.reply('❌ Произошла ошибка при загрузке напоминаний');
    }
};

export const handleDeleteSelection = async (ctx) => {
    try {
        const action = ctx.callbackQuery?.data;
        
        if (action === 'cancel_delete') {
            await ctx.deleteMessage();
            return await ctx.reply('Удаление отменено');
        }

        if (!action?.startsWith('delete_')) return;

        const id = Number(action.replace('delete_', ''));
        if (!id) return;

        const reminder = reminderDB.getReminderById(id);
        if (!reminder) {
            await ctx.answerCallbackQuery('Напоминание не найдено');
            return;
        }

        await ctx.editMessageText(
            `Вы уверены, что хотите удалить напоминание?\n` +
            `🎉 Событие: ${reminder.occasion}\n` +
            `📅 Дата: ${reminder.day}.${reminder.month}\n` +
            `👤 Получатель: ${reminder.congratName}`,
            {
                reply_markup: new InlineKeyboard()
                    .text('✅ Да, удалить', `confirm_delete_${id}`)
                    .text('❌ Нет, отменить', 'cancel_delete')
            }
        );

    } catch (error) {
        console.error('Ошибка при выборе напоминания:', error);
        await ctx.answerCallbackQuery('Произошла ошибка');
    }
};

export const confirmDeleteReminder = async (ctx) => {
    try {
        const action = ctx.callbackQuery?.data;
        
        if (action === 'cancel_delete') {
            await ctx.deleteMessage();
            return await ctx.reply('Удаление отменено');
        }

        if (!action?.startsWith('confirm_delete_')) return;

        const id = Number(action.replace('confirm_delete_', ''));
        if (!id) return;

        const success = reminderDB.deleteReminder(id);
        
        if (success) {
            await ctx.editMessageText('✅ Напоминание успешно удалено');
            await getReminders(ctx);
        } else {
            await ctx.editMessageText('❌ Не удалось удалить напоминание');
        }

    } catch (error) {
        console.error('Ошибка при удалении:', error);
        await ctx.answerCallbackQuery('Произошла ошибка при удалении');
    }
};
