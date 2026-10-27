import { computed, nextTick, onMounted, ref, watch } from "vue";
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
const loggedIn = computed(() => Boolean(store.token && store.conversation));
const currentKey = computed(() => store.conversation ? store.conversationKey(store.conversation) : "");
const currentUnread = computed(() => currentKey.value ? (store.unread[currentKey.value] ?? 0) : 0);
const firstUnreadMessageId = computed(() => currentKey.value ? store.firstUnreadMessage[currentKey.value] : undefined);
function scrollToBottom() {
    if (!list.value)
        return;
    list.value.scrollTop = list.value.scrollHeight;
    atBottom.value = true;
    newMessageCount.value = 0;
}
function handleScroll() {
    if (!list.value)
        return;
    atBottom.value = list.value.scrollHeight - list.value.scrollTop - list.value.clientHeight <= 48;
    if (atBottom.value)
        newMessageCount.value = 0;
}
async function login() { if (!token.value)
    return ElMessage.warning("请输入访问密码"); try {
    store.setToken(token.value);
    await store.loadConversations();
    await store.loadStickers();
    if (store.conversations[0])
        await selectConversation(store.conversations[0]);
    store.connect();
}
catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "连接失败");
} }
async function selectConversation(item) { try {
    await store.selectConversation(item);
    await nextTick(scrollToBottom);
}
catch (error) {
    ElMessage.error(error instanceof Error ? error.message : "加载会话失败");
} }
function scrollToUnread() {
    if (!firstUnreadMessageId.value)
        return;
    document.getElementById(`message-${firstUnreadMessageId.value}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (currentKey.value) {
        store.unread[currentKey.value] = 0;
        delete store.firstUnreadMessage[currentKey.value];
    }
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
onMounted(() => { if (store.token)
    void login(); });
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
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.store.token))
                    return;
                if (!(__VLS_ctx.loggedIn))
                    return;
                __VLS_ctx.store.$reset();
            }
        };
        __VLS_23.slots.default;
        var __VLS_23;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ onScroll: (__VLS_ctx.handleScroll) },
            ref: "list",
            ...{ class: "messages" },
        });
        /** @type {typeof __VLS_ctx.list} */ ;
        for (const [message] of __VLS_getVForSourceType((__VLS_ctx.store.messages))) {
            /** @type {[typeof MessageItem, ]} */ ;
            // @ts-ignore
            const __VLS_28 = __VLS_asFunctionalComponent(MessageItem, new MessageItem({
                ...{ 'onReply': {} },
                key: (message.messageId),
                message: (message),
                stickers: (__VLS_ctx.store.stickers),
            }));
            const __VLS_29 = __VLS_28({
                ...{ 'onReply': {} },
                key: (message.messageId),
                message: (message),
                stickers: (__VLS_ctx.store.stickers),
            }, ...__VLS_functionalComponentArgsRest(__VLS_28));
            let __VLS_31;
            let __VLS_32;
            let __VLS_33;
            const __VLS_34 = {
                onReply: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    if (!(__VLS_ctx.loggedIn))
                        return;
                    __VLS_ctx.store.replyTo = $event;
                }
            };
            var __VLS_30;
        }
        if (__VLS_ctx.currentUnread && __VLS_ctx.firstUnreadMessageId) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "unread-jump" },
            });
            const __VLS_35 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_36 = __VLS_asFunctionalComponent(__VLS_35, new __VLS_35({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }));
            const __VLS_37 = __VLS_36({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_36));
            let __VLS_39;
            let __VLS_40;
            let __VLS_41;
            const __VLS_42 = {
                onClick: (__VLS_ctx.scrollToUnread)
            };
            __VLS_38.slots.default;
            (__VLS_ctx.currentUnread);
            var __VLS_38;
        }
        if (!__VLS_ctx.atBottom) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "new-message-indicator" },
            });
            const __VLS_43 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_44 = __VLS_asFunctionalComponent(__VLS_43, new __VLS_43({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }));
            const __VLS_45 = __VLS_44({
                ...{ 'onClick': {} },
                type: "primary",
                round: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_44));
            let __VLS_47;
            let __VLS_48;
            let __VLS_49;
            const __VLS_50 = {
                onClick: (__VLS_ctx.scrollToBottom)
            };
            __VLS_46.slots.default;
            (__VLS_ctx.newMessageCount ? `${__VLS_ctx.newMessageCount} 条新消息` : "滚动到最底部");
            var __VLS_46;
        }
        if (__VLS_ctx.store.replyTo) {
            __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
                ...{ class: "replying" },
            });
            (__VLS_ctx.store.replyTo);
            const __VLS_51 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_52 = __VLS_asFunctionalComponent(__VLS_51, new __VLS_51({
                ...{ 'onClick': {} },
                text: true,
            }));
            const __VLS_53 = __VLS_52({
                ...{ 'onClick': {} },
                text: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_52));
            let __VLS_55;
            let __VLS_56;
            let __VLS_57;
            const __VLS_58 = {
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
            __VLS_54.slots.default;
            var __VLS_54;
        }
        __VLS_asFunctionalElement(__VLS_intrinsicElements.footer, __VLS_intrinsicElements.footer)({});
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "composer-tools" },
        });
        const __VLS_59 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_60 = __VLS_asFunctionalComponent(__VLS_59, new __VLS_59({
            ...{ 'onClick': {} },
        }));
        const __VLS_61 = __VLS_60({
            ...{ 'onClick': {} },
        }, ...__VLS_functionalComponentArgsRest(__VLS_60));
        let __VLS_63;
        let __VLS_64;
        let __VLS_65;
        const __VLS_66 = {
            onClick: (...[$event]) => {
                if (!!(!__VLS_ctx.store.token))
                    return;
                if (!(__VLS_ctx.loggedIn))
                    return;
                __VLS_ctx.imageInput?.click();
            }
        };
        __VLS_62.slots.default;
        var __VLS_62;
        __VLS_asFunctionalElement(__VLS_intrinsicElements.input)({
            ...{ onChange: (__VLS_ctx.uploadImage) },
            ref: "imageInput",
            hidden: true,
            type: "file",
            accept: "image/*",
        });
        /** @type {typeof __VLS_ctx.imageInput} */ ;
        for (const [sticker] of __VLS_getVForSourceType((__VLS_ctx.store.stickers.slice(0, 6)))) {
            const __VLS_67 = {}.ElButton;
            /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
            // @ts-ignore
            const __VLS_68 = __VLS_asFunctionalComponent(__VLS_67, new __VLS_67({
                ...{ 'onClick': {} },
                key: (sticker.id),
                text: true,
            }));
            const __VLS_69 = __VLS_68({
                ...{ 'onClick': {} },
                key: (sticker.id),
                text: true,
            }, ...__VLS_functionalComponentArgsRest(__VLS_68));
            let __VLS_71;
            let __VLS_72;
            let __VLS_73;
            const __VLS_74 = {
                onClick: (...[$event]) => {
                    if (!!(!__VLS_ctx.store.token))
                        return;
                    if (!(__VLS_ctx.loggedIn))
                        return;
                    __VLS_ctx.sendSticker(sticker.url);
                }
            };
            __VLS_70.slots.default;
            var __VLS_70;
        }
        const __VLS_75 = {}.ElInput;
        /** @type {[typeof __VLS_components.ElInput, typeof __VLS_components.elInput, ]} */ ;
        // @ts-ignore
        const __VLS_76 = __VLS_asFunctionalComponent(__VLS_75, new __VLS_75({
            ...{ 'onKeydown': {} },
            modelValue: (__VLS_ctx.draft),
            type: "textarea",
            rows: (3),
            placeholder: "输入消息，Enter 发送，Shift+Enter 换行",
        }));
        const __VLS_77 = __VLS_76({
            ...{ 'onKeydown': {} },
            modelValue: (__VLS_ctx.draft),
            type: "textarea",
            rows: (3),
            placeholder: "输入消息，Enter 发送，Shift+Enter 换行",
        }, ...__VLS_functionalComponentArgsRest(__VLS_76));
        let __VLS_79;
        let __VLS_80;
        let __VLS_81;
        const __VLS_82 = {
            onKeydown: (__VLS_ctx.onKey)
        };
        var __VLS_78;
        const __VLS_83 = {}.ElButton;
        /** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
        // @ts-ignore
        const __VLS_84 = __VLS_asFunctionalComponent(__VLS_83, new __VLS_83({
            ...{ 'onClick': {} },
            type: "primary",
        }));
        const __VLS_85 = __VLS_84({
            ...{ 'onClick': {} },
            type: "primary",
        }, ...__VLS_functionalComponentArgsRest(__VLS_84));
        let __VLS_87;
        let __VLS_88;
        let __VLS_89;
        const __VLS_90 = {
            onClick: (__VLS_ctx.send)
        };
        __VLS_86.slots.default;
        var __VLS_86;
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
            ...{ class: "empty-chat" },
        });
    }
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
/** @type {__VLS_StyleScopedClasses['messages']} */ ;
/** @type {__VLS_StyleScopedClasses['unread-jump']} */ ;
/** @type {__VLS_StyleScopedClasses['new-message-indicator']} */ ;
/** @type {__VLS_StyleScopedClasses['replying']} */ ;
/** @type {__VLS_StyleScopedClasses['composer-tools']} */ ;
/** @type {__VLS_StyleScopedClasses['empty-chat']} */ ;
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
            loggedIn: loggedIn,
            currentUnread: currentUnread,
            firstUnreadMessageId: firstUnreadMessageId,
            scrollToBottom: scrollToBottom,
            handleScroll: handleScroll,
            login: login,
            selectConversation: selectConversation,
            scrollToUnread: scrollToUnread,
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
