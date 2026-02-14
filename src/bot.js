import { Bot } from "grammy";

import { registerCommands } from "./commands/loader.js";
import { translateEnglishToIndonesian } from "./lib/ai.js";
import { addTurn, getRecentTurns, clearMemory } from "./lib/memory.js";
import { log, safeErr } from "./lib/logging.js";

export function createBot(token) {
  const bot = new Bot(token);

  bot.catch((err) => {
    const ctx = err?.ctx;
    log.error("bot error", {
      err: safeErr(err?.error || err),
      chatId: ctx?.chat?.id ? String(ctx.chat.id) : "",
      fromId: ctx?.from?.id ? String(ctx.from.id) : ""
    });
  });

  registerCommands(bot);

  const inFlightByChat = new Map();

  bot.on("message:text", async (ctx, next) => {
    const raw = ctx.message?.text || "";
    if (raw.startsWith("/")) return next();

    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) {
      return ctx.reply("Maaf, aku butuh info chat dan user untuk memproses pesan ini.");
    }

    const key = String(chatId);
    if (inFlightByChat.get(key)) {
      return ctx.reply("Sedang menerjemahkan pesan sebelumnya. Coba lagi sebentar ya.");
    }

    inFlightByChat.set(key, true);

    try {
      const text = raw.trim();
      if (!text) return;

      await addTurn({
        platform: "telegram",
        userId: String(userId),
        chatId: String(chatId),
        role: "user",
        text
      });

      const history = await getRecentTurns({
        platform: "telegram",
        userId: String(userId),
        chatId: String(chatId),
        limit: 16
      });

      const translated = await translateEnglishToIndonesian({
        userText: text,
        history
      });

      await ctx.reply(translated || "Maaf, aku belum dapat hasil terjemahan.");

      await addTurn({
        platform: "telegram",
        userId: String(userId),
        chatId: String(chatId),
        role: "assistant",
        text: translated || ""
      });
    } catch (e) {
      log.error("translate handler failed", { err: safeErr(e) });
      await ctx.reply("Maaf, terjadi kendala saat menerjemahkan. Coba lagi sebentar ya.");
    } finally {
      inFlightByChat.delete(key);
    }
  });

  bot.on("message", async (ctx) => {
    const hasText = !!ctx.message?.text;
    if (hasText) return;
    await ctx.reply("Aku hanya bisa menerjemahkan pesan teks (bahasa Inggris ke Indonesia). Kirim teks ya.");
  });

  bot.command("_internal_reset_inflight", async (ctx) => {
    const chatId = ctx.chat?.id;
    if (chatId) inFlightByChat.delete(String(chatId));
    await ctx.reply("OK");
  });

  bot.command("reset", async (ctx) => {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) return ctx.reply("Maaf, tidak bisa menentukan chat/user.");

    try {
      await clearMemory({
        platform: "telegram",
        userId: String(userId),
        chatId: String(chatId)
      });
      await ctx.reply("Riwayat percakapan kamu untuk chat ini sudah dihapus.");
    } catch (e) {
      log.error("reset failed", { err: safeErr(e) });
      await ctx.reply("Maaf, gagal menghapus riwayat. Coba lagi sebentar ya.");
    }
  });

  return bot;
}
