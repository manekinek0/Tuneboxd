import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Client } from "pg";

if (!process.env.DATABASE_URL) {
  // Node's built-in .env loader: `pnpm db:migrate` works without dotenv.
  try {
    process.loadEnvFile(".env.local");
  } catch {
    // No .env.local — fall through to the error below.
  }
}

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is not set. Add it to .env.local or your shell environment.");
  process.exit(1);
}

const local = /localhost|127\.0\.0\.1/.test(connectionString);
const client = new Client({
  connectionString,
  ssl: local ? false : { rejectUnauthorized: false },
});

const dir = path.join(process.cwd(), "db", "migrations");
const files = (await readdir(dir)).filter((f) => f.endsWith(".sql")).sort();

await client.connect();
await client.query(`
  create table if not exists public._migrations (
    name text primary key,
    applied_at timestamptz not null default now()
  )
`);

for (const file of files) {
  const { rowCount } = await client.query("select 1 from public._migrations where name = $1", [file]);
  if (rowCount) {
    console.log(`skip     ${file}`);
    continue;
  }
  const text = await readFile(path.join(dir, file), "utf8");
  await client.query("begin");
  try {
    await client.query(text);
    await client.query("insert into public._migrations (name) values ($1)", [file]);
    await client.query("commit");
    console.log(`applied  ${file}`);
  } catch (error) {
    await client.query("rollback");
    throw error;
  }
}

await client.end();
console.log("Database is up to date.");
