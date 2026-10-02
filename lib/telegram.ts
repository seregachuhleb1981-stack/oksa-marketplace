import { prisma } from "@/lib/prisma";

type TelegramConfig = {
  token: string;
  chatId: string;
};

function getTelegramConfig(): TelegramConfig | null {
  const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const chatId = process.env.TELEGRAM_CHAT_ID?.trim();

  if (!token || !chatId) return null;
  return { token, chatId };
}

function formatMoney(value: unknown) {
  return Number(value).toLocaleString("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

export async function sendOrderToTelegram(orderId: string) {
  const config = getTelegramConfig();

  if (!config) {
    console.warn("Telegram order notification is not configured.");
    return { sent: false, reason: "not_configured" as const };
  }

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true }
  });

  if (!order) {
    return { sent: false, reason: "order_not_found" as const };
  }

  const itemLines = order.items
    .map(
      (item) =>
        `• ${item.name} × ${item.quantity} — ${formatMoney(item.total)} ₴`
    )
    .join("\n");

  const text = [
    "🛒 НОВЕ ЗАМОВЛЕННЯ OKSA",
    "",
    `📋 Номер: ${order.number}`,
    `👤 Ім’я: ${order.customerName}`,
    `📞 Телефон: ${order.customerPhone}`,
    order.customerEmail ? `✉️ Email: ${order.customerEmail}` : null,
    `📍 Місто: ${order.city}`,
    `📦 Відділення Нової пошти: ${order.deliveryBranch}`,
    "",
    "Товари:",
    itemLines || "• Немає позицій",
    "",
    `💰 Разом: ${formatMoney(order.total)} ₴`,
    order.comment ? `💬 Коментар: ${order.comment}` : null
  ]
    .filter(Boolean)
    .join("\n");

  const response = await fetch(
    `https://api.telegram.org/bot${config.token}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: config.chatId,
        text,
        disable_web_page_preview: true
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(10_000)
    }
  );

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Telegram notification failed: HTTP ${response.status} ${body.slice(0, 300)}`
    );
  }

  return { sent: true as const };
}
