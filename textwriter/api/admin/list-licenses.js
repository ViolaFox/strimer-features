// api/admin/list-licenses.js
import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  const user = await verifyAuth0(req);
  if (!user || !isAdmin(user.sub)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  const { data, error } = await supabase
    .from("licenses")
    .select(
      `
      id, status, created_at, activated_at, note,
      users:user_id (email),
      devices:device_id (fingerprint_hash, last_seen, last_ip)
    `,
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) return res.status(500).json({ ok: false, error: error.message });
  res.json({ ok: true, licenses: data });
}
