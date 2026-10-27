<script setup lang="ts">
import type { ForwardNode } from "../types";
defineProps<{ node: ForwardNode }>();
</script>
<template><el-card class="forward-node" shadow="never"><strong>{{ node.nickname || node.userId || "转发消息" }}</strong><p v-for="(part, index) in node.content" :key="index">{{ part.type === "text" ? part.data.text : `[${part.type}]` }}</p><ForwardNode v-for="(child, index) in node.children" :key="index" :node="child" /></el-card></template>
