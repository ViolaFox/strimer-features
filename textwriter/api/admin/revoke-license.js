import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();
  const user = await verifyAuth0(req);
  if (!user || !isAdmin(user.sub))
    return res.status(403).json({ ok: false, error: "forbidden" });

  const { id } = req.body || {};
  if (!id) return res.status(400).json({ ok: false, error: "missing_id" });

  const { error } = await supabase
    .from("licenses")
    .update({ status: "revoked" })
    .eq("id", id);

  if (error) return res.status(500).json({ ok: false, error: error.message });

  await supabase.from("activity_logs").insert({
    event: "admin_revoke_license",
    metadata: { by: user.sub, license_id: id },
  });

  res.json({ ok: true });
}
