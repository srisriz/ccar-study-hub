// Sign-in for the CCAR Study Hub. The question data is encrypted (AES-GCM, key from
// PBKDF2-SHA256 over username + password), so it can't be read without the password,
// even from the public repository. The derived key is kept on this device after sign-in.
(function () {
  const SLOT = "ccx-key", ITER = 310000, enc = new TextEncoder();
  const b64 = u => btoa(String.fromCharCode(...u)), unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
  function save(v) { for (const s of ["localStorage", "sessionStorage"]) { try { v == null ? window[s].removeItem(SLOT) : window[s].setItem(SLOT, v); if (v != null) return; } catch (e) {} } }
  function load() { for (const s of ["localStorage", "sessionStorage"]) { try { const v = window[s].getItem(SLOT); if (v) return v; } catch (e) {} } return null; }
  function parts(buf) {
    const u = new Uint8Array(buf);
    if (new TextDecoder().decode(u.subarray(0, 4)) !== "CCX1") throw "format";
    return { salt: u.subarray(4, 20), iv: u.subarray(20, 32), ct: u.subarray(32) };
  }
  async function keyFrom(raw) { return crypto.subtle.importKey("raw", raw, "AES-GCM", false, ["decrypt"]); }
  window.CCXAuth = {
    signedIn: () => !!load(),
    async signIn(user, pass) {
      const r = await fetch("/auth.bin", { cache: "no-store" });
      if (!r.ok) throw "network";
      const p = parts(await r.arrayBuffer());
      const base = await crypto.subtle.importKey("raw", enc.encode(user.trim().toLowerCase() + "\n" + pass), "PBKDF2", false, ["deriveKey"]);
      const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: p.salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, true, ["decrypt"]);
      try { await crypto.subtle.decrypt({ name: "AES-GCM", iv: p.iv }, key, p.ct); } catch (e) { throw "auth"; }
      save(b64(new Uint8Array(await crypto.subtle.exportKey("raw", key))));
    },
    signOut() { save(null); },
    async open(buf) {
      const s = load(); if (!s) throw "auth";
      const p = parts(buf);
      try { return new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv: p.iv }, await keyFrom(unb64(s)), p.ct)); }
      catch (e) { save(null); throw "auth"; }
    },
    toLogin() { location.replace("/?next=" + encodeURIComponent(location.pathname)); }
  };
})();
