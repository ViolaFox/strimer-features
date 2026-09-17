export default async function handler(req, res) {
  const { key } = JSON.parse(req.body);

  await supabase.from("licenses").insert([{ key, active: true }]);

  res.json({ ok: true });
}
