import { MongoClient } from "mongodb";

import { log, safeErr } from "./logging.js";

let client = null;
let db = null;
let connecting = null;

export async function getDb(mongoUri) {
  if (!mongoUri) return null;
  if (db) return db;
  if (connecting) return connecting;

  connecting = (async () => {
    try {
      client = new MongoClient(mongoUri, {
        maxPoolSize: 10,
        ignoreUndefined: true
      });
      await client.connect();
      db = client.db();
      log.info("mongo connected", { ok: true });
      return db;
    } catch (e) {
      log.error("mongo connect failed", { err: safeErr(e) });
      client = null;
      db = null;
      return null;
    } finally {
      connecting = null;
    }
  })();

  return connecting;
}

export async function withCollection(mongoUri, name, fn, opName = "op") {
  const d = await getDb(mongoUri);
  if (!d) return null;

  try {
    const col = d.collection(name);
    return await fn(col);
  } catch (e) {
    log.error("mongo operation failed", {
      collection: name,
      op: opName,
      err: safeErr(e)
    });
    throw e;
  }
}
