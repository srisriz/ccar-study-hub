// Encrypts the study data with a key derived from username + password.
// File layout: "CCX1" | salt(16) | iv(12) | AES-GCM ciphertext. One salt for the whole site.
// Usage: node encrypt.mjs <siteDir> <plainDir> <credsFile>
import { readFileSync, writeFileSync, readdirSync, unlinkSync } from "node:fs";
import { webcrypto as wc } from "node:crypto";
const [site, plain, credsFile] = process.argv.slice(2);
const [user, pass] = readFileSync(credsFile, "utf8").split("\n");
const ITER = 310000, PART = 20000;
const salt = wc.getRandomValues(new Uint8Array(16));
const base = await wc.subtle.importKey("raw", new TextEncoder().encode(user.trim().toLowerCase() + "\n" + pass), "PBKDF2", false, ["deriveKey"]);
const key = await wc.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
async function seal(bytes) {
  const iv = wc.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await wc.subtle.encrypt({ name: "AES-GCM", iv }, key, bytes));
  const out = new Uint8Array(4 + 16 + 12 + ct.length);
  out.set(new TextEncoder().encode("CCX1")); out.set(salt, 4); out.set(iv, 20); out.set(ct, 32);
  return out;
}
writeFileSync(`${site}/auth.bin`, await seal(new TextEncoder().encode("ok")));
for (const kit of ["ccar-p", "bandorini"]) {
  for (const f of readdirSync(`${site}/${kit}`)) if (/^d\.\d+$/.test(f)) unlinkSync(`${site}/${kit}/${f}`);
  const sealed = await seal(readFileSync(`${plain}/${kit}.gz`));
  const n = Math.ceil(sealed.length / PART);
  for (let i = 0; i < n; i++) writeFileSync(`${site}/${kit}/d.${i}`, sealed.subarray(i * PART, (i + 1) * PART));
  console.log(kit, sealed.length, "bytes in", n, "parts");
}
