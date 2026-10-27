export type Segment = { type: string; data: Record<string, string> };
export type ForwardNode = { userId?: string; nickname?: string; time?: number; content: Segment[]; children?: ForwardNode[] };
export type ChatMessage = { messageId: string; chatType: "group" | "private"; chatId: string; groupId: string; userId: string; nickname: string; avatar: string; time: number; segments: Segment[]; isAtMe: boolean; isMine?: boolean; replyTo?: string; forward?: ForwardNode[] };
export type Sticker = { id: number; name: string; url: string };
export type Conversation = { id: string; type: "group" | "private"; name: string; avatar: string };
