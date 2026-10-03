"use client";

import { useState } from "react";

export default function StartImportButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function start() {
    setBusy(true);
    setMessage("Запускаємо імпорт нового фіду…");
    try {
      const res = await fetch("/api/admin/import", { method: "POST", cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setMessage("Помилка запуску: " + (data.error || res.status));
        return;
      }
      if (!data.runId) {
        setMessage("Сервер не повернув ID імпорту.");
        return;
      }
      setMessage("Імпорт запущено. Перезавантажте сторінку через кілька секунд для перегляду прогресу.");
    } catch (error) {
      setMessage(error instanceof Error ? "Помилка: " + error.message : "Помилка з'єднання.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{display:"grid",gap:8,justifyItems:"end"}}>
      <button className="primary-button" type="button" onClick={start} disabled={busy}>
        {busy ? "Запускаємо…" : "Запустити імпорт"} <span>→</span>
      </button>
      {message && <small style={{color:"var(--muted)",maxWidth:320,textAlign:"right"}}>{message}</small>}
    </div>
  );
}
