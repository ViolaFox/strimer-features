export default async function handler(req, res) {
  const { deviceId, email } = JSON.parse(req.body);

  const ip = req.headers["x-forwarded-for"];

  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("email", email)
    .single();

  if (!data) return res.json({ ok: false });

  // если устройство совпадает
  if (data.device_id === deviceId) {
    // проверка смены IP
    if (data.last_ip && data.last_ip !== ip) {
      return res.json({ ok: false, message: "Подозрение на передачу" });
    }

    await supabase.from("licenses").update({ last_ip: ip }).eq("email", email);

    return res.json({ ok: true });
  }

  return res.json({ ok: false });
}
