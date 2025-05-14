import Database from 'better-sqlite3';
import path from 'path';
import { Reminder } from '../models/reminder';

// Тип для объекта напоминания
const DB_PATH = path.resolve(__dirname, process.env.DB_FILE);

// Класс для работы с БД
export class ReminderDB {
  private db: Database.Database;

  constructor() {
    this.resetDatabase()
  }  
  async resetDatabase(): Promise<void> {    
    // Создаем новое соединение
    this.db = new Database(DB_PATH);
    this.checkAndInitDB();
    process.on('exit', () => this.db.close());

  }
    // Инициализация таблицы
  // Проверяем существование таблицы перед инициализацией
  public checkAndInitDB() {
    const tableExists = this.db.prepare(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name='reminder'
    `).get();

    if (!tableExists) {
      this.db.prepare(`
        CREATE TABLE reminder (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chatid INTEGER NOT NULL,
          occasion TEXT NOT NULL,
          month INTEGER NOT NULL,
          day INTEGER NOT NULL,
          congratName TEXT NOT NULL,
          info TEXT
        )
      `).run();
      
      this.db.prepare(`
        CREATE INDEX idx_reminder_chatid ON reminder (chatid)
      `).run();
      
      console.log('Таблица reminder создана');
    } else {
      console.log('Таблица reminder уже существует');
    }
  }

  // Добавление напоминания
  addReminder(reminder: Reminder): Reminder {
    const stmt = this.db.prepare(`
      INSERT INTO reminder (chatid, occasion, month, day, congratName, info)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      reminder.chatid,
      reminder.occasion,
      reminder.month,
      reminder.day,
      reminder.congratName,
      reminder?.info || null
    );
    return { id: info.lastInsertRowid as number, ...reminder };
  }

  // Получение всех напоминаний для чата
  getRemindersByChatId(chatid: number): Reminder[] {
    console.log(chatid, this.db)
    return this.db.prepare(`
      SELECT * FROM reminder WHERE chatid = ?
    `).all(chatid) as Reminder[];
  }

  // Получение напоминаний на конкретную дату
  getRemindersByDate(month: number, day: number): Reminder[] {
    return this.db.prepare(`
      SELECT * FROM reminder WHERE month = ? AND day = ?
    `).all(month, day) as Reminder[];
  }
  getReminderById(id: number): Reminder | undefined {
    try {
      const stmt = this.db.prepare(`
        SELECT * FROM reminder
        WHERE id = @id
      `);

      const reminder = stmt.get({ id }) as Reminder | undefined;
      
      if (!reminder) {
        console.warn(`Напоминание с ID ${id} не найдено`);
        return undefined;
      }

      return {
        ...reminder,
        // Преобразование SQLite INTEGER в boolean если нужно
        info: reminder.info || undefined // преобразуем null в undefined
      };
    } catch (error) {
      console.error('Ошибка при поиске напоминания:', error);
      throw new Error('Не удалось получить напоминание');
    }
  }

  // Удаление напоминания
  deleteReminder(id: number): boolean {
    const changes = this.db.prepare(`
      DELETE FROM reminder WHERE id = ?
    `).run(id).changes;
    return changes > 0;
  }
}