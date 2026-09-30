import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminLoginPage() {
  async function login(formData: FormData) {
    "use server";

    const expected = process.env.ADMIN_ACCESS_TOKEN;
    const supplied = String(formData.get("token") ?? "");

    if (!expected || supplied !== expected) {
      redirect("/admin/login?error=1");
    }

    (await cookies()).set("oksa_admin_access", supplied, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/admin",
      maxAge: 60 * 60 * 24 * 30
    });

    redirect("/admin");
  }

  return (
    <main className="catalog-shell">
      <section className="catalog-intro">
        <span className="eyebrow">OKSA</span>
        <h1>Вхід до адмін-панелі</h1>
        <p>Введи свій адміністративний токен. Не надсилай його сюди.</p>

        <form
          action={login}
          style={{ display: "grid", gap: 12, maxWidth: 420 }}
        >
          <input
            name="token"
            type="password"
            placeholder="ADMIN_ACCESS_TOKEN"
            autoComplete="current-password"
            required
            style={{ padding: 12 }}
          />
          <button className="primary-button" type="submit">
            Увійти →
          </button>
        </form>
      </section>
    </main>
  );
}
