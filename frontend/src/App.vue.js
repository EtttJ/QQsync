import { computed, nextTick, onMounted, onUnmounted, ref, watch } from "vue";
import { ElMessage } from "element-plus";
import { useChatStore } from "./stores/chat";
import MessageItem from "./components/MessageItem.vue";
const store = useChatStore();
const token = ref(store.token);
const draft = ref("");
const list = ref();
const imageInput = ref();
const atBottom = ref(true);
const newMessageCount = ref(0);
const viewerOpen = ref(false);
const viewerIndex = ref(0);
const viewerScale = ref(1);
const viewerRotation = ref(0);
const viewerOffset = ref({ x: 0, y: 0 });
const dragging = ref(false);
const dragStart = ref({ x: 0, y: 0 });
const dragOrigin = ref({ x: 0, y: 0 });
const historyLimitDraft = ref(store.historyLimit);
const loggedIn = computed(() => Boolean(store.token && store.conversation));
const currentKey = computed(() => store.conversation ? store.conversationKey(store.conversation) : "");
const currentUnread = computed(() => currentKey.value ? (store.unread[currentKey.value] ?? 0) : 0);
const firstUnreadMessageId = computed(() => currentKey.value ? store.firstUnreadMessage[currentKey.value] : undefined);
const replyingMessage = computed(() => store.replyTo ? store.messages.find((message) => message.messageId === store.replyTo) : undefined);
const viewerImages = computed(() => store.messages.flatMap((message) => message.segments
    .filter((segment) => segment.type === "image" || segment.type === "mface")
    .map((segment) => segment.data.url || (segment.data.file?.startsWith("http") ? segment.data.file : ""))
    .filter((url) => Boolean(url))));
const viewerImage = computed(() => viewerImages.value[viewerIndex.value] || "");
function clearUnread() {
    if (!currentKey.value)
        return;
    store.unread[currentKey.value] = 0;
    delete store.firstUnreadMessage[currentKey.value];
}
function scrollToBottom() {
    if (!list.value)
        return;
    list.value.scrollTop = list.value.scrollHeight;
    atBottom.value = true;
    newMessageCount.value = 0;
    clearUnread();
}
function handleScroll() {
    if (!list.value)
        return;
    atBottom.value = list.value.scrollHeight - list.value.scrollTop - list.value.clientHeight <= 48;
    if (atBottom.value) {
        newMessageCount.value = 0;
        clearUnread();
    }
}
async function login() { if (!token.value)
    return ElMessage.warning("请输入访问密码"); try {
    store.setToken(token.value);
    await store.loadSettings();
    historyLimitDraft.value = store.historyLimit;
    await store.loadConversations();
    await store.loadStickers();
    if (store.conversations[0])
        await selectConversation(store.conversations[0]);
    store.connect();
}
catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "连接失败");
} }
async function saveHistoryLimit() {
    const limit = Number(historyLimitDraft.value);
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000)
        return ElMessage.warning("请输入 1 到 1000 之间的整数");
    try {
        await store.updateHistoryLimit(limit);
        historyLimitDraft.value = store.historyLimit;
        ElMessage.success(`已保存，保留 ${store.historyLimit} 条消息`);
    }
    catch (error) {
        ElMessage.error(error instanceof Error ? error.message : "保存失败");
    }
}
async function selectConversation(item) { try {
    await store.selectConversation(item);
    await nextTick(scrollToBottom);
}
catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载会话失败");
} }
function scrollToMessage(messageId) {
    const target = document.getElementById(`message-${messageId}`);
    if (!target) {
        ElMessage.info("引用的消息不在本地保存的 200 条记录中");
        return;
    }
    target.scrollIntoView({ behavior: "smooth", block: "center" });
}
function scrollToUnread() {
    if (!firstUnreadMessageId.value)
        return;
    scrollToMessage(firstUnreadMessageId.value);
    if (currentKey.value) {
        store.unread[currentKey.value] = 0;
        delete store.firstUnreadMessage[currentKey.value];
    }
}
function resetViewerTransform() {
    viewerScale.value = 1;
    viewerRotation.value = 0;
    viewerOffset.value = { x: 0, y: 0 };
}
function openImage(url) {
    const index = viewerImages.value.indexOf(url);
    viewerIndex.value = index >= 0 ? index : 0;
    resetViewerTransform();
    viewerOpen.value = true;
}
function closeImage() {
    viewerOpen.value = false;
    dragging.value = false;
    resetViewerTransform();
}
function changeImage(step) {
    if (viewerImages.value.length < 2)
        return;
    viewerIndex.value = (viewerIndex.value + step + viewerImages.value.length) % viewerImages.value.length;
    resetViewerTransform();
}
function zoomImage(amount) {
    viewerScale.value = Math.min(5, Math.max(0.25, Number((viewerScale.value + amount).toFixed(2))));
}
function fitImage() {
    resetViewerTransform();
}
function startDragging(event) {
    if (event.button !== 0)
        return;
    dragging.value = true;
    dragStart.value = { x: event.clientX, y: event.clientY };
    dragOrigin.value = { ...viewerOffset.value };
    event.currentTarget.setPointerCapture(event.pointerId);
}
function dragImage(event) {
    if (!dragging.value)
        return;
    viewerOffset.value = {
        x: dragOrigin.value.x + event.clientX - dragStart.value.x,
        y: dragOrigin.value.y + event.clientY - dragStart.value.y,
    };
}
function stopDragging() {
    dragging.value = false;
}
function onViewerWheel(event) {
    event.preventDefault();
    zoomImage(event.deltaY < 0 ? 0.1 : -0.1);
}
function onViewerKeydown(event) {
    if (!viewerOpen.value)
        return;
    if (event.key === "Escape")
        closeImage();
    else if (event.key === "ArrowLeft")
        changeImage(-1);
    else if (event.key === "ArrowRight")
        changeImage(1);
    else if (event.key === "+" || event.key === "=")
        zoomImage(0.1);
    else if (event.key === "-")
        zoomImage(-0.1);
    else if (event.key === "0")
        fitImage();
}
async function send() { if (!draft.value.trim())
    return; await store.send([{ type: "text", data: { text: draft.value } }]); draft.value = ""; await nextTick(scrollToBottom); }
