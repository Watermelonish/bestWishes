import { Bot, session, BotError } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import cron from "node-cron";
import { ReminderDB } from "./src/db/reminderDB";
import dotenv from 'dotenv';

import { generateCongratulation } from "./src/api/llm.api";
import { MyContext, SessionData } from "./src/models/seccionData";
import { COMMANDSENUM } from "./src/models/commands";
import { confirmDeleteReminder, deleteReminder, handleDeleteSelection } from "./src/commands/delete";
import { addReminder, addReminderConversation } from "./src/commands/addRemider";
import { quickGeneration, quickReminderConversation } from "./src/commands/quickReminder";
import { showCalendar } from "./src/commands/getReminder";
import { startBot } from "./src/commands/startBot";
dotenv.config({
    path: process.env.NODE_ENV === 'test' ? '.env.test' : '.env.prod'
  });
// Инициализация бота и БД
const bot = new Bot<MyContext>(process.env.BOT_API_KEY || '');
export const reminderDB = new ReminderDB();

// Обработка ошибок
bot.catch((err: BotError) => {
    const ctx = err.ctx;
    console.error(`Error while handling update ${ctx.update.update_id}:`, err.error);
});
// Установка команд бота
bot.api.setMyCommands([
    { command: COMMANDSENUM.START, description: 'Запуск бота' },
    { command: COMMANDSENUM.ADD, description: 'Добавить поздравление' },
    { command: COMMANDSENUM.QUICK, description: 'Быстрое поздравление'},
    { command: COMMANDSENUM.CALENDAR, description: 'Просмотреть календарь поздравлений' },
    { command: COMMANDSENUM.DELETE, description: 'Удалить напоминание'},
]);

// Middleware
bot.use(session({ initial: (): SessionData => ({}) }));
bot.use(conversations());

// Регистрация диалога
bot.use(createConversation(addReminderConversation));
bot.use(createConversation(quickReminderConversation));

// Команды
bot.command(COMMANDSENUM.START, startBot);
bot.command(COMMANDSENUM.ADD, addReminder);
bot.command(COMMANDSENUM.DELETE, deleteReminder);
bot.command(COMMANDSENUM.CALENDAR, showCalendar);
bot.command(COMMANDSENUM.QUICK, quickGeneration)
bot.callbackQuery(/^delete_\d+$/, handleDeleteSelection);
bot.callbackQuery(/^confirm_delete_\d+$/, confirmDeleteReminder);
bot.callbackQuery('cancel_delete', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage();
    await ctx.reply('Удаление отменено');
});
bot.callbackQuery(/^holiday_\d+$/, async (ctx) => {
    await ctx.answerCallbackQuery();
});
// Ежедневная проверка напоминаний
cron.schedule('0 10 * * *', async () => {
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
            // const  message = await generateCongratulation(reminder);
            const message = 'С днём рождения!'
            await bot.api.sendMessage(
                reminder.chatid,
                message
            );
        } catch (e) {
            console.error(`Неудача:`, e);
        }
    }
});
// Запуск бота
bot.start();