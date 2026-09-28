"use client";

import { FormEvent, useState } from "react";

type ImportRun = { id:string; status:string; processed:number; created:number; updated:number; failed:number; error:string|null };

async function readApiResponse(response: Response) {
  const raw = await response.text();
  try { return { data: JSON.parse(raw) as Record<string, unknown>, raw }; }
  catch { return { data: null, raw }; }
}

export default function ImportPage() {
  const [secret, setSecret] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = secret.trim();
    if (!value) return;
    setBusy(true);
    setStatus("Запускаємо імпорт у фоні…");

    try {
      const response = await fetch("/api/import", {
        method: "POST",
        headers: { "x-import-secret": value },
        cache: "no-store"
      });
      const { data, raw } = await readApiResponse(response);

      if (!response.ok) {
        const message = typeof data?.error === "string" ? data.error : raw.slice(0, 240);
        setStatus(`Помилка запуску (${response.status}): ${message || "сервер не повернув деталей"}`);
        return;
      }

      const runId = typeof data?.runId === "string" ? data.runId : "";
      if (!runId) {
        setStatus("Сервер не повернув ID імпорту. Перевіряємо конфігурацію API.");
        return;
      }

      while (true) {
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let progress: Response;
        try {
          progress = await fetch(`/api/import?runId=${encodeURIComponent(runId)}`, {
            headers: { "x-import-secret": value },
            cache: "no-store"
          });
        } catch {
          setStatus("З'єднання із сервером перервано під час імпорту. Це може означати перезапуск процесу Render.");
          return;
        }

        const progressResponse = await readApiResponse(progress);
        if (!progress.ok) {
          const message = typeof progressResponse.data?.error === "string"
            ? progressResponse.data.error
            : progressResponse.raw.slice(0, 240);
          setStatus(`Помилка статусу (${progress.status}): ${message || "сервер не повернув деталей"}`);
          return;
        }

        if (!progressResponse.data) {
          setStatus("Сервер повернув некоректну відповідь під час перевірки імпорту.");
          return;
        }

        const run = progressResponse.data.run as ImportRun | undefined;
        if (!run) {
          setStatus("Сервер не повернув дані про імпорт.");
          return;
        }

        if (run.status === "running") {
          setStatus(`Імпорт триває: ${run.processed} оброблено, ${run.created} додано, ${run.updated} оновлено.`);
          continue;
        }

        if (run.status === "completed" || run.status === "completed_with_errors") {
          setStatus(`Готово: ${run.processed} оброблено, ${run.created} додано, ${run.updated} оновлено, помилок ${run.failed}.${run.error ? ` ${run.error}` : ""}`);
          setSecret("");
        } else {
          setStatus(`Імпорт завершився зі статусом "${run.status}". ${run.error || ""}`);
        }
        break;
      }
    } catch (error) {
      setStatus(error instanceof Error ? `Помилка: ${error.message}` : "Невідома помилка з'єднання.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="admin-shell import-shell">
      <section className="admin-card import-card">
        <span className="eyebrow">Службова сторінка</span>
        <h1>Імпорт каталогу OKSA</h1>
        <p>Імпорт запускається у фоні, а сторінка показує прогрес через базу даних.</p>
        <form onSubmit={submit} className="admin-form">
          <label>Секрет імпорту<input type="password" value={secret} onChange={(e)=>setSecret(e.target.value)} autoComplete="off" placeholder="Вставте IMPORT_SECRET з Render" required /></label>
          <button className="primary-button" type="submit" disabled={busy}>{busy ? "Імпорт триває…" : "Запустити імпорт"}</button>
        </form>
        {status && <p className="import-status" role="status">{status}</p>}
        <a className="catalog-back" href="/catalog">← Повернутися до каталогу</a>
      </section>
    </main>
  );
}
