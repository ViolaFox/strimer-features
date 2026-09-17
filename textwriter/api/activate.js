import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY,
);

export default async function handler(req, res) {
  const { key, deviceId, email } = JSON.parse(req.body);

  const { data } = await supabase
    .from("licenses")
    .select("*")
    .eq("key", key)
    .single();

  if (!data) {
    return res.json({ ok: false, message: "Ключ не найден" });
  }

  // первая активация
  if (!data.device_id) {
    await supabase
      .from("licenses")
      .update({ device_id: deviceId, email })
      .eq("key", key);

    return res.json({ ok: true });
  }

  // уже привязан
  if (data.device_id === deviceId) {
    return res.json({ ok: true });
  }

  return res.json({ ok: false, message: "Ключ уже используется" });
}
