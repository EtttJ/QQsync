import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fs from "node:fs";
import path from "node:path";
import { WebSocketServer } from "ws";
import { config } from "./config.js";
import { listConversations, listMessages, listStickers, saveSticker } from "./db.js";
import { broadcast, createOutgoingMessage, fetchImage, getConversations, onMessage, sendGroupMessage, sendPrivateMessage, startOneBot } from "./onebot.js";
import type { Segment } from "./types.js";

const app = Fastify({ logger: true });
await app.register(cors);
await app.register(multipart);
const uploadDir = path.resolve(config.UPLOAD_DIR);
fs.mkdirSync(uploadDir, { recursive: true });
await app.register(fastifyStatic, { root: uploadDir, prefix: "/uploads/" });

function authorized(request: { headers: Record<string, string | string[] | undefined>; query?: unknown; body?: unknown }) {
  const header = request.headers.authorization;
  const query = request.query as { token?: string } | undefined;
  const body = request.body as { token?: string } | undefined;
  return header === `Bearer ${config.WEB_TOKEN}` || query?.token === config.WEB_TOKEN || body?.token === config.WEB_TOKEN;
}
app.addHook("onRequest", async (request, reply) => {
  if (request.url === "/health" || request.url.startsWith("/uploads/")) return;
  if (!authorized(request)) return reply.code(401).send({ error: "Unauthorized" });
});
app.get("/health", async () => ({ ok: true }));
app.get("/api/conversations", async (request) => {
  try { return { conversations: [...await getConversations(), ...listConversations()] }; }
  catch (error) { request.log.error({ error }, "Failed to load conversations"); return { conversations: listConversations() }; }
});
app.get("/api/image", async (request, reply) => {
  const file = (request.query as { file?: string }).file;
  if (!file) return reply.code(400).send({ error: "Image file is required" });
  try {
    const response = await fetchImage(file);
    reply.type(response.headers.get("content-type") ?? "application/octet-stream");
    return reply.send(response.body);
  } catch (error) {
    request.log.error({ error }, "Failed to proxy NapCat image");
    return reply.code(502).send({ error: "Unable to load image from NapCat" });
  }
});
app.get("/api/messages", async (request) => {
  const query = request.query as { group_id?: string; conversation_id?: string; before?: string; limit?: string };
  const id = query.conversation_id ?? query.group_id;
  if (!id) return { messages: [] };
  return { messages: listMessages(id, query.before ? Number(query.before) : undefined, query.limit ? Math.min(Number(query.limit), 1000) : undefined) };
});
app.post("/api/send", async (request, reply) => {
  const body = request.body as { chat_type?: "group" | "private"; target_id?: string; group_id?: string; message?: Segment[]; reply_to?: string };
  const chatType = body.chat_type ?? "group";
  const targetId = body.target_id ?? body.group_id;
  if (!targetId || !["group", "private"].includes(chatType) || !Array.isArray(body.message)) {
    request.log.warn({ targetId, chatType, messageIsArray: Array.isArray(body.message) }, "Rejected outgoing message");
    return reply.code(400).send({ error: "Invalid message", received_target_id: targetId });
  }
  const chatId = String(targetId);
  if (chatType === "group") await sendGroupMessage(chatId, body.message, body.reply_to);
  else await sendPrivateMessage(chatId, body.message, body.reply_to);
  try {
    broadcast(await createOutgoingMessage(chatType, chatId, body.message, body.reply_to));
  } catch (error) {
    request.log.warn({ error }, "Message sent but local echo could not be created");
  }
  return { ok: true };
});
app.get("/api/stickers", async () => ({ stickers: listStickers() }));
app.post("/api/stickers", async (request, reply) => {
  const file = await request.file();
  if (!file) return reply.code(400).send({ error: "Image is required" });
  const safeName = `${Date.now()}-${file.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const target = path.join(uploadDir, safeName);
  await pipeline(file.file, fs.createWriteStream(target));
  return saveSticker(file.filename || "sticker", `${config.PUBLIC_URL}/uploads/${safeName}`);
});

const server = await app.listen({ port: config.PORT, host: config.HOST });
const wss = new WebSocketServer({ server: app.server });
onMessage((message) => { const payload = JSON.stringify({ type: "message", message }); wss.clients.forEach((client) => { if (client.readyState === 1) client.send(payload); }); });
wss.on("connection", (socket, request) => {
  const token = new URL(request.url ?? "/", `http://${request.headers.host}`).searchParams.get("token");
  if (token !== config.WEB_TOKEN) { socket.close(1008, "Unauthorized"); return; }
  socket.send(JSON.stringify({ type: "ready" }));
});
console.log(`QQ Web Bridge listening on ${server}`);
startOneBot();

async function pipeline(source: NodeJS.ReadableStream, destination: NodeJS.WritableStream) {
  for await (const chunk of source) {
    if (!destination.write(chunk)) await new Promise<void>((resolve) => destination.once("drain", resolve));
  }
  destination.end();
}
