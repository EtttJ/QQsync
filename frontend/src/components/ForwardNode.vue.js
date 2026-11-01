const props = defineProps();
const faceMap = { "0": "😀", "1": "😄", "2": "😍", "4": "😎", "5": "😢", "6": "😡", "9": "😮", "14": "😴", "21": "😞", "24": "😋", "26": "😉", "28": "🤗", "29": "😱", "30": "😣", "31": "😠", "32": "😳", "33": "😥", "34": "😓", "36": "😇", "37": "😈", "38": "👿", "39": "😺", "40": "😸", "41": "😹", "42": "😻", "43": "😽", "44": "🙀", "45": "😿", "46": "😾", "53": "💔", "55": "🤔", "63": "😲", "64": "😦", "66": "🙂", "67": "🙃", "85": "🤩", "86": "🤭", "89": "😜", "96": "😬" };
function imageSource(segment) {
    return segment.data.url || (segment.data.file?.startsWith("http") ? segment.data.file : "");
}
function emojiText(segment) {
    return segment.data.text || faceMap[segment.data.id] || (segment.data.id ? `[表情 ${segment.data.id}]` : "[表情]");
}
debugger; /* PartiallyEnd: #3632/scriptSetup.vue */
const __VLS_ctx = {};
let __VLS_components;
let __VLS_directives;
const __VLS_0 = {}.ElCard;
/** @type {[typeof __VLS_components.ElCard, typeof __VLS_components.elCard, typeof __VLS_components.ElCard, typeof __VLS_components.elCard, ]} */ ;
// @ts-ignore
const __VLS_1 = __VLS_asFunctionalComponent(__VLS_0, new __VLS_0({
    ...{ class: "forward-node" },
    shadow: "never",
}));
const __VLS_2 = __VLS_1({
    ...{ class: "forward-node" },
    shadow: "never",
}, ...__VLS_functionalComponentArgsRest(__VLS_1));
var __VLS_4 = {};
__VLS_3.slots.default;
__VLS_asFunctionalElement(__VLS_intrinsicElements.strong, __VLS_intrinsicElements.strong)({});
(props.node.nickname || props.node.userId || "转发消息");
for (const [part, index] of __VLS_getVForSourceType((props.node.content))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.div, __VLS_intrinsicElements.div)({
        key: (index),
        ...{ class: "forward-part" },
    });
    if (part.type === 'text') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({});
        (part.data.text);
    }
    else if ((part.type === 'image' || part.type === 'mface') && __VLS_ctx.imageSource(part)) {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.img)({
            ...{ class: "forward-image" },
            src: (__VLS_ctx.imageSource(part)),
        });
    }
    else if (part.type === 'face' || part.type === 'emoji') {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "emoji" },
        });
        (__VLS_ctx.emojiText(part));
    }
    else {
        __VLS_asFunctionalElement(__VLS_intrinsicElements.span, __VLS_intrinsicElements.span)({
            ...{ class: "unsupported" },
        });
        (part.type);
    }
}
for (const [child, index] of __VLS_getVForSourceType((props.node.children))) {
    const __VLS_5 = {}.ForwardNode;
    /** @type {[typeof __VLS_components.ForwardNode, ]} */ ;
    // @ts-ignore
    const __VLS_6 = __VLS_asFunctionalComponent(__VLS_5, new __VLS_5({
        key: (index),
        node: (child),
    }));
    const __VLS_7 = __VLS_6({
        key: (index),
        node: (child),
    }, ...__VLS_functionalComponentArgsRest(__VLS_6));
}
var __VLS_3;
/** @type {__VLS_StyleScopedClasses['forward-node']} */ ;
/** @type {__VLS_StyleScopedClasses['forward-part']} */ ;
/** @type {__VLS_StyleScopedClasses['forward-image']} */ ;
/** @type {__VLS_StyleScopedClasses['emoji']} */ ;
/** @type {__VLS_StyleScopedClasses['unsupported']} */ ;
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {
            imageSource: imageSource,
            emojiText: emojiText,
        };
    },
    __typeProps: {},
});
export default (await import('vue')).defineComponent({
    setup() {
        return {};
    },
    __typeProps: {},
});
; /* PartiallyEnd: #4569/main.vue */
