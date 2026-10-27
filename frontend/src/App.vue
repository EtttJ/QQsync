<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useChatStore } from "./stores/chat";
import MessageItem from "./components/MessageItem.vue";
const store = useChatStore();
const token = ref(store.token);
const draft = ref("");
const list = ref<HTMLElement>();
const imageInput = ref<HTMLInputElement>();
const atBottom = ref(true);
const newMessageCount = ref(0);
const loggedIn = computed(() => Boolean(store.token && store.conversation));
const currentKey = computed(() => store.conversation ? store.conversationKey(store.conversation) : "");
const currentUnread = computed(() => currentKey.value ? (store.unread[currentKey.value] ?? 0) : 0);
const firstUnreadMessageId = computed(() => currentKey.value ? store.firstUnreadMessage[currentKey.value] : undefined);
function scrollToBottom() {
  if (!list.value) return;
  list.value.scrollTop = list.value.scrollHeight;
  atBottom.value = true;
  newMessageCount.value = 0;
}
function handleScroll() {
  if (!list.value) return;
  atBottom.value = list.value.scrollHeight - list.value.scrollTop - list.value.clientHeight <= 48;
  if (atBottom.value) newMessageCount.value = 0;
}
async function login() { if (!token.value) return ElMessage.warning("请输入访问密码"); try { store.setToken(token.value); await store.loadConversations(); await store.loadStickers(); if (store.conversations[0]) await selectConversation(store.conversations[0]); store.connect(); } catch (error) { ElMessage.error(error instanceof Error ? error.message : "连接失败"); } }
async function selectConversation(item: typeof store.conversations[number]) { try { await store.selectConversation(item); await nextTick(scrollToBottom); } catch (error) { ElMessage.error(error instanceof Error ? error.message : "加载会话失败"); } }
function scrollToUnread() {
  if (!firstUnreadMessageId.value) return;
  document.getElementById(`message-${firstUnreadMessageId.value}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  if (currentKey.value) {
    store.unread[currentKey.value] = 0;
    delete store.firstUnreadMessage[currentKey.value];
  }
}
async function send() { if (!draft.value.trim()) return; await store.send([{ type: "text", data: { text: draft.value } }]); draft.value = ""; await nextTick(scrollToBottom); }
async function uploadImage(event: Event) { const file = (event.target as HTMLInputElement).files?.[0]; if (!file) return; const sticker = await store.saveSticker(file); await store.send([{ type: "image", data: { file: sticker.url, url: sticker.url } }]); (event.target as HTMLInputElement).value = ""; }
async function sendSticker(url: string) { await store.send([{ type: "image", data: { file: url, url } }]); }
function onKey(event: KeyboardEvent) { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }
watch(() => store.messages.length, async (length, previousLength) => {
  if (length <= previousLength) return;
  await nextTick();
  if (atBottom.value) scrollToBottom();
  else newMessageCount.value += length - previousLength;
});
onMounted(() => { if (store.token) void login(); });
</script>
<template>
  <main class="app">
    <section v-if="!store.token" class="login card">
      <h1>QQ 群聊桥接</h1><p>连接 NapCat OneBot，实时查看与回复群消息。</p>
      <el-input v-model="token" type="password" show-password placeholder="WEB_TOKEN" />
      <el-button type="primary" @click="login">连接</el-button>
    </section>
    <section v-else class="chat-shell card">
      <aside class="conversation-list"><div class="sidebar-title">好友和群聊 <span :class="{ online: store.connected }">●</span></div><button v-for="item in store.conversations" :key="`${item.type}-${item.id}`" class="conversation" :class="{ active: store.conversation?.id === item.id && store.conversation?.type === item.type }" @click="selectConversation(item)"><img :src="item.avatar" /><span><b>{{ item.name }}</b><small>{{ item.type === "group" ? "群聊" : "好友" }}</small></span><i v-if="store.unread[store.conversationKey(item)]" class="unread-badge">{{ store.unread[store.conversationKey(item)] > 99 ? "99+" : store.unread[store.conversationKey(item)] }}</i><el-button class="pin-button" text size="small" @click.stop="store.togglePinned(item)">{{ store.isPinned(item) ? "取消置顶" : "置顶" }}</el-button></button></aside>
      <section class="chat-main" v-if="loggedIn">
      <header><div><strong>{{ store.conversation?.name }}</strong><span>{{ store.conversation?.type === "group" ? "群聊" : "私聊" }}</span><span :class="{ online: store.connected }">● {{ store.connected ? "已连接" : "重连中" }}</span></div><el-button text @click="store.$reset()">退出</el-button></header>
      <div ref="list" class="messages" @scroll="handleScroll"><MessageItem v-for="message in store.messages" :key="message.messageId" :message="message" :stickers="store.stickers" @reply="store.replyTo = $event" /></div>
      <div v-if="currentUnread && firstUnreadMessageId" class="unread-jump"><el-button type="primary" round @click="scrollToUnread">{{ currentUnread }} 条未读消息，跳转到最新未读</el-button></div>
      <div v-if="!atBottom" class="new-message-indicator"><el-button type="primary" round @click="scrollToBottom">↓ {{ newMessageCount ? `${newMessageCount} 条新消息` : "滚动到最底部" }}</el-button></div>
      <div v-if="store.replyTo" class="replying">回复消息 {{ store.replyTo }} <el-button text @click="store.replyTo = undefined">取消</el-button></div>
      <footer><div class="composer-tools"><el-button @click="imageInput?.click()">图片/表情包</el-button><input ref="imageInput" hidden type="file" accept="image/*" @change="uploadImage" /><el-button v-for="sticker in store.stickers.slice(0, 6)" :key="sticker.id" text @click="sendSticker(sticker.url)">🖼️</el-button></div><el-input v-model="draft" type="textarea" :rows="3" placeholder="输入消息，Enter 发送，Shift+Enter 换行" @keydown="onKey" /><el-button type="primary" @click="send">发送</el-button></footer>
      </section><div v-else class="empty-chat">从左侧选择一个好友或群聊</div>
    </section>
  </main>
</template>
