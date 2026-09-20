// api/admin/list-licenses.js
import { verifyAuth0, isAdmin } from "../_lib/auth0.js";
import { supabase } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).end();

  try {
    const user = await verifyAuth0(req);
    if (!user || !isAdmin(user.sub)) {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    // 1. Загружаем лицензии
    const { data: licenses, error: licErr } = await supabase
      .from("licenses")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (licErr) {
      console.error("licenses query error:", licErr);
      return res.status(500).json({ ok: false, error: licErr.message });
    }

    // 2. Собираем user_id и device_id
    const userIds = [
      ...new Set((licenses || []).map((l) => l.user_id).filter(Boolean)),
    ];
    const deviceIds = [
      ...new Set((licenses || []).map((l) => l.device_id).filter(Boolean)),
    ];

    // 3. Загружаем users (если есть)
    let usersMap = {};
    if (userIds.length) {
      const { data: users, error: uErr } = await supabase
        .from("users")
        .select("id, email")
        .in("id", userIds);
      if (!uErr && users) {
        usersMap = Object.fromEntries(users.map((u) => [u.id, u]));
      }
    }

    // 4. Загружаем devices (если есть)
    let devicesMap = {};
    if (deviceIds.length) {
      const { data: devices, error: dErr } = await supabase
        .from("devices")
        .select("id, fingerprint_hash, last_seen, last_ip")
        .in("id", deviceIds);
      if (!dErr && devices) {
        devicesMap = Object.fromEntries(devices.map((d) => [d.id, d]));
      }
    }

    // 5. Мержим
    const merged = (licenses || []).map((l) => ({
      ...l,
      users: l.user_id ? usersMap[l.user_id] || null : null,
      devices: l.device_id ? devicesMap[l.device_id] || null : null,
    }));

    res.json({ ok: true, licenses: merged });
  } catch (e) {
    console.error("list-licenses crash:", e);
    res
      .status(500)
      .json({ ok: false, error: "server_error", detail: e.message });
  }
}
