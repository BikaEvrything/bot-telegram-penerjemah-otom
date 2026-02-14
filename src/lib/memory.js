import { cfg } from "./config.js";
import { withCollection } from "./db.js";
import { log } from "./logging.js";

const COL = "memory_messages";

const mem = new Map();
let warnedNoMongo = false;

function memKey({ platform, userId, chatId }) {
  return `${platform}:${String(userId)}:${String(chatId)}`;
}

function warnNoMongoOnce() {
  if (warnedNoMongo) return;
  warnedNoMongo = true;
  log.warn("MONGODB_URI missing - using in-memory memory (not persistent)", {
    persistence: false
  });
}

export async function addTurn({ platform, userId, chatId, role, text }) {
  const doc = {
    platform,
    userId: String(userId),
    chatId: String(chatId),
    role,
    text: String(text || "").slice(0, 8000),
    ts: new Date()
  };

  if (!cfg.MONGODB_URI) {
    warnNoMongoOnce();
    const k = memKey(doc);
    const arr = mem.get(k) || [];
    arr.push({ role: doc.role, text: doc.text, ts: doc.ts });
    if (arr.length > 60) arr.splice(0, arr.length - 60);
    mem.set(k, arr);
    return;
  }

  await withCollection(
    cfg.MONGODB_URI,
    COL,
    (col) => col.insertOne(doc),
    "insertOne"
  );
}

export async function getRecentTurns({ platform, userId, chatId, limit = 16 }) {
  if (!cfg.MONGODB_URI) {
    warnNoMongoOnce();
    const k = memKey({ platform, userId, chatId });
    const arr = mem.get(k) || [];
    return arr.slice(-limit).map((x) => ({ role: x.role, text: x.text }));
  }

  const q = {
    platform,
    userId: String(userId),
    chatId: String(chatId)
  };

  const rows = await withCollection(
    cfg.MONGODB_URI,
    COL,
    (col) => col.find(q).sort({ ts: -1 }).limit(limit).toArray(),
    "findRecent"
  );

  const list = Array.isArray(rows) ? rows : [];
  return list.reverse().map((r) => ({ role: r.role, text: r.text }));
}

export async function clearMemory({ platform, userId, chatId }) {
  if (!cfg.MONGODB_URI) {
    warnNoMongoOnce();
    mem.delete(memKey({ platform, userId, chatId }));
    return;
  }

  const q = {
    platform,
    userId: String(userId),
    chatId: String(chatId)
  };

  await withCollection(
    cfg.MONGODB_URI,
    COL,
    (col) => col.deleteMany(q),
    "deleteMany"
  );
}
