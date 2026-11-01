import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { ChatMessage } from "./types.js";
const defaultHistoryLimit = 100;

fs.mkdirSync(path.dirname(config.DB_FILE), { recursive: true });
export const db = new Database(config.DB_FILE);
db.pragma("journal_mode = WAL");
db.exec(`CREATE TABLE IF NOT EXISTS messages (
  message_id TEXT PRIMARY KEY, group_id TEXT NOT NULL, user_id TEXT NOT NULL,
  nickname TEXT NOT NULL, avatar TEXT NOT NULL, time INTEGER NOT NULL,
  segments TEXT NOT NULL, is_at_me INTEGER NOT NULL, reply_to TEXT, forward TEXT
);
CREATE INDEX IF NOT EXISTS idx_messages_group_time ON messages(group_id, time DESC);
CREATE TABLE IF NOT EXISTS stickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, url TEXT NOT NULL,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY, value TEXT NOT NULL
);`);
try { db.exec("ALTER TABLE messages ADD COLUMN chat_type TEXT NOT NULL DEFAULT 'group'"); } catch {}
db.prepare("INSERT OR IGNORE INTO settings (key, value) VALUES ('history_limit', ?)").run(String(defaultHistoryLimit));

export function getHistoryLimit() {
  const row = db.prepare("SELECT value FROM settings WHERE key = 'history_limit'").get() as { value?: string } | undefined;
  const value = Number(row?.value);
  return Number.isInteger(value) && value > 0 ? value : defaultHistoryLimit;
}

export function setHistoryLimit(limit: number) {
  db.prepare("INSERT INTO settings (key, value) VALUES ('history_limit', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String(limit));
  db.prepare(`DELETE FROM messages WHERE message_id IN (
    SELECT message_id FROM (
      SELECT message_id, ROW_NUMBER() OVER (PARTITION BY chat_type, group_id ORDER BY time DESC) AS position
      FROM messages
    ) WHERE position > ?
  )`).run(limit);
}

export function saveMessage(message: ChatMessage) {
  db.prepare(`INSERT OR REPLACE INTO messages
    (message_id, group_id, chat_type, user_id, nickname, avatar, time, segments, is_at_me, reply_to, forward)
    VALUES (@messageId,@chatId,@chatType,@userId,@nickname,@avatar,@time,@segments,@isAtMe,@replyTo,@forward)`)
    .run({ ...message, segments: JSON.stringify(message.segments), isAtMe: message.isAtMe ? 1 : 0,
      replyTo: message.replyTo ?? null, forward: message.forward ? JSON.stringify(message.forward) : null });
  db.prepare(`DELETE FROM messages
    WHERE chat_type = ? AND group_id = ?
      AND message_id NOT IN (
        SELECT message_id FROM messages
        WHERE chat_type = ? AND group_id = ?
        ORDER BY time DESC LIMIT ?
      )`).run(message.chatType, message.chatId, message.chatType, message.chatId, getHistoryLimit());
}

function fromRow(row: Record<string, unknown>): ChatMessage {
  const chatType = row.chat_type === "private" ? "private" : "group";
  return { messageId: String(row.message_id), chatType, chatId: String(row.group_id), groupId: String(row.group_id), userId: String(row.user_id),
    nickname: String(row.nickname), avatar: String(row.avatar), time: Number(row.time),
    segments: JSON.parse(String(row.segments)), isAtMe: Boolean(row.is_at_me),
    replyTo: row.reply_to ? String(row.reply_to) : undefined,
    forward: row.forward ? JSON.parse(String(row.forward)) : undefined };
}

export function listMessages(groupId: string, chatType: "group" | "private", before?: number, limit = getHistoryLimit()) {
  const rows = db.prepare(`SELECT * FROM messages WHERE group_id = ? AND chat_type = ? ${before ? "AND time < ?" : ""}
    ORDER BY time DESC LIMIT ?`).all(...(before ? [groupId, chatType, before, limit] : [groupId, chatType, limit])) as Record<string, unknown>[];
  return rows.map(fromRow).reverse();
}
export function listConversations() {
  return db.prepare("SELECT chat_type AS type, group_id AS id, MAX(time) AS lastTime, MAX(nickname) AS name FROM messages GROUP BY chat_type, group_id ORDER BY lastTime DESC").all();
}

export function saveSticker(name: string, url: string) {
  const result = db.prepare("INSERT INTO stickers (name,url,created_at) VALUES (?,?,?)").run(name, url, Date.now());
  return { id: Number(result.lastInsertRowid), name, url };
}
export function listStickers() {
  return db.prepare("SELECT id,name,url,created_at AS createdAt FROM stickers ORDER BY created_at DESC").all();
}
