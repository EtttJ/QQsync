import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config.js";
import type { ChatMessage } from "./types.js";

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
);`);
try { db.exec("ALTER TABLE messages ADD COLUMN chat_type TEXT NOT NULL DEFAULT 'group'"); } catch {}

export function saveMessage(message: ChatMessage) {
  db.prepare(`INSERT OR REPLACE INTO messages
    (message_id, group_id, chat_type, user_id, nickname, avatar, time, segments, is_at_me, reply_to, forward)
    VALUES (@messageId,@chatId,@chatType,@userId,@nickname,@avatar,@time,@segments,@isAtMe,@replyTo,@forward)`)
    .run({ ...message, segments: JSON.stringify(message.segments), isAtMe: message.isAtMe ? 1 : 0,
      replyTo: message.replyTo ?? null, forward: message.forward ? JSON.stringify(message.forward) : null });
}

function fromRow(row: Record<string, unknown>): ChatMessage {
  const chatType = row.chat_type === "private" ? "private" : "group";
  return { messageId: String(row.message_id), chatType, chatId: String(row.group_id), groupId: String(row.group_id), userId: String(row.user_id),
    nickname: String(row.nickname), avatar: String(row.avatar), time: Number(row.time),
    segments: JSON.parse(String(row.segments)), isAtMe: Boolean(row.is_at_me),
    replyTo: row.reply_to ? String(row.reply_to) : undefined,
    forward: row.forward ? JSON.parse(String(row.forward)) : undefined };
}

export function listMessages(groupId: string, before?: number, limit = config.HISTORY_LIMIT) {
  const rows = db.prepare(`SELECT * FROM messages WHERE group_id = ? ${before ? "AND time < ?" : ""}
    ORDER BY time DESC LIMIT ?`).all(...(before ? [groupId, before, limit] : [groupId, limit])) as Record<string, unknown>[];
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
