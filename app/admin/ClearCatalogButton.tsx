"use client";

import { useState } from "react";

export default function ClearCatalogButton({
  action
}: {
  action: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <form
      action={async () => {
        setBusy(true);
        try {
          await action();
        } finally {
          setBusy(false);
        }
      }}
    >
      <button
        className="primary-button"
        type="submit"
        disabled={busy}
        onClick={(event) => {
          if (!window.confirm("УВАГА! Видалити ВСІ товари, зображення, характеристики, категорії та бренди? Замовлення залишаться. Цю дію не можна скасувати.")) {
            event.preventDefault();
          }
        }}
        style={{ background: "#b42318" }}
      >
        {busy ? "Очищення..." : "Повністю очистити каталог"}
      </button>
    </form>
  );
}
