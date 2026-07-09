// Bun has a native, fast, argon2id-based password API — no external package needed.

export async function hashPassword(plain: string): Promise<string> {
  return Bun.password.hash(plain, {
    algorithm: "argon2id",
    memoryCost: 19456, // ~19MB, OWASP recommended minimum
    timeCost: 2,
  });
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return Bun.password.verify(plain, hash);
}