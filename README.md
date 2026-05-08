# Macha.ai

> macha — Tanglish for "bro/dude," one of the particles every code-mix model gets wrong.

A single-screen code-mix writing tool for Indian creators. Type a draft, pick a platform, get three calibrated rewrites (more native / balanced / more English) — plus a side-by-side look at what an untuned LLM would have written for the same draft.

## Why this

Most generic LLMs handle Hinglish and Tanglish badly. They translate instead of code-mixing, drop the particles that carry tone (`yaar`, `da`, `na`, `bhi`), and over-formalise. Macha.ai shows that with a small amount of structure — a taxonomy, a handful of hand-curated few-shot examples, platform calibration, and a structured-output schema — the gap between "raw API call" and "thing a creator would actually post" is large and visible.

The collapsed comparison panel below every rewrite is the point of the project: the same draft, run through the same family of model size, with no tuning. The contrast is the demo.

## What's actually in here

```
app/
  layout.tsx              root layout, dark theme
  page.tsx                the entire UI — one screen, no routing
  globals.css             Tailwind + small color tokens
  api/rewrite/route.ts    proxy: parallel calls to Gemini (tuned) + Groq (naive)

lib/
  taxonomy.ts             the structural rules for code-mix that go into the system prompt
  examples.ts             ~10 hand-curated few-shot examples, Hinglish + Tanglish × 3 platforms
  prompts.ts              buildTunedPrompt() and buildNaivePrompt()

netlify.toml              Netlify + @netlify/plugin-nextjs config
```

The tuned pipeline is one Gemini 2.5 Flash call with `responseMimeType: "application/json"` and a strict response schema. Detection of language and the three variants happen in a single call — no orchestration, no chaining. The naive pipeline is one Groq Llama-3.3-70B call with the prompt `"Rewrite this in Hinglish or Tanglish for [platform]: [draft]"` and nothing else.

## Run locally

```bash
npm install
cp .env.example .env.local
# add GEMINI_API_KEY and GROQ_API_KEY to .env.local
npm run dev
```

Open `http://localhost:3000`.

- Get a Gemini key: https://aistudio.google.com/apikey
- Get a Groq key: https://console.groq.com/keys

## Deploy to Netlify

1. Push this repo to GitHub.
2. On Netlify, "Add new site → Import an existing project," select the repo.
3. Netlify auto-detects Next.js. Confirm the build command is `npm run build`.
4. Add `GEMINI_API_KEY` and `GROQ_API_KEY` under Site settings → Environment variables.
5. Deploy.

`netlify.toml` already wires up `@netlify/plugin-nextjs`, so the API route runs as a Netlify function.

## What I cut

- Accounts, auth, history, persistence — none of it earns its complexity for a one-screen demo.
- Streaming — the structured JSON contract is more important than first-token latency.
- A tone slider, formality slider, length slider — three pre-calibrated variants is the entire control surface. More dials make the output worse, not better.
- A language picker — auto-detected from the draft. If the user writes `da` we know it's Tanglish.
- Emoji generation — users add their own; LLM-inserted emojis age the output instantly.
- A component library — plain Tailwind, one file of UI.

## What I'd do with another 10 hours

- Expand the few-shot bank from ~10 to ~60 examples, weighted by platform, and A/B which subset gets selected per request.
- Add a small eval set (50-100 hand-rated drafts) and a gate that compares tuned vs. naive on `particle retention`, `script discipline`, `tone match` — so changes to the prompt are measurable rather than vibes-based.
- Pluralise the "balanced" variant: 2 takes, slightly different angles, so the user picks rather than tweaks.
- A regional dial (Bombay / Delhi / Bangalore / Chennai) — the particle vocabularies diverge enough to matter.
- Saved snippets per user, but only if there's a real signal that single-shot rewrite isn't the right interaction loop.
