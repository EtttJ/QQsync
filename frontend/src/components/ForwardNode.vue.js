const __VLS_props = defineProps();
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
(__VLS_ctx.node.nickname || __VLS_ctx.node.userId || "转发消息");
for (const [part, index] of __VLS_getVForSourceType((__VLS_ctx.node.content))) {
    __VLS_asFunctionalElement(__VLS_intrinsicElements.p, __VLS_intrinsicElements.p)({
        key: (index),
    });
    (part.type === "text" ? part.data.text : `[${part.type}]`);
}
for (const [child, index] of __VLS_getVForSourceType((__VLS_ctx.node.children))) {
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
var __VLS_dollars;
const __VLS_self = (await import('vue')).defineComponent({
    setup() {
        return {};
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
