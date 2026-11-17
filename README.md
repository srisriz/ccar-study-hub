# ccar-study-hub

A study guide for preparing for the Claude Certified Architect – Professional (CCAR-P) exam. Unofficial practice material: the questions are original and are not Anthropic exam content.

## What's here

| Path | What it is |
| --- | --- |
| `index.html` | Landing page |
| `ccar-p/index.html` | CCAR-P study kit: daily plan, domain notes, notes for each paper, flashcards, six timed 63-question mocks, mixed mocks and domain drills |
| `ccar-p/d.0` to `d.4` | The question bank and notes: a gzip-compressed JSON file split into parts, which the page joins and decompresses in the browser |

Each answer locks as soon as you give it, and shows the correct answer and an explanation. Scores, missed questions and plan ticks are saved in the browser's localStorage only.

## Run it locally

It is a static site with no build step:

```
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Deploy

Any static host works. With Vercel: `npx vercel deploy --prod` from the repository root, or connect this repository to a Vercel project so that every push to `main` deploys.
