// api/session.js
import { verifyAuth0 } from "./_lib/auth0.js";
import { supabase } from "./_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = await verifyAuth0(req);
    if (!user) {
      return res.status(401).json({ ok: false, error: "unauthorized" });
    }

    // Ищем пользователя в БД
    const { data: dbUser, error: userErr } = await supabase
      .from("users")
      .select("id, email, role, status")
      .eq("auth0_user_id", user.sub)
      .maybeSingle();

    if (userErr) {
      console.error("users query error:", userErr);
      return res
        .status(500)
        .json({ ok: false, error: "db_error", detail: userErr.message });
    }

    // Если пользователя нет — создаём
    if (!dbUser) {
      const { data: newUser, error: insertErr } = await supabase
        .from("users")
        .insert({
          auth0_user_id: user.sub,
          email: user.email || null,
          last_login: new Date().toISOString(),
        })
        .select()
        .single();

      if (insertErr) {
        console.error("user insert error:", insertErr);
        return res
          .status(500)
          .json({
            ok: false,
            error: "db_insert_error",
            detail: insertErr.message,
          });
      }

      return res.json({
        ok: true,
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
        license: null,
        fullAccess: false,
      });
    }

    // Проверяем статус
    if (dbUser.status === "banned") {
      return res.json({ ok: false, error: "banned" });
    }

    // Ищем лицензию
    const { data: lic, error: licErr } = await supabase
      .from("licenses")
      .select("id, status, activated_at, expires_at, device_id")
      .eq("user_id", dbUser.id)
      .maybeSingle();

    if (licErr) {
      console.error("licenses query error:", licErr);
      // не критично — просто вернём без лицензии
    }

    // Обновляем last_login
    await supabase
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", dbUser.id);

    res.json({
      ok: true,
      user: { id: dbUser.id, email: dbUser.email, role: dbUser.role },
      license: lic
        ? {
            status: lic.status,
            activatedAt: lic.activated_at,
            deviceId: lic.device_id,
          }
        : null,
      fullAccess: !!lic && lic.status === "active",
    });
  } catch (e) {
    console.error("session handler crash:", e);
    res
      .status(500)
      .json({ ok: false, error: "server_error", detail: e.message });
  }
}
