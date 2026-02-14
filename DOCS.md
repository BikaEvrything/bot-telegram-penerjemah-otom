Bot ini menerjemahkan pesan teks dari bahasa Inggris ke Bahasa Indonesia.

Cara pakai
Kirim pesan teks bahasa Inggris, bot akan membalas dengan terjemahan Bahasa Indonesia.

Perintah
1) /start
Perkenalan singkat dan cara pakai.

2) /help
Instruksi ringkas dan contoh.

3) /reset
Menghapus memori percakapan kamu untuk chat ini.

Contoh
User: I will be late for the meeting.
Bot: Aku akan terlambat untuk rapat.

Environment variables
1) TELEGRAM_BOT_TOKEN
Token bot Telegram dari BotFather.

2) MONGODB_URI
Koneksi MongoDB untuk menyimpan memori percakapan. Jika tidak diisi, bot tetap berjalan dengan memori in-memory.

3) COOKMYBOTS_AI_ENDPOINT
Base URL AI gateway CookMyBots. Bot akan memanggil endpoint ini + /chat.

4) COOKMYBOTS_AI_KEY
API key untuk AI gateway CookMyBots.

5) AI_TIMEOUT_MS
Timeout request AI (default 600000).

6) AI_MAX_RETRIES
Jumlah retry untuk error sementara (default 2).

7) CONCURRENCY
Concurrency runner grammY (default 20).
