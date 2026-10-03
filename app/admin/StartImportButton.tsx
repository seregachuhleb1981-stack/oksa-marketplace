"use client";

import { useEffect, useRef, useState } from "react";

type ImportRun = {
  id: string;
  status: string;
  processed: number;
  created: number;
  updated: number;
  failed: number;
  error: string | null;
};

export default function StartImportButton() {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const [run, setRun] = useState<ImportRun | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  function watch(id: string) {
    setRunId(id);

    const poll = async () => {
      try {
        const res = await fetch("/api/admin/import?runId=" + encodeURIComponent(id), {
          cache: "no-store"
        });
        const data = await res.json();

        if (!res.ok) {
          setMessage("Помилка перевірки: " + (data.error || res.status));
          return;
        }

        setRun(data.run);

        if (data.run.status !== "running") {
          if (timer.current) clearInterval(timer.current);
          setBusy(false);
          setMessage(
            data.run.status === "completed"
              ? "Імпорт завершено."
              : data.run.status === "completed_with_errors"
                ? "Імпорт завершено з помилками."
                : "Імпорт завершився помилкою."
          );
        }
      } catch {
        setMessage("Не вдалося перевірити стан імпорту.");
      }
    };

    void poll();
    timer.current = setInterval(() => void poll(), 2000);
  }

  async function start() {
    if (timer.current) clearInterval(timer.current);
    setBusy(true);
    setRun(null);
    setMessage("Запускаємо імпорт нового фіду…");

    try {
      const res = await fetch("/api/admin/import", {
        method: "POST",
        cache: "no-store"
      });
      const data = await res.json();

      if (!res.ok) {
        setBusy(false);
        setMessage("Помилка запуску: " + (data.error || res.status));
        return;
      }

      if (!data.runId) {
        setBusy(false);
        setMessage("Сервер не повернув ID імпорту.");
        return;
      }

      setMessage("Імпорт запущено. Перевіряємо прогрес автоматично…");
      watch(data.runId);
    } catch (error) {
      setBusy(false);
      setMessage(error instanceof Error ? "Помилка: " + error.message : "Помилка з'єднання.");
    }
  }

  return (
    <div style={{display:"grid",gap:8,justifyItems:"end"}}>
      <button className="primary-button" type="button" onClick={start} disabled={busy}>
        {busy ? "Імпорт працює…" : "Запустити імпорт"} <span>→</span>
      </button>

      {message && (
        <small style={{color:"var(--muted)",maxWidth:360,textAlign:"right"}}>
          {message}
        </small>
      )}

      {run && (
        <small style={{color:"var(--muted)",maxWidth:360,textAlign:"right"}}>
          {run.status}: {run.processed} оброблено · {run.created} створено · {run.updated} оновлено · {run.failed} помилок
          {run.error ? <><br />{run.error}</> : null}
        </small>
      )}
    </div>
  );
}
