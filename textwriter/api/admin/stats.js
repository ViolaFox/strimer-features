// api/admin/stats.js
import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const user = await verifyAuth0(req);
  if (!user || !isAdmin(user.sub)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const [
    { count: usersCount },
    { count: activeLicenses },
    { count: unusedKeys },
    { count: blockedKeys },
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("licenses")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("licenses")
      .select("*", { count: "exact", head: true })
      .eq("status", "unused"),
    supabase
      .from("licenses")
      .select("*", { count: "exact", head: true })
      .eq("status", "blocked"),
  ]);

  // Активных за 24 часа
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count: activeToday } = await supabase
    .from("users")
    .select("*", { count: "exact", head: true })
    .gte("last_login", since);

  res.json({
    ok: true,
    stats: {
      users: usersCount || 0,
      activeLicenses: activeLicenses || 0,
      unusedKeys: unusedKeys || 0,
      blockedKeys: blockedKeys || 0,
      activeToday: activeToday || 0,
    },
  });
}
