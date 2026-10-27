<script setup lang="ts">
import { computed } from "vue";
import type { ChatMessage, Segment, Sticker } from "../types";
import ForwardNode from "./ForwardNode.vue";
const props = defineProps<{ message: ChatMessage; stickers: Sticker[] }>();
const emit = defineEmits<{ reply: [id: string] }>();
const minute = computed(() => new Date(props.message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
function bilibili(segment: Segment) { const text = JSON.stringify(segment.data); return text.match(/https?:\/\/(?:b23\.tv|www\.bilibili\.com|bilibili\.com)[^\s"\\]+/)?.[0]; }
function hideAvatar(event: Event) { (event.target as HTMLImageElement).style.visibility = "hidden"; }
</script>
<template>
  <article :id="`message-${message.messageId}`" class="message" :class="{ mention: message.isAtMe, mine: message.isMine }">
    <img class="avatar" :src="message.avatar" @error="hideAvatar" />
    <div class="body"><div class="meta"><b>{{ message.nickname }}</b><time>{{ minute }}</time><el-button text size="small" @click="emit('reply', message.messageId)">回复</el-button><span v-if="message.isAtMe" class="at">@我</span></div>
      <div class="content"><template v-for="(segment, index) in message.segments" :key="index">
        <span v-if="segment.type === 'text'">{{ segment.data.text }}</span><span v-else-if="segment.type === 'at'" class="at">@{{ segment.data.qq }}</span>
        <img v-else-if="segment.type === 'image'" class="inline-image" :src="segment.data.url || (segment.data.file?.startsWith('http') ? segment.data.file : '')" />
        <a v-else-if="bilibili(segment)" :href="bilibili(segment)" target="_blank" rel="noreferrer">B 站视频：{{ segment.data.title || bilibili(segment) }}</a>
        <span v-else class="unsupported">[{{ segment.type }}]</span>
      </template></div>
      <details v-if="message.forward?.length" class="forward"><summary>合并转发（{{ message.forward.length }} 条）</summary><ForwardNode v-for="(node, index) in message.forward" :key="index" :node="node" /></details>
      <div v-if="message.isAtMe" class="jump"><a :href="`#message-${message.messageId}`">跳转到此消息</a></div>
    </div>
  </article>
</template>
