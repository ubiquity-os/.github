import { EncryptJWT, jwtDecrypt } from "jose";

export async function getSessionKey(): Promise<Uint8Array> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET environment variable is strictly required for secure cookie encryption.");
  }
  if (secret.length < 32) {
    throw new Error("SESSION_SECRET must be at least 32 characters long to ensure cryptographic entropy.");
  }
  
  // CodeRabbit Fix: Proper Key Derivation for guaranteed 32-byte secret (ASCII/UTF-8 safe)
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(secret));
  return new Uint8Array(hash);
}

export async function encryptToken(payload: string): Promise<string> {
  const key = await getSessionKey();
  return await new EncryptJWT({ token: payload })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .encrypt(key);
}

export async function decryptToken(sessionString: string): Promise<string | null> {
  const key = await getSessionKey(); // Bubble up infrastructure/config errors loudly
  try {
    const { payload } = await jwtDecrypt(sessionString, key);
    if (typeof payload.token !== "string") {
      return null;
    }
    return payload.token;
  } catch {
    // Fails strictly on forged, expired, or invalid cookies
    return null;
  }
}
