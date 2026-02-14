import "dotenv/config";

import { run } from "@grammyjs/runner";

import { cfg } from "./lib/config.js";
import { log, safeErr } from "./lib/logging.js";
import { createBot } from "./bot.js";

process.on("unhandledRejection", (reason) => {
  log.error("process unhandledRejection", { err: safeErr(reason) });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  log.error("process uncaughtException", { err: safeErr(err) });
  process.exit(1);
});

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function deleteWebhookSafe(bot) {
  try {
    await bot.api.deleteWebhook({ drop_pending_updates: true });
    log.info("telegram deleteWebhook ok", { dropPendingUpdates: true });
  } catch (e) {
    log.warn("telegram deleteWebhook failed", { err: safeErr(e) });
  }
}

async function startPollingWithConflictBackoff(bot) {
  const backoffs = [2000, 5000, 10000, 20000];
  let i = 0;

  while (true) {
    try {
      log.info("polling start", { mode: "long_polling", concurrency: cfg.CONCURRENCY });
      const runner = run(bot, { concurrency: cfg.CONCURRENCY });
      await runner.task();
      log.warn("polling stopped", { reason: "runner.task resolved" });
      i = 0;
    } catch (e) {
      const msg = safeErr(e);
      const code = e?.error_code || e?.response?.status;
      const isConflict = code === 409 || String(msg).includes("409");

      if (isConflict) {
        const waitMs = backoffs[Math.min(i, backoffs.length - 1)];
        log.warn("polling conflict (409) - retrying", { waitMs, err: msg });
        await sleep(waitMs);
        i += 1;
        continue;
      }

      log.error("polling failed", { err: msg });
      throw e;
    }
  }
}

async function boot() {
  log.info("boot start", {
    platform: "telegram",
    polling: true,
    TELEGRAM_BOT_TOKEN_set: !!cfg.TELEGRAM_BOT_TOKEN,
    MONGODB_URI_set: !!cfg.MONGODB_URI,
    COOKMYBOTS_AI_ENDPOINT_set: !!cfg.COOKMYBOTS_AI_ENDPOINT,
    COOKMYBOTS_AI_KEY_set: !!cfg.COOKMYBOTS_AI_KEY
  });

  if (!cfg.TELEGRAM_BOT_TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is required. Set it in environment variables and redeploy.");
    process.exit(1);
  }

  const bot = createBot(cfg.TELEGRAM_BOT_TOKEN);

  try {
    await bot.init();
  } catch (e) {
    log.warn("bot.init failed", { err: safeErr(e) });
  }

  await deleteWebhookSafe(bot);
  await startPollingWithConflictBackoff(bot);
}

boot().catch((e) => {
  log.error("boot failed", { err: safeErr(e) });
  process.exit(1);
});
