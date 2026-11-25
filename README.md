# ccar-study-hub

A study guide for preparing for the Claude Certified Architect exams. It's a static site with three parts:

| Path | What it is |
|---|---|
| `/` | Landing page and sign-in |
| `/ccar-p/` | CCAR-P study kit: plan, notes (including the Feature knowledge summary), flashcards, 14 mocks, drills and progress |
| `/bandorini/` | Bandorini CCAR-F kit: tests, notes and flashcards |

## What is (and isn't) in this repository

This repository holds the site code only. The question data is AES-GCM encrypted with the site password (key from PBKDF2-SHA256 over username and password) and isn't tracked here, because the repository is public and some of the papers are third-party material for personal study only. `.gitignore` excludes `auth.bin`, `ccar-p/d.*`, `bandorini/d.*` and `_backup/`.

Deploy from the local site folder, which has the encrypted data files.

## Deploy

The Vercel project `ccar-study-hub` lives in the team `srzs`, with Vercel Authentication on all deployments.

```
npx vercel login                                   # once
npx vercel link --yes --project ccar-study-hub --scope srzs
npx vercel deploy --prod
```

`.vercelignore` keeps `tools/`, `_backup/` and `.env*` out of deployments.

## Adding content to the encrypted bank

New questions or notes arrive as `tools/ccar-p-additions.json` (plain text). From the site folder, run:

```
node tools/add-content.mjs      # asks for the site username and password
npx vercel deploy --prod
```

The script checks the credentials against `auth.bin` and backs up `ccar-p/d.*` to `_backup/`. It then adds new mocks (or replaces a mock that already exists), sets the Feature knowledge summary, re-encrypts the bank and deletes the plain-text additions file.
