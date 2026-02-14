export default function register(bot) {
  bot.command("help", async (ctx) => {
    await ctx.reply(
      "Kirim teks bahasa Inggris, aku akan menerjemahkan ke Bahasa Indonesia.\n\nContoh:\nUser: I will be late for the meeting.\nBot: Aku akan terlambat untuk rapat.\n\nPerintah:\n/start untuk info singkat\n/help untuk bantuan\n/reset untuk menghapus riwayat percakapan"
    );
  });
}
