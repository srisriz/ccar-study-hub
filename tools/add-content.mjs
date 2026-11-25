// Merges tools/ccar-p-additions.json into the encrypted CCAR-P question bank.
// Run from the site folder:   node tools/add-content.mjs
// You type your site username and password. They stay on this computer and are
// used only to decrypt and re-encrypt ccar-p/d.0 ... d.7 (AES-GCM, PBKDF2-SHA256).
import { readFileSync, writeFileSync, mkdirSync, existsSync, unlinkSync, copyFileSync } from "node:fs";
import { gzipSync, gunzipSync } from "node:zlib";
import { webcrypto as crypto } from "node:crypto";
import { createInterface } from "node:readline";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATA = join(ROOT, "ccar-p"), PARTS = 8, ITER = 310000, MAGIC = "CCX1";
const ADD = join(ROOT, "tools", "ccar-p-additions.json");

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: process.stdin.isTTY });
let muted = false;
rl._writeToOutput = s => { if (!muted) process.stdout.write(s); };
const lines = rl[Symbol.asyncIterator]();
async function ask(q, hidden) {
  process.stdout.write(q);
  muted = !!hidden;
  const { value } = await lines.next();
  if (hidden) { muted = false; process.stdout.write("\n"); }
  return value || "";
}
const parts = u => {
  if (Buffer.from(u.subarray(0, 4)).toString() !== MAGIC) throw new Error("Unexpected file format");
  return { salt: u.subarray(4, 20), iv: u.subarray(20, 32), ct: u.subarray(32) };
};

if (!existsSync(ADD)) { console.log("Nothing to add: tools/ccar-p-additions.json isn't here. It may already be merged."); process.exit(0); }
const auth = parts(new Uint8Array(readFileSync(join(ROOT, "auth.bin"))));
const user = await ask("Site username: ");
const pass = await ask("Site password: ", true);
rl.close();
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(user.trim().toLowerCase() + "\n" + pass), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: auth.salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
try { await crypto.subtle.decrypt({ name: "AES-GCM", iv: auth.iv }, key, auth.ct); }
catch { console.error("That username or password doesn't match the site sign-in. Nothing was changed."); process.exit(1); }

const blob = Buffer.concat(Array.from({ length: PARTS }, (_, i) => readFileSync(join(DATA, "d." + i))));
const p = parts(new Uint8Array(blob));
let plain = Buffer.from(await crypto.subtle.decrypt({ name: "AES-GCM", iv: p.iv }, key, p.ct));
const wasGz = plain[0] === 0x1f && plain[1] === 0x8b;
const data = JSON.parse((wasGz ? gunzipSync(plain) : plain).toString("utf8"));
const add = JSON.parse(readFileSync(ADD, "utf8"));

console.log(`Current bank: ${data.bank.length} mocks.`);
for (const [n, mock] of add.mocks.entries()) {
  const at = data.bank.findIndex(m => m[0] && m[0].q === mock[0].q);
  if (at >= 0) { data.bank[at] = mock; console.log(`Updated existing Mock ${at + 1}.`); }
  else { data.bank.push(mock); console.log(`Added Mock ${data.bank.length} (${mock.length} questions).`); }
}
data.study.features = add.features;
data.study.mockTitles = add.mockTitles;
console.log(`Feature knowledge summary: ${add.features.sections.length} sections.`);

// Back up the current encrypted files, then write the new ones.
const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const bak = join(ROOT, "_backup", "data-" + stamp); mkdirSync(bak, { recursive: true });
for (let i = 0; i < PARTS; i++) copyFileSync(join(DATA, "d." + i), join(bak, "d." + i));
const iv = crypto.getRandomValues(new Uint8Array(12));
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, gzipSync(Buffer.from(JSON.stringify(data), "utf8"))));
const out = Buffer.concat([Buffer.from(MAGIC), Buffer.from(p.salt), Buffer.from(iv), Buffer.from(ct)]);
const size = Math.ceil(out.length / PARTS);
for (let i = 0; i < PARTS; i++) writeFileSync(join(DATA, "d." + i), out.subarray(i * size, (i + 1) * size));

// Check the result decrypts, then remove the plain-text additions file.
const check = Buffer.concat(Array.from({ length: PARTS }, (_, i) => readFileSync(join(DATA, "d." + i))));
const q = parts(new Uint8Array(check));
const back = JSON.parse(gunzipSync(Buffer.from(await crypto.subtle.decrypt({ name: "AES-GCM", iv: q.iv }, key, q.ct))).toString());
if (back.bank.length !== data.bank.length) throw new Error("Check failed. Restore from " + bak);
unlinkSync(ADD);
console.log(`Done: ${back.bank.length} mocks, encrypted. Old files backed up to _backup/data-${stamp}.`);
console.log("Next: npx vercel deploy --prod");