async function uploadImage(event) { const file = event.target.files?.[0]; if (!file)
    return; const sticker = await store.saveSticker(file); await store.send([{ type: "image", data: { file: sticker.url, url: sticker.url } }]); event.target.value = ""; }
async function sendSticker(url) { await store.send([{ type: "image", data: { file: url, url } }]); }
function onKey(event) { if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    void send();
} }
watch(() => store.messages.length, async (length, previousLength) => {
    if (length <= previousLength)
        return;
    await nextTick();
    if (atBottom.value)
        scrollToBottom();
    else
        newMessageCount.value += length - previousLength;
});
onMounted(() => {
    window.addEventListener("keydown", onViewerKeydown);
    if (store.token)
        void login();
});
onUnmounted(() => window.removeEventListener("keydown", onViewerKeydown));
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.main, __VLS_intrinsicElements.main)({
    ...{ class: "app" },
});
if (!__VLS_ctx.store.token) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "login card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.h1, __VLS_intrinsicElements.h1)({});
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({});
    const __VLS_0 = {}.ElInput;
    /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
    // @ts-ignore
    const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
        modelValue: (__VLS_ctx.token),
        type: "password",
        showPassword: true,
        placeholder: "WEB_TOKEN",
    }));
    const __VLS_2 = __VLS_1({
        modelValue: (__VLS_ctx.token),
        type: "password",
        showPassword: true,
        placeholder: "WEB_TOKEN",
    }, ...__VLS_functionalComponentArgsRest(__VLS_1));
    const __VLS_4 = {}.ElButton;
    /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
    // @ts-ignore
    const __VLS_5 = __VLS_asFunctionalComponent(__VLS_4, new __VLS_4({
        ...{ 'onClick': {} },
        type: "primary",
    }));
    const __VLS_6 = __VLS_5({
        ...{ 'onClick': {} },
        type: "primary",
    }, ...__VLS_functionalComponentArgsRest(__VLS_5));
    let __VLS_8;
    let __VLS_9;
    let __VLS_10;
    const __VLS_11 = {
        onClick: (__VLS_ctx.login)
    };
    __VLS_7.slots.default;
    var __VLS_7;
}
else {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
        ...{ class: "chat-shell card" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.aside, __VLS_intrinsicElements.aside)({
        ...{ class: "conversation-list" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "sidebar-title" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: ({ online: __VLS_ctx.store.connected }) },
    });
    for (const [item] of __VLS_getVForSourceType((__VLS_ctx.store.conversations))) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    __VLS_ctx.selectConversation(item);
                } },
            key: (`${item.type}-${item.id}`),
            ...{ class: "conversation" },
            ...{ class: ({ active: __VLS_ctx.store.conversation?.id === item.id && __VLS_ctx.store.conversation?.type === item.type }) },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            src: (item.avatar),
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
        (item.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.small, __VLS_intrinsicElements.small)({});
        (item.type === "group" ? "群聊" : "好友");
        if (__VLS_ctx.store.unread[__VLS_ctx.store.conversationKey(item)]) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.i, __VLS_intrinsicElements.i)({
                ...{ class: "unread-badge" },
            });
            (__VLS_ctx.store.unread[__VLS_ctx.store.conversationKey(item)] > 99 ? "99+" : __VLS_ctx.store.unread[__VLS_ctx.store.conversationKey(item)]);
        }
        const __VLS_12 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_13 = __VLS_asFunctionalComponent(__VLS_12, new __VLS_12({
            ...{ 'onClick': {} },
            ...{ class: "pin-button" },
            text: true,
            size: "small",
        }));
        const __VLS_14 = __VLS_13({
            ...{ 'onClick': {} },
            ...{ class: "pin-button" },
            text: true,
            size: "small",
        }, ...__VLS_functionalComponentArgsRest(__VLS_13));
        let __VLS_16;
        let __VLS_17;
        let __VLS_18;
        const __VLS_19 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.store.token))
                    return;
                __VLS_ctx.store.togglePinned(item);
            }
        };
        __VLS_15.slots.default;
        (__VLS_ctx.store.isPinned(item) ? "取消置顶" : "置顶");
        var __VLS_15;
    }
    if (__VLS_ctx.loggedIn) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.section, __VLS_intrinsicElements.section)({
            ...{ class: "chat-main" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.header, __VLS_intrinsicElements.header)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
        (__VLS_ctx.store.conversation?.name);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (__VLS_ctx.store.conversation?.type === "group" ? "群聊" : "私聊");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: ({ online: __VLS_ctx.store.connected }) },
        });
        (__VLS_ctx.store.connected ? "已连接" : "重连中");
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "header-actions" },
        });
        __VLS_asFunctionalElement(__VLS_intrinsicElements.label, __VLS_intrinsicElements.label)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onKeyup: (__VLS_ctx.saveHistoryLimit) },
            type: "number",
            min: "1",
            max: "1000",
            step: "1",
        });
        (__VLS_ctx.historyLimitDraft);
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        const __VLS_20 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_21 = __VLS_asFunctionalComponent(__VLS_20, new __VLS_20({
            ...{ 'onClick': {} },
            text: true,
        }));
        const __VLS_22 = __VLS_21({
            ...{ 'onClick': {} },
            text: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_21));
        let __VLS_24;
        let __VLS_25;
        let __VLS_26;
        const __VLS_27 = {
            onClick: (__VLS_ctx.saveHistoryLimit)
        };
        __VLS_23.slots.default;
        var __VLS_23;
        const __VLS_28 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_29 = __VLS_asFunctionalComponent(__VLS_28, new __VLS_28({
            ...{ 'onClick': {} },
            text: true,
        }));
        const __VLS_30 = __VLS_29({
            ...{ 'onClick': {} },
            text: true,
        }, ...__VLS_functionalComponentArgsRest(__VLS_29));
        let __VLS_32;
        let __VLS_33;
        let __VLS_34;
        const __VLS_35 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.store.token))
                    return;
                if (!(__VLS_ctx.loggedIn))
                    return;
                __VLS_ctx.store.$reset();
            }
        };
        __VLS_31.slots.default;
        var __VLS_31;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onScroll: (__VLS_ctx.handleScroll) },
            ref: "list",
            ...{ class: "messages" },
        });
        /** @type {typeof __VLS_ctx.list} */ ;
        for (const [message] of __VLS_getVForSourceType((__VLS_ctx.store.messages))) {
            /** @type {[typeof MessageItem, ]} */ ;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent(MessageItem, new MessageItem({
                ...{ 'onReply': {} },
                ...{ 'onJump': {} },
                ...{ 'onImage': {} },
                key: (message.messageId),
                message: (message),
                stickers: (__VLS_ctx.store.stickers),
            }));
            const __VLS_37 = __VLS_36({
                ...{ 'onReply': {} },
                ...{ 'onJump': {} },
                ...{ 'onImage': {} },
                key: (message.messageId),
                message: (message),
                stickers: (__VLS_ctx.store.stickers),
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            let __VLS_39;
            let __VLS_40;
            let __VLS_41;
            const __VLS_42 = {
                onReply: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    if (!(__VLS_ctx.loggedIn))
                        return;
                    __VLS_ctx.store.replyTo = $event;
                }
            };
            const __VLS_43 = {
                onJump: (__VLS_ctx.scrollToMessage)
            };
            const __VLS_44 = {
                onImage: (__VLS_ctx.openImage)
            };
            var __VLS_38;
        }
        if (__VLS_ctx.currentUnread && __VLS_ctx.firstUnreadMessageId) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "unread-jump" },
            });
            const __VLS_45 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_46 = __VLS_asFunctionalComponent(__VLS_45, new __VLS_45({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }));
            const __VLS_47 = __VLS_46({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_46));
            let __VLS_49;
            let __VLS_50;
            let __VLS_51;
            const __VLS_52 = {
                onClick: (__VLS_ctx.scrollToUnread)
            };
            __VLS_48.slots.default;
            (__VLS_ctx.currentUnread);
            var __VLS_48;
        }
        if (!__VLS_ctx.atBottom) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "new-message-indicator" },
            });
            const __VLS_53 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_54 = __VLS_asFunctionalComponent(__VLS_53, new __VLS_53({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }));
            const __VLS_55 = __VLS_54({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_54));
            let __VLS_57;
            let __VLS_58;
            let __VLS_59;
            const __VLS_60 = {
                onClick: (__VLS_ctx.scrollToBottom)
            };
            __VLS_56.slots.default;
            (__VLS_ctx.newMessageCount ? `${__VLS_ctx.newMessageCount} 条新消息` : "滚动到最底部");
            var __VLS_56;
        }
        if (__VLS_ctx.store.replyTo) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "replying" },
            });
            (__VLS_ctx.replyingMessage?.nickname || __VLS_ctx.store.replyTo);
            if (__VLS_ctx.replyingMessage) {
                __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
                (__VLS_ctx.store.replyTo);
            }
            const __VLS_61 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_62 = __VLS_asFunctionalComponent(__VLS_61, new __VLS_61({
                ...{ 'onClick': {} },
                text: true,
            }));
            const __VLS_63 = __VLS_62({
                ...{ 'onClick': {} },
                text: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_62));
            let __VLS_65;
            let __VLS_66;
            let __VLS_67;
            const __VLS_68 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    if (!(__VLS_ctx.loggedIn))
                        return;
                    if (!(__VLS_ctx.store.replyTo))
                        return;
                    __VLS_ctx.store.replyTo = undefined;
                }
            };
            __VLS_64.slots.default;
            var __VLS_64;
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "composer-tools" },
        });
        const __VLS_69 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_70 = __VLS_asFunctionalComponent(__VLS_69, new __VLS_69({
            ...{ 'onClick': {} },
        }));
        const __VLS_71 = __VLS_70({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_70));
        let __VLS_73;
        let __VLS_74;
        let __VLS_75;
        const __VLS_76 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.store.token))
                    return;
                if (!(__VLS_ctx.loggedIn))
                    return;
                __VLS_ctx.imageInput?.click();
            }
        };
        __VLS_72.slots.default;
        var __VLS_72;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (__VLS_ctx.uploadImage) },
            ref: "imageInput",
            hidden: true,
            type: "file",
            accept: "image/*",
        });
        /** @type {typeof __VLS_ctx.imageInput} */ ;
        for (const [sticker] of __VLS_getVForSourceType((__VLS_ctx.store.stickers.slice(0, 6)))) {
            const __VLS_77 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_78 = __VLS_asFunctionalComponent(__VLS_77, new __VLS_77({
                ...{ 'onClick': {} },
                key: (sticker.id),
                text: true,
            }));
            const __VLS_79 = __VLS_78({
                ...{ 'onClick': {} },
                key: (sticker.id),
                text: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_78));
            let __VLS_81;
            let __VLS_82;
            let __VLS_83;
            const __VLS_84 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    if (!(__VLS_ctx.loggedIn))
                        return;
                    __VLS_ctx.sendSticker(sticker.url);
                }
            };
            __VLS_80.slots.default;
            var __VLS_80;
        }
        const __VLS_85 = {}.ElInput;
        /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
        // @ts-ignore
        const __VLS_86 = __VLS_asFunctionalComponent(__VLS_85, new __VLS_85({
            ...{ 'onKeydown': {} },
            modelValue: (__VLS_ctx.draft),
            type: "textarea",
            rows: (3),
            placeholder: "输入消息，Enter 发送，Shift+Enter 换行",
        }));
        const __VLS_87 = __VLS_86({
            ...{ 'onKeydown': {} },
            modelValue: (__VLS_ctx.draft),
            type: "textarea",
            rows: (3),
            placeholder: "输入消息，Enter 发送，Shift+Enter 换行",
        }, ...__VLS_functionalComponentArgsRest(__VLS_86));
        let __VLS_89;
        let __VLS_90;
        let __VLS_91;
        const __VLS_92 = {
            onKeydown: (__VLS_ctx.onKey)
        };
        var __VLS_88;
        const __VLS_93 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_94 = __VLS_asFunctionalComponent(__VLS_93, new __VLS_93({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_95 = __VLS_94({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_94));
        let __VLS_97;
        let __VLS_98;
        let __VLS_99;
        const __VLS_100 = {
            onClick: (__VLS_ctx.send)
        };
        __VLS_96.slots.default;
        var __VLS_96;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-chat" },
        });
    }
}
if (__VLS_ctx.viewerOpen) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeImage) },
        ...{ onWheel: (__VLS_ctx.onViewerWheel) },
        ...{ class: "image-viewer" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.closeImage) },
        ...{ class: "viewer-close" },
        type: "button",
        'aria-label': "关闭",
    });
    if (__VLS_ctx.viewerImages.length > 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.viewerOpen))
                        return;
                    if (!(__VLS_ctx.viewerImages.length > 1))
                        return;
                    __VLS_ctx.changeImage(-1);
                } },
            ...{ class: "viewer-nav viewer-prev" },
            type: "button",
            'aria-label': "上一张",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: (__VLS_ctx.closeImage) },
        ...{ class: "viewer-stage" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
        ...{ onPointerdown: (__VLS_ctx.startDragging) },
        ...{ onPointermove: (__VLS_ctx.dragImage) },
        ...{ onPointerup: (__VLS_ctx.stopDragging) },
        ...{ onPointercancel: (__VLS_ctx.stopDragging) },
        ...{ class: "viewer-image" },
        ...{ class: ({ dragging: __VLS_ctx.dragging }) },
        src: (__VLS_ctx.viewerImage),
        alt: "图片预览",
        ...{ style: ({ transform: `translate(${__VLS_ctx.viewerOffset.x}px, ${__VLS_ctx.viewerOffset.y}px) scale(${__VLS_ctx.viewerScale}) rotate(${__VLS_ctx.viewerRotation}deg)` }) },
    });
    if (__VLS_ctx.viewerImages.length > 1) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
            ...{ onClick: (...[$event]) => {
                    if (!(__VLS_ctx.viewerOpen))
                        return;
                    if (!(__VLS_ctx.viewerImages.length > 1))
                        return;
                    __VLS_ctx.changeImage(1);
                } },
            ...{ class: "viewer-nav viewer-next" },
            type: "button",
            'aria-label': "下一张",
        });
    }
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ onClick: () => { } },
        ...{ class: "viewer-toolbar" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.viewerOpen))
                    return;
                __VLS_ctx.zoomImage(-0.1);
            } },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
    (Math.round(__VLS_ctx.viewerScale * 100));
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.viewerOpen))
                    return;
                __VLS_ctx.zoomImage(0.1);
            } },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (...[$event]) => {
                if (!(__VLS_ctx.viewerOpen))
                    return;
                __VLS_ctx.viewerRotation = (__VLS_ctx.viewerRotation + 90) % 360;
            } },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.fitImage) },
        type: "button",
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.button, __VLS_intrinsicElements.button)({
        ...{ onClick: (__VLS_ctx.fitImage) },
        type: "button",
    });
}
/** @type {__VLS_StyleScopedClasses['app']} */ ;
/** @type {__VLS_StyleScopedClasses['login']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-shell']} */ ;
/** @type {__VLS_StyleScopedClasses['card']} */ ;
/** @type {__VLS_StyleScopedClasses['conversation-list']} */ ;
/** @type {__VLS_StyleScopedClasses['sidebar-title']} */ ;
/** @type {__VLS_StyleScopedClasses['conversation']} */ ;
/** @type {__VLS_StyleScopedClasses['unread-badge']} */ ;
/** @type {__VLS_StyleScopedClasses['pin-button']} */ ;
/** @type {__VLS_StyleScopedClasses['chat-main']} */ ;
/** @type {__VLS_StyleScopedClasses['header-actions']} */ ;
/** @type {__VLS_StyleScopedClasses['messages']} */ ;
/** @type {__VLS_StyleScopedClasses['unread-jump']} */ ;
/** @type {__VLS_StyleScopedClasses['new-message-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['replying']} */ ;
/** @type {__VLS_StyleScopedClasses['composer-tools']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-chat']} */ ;
/** @type {__VLS_StyleScopedClasses['image-viewer']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-close']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-prev']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-stage']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-image']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-nav']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-next']} */ ;
/** @type {__VLS_StyleScopedClasses['viewer-toolbar']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            MessageItem: MessageItem,
            store: store,
            token: token,
            draft: draft,
            list: list,
            imageInput: imageInput,
            atBottom: atBottom,
            newMessageCount: newMessageCount,
            viewerOpen: viewerOpen,
            viewerScale: viewerScale,
            viewerRotation: viewerRotation,
            viewerOffset: viewerOffset,
            dragging: dragging,
            historyLimitDraft: historyLimitDraft,
            loggedIn: loggedIn,
            currentUnread: currentUnread,
            firstUnreadMessageId: firstUnreadMessageId,
            replyingMessage: replyingMessage,
            viewerImages: viewerImages,
            viewerImage: viewerImage,
            scrollToBottom: scrollToBottom,
            handleScroll: handleScroll,
            login: login,
            saveHistoryLimit: saveHistoryLimit,
            selectConversation: selectConversation,
            scrollToMessage: scrollToMessage,
            scrollToUnread: scrollToUnread,
            openImage: openImage,
            closeImage: closeImage,
            changeImage: changeImage,
            zoomImage: zoomImage,
            fitImage: fitImage,
            startDragging: startDragging,
            dragImage: dragImage,
            stopDragging: stopDragging,
            onViewerWheel: onViewerWheel,
            send: send,
            uploadImage: uploadImage,
            sendSticker: sendSticker,
            onKey: onKey,
        };
    },
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
});
; /* PartiallyEnd: #4569/main.vue */
