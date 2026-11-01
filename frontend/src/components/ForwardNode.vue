<script setup lang="ts">
import type { ForwardNode } from "../types";
const props = defineProps<{ node: ForwardNode }>();
const faceMap: Record<string, string> = { "0": "😀", "1": "😄", "2": "😍", "4": "😎", "5": "😢", "6": "😡", "9": "😮", "14": "😴", "21": "😞", "24": "😋", "26": "😉", "28": "🤗", "29": "😱", "30": "😣", "31": "😠", "32": "😳", "33": "😥", "34": "😓", "36": "😇", "37": "😈", "38": "👿", "39": "😺", "40": "😸", "41": "😹", "42": "😻", "43": "😽", "44": "🙀", "45": "😿", "46": "😾", "53": "💔", "55": "🤔", "63": "😲", "64": "😦", "66": "🙂", "67": "🙃", "85": "🤩", "86": "🤭", "89": "😜", "96": "😬" };
function imageSource(segment: ForwardNode["content"][number]) {
  return segment.data.url || (segment.data.file?.startsWith("http") ? segment.data.file : "");
}
function emojiText(segment: ForwardNode["content"][number]) {
  return segment.data.text || faceMap[segment.data.id] || (segment.data.id ? `[表情 ${segment.data.id}]` : "[表情]");
}
</script>
<template><el-card class="forward-node" shadow="never"><strong>{{ props.node.nickname || props.node.userId || "转发消息" }}</strong><div v-for="(part, index) in props.node.content" :key="index" class="forward-part"><span v-if="part.type === 'text'">{{ part.data.text }}</span><img v-else-if="(part.type === 'image' || part.type === 'mface') && imageSource(part)" class="forward-image" :src="imageSource(part)" /><span v-else-if="part.type === 'face' || part.type === 'emoji'" class="emoji">{{ emojiText(part) }}</span><span v-else class="unsupported">[{{ part.type }}]</span></div><ForwardNode v-for="(child, index) in props.node.children" :key="index" :node="child" /></el-card></template>
