// api/admin/create-license.js
import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";
import crypto from "node:crypto";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyAuth0(req);
  if (!user || !isAdmin(user.sub)) {
    return res.status(403).json({ ok: false, error: "forbidden" });
  }

  // Генерим ключ TEP-XXXX-XXXX-XXXX
  const raw = crypto
    .randomBytes(12)
    .toString("base64url")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
  const key =
    "TEP-" + raw.slice(0, 4) + "-" + raw.slice(4, 8) + "-" + raw.slice(8, 12);
  const hash = crypto.createHash("sha256").update(key).digest("hex");

  const { error } = await supabase.from("licenses").insert({
    license_key_hash: hash,
    status: "unused",
    note: req.body?.note || null,
  });

  if (error) return res.status(500).json({ ok: false, error: error.message });

  await supabase.from("activity_logs").insert({
    event: "admin_create_license",
    metadata: { by: user.sub, key },
  });

  // Возвращаем plaintext ОДИН РАЗ
  res.json({ ok: true, key });
}
