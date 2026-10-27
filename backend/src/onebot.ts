import WebSocket from "ws";
import { config } from "./config.js";
import { saveMessage } from "./db.js";
import type { ChatMessage, Conversation, ForwardNode, LoginInfo, OneBotEvent, Segment } from "./types.js";

type Listener = (message: ChatMessage) => void;
const listeners = new Set<Listener>();
let socket: WebSocket | undefined;
let sequence = 0;

export function onMessage(listener: Listener) { listeners.add(listener); return () => listeners.delete(listener); }
export function broadcast(message: ChatMessage) { saveMessage(message); listeners.forEach((listener) => listener(message)); }

async function callApi<T>(action: string, params: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${config.NAPCAT_HTTP}/${action}`, {
    method: "POST", headers: { "content-type": "application/json", ...(config.NAPCAT_TOKEN ? { Authorization: `Bearer ${config.NAPCAT_TOKEN}` } : {}) },
    body: JSON.stringify(params)
  });
  if (!response.ok) throw new Error(`NapCat API ${action} failed: ${response.status}`);
  const body = await response.json() as { status?: string; retcode?: number; data?: T; message?: string };
  if (body.status !== "ok" || (body.retcode !== undefined && body.retcode !== 0)) throw new Error(body.message ?? `NapCat API ${action} failed`);
  return body.data as T;
}

export async function fetchImage(file: string) {
  const image = await callApi<{ url?: string; file?: string }>("get_image", { file });
  const source = image.url ?? image.file;
  if (!source) throw new Error("NapCat did not return an image URL");
  const response = await fetch(source);
  if (!response.ok || !response.body) throw new Error(`Image fetch failed: ${response.status}`);
  return response;
}

function normalizeContent(message: OneBotEvent["message"]): Segment[] {
  if (typeof message === "string") return [{ type: "text", data: { text: message } }];
  if (Array.isArray(message)) return message;
  if (message && typeof message === "object") return [message as Segment];
  return [];
}
function avatar(userId: string) { return `https://q1.qlogo.cn/g?b=qq&nk=${encodeURIComponent(userId)}&s=100`; }
export async function getLoginInfo() { return callApi<LoginInfo>("get_login_info", {}); }
export async function getConversations(): Promise<Conversation[]> {
  const [groups, friends] = await Promise.all([
    callApi<any[]>("get_group_list", {}),
    callApi<any[]>("get_friend_list", {})
  ]);
  return [
    ...groups.map((item) => ({ id: String(item.group_id), type: "group" as const, name: item.group_name ?? String(item.group_id), avatar: `https://p.qlogo.cn/gh/${item.group_id}/${item.group_id}/100` })),
    ...friends.map((item) => ({ id: String(item.user_id), type: "private" as const, name: item.remark || item.nickname || String(item.user_id), avatar: avatar(String(item.user_id)) }))
  ];
}
async function normalizeImages(segments: Segment[]) {
  return Promise.all(segments.map(async (segment) => {
    if (segment.type !== "image") return segment;
    try {
      return { ...segment, data: { ...segment.data, url: `/api/image?file=${encodeURIComponent(segment.data.file ?? segment.data.url ?? "")}&token=${encodeURIComponent(config.WEB_TOKEN)}` } };
    } catch (error) {
      console.error("Failed to resolve image:", error);
      return segment;
    }
  }));
}
function parseForwardNode(node: any): ForwardNode {
  const content = normalizeContent(node.content ?? node.message);
  return { userId: node.uin ? String(node.uin) : node.user_id ? String(node.user_id) : undefined,
    nickname: node.name ?? node.nickname, time: node.time, content,
    children: content.filter((segment) => segment.type === "forward" && segment.data?.content)
      .map((segment) => parseForwardNode(segment.data.content)) };
}
async function expandForwards(segments: Segment[]): Promise<ForwardNode[] | undefined> {
  const forwards = segments.filter((segment) => segment.type === "forward");
  if (!forwards.length) return undefined;
  const result: ForwardNode[] = [];
  for (const segment of forwards) {
    const res = await callApi<{ messages?: any[] }>("get_forward_msg", { id: segment.data.id });
    result.push(...(res.messages ?? []).map(parseForwardNode));
  }
  return result;
}

async function handleEvent(event: OneBotEvent) {
  if (event.post_type !== "message" || !["group", "private"].includes(event.message_type ?? "")) {
    console.log(`[OneBot] ignored event post_type=${event.post_type ?? "unknown"} message_type=${event.message_type ?? "unknown"}`);
    return;
  }
  const chatType = event.message_type as "group" | "private";
  const chatId = String(chatType === "group" ? event.group_id : (event.user_id ?? event.sender?.user_id ?? ""));
  if (!chatId || chatId === "undefined") return;
  const userId = String(event.sender?.user_id ?? event.user_id ?? "");
  const segments = await normalizeImages(normalizeContent(event.message));
  const selfId = event.self_id;
  const isAtMe = segments.some((segment) => segment.type === "at" && segment.data.qq === String(selfId ?? ""));
  const message: ChatMessage = { messageId: String(event.message_id ?? `${Date.now()}-${sequence++}`), chatType, chatId, groupId: chatId, userId,
    nickname: event.sender?.card || event.sender?.nickname || userId, avatar: avatar(userId),
    time: (event.time ?? Math.floor(Date.now() / 1000)) * 1000, segments, isAtMe, isMine: false,
    replyTo: segments.find((segment) => segment.type === "reply")?.data.id };
  try { message.forward = await expandForwards(segments); } catch (error) {
    console.error("Failed to expand forward message:", error);
  }
  console.log(`[OneBot] ${chatType} message received id=${chatId} message_id=${message.messageId}`);
  broadcast(message);
}

function connect() {
  socket = new WebSocket(config.NAPCAT_WS, config.NAPCAT_TOKEN ? { headers: { Authorization: `Bearer ${config.NAPCAT_TOKEN}` } } : undefined);
  socket.on("open", () => console.log(`NapCat WS connected: ${config.NAPCAT_WS}`));
  socket.on("message", (data) => {
    try {
      const event = JSON.parse(data.toString()) as OneBotEvent;
      void handleEvent(event);
    } catch (error) {
      console.error("Invalid OneBot event:", error);
    }
  });
  socket.on("error", (error) => console.error("NapCat WS error:", error.message));
  socket.on("close", () => { console.warn("NapCat WS disconnected; retrying in 3s"); setTimeout(connect, 3000); });
}
export function startOneBot() { connect(); }
export function sendGroupMessage(groupId: string, message: Segment[], replyTo?: string) {
  return callApi("send_group_msg", { group_id: Number(groupId), message: replyTo ? [{ type: "reply", data: { id: replyTo } }, ...message] : message });
}
export function sendPrivateMessage(userId: string, message: Segment[], replyTo?: string) {
  return callApi("send_private_msg", { user_id: Number(userId), message: replyTo ? [{ type: "reply", data: { id: replyTo } }, ...message] : message });
}

export async function createOutgoingMessage(chatType: "group" | "private", chatId: string, segments: Segment[], replyTo?: string): Promise<ChatMessage> {
  const login = await getLoginInfo();
  return {
    messageId: `web-${Date.now()}-${sequence++}`,
    chatType,
    chatId,
    groupId: chatId,
    userId: String(login.user_id),
    nickname: login.nickname ?? String(login.user_id),
    avatar: avatar(String(login.user_id)),
    time: Date.now(),
    segments,
    isAtMe: false,
    isMine: true,
    replyTo
  };
}
