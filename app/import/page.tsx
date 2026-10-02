"use client";
import { useState } from "react";

type ImportRun = { id:string; status:string; processed:number; created:number; updated:number; failed:number; error:string|null };

export default function ImportPage() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function startImport() {
    setBusy(true); setStatus("Запускаємо імпорт нового фіду…");
    try {
      const response = await fetch("/api/admin/import", { method: "POST", cache: "no-store" });
      const data = await response.json();
      if (!response.ok) { setStatus(response.status === 401 ? "Сесія адміністратора недійсна. Увійдіть в адмін-панель знову." : "Помилка запуску: " + (data.error || "невідома помилка")); return; }
      const runId = typeof data.runId === "string" ? data.runId : "";
      if (!runId) { setStatus("Сервер не повернув ID імпорту."); return; }
      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const progress = await fetch("/api/admin/import?runId=" + encodeURIComponent(runId), { cache: "no-store" });
        const progressData = await progress.json();
        if (!progress.ok) { setStatus("Помилка перевірки імпорту: " + (progressData.error || "невідома помилка")); return; }
        const run = progressData.run as ImportRun | undefined;
        if (!run) { setStatus("Сервер не повернув дані про імпорт."); return; }
        if (run.status === "running") { setStatus("Імпорт триває: " + run.processed + " оброблено, " + run.created + " додано, " + run.updated + " оновлено."); continue; }
        if (run.status === "completed" || run.status === "completed_with_errors") setStatus("Готово: " + run.processed + " оброблено, " + run.created + " додано, " + run.updated + " оновлено, помилок " + run.failed + ".");
        else setStatus("Імпорт завершився зі статусом «" + run.status + "». " + (run.error || ""));
        break;
      }
    } catch (error) { setStatus(error instanceof Error ? "Помилка: " + error.message : "Помилка зєднання."); }
    finally { setBusy(false); }
  }

  return <main className="admin-shell import-shell"><section className="admin-card import-card">
    <span className="eyebrow">Синхронізація каталогу</span>
    <h1>Імпорт каталогу OKSA</h1>
    <p>Новий фід запускається без введення секрету — доступ перевіряється через адмін-сесію.</p>
    <button className="primary-button" type="button" onClick={startImport} disabled={busy}>{busy ? "Імпорт триває…" : "Завантажити новий фід"}</button>
    {status && <p className="import-status" role="status">{status}</p>}
    <a className="catalog-back" href="/admin">← Повернутися до адмін-панелі</a>
  </section></main>;
}