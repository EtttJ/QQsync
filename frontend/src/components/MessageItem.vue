<script setup lang="ts">
import { computed } from "vue";
import type { ChatMessage, Segment, Sticker } from "../types";
import ForwardNode from "./ForwardNode.vue";
const props = defineProps<{ message: ChatMessage; stickers: Sticker[] }>();
const emit = defineEmits<{ reply: [id: string]; jump: [id: string]; image: [url: string] }>();
const minute = computed(() => new Date(props.message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
const faceMap: Record<string, string> = { "0": "😀", "1": "😄", "2": "😍", "4": "😎", "5": "😢", "6": "😡", "9": "😮", "14": "😴", "21": "😞", "24": "😋", "26": "😉", "28": "🤗", "29": "😱", "30": "😣", "31": "😠", "32": "😳", "33": "😥", "34": "😓", "36": "😇", "37": "😈", "38": "👿", "39": "😺", "40": "😸", "41": "😹", "42": "😻", "43": "😽", "44": "🙀", "45": "😿", "46": "😾", "53": "💔", "55": "🤔", "63": "😲", "64": "😦", "66": "🙂", "67": "🙃", "85": "🤩", "86": "🤭", "89": "😜", "96": "😬" };
function bilibili(segment: Segment) { const text = JSON.stringify(segment.data); return text.match(/https?:\/\/(?:b23\.tv|www\.bilibili\.com|bilibili\.com)[^\s"\\]+/)?.[0]; }
function imageSource(segment: Segment) {
  return segment.data.url || (segment.data.file?.startsWith("http") ? segment.data.file : "");
}
function emojiText(segment: Segment) {
  return segment.data.text || faceMap[segment.data.id] || (segment.data.id ? `[表情 ${segment.data.id}]` : "[表情]");
}
function replyLabel(segment: Segment) {
  const data = segment.data as Record<string, unknown>;
  const sender = data.sender as Record<string, unknown> | undefined;
  return String(sender?.card || sender?.nickname || "消息");
}
function hideAvatar(event: Event) { (event.target as HTMLImageElement).style.visibility = "hidden"; }
</script>
<template>
  <article :id="`message-${message.messageId}`" class="message" :class="{ mention: message.isAtMe, mine: message.isMine }">
    <img class="avatar" :src="message.avatar" @error="hideAvatar" />
    <div class="body"><div class="meta"><b>{{ message.nickname }}</b><time>{{ minute }}</time><el-button text size="small" @click="emit('reply', message.messageId)">回复</el-button><span v-if="message.isAtMe" class="at">@我</span></div>
      <div class="content"><template v-for="(segment, index) in message.segments" :key="index">
        <span v-if="segment.type === 'text'">{{ segment.data.text }}</span><span v-else-if="segment.type === 'at'" class="at">@{{ segment.data.nickname || "用户" }}</span>
        <img v-else-if="segment.type === 'image' && imageSource(segment)" class="inline-image" :src="imageSource(segment)" @click="emit('image', imageSource(segment))" />
        <span v-else-if="segment.type === 'face' || segment.type === 'emoji'" class="emoji">{{ emojiText(segment) }}</span>
        <img v-else-if="segment.type === 'mface' && imageSource(segment)" class="inline-image emoji-image" :src="imageSource(segment)" @click="emit('image', imageSource(segment))" />
        <button v-else-if="segment.type === 'reply' && segment.data.id" class="reply-preview" type="button" @click="emit('jump', segment.data.id)">回复 {{ replyLabel(segment) }}</button>
        <a v-else-if="bilibili(segment)" :href="bilibili(segment)" target="_blank" rel="noreferrer">B 站视频：{{ segment.data.title || bilibili(segment) }}</a>
        <span v-else class="unsupported">[{{ segment.type }}]</span>
      </template></div>
      <details v-if="message.forward?.length" class="forward"><summary>合并转发（{{ message.forward.length }} 条）</summary><ForwardNode v-for="(node, index) in message.forward" :key="index" :node="node" /></details>
      <div v-if="message.isAtMe" class="jump"><a :href="`#message-${message.messageId}`">跳转到此消息</a></div>
    </div>
  </article>
</template>
