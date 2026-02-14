import axios from "axios";

import { cfg } from "./config.js";
import { log, safeErr } from "./logging.js";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function buildMessages({ history, userText }) {
  const system =
    "Kamu adalah penerjemah dari bahasa Inggris ke Bahasa Indonesia. " +
    "Tugasmu hanya menerjemahkan. Jaga arti, nada, dan struktur. " +
    "Pertahankan baris baru persis seperti sumber. " +
    "Jangan menambah penjelasan kecuali diminta user. " +
    "Jika ada istilah teknis, pertahankan istilah penting dalam bahasa aslinya bila lebih umum, " +
    "dengan penyesuaian yang natural.";

  const turns = Array.isArray(history) ? history : [];
  const filtered = turns
    .filter((t) => t && (t.role === "user" || t.role === "assistant"))
    .map((t) => ({ role: t.role, content: String(t.text || "") }));

  return [{ role: "system", content: system }, ...filtered, { role: "user", content: userText }];
}

export async function translateEnglishToIndonesian({ userText, history }) {
  const endpointBase = String(cfg.COOKMYBOTS_AI_ENDPOINT || "").replace(/\/+$/, "");
  const url = endpointBase ? `${endpointBase}/chat` : "";

  if (!url || !cfg.COOKMYBOTS_AI_KEY) {
    log.error("ai config missing", {
      COOKMYBOTS_AI_ENDPOINT_set: !!cfg.COOKMYBOTS_AI_ENDPOINT,
      COOKMYBOTS_AI_KEY_set: !!cfg.COOKMYBOTS_AI_KEY
    });
    return "Maaf, AI penerjemah belum dikonfigurasi. Coba hubungi admin bot.";
  }

  const timeoutMs = cfg.AI_TIMEOUT_MS;
  const maxRetries = cfg.AI_MAX_RETRIES;

  const messages = buildMessages({ history, userText });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const meta = { feature: "translate", attempt };
    log.info("ai call start", meta);

    try {
      const res = await axios.post(
        url,
        {
          messages,
          meta: { platform: "telegram", feature: "translate" }
        },
        {
          timeout: timeoutMs,
          headers: {
            Authorization: `Bearer ${cfg.COOKMYBOTS_AI_KEY}`,
            "Content-Type": "application/json"
          }
        }
      );

      const data = res?.data;
      const out = data?.output;
      const content = typeof out?.content === "string" ? out.content : "";

      if (!data?.ok) {
        log.warn("ai call non-ok", { ...meta, err: String(data?.error || data?.message || "non-ok") });
      }

      if (!content) {
        log.warn("ai call missing content", { ...meta });
        return "Maaf, aku tidak menerima hasil terjemahan dari AI.";
      }

      log.info("ai call success", { ...meta });
      return content.trim();
    } catch (e) {
      const errMsg = safeErr(e);
      log.error("ai call failed", { ...meta, err: errMsg });

      const status = e?.response?.status;
      const shouldRetry = !status || (status >= 500 && status < 600) || status === 429;

      if (attempt < maxRetries && shouldRetry) {
        const waitMs = 500 * Math.pow(2, attempt);
        await sleep(waitMs);
        continue;
      }

      return "Maaf, terjadi kendala saat menerjemahkan. Coba lagi sebentar ya.";
    }
  }

  return "Maaf, terjadi kendala saat menerjemahkan. Coba lagi sebentar ya.";
}
