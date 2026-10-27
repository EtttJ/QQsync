import { computed } from "vue";
import ForwardNode from "./ForwardNode.vue";
const props = defineProps();
const emit = defineEmits();
const minute = computed(() => new Date(props.message.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
function bilibili(segment) { const text = JSON.stringify(segment.data); return text.match(/https?:\/\/(?:b23\.tv|www\.bilibili\.com|bilibili\.com)[^\s"\\]+/)?.[0]; }
function hideAvatar(event) { event.target.style.visibility = "hidden"; }
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
__VLS_asFunctionalElement(__VLS_intrinsicElements.article, __VLS_intrinsicElements.article)({
    id: (`message-${__VLS_ctx.message.messageId}`),
    ...{ class: "message" },
    ...{ class: ({ mention: __VLS_ctx.message.isAtMe, mine: __VLS_ctx.message.isMine }) },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
    ...{ onError: (__VLS_ctx.hideAvatar) },
    ...{ class: "avatar" },
    src: (__VLS_ctx.message.avatar),
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "body" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "meta" },
});
__VLS_asFunctionalElement(__VLS_intrinsicElements.b, __VLS_intrinsicElements.b)({});
(__VLS_ctx.message.nickname);
__VLS_asFunctionalElement(__VLS_intrinsicElements.time, __VLS_intrinsicElements.time)({});
(__VLS_ctx.minute);
const __VLS_0 = {}.ElButton;
/** @type {[typeof __VLS_components.ElButton, typeof __VLS_components.elButton, typeof __VLS_components.ElButton, typeof __VLS_components.elButton, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ 'onClick': {} },
    text: true,
    size: "small",
}));
const __VLS_2 = __VLS_1({
    ...{ 'onClick': {} },
    text: true,
    size: "small",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
let __VLS_4;
let __VLS_5;
let __VLS_6;
const __VLS_7 = {
    onClick: (...[$event]) => {
        __VLS_ctx.emit('reply', __VLS_ctx.message.messageId);
    }
};
__VLS_3.slots.default;
var __VLS_3;
if (__VLS_ctx.message.isAtMe) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
        ...{ class: "at" },
    });
}
__VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
    ...{ class: "content" },
});
for (const [segment, index] of __VLS_getVForSourceType((__VLS_ctx.message.segments))) {
    (index);
    if (segment.type === 'text') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (segment.data.text);
    }
    else if (segment.type === 'at') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "at" },
        });
        (segment.data.qq);
    }
    else if (segment.type === 'image') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ class: "inline-image" },
            src: (segment.data.url || (segment.data.file?.startsWith('http') ? segment.data.file : '')),
        });
    }
    else if (__VLS_ctx.bilibili(segment)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
            href: (__VLS_ctx.bilibili(segment)),
            target: "_blank",
            rel: "noreferrer",
        });
        (segment.data.title || __VLS_ctx.bilibili(segment));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "unsupported" },
        });
        (segment.type);
    }
}
if (__VLS_ctx.message.forward?.length) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.details, __VLS_intrinsicElements.details)({
        ...{ class: "forward" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.summary, __VLS_intrinsicElements.summary)({});
    (__VLS_ctx.message.forward.length);
    for (const [node, index] of __VLS_getVForSourceType((__VLS_ctx.message.forward))) {
        /** @type {[typeof ForwardNode, ]} */ ;
        // @ts-ignore
        const __VLS_8 = __VLS_asFunctionalComponent(ForwardNode, new ForwardNode({
            key: (index),
            node: (node),
        }));
        const __VLS_9 = __VLS_8({
            key: (index),
            node: (node),
        }, ...__VLS_functionalComponentArgsRest(__VLS_8));
    }
}
if (__VLS_ctx.message.isAtMe) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        ...{ class: "jump" },
    });
    __VLS_asFunctionalElement(__VLS_intrinsicElements.a, __VLS_intrinsicElements.a)({
        href: (`#message-${__VLS_ctx.message.messageId}`),
    });
}
/** @type {__VLS_StyleScopedClasses['message']} */ ;
/** @type {__VLS_StyleScopedClasses['avatar']} */ ;
/** @type {__VLS_StyleScopedClasses['body']} */ ;
/** @type {__VLS_StyleScopedClasses['meta']} */ ;
/** @type {__VLS_StyleScopedClasses['at']} */ ;
/** @type {__VLS_StyleScopedClasses['content']} */ ;
/** @type {__VLS_StyleScopedClasses['at']} */ ;
/** @type {__VLS_StyleScopedClasses['inline-image']} */ ;
/** @type {__VLS_StyleScopedClasses['unsupported']} */ ;
/** @type {__VLS_StyleScopedClasses['forward']} */ ;
/** @type {__VLS_StyleScopedClasses['jump']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            ForwardNode: ForwardNode,
            emit: emit,
            minute: minute,
            bilibili: bilibili,
            hideAvatar: hideAvatar,
        };
    },
    __typeEmits: {},
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeEmits: {},
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
