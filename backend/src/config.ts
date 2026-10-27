import dotenv from "dotenv";
import path from "node:path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), "..", ".env") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(8787),
  PUBLIC_URL: z.string().url().default("http://127.0.0.1:8787"),
  HOST: z.string().default("0.0.0.0"),
  NAPCAT_WS: z.string().url(),
  NAPCAT_HTTP: z.string().url(),
  NAPCAT_TOKEN: z.string().default(""),
  WEB_TOKEN: z.string().min(1),
  HISTORY_LIMIT: z.coerce.number().int().positive().max(1000).default(200),
  UPLOAD_DIR: z.string().default("./data/uploads"),
  DB_FILE: z.string().default("./data/qq-bridge.db")
});

export const config = schema.parse(process.env);
