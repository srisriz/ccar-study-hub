# ccar-study-hub

A study site for the Claude Certified Architect – Professional (CCAR-P) exam. Unofficial practice material, not Anthropic exam content.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Landing page with the sign-in form |
| `auth.js`, `auth.bin` | Sign-in code and the encrypted check file it signs in against |
| `ccar-p/` | CCAR-P study kit: daily plan, notes, flashcards, six timed mocks, mixed mocks and domain drills (378 original questions) |
| `bandorini/` | Bandorini CCAR-F kit: tests, notes and flashcards (private study material) |
| `tools/encrypt.mjs` | Re-encrypts the data, for example to change the password |

Each answer locks as soon as you give it, and shows the correct answer and an explanation. Scores and progress are saved in the browser only.

## Sign-in and encryption

The `d.*` files in each kit are AES-GCM encrypted with a key derived from the username and password (PBKDF2-SHA256, 310,000 rounds). They can't be read without the password, including from this repository. The password is not stored anywhere in the repo. After sign-in, the derived key is kept in the browser until you choose **Sign out**.

To change the password, run `node tools/encrypt.mjs <site-dir> <plain-dir> <creds-file>`. `plain-dir` holds the unencrypted `ccar-p.gz` and `bandorini.gz`, and `creds-file` has the username on line 1 and the password on line 2. Keep both out of the repo.

## Run it locally

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Any static host works. With Vercel, run `npx vercel deploy --prod` from the repository root, or connect this repository to the Vercel project so that every push to `main` deploys.
