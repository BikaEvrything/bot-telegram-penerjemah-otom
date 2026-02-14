export function safeErr(err) {
  return (
    err?.response?.data?.error?.message ||
    err?.response?.data?.message ||
    err?.message ||
    String(err)
  );
}

function out(level, msg, meta) {
  const line = {
    level,
    msg,
    ...(meta && typeof meta === "object" ? meta : {})
  };
  console.log(JSON.stringify(line));
}

export const log = {
  info: (msg, meta) => out("info", msg, meta),
  warn: (msg, meta) => out("warn", msg, meta),
  error: (msg, meta) => out("error", msg, meta)
};
