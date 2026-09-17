// api/license/activate.js
import { verifyAuth0 } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";
import crypto from "node:crypto";

function getIp(req) {
  return (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || null;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const user = await verifyAuth0(req);
  if (!user) return res.status(401).json({ ok: false, error: "unauthorized" });

  const { key, fingerprint } = req.body || {};
  if (!key || !fingerprint) {
    return res.status(400).json({ ok: false, error: "missing_fields" });
  }

  const hash = crypto
    .createHash("sha256")
    .update(key.trim().toUpperCase())
    .digest("hex");

  // 1. Ищем лицензию
  const { data: lic } = await supabase
    .from("licenses")
    .select("*")
    .eq("license_key_hash", hash)
    .maybeSingle();

  if (!lic) return res.status(404).json({ ok: false, error: "key_not_found" });
  if (lic.status === "blocked" || lic.status === "revoked") {
    return res.status(403).json({ ok: false, error: "key_blocked" });
  }

  // 2. Находим/создаём пользователя
  let { data: dbUser } = await supabase
    .from("users")
    .select("*")
    .eq("auth0_user_id", user.sub)
    .maybeSingle();

  if (!dbUser) {
    const { data } = await supabase
      .from("users")
      .insert({ auth0_user_id: user.sub, email: user.email })
      .select()
      .single();
    dbUser = data;
  }

  // 3. Если лицензия уже привязана
  if (lic.user_id) {
    if (lic.user_id !== dbUser.id) {
      return res
        .status(403)
        .json({ ok: false, error: "key_in_use_other_user" });
    }

    const { data: dev } = await supabase
      .from("devices")
      .select("*")
      .eq("license_id", lic.id)
      .eq("fingerprint_hash", fingerprint)
      .eq("revoked", false)
      .maybeSingle();

    if (dev) {
      await supabase
        .from("devices")
        .update({ last_seen: new Date().toISOString(), last_ip: getIp(req) })
        .eq("id", dev.id);
      return res.json({ ok: true, alreadyActivated: true });
    }

    return res.status(403).json({ ok: false, error: "device_mismatch" });
  }

  // 4. Первая активация
  const { data: device, error: devErr } = await supabase
    .from("devices")
    .insert({
      user_id: dbUser.id,
      license_id: lic.id,
      fingerprint_hash: fingerprint,
      ua: req.headers["user-agent"],
      last_ip: getIp(req),
    })
    .select()
    .single();

  if (devErr) return res.status(500).json({ ok: false, error: devErr.message });

  await supabase
    .from("licenses")
    .update({
      status: "active",
      user_id: dbUser.id,
      device_id: device.id,
      activated_at: new Date().toISOString(),
    })
    .eq("id", lic.id);

  await supabase.from("activity_logs").insert({
    user_id: dbUser.id,
    device_id: device.id,
    event: "license_activated",
    ip: getIp(req),
  });

  res.json({ ok: true });
}
