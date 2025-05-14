import { Context } from "grammy";
import { Conversation } from "@grammyjs/conversations";
import { Reminder } from "./reminder";

// Типы сессии и контекста
export interface SessionData {
    reminderData?: Partial<Reminder>;
}

export type MyContext = Context & { session: SessionData };
export type MyConversation = Conversation<MyContext>;
