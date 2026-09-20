// api/admin/list-users.js
import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = await verifyAuth0(req);
    if (!user || !isAdmin(user.sub)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("list-users error:", error);
      return res.status(500).json({ ok: false, error: error.message });
    }

    res.json({ ok: true, users: data || [] });
  } catch (e) {
    console.error("list-users crash:", e);
    res
      .status(500)
      .json({ ok: false, error: "server_error", detail: e.message });
  }
}
