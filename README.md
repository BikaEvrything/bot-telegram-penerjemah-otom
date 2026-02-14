Bot Telegram penerjemah otomatis bahasa Inggris ke Bahasa Indonesia.

Cara pakai cepat
1) Set TELEGRAM_BOT_TOKEN
2) Jalankan bot
3) Kirim teks bahasa Inggris, bot akan membalas terjemahan bahasa Indonesia

Fitur
1) Terjemahan otomatis untuk setiap pesan teks non-perintah
2) Perintah /start, /help, /reset
3) Memori jangka panjang (MongoDB) untuk konteks terjemahan; fallback in-memory jika MONGODB_URI tidak diset
4) Long polling via @grammyjs/runner untuk deployment yang stabil
5) Proteksi dasar: in-flight guard per chat untuk menghindari banyak request bersamaan

Setup
1) Install
npm install

2) Buat file .env dari .env.sample lalu isi TELEGRAM_BOT_TOKEN

3) Jalankan lokal
npm run dev

4) Jalankan production
npm start

Environment variables
1) TELEGRAM_BOT_TOKEN (wajib)
2) MONGODB_URI (opsional, tapi disarankan untuk memory persisten)
3) COOKMYBOTS_AI_ENDPOINT (wajib untuk AI, biasanya sudah disediakan CookMyBots). Default: https://api.cookmybots.com/api/ai
4) COOKMYBOTS_AI_KEY (wajib untuk AI, biasanya sudah disediakan CookMyBots)
5) AI_TIMEOUT_MS (opsional, default 600000)
6) AI_MAX_RETRIES (opsional, default 2)
7) CONCURRENCY (opsional, default 20)

Perintah
1) /start
Menjelaskan cara pakai.

2) /help
Instruksi singkat + contoh.

3) /reset
Menghapus memori percakapan user pada chat tersebut.

Database
Koleksi: memory_messages
Field minimal:
platform, userId, chatId, role, text, ts

Troubleshooting
1) Bot tidak jalan dan minta token
Pastikan TELEGRAM_BOT_TOKEN sudah diset.

2) Bot jalan tapi tidak membalas
Periksa log untuk error 409 Conflict atau error Telegram API.

3) Memory tidak persisten
Set MONGODB_URI. Jika tidak ada, bot akan pakai in-memory dan log warning.
