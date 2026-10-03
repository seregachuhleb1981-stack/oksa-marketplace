import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function AdminLoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  async function login(formData: FormData) {
    "use server";

    const expectedPassword = process.env.ADMIN_ACCESS_TOKEN;
    const suppliedPassword = String(formData.get("password") ?? "");

    if (!expectedPassword || suppliedPassword !== expectedPassword) {
      redirect("/admin/login?error=1");
    }

    (await cookies()).set("oksa_admin_access", suppliedPassword, {
      httpOnly: true,
      sameSite: "lax",
      secure: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    redirect("/admin");
  }

  return (
    <main className="catalog-shell">
      <section className="catalog-intro">
        <span className="eyebrow">OKSA</span>
        <h1>Вхід до адмін-панелі</h1>
        <p>Введіть пароль адміністратора.</p>

        <form
          action={login}
          style={{ display: "grid", gap: 12, maxWidth: 420 }}
        >
          <input
            name="password"
            type="password"
            placeholder="Пароль адміністратора"
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
