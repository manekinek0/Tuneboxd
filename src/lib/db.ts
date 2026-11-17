import "server-only";
import { neon } from "@neondatabase/serverless";

type NeonClient = ReturnType<typeof neon>;

let client: NeonClient | null = null;

/** Lazily create the Neon HTTP client so builds don't need a database. */
export function getSql(): NeonClient {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  client ??= neon(url);
  return client;
}
