import "server-only";
import { createHash, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, SESSION_MAX_AGE, createSessionToken, verifySessionToken } from "./session";

const scryptAsync = promisify(scrypt);

export type Session = { username: string };

export function configuredUsername(): string {
  return process.env.APP_USERNAME?.trim() || "owner";
}

function safeEqual(a: string, b: string): boolean {
  const left = createHash("sha256").update(a).digest();
  const right = createHash("sha256").update(b).digest();
  return timingSafeEqual(left, right);
}

export async function verifyCredentials(username: string, password: string): Promise<boolean> {
  if (!safeEqual(username.trim(), configuredUsername())) return false;

  const hash = process.env.APP_PASSWORD_HASH?.trim();
  if (hash) {
    const [scheme, salt, expected] = hash.split(":");
    if (scheme !== "scrypt" || !salt || !expected) return false;
    const derived = (await scryptAsync(password, salt, 64)) as Buffer;
    const expectedBuffer = Buffer.from(expected, "hex");
    if (expectedBuffer.length !== derived.length) return false;
    return timingSafeEqual(derived, expectedBuffer);
  }

  const plain = process.env.APP_PASSWORD;
  if (!plain) return false;
  return safeEqual(password, plain);
}

export async function createSession(username: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, await createSessionToken(username), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const payload = await verifySessionToken(store.get(SESSION_COOKIE)?.value);
  return payload ? { username: payload.username } : null;
}

/** Use in pages and server actions. Redirects to the login screen when signed out. */
export async function requireSession(): Promise<Session> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function authIsConfigured(): boolean {
  return Boolean(process.env.APP_PASSWORD_HASH?.trim() || process.env.APP_PASSWORD);
}
