import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { log } from "../lib/logging.js";

export function registerCommands(bot) {
  const dir = path.dirname(fileURLToPath(import.meta.url));

  const files = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".js"))
    .filter((f) => f !== "loader.js")
    .filter((f) => !f.startsWith("_"));

  for (const f of files) {
    const url = pathToFileURL(path.join(dir, f)).href;
    import(url)
      .then((mod) => {
        const fn = mod?.default || mod?.register;
        if (typeof fn === "function") {
          fn(bot);
          log.info("command registered", { file: f });
        } else {
          log.warn("command skipped (no export)", { file: f });
        }
      })
      .catch((e) => {
        log.error("command import failed", { file: f, err: String(e?.message || e) });
      });
  }
}
