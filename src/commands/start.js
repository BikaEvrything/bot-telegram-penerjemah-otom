export default function register(bot) {
  bot.command("start", async (ctx) => {
    await ctx.reply(
      "Halo. Aku bot penerjemah otomatis dari bahasa Inggris ke Bahasa Indonesia.\n\nCara pakai: kirim teks bahasa Inggris, nanti aku balas terjemahannya.\nKalau ingin hapus riwayat percakapan, pakai /reset."
    );
  });
}
