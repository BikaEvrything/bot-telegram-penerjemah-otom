import { clearMemory } from "../lib/memory.js";
import { log, safeErr } from "../lib/logging.js";

export default function register(bot) {
  bot.command("reset", async (ctx) => {
    const chatId = ctx.chat?.id;
    const userId = ctx.from?.id;

    if (!chatId || !userId) {
      return ctx.reply("Maaf, tidak bisa menentukan chat/user untuk reset.");
    }

    try {
      await clearMemory({
        platform: "telegram",
        userId: String(userId),
        chatId: String(chatId)
      });
      await ctx.reply("Riwayat percakapan kamu untuk chat ini sudah dihapus.");
    } catch (e) {
      log.error("/reset failed", { err: safeErr(e) });
      await ctx.reply("Maaf, gagal menghapus riwayat. Coba lagi sebentar ya.");
    }
  });
}
