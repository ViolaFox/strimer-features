// api/_lib/auth0.js
import { createRemoteJWKSet, jwtVerify } from "jose";

const JWKS = createRemoteJWKSet(
  new URL(`https://${process.env.AUTH0_DOMAIN}/.well-known/jwks.json`),
);

export async function verifyAuth0(req) {
  const auth = req.headers.authorization || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, JWKS, {
      issuer: `https://${process.env.AUTH0_DOMAIN}/`,
      audience: process.env.AUTH0_AUDIENCE,
    });
    return payload;
  } catch (e) {
    console.error("JWT verify failed", e.message);
    return null;
  }
}

export function isAdmin(userSub) {
  const admins = (process.env.ADMIN_AUTH0_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return admins.includes(userSub);
}
