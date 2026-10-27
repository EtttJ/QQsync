export type Segment = {
  type: string;
  data: Record<string, string>;
};

export type ForwardNode = {
  userId?: string;
  nickname?: string;
  time?: number;
  content: Segment[];
  children?: ForwardNode[];
};

export type ChatMessage = {
  messageId: string;
  chatType: "group" | "private";
  chatId: string;
  groupId: string;
  userId: string;
  nickname: string;
  avatar: string;
  time: number;
  segments: Segment[];
  isAtMe: boolean;
  isMine?: boolean;
  replyTo?: string;
  forward?: ForwardNode[];
};

export type OneBotEvent = {
  post_type?: string;
  message_type?: string;
  group_id?: number | string;
  user_id?: number | string;
  message_id?: number | string;
  time?: number;
  sender?: { user_id?: number | string; nickname?: string; card?: string; };
  message?: Segment[] | string;
  raw_message?: string;
  self_id?: number | string;
};

export type Conversation = {
  id: string;
  type: "group" | "private";
  name: string;
  avatar: string;
};

export type LoginInfo = { user_id: number | string; nickname?: string };
