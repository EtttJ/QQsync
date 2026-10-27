import { defineStore } from "pinia";
import type { ChatMessage, Conversation, Segment, Sticker } from "../types";
const tokenKey = "qq-bridge-token";
const pinnedKey = "qq-bridge-pinned";
type ConversationKey = `${"group" | "private"}:${string}`;
export const useChatStore = defineStore("chat", {
  state: () => ({
    token: localStorage.getItem(tokenKey) ?? "",
    conversation: undefined as Conversation | undefined,
    conversations: [] as Conversation[],
    messages: [] as ChatMessage[],
    stickers: [] as Sticker[],
    connected: false,
    replyTo: undefined as string | undefined,
    pinned: JSON.parse(localStorage.getItem(pinnedKey) ?? "[]") as ConversationKey[],
    unread: {} as Record<ConversationKey, number>,
    firstUnreadMessage: {} as Partial<Record<ConversationKey, string>>
  }),
  actions: {
    setToken(token: string) { this.token = token; localStorage.setItem(tokenKey, token); },
    conversationKey(item: Pick<Conversation, "type" | "id">): ConversationKey { return `${item.type}:${item.id}`; },
    isPinned(item: Conversation) { return this.pinned.includes(this.conversationKey(item)); },
    togglePinned(item: Conversation) {
      const key = this.conversationKey(item);
      this.pinned = this.isPinned(item) ? this.pinned.filter((value) => value !== key) : [key, ...this.pinned];
      localStorage.setItem(pinnedKey, JSON.stringify(this.pinned));
      this.sortConversations();
    },
    sortConversations() {
      this.conversations.sort((a, b) => Number(this.isPinned(b)) - Number(this.isPinned(a)));
    },
    async loadConversations() {
      const response = await fetch(`/api/conversations?token=${encodeURIComponent(this.token)}`);
      if (!response.ok) throw new Error("加载好友和群列表失败");
      const data = await response.json() as { conversations: Conversation[] };
      this.conversations = data.conversations.filter((item, index, list) => list.findIndex((other) => other.type === item.type && other.id === item.id) === index);
      this.sortConversations();
    },
    async selectConversation(conversation: Conversation) {
      this.conversation = conversation;
      const response = await fetch(`/api/messages?conversation_id=${encodeURIComponent(conversation.id)}&token=${encodeURIComponent(this.token)}`);
      if (!response.ok) throw new Error("加载消息失败");
      this.messages = (await response.json()).messages;
      this.replyTo = undefined;
    },
    async loadStickers() { const response = await fetch(`/api/stickers?token=${encodeURIComponent(this.token)}`); this.stickers = (await response.json()).stickers; },
    connect() {
      const protocol = location.protocol === "https:" ? "wss:" : "ws:";
      const socket = new WebSocket(`${protocol}//${location.host}/ws?token=${encodeURIComponent(this.token)}`);
      socket.onopen = () => { this.connected = true; };
      socket.onerror = () => { this.connected = false; };
      socket.onclose = () => { this.connected = false; setTimeout(() => { if (!this.connected) this.connect(); }, 3000); };
      socket.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        const message = payload.message as ChatMessage;
        if (payload.type !== "message") return;
        const known = this.conversations.find((item) => item.id === message.chatId && item.type === message.chatType);
        if (!known) {
          this.conversations.unshift({ id: message.chatId, type: message.chatType, name: message.nickname, avatar: message.avatar });
          this.sortConversations();
        }
        const key = `${message.chatType}:${message.chatId}` as ConversationKey;
        if (!this.pinned.includes(key)) {
          this.pinned = [key, ...this.pinned];
          localStorage.setItem(pinnedKey, JSON.stringify(this.pinned));
          this.sortConversations();
        }
        if (this.conversation?.id === message.chatId && this.conversation.type === message.chatType) this.messages.push(message);
        else {
          this.unread[key] = (this.unread[key] ?? 0) + 1;
          this.firstUnreadMessage[key] = message.messageId;
        }
      };
    },
    async send(message: Segment[]) {
      if (!this.conversation) return;
      const response = await fetch("/api/send", { method: "POST", headers: { "content-type": "application/json", Authorization: `Bearer ${this.token}` }, body: JSON.stringify({ chat_type: this.conversation.type, target_id: this.conversation.id, message, reply_to: this.replyTo }) });
      if (!response.ok) throw new Error(`发送失败（${response.status}）`);
      this.replyTo = undefined;
    },
    async saveSticker(file: File) { const data = new FormData(); data.append("file", file); const response = await fetch("/api/stickers", { method: "POST", headers: { Authorization: `Bearer ${this.token}` }, body: data }); if (!response.ok) throw new Error("保存失败"); const sticker = await response.json() as Sticker; this.stickers.unshift(sticker); return sticker; }
  }
});
