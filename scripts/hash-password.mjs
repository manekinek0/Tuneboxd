import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";

let password = process.argv.slice(2).join(" ").trim();

if (!password) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  password = (await rl.question("Password: ")).trim();
  rl.close();
}

if (password.length < 8) {
  console.error("Use at least 8 characters.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const hash = scryptSync(password, salt, 64).toString("hex");
console.log(`APP_PASSWORD_HASH=scrypt:${salt}:${hash}`);
