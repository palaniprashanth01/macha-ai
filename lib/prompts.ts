import { TAXONOMY } from "./taxonomy";
import { examplesForPlatform, Platform } from "./examples";

const PLATFORM_GUIDANCE: Record<Platform, string> = {
  instagram:
    "Instagram caption: short, vibe-led, lowercase preferred, line breaks optional, at most 1 emoji.",
  x:
    "X / Twitter post: punchy and observational, fits in ~240 chars, no hashtags, no emoji needed.",
  whatsapp:
    "WhatsApp message: conversational, tight, sounds like something a real person would type to a friend. No hashtags, no emoji unless tone calls for it.",
};

export function buildTunedPrompt(draft: string, platform: Platform): string {
  const examples = examplesForPlatform(platform);

  const fewShotBlock = examples
    .map(
      (e) =>
        `INPUT (${e.language}): ${e.input}\nmore_native: ${e.more_native}\nbalanced: ${e.balanced}\nmore_english: ${e.more_english}`
    )
    .join("\n\n");

  return `You are a code-mix writing assistant for Indian creators. You rewrite English (or partial code-mix) drafts into natural Hinglish or Tanglish suited to the chosen platform.

${TAXONOMY}

PLATFORM: ${platform}
${PLATFORM_GUIDANCE[platform]}

FEW-SHOT EXAMPLES for this platform (study tone, particle density, and the gap between the three variants):

${fewShotBlock}

TASK
1. Detect whether the draft should be rewritten in hinglish or tanglish. If the draft already has Tamil-leaning particles (da, machan, anna, illa, pannu, aaguven), choose tanglish. If it has Hindi-leaning particles (yaar, bhai, kya, hai, karna), choose hinglish. If neither, default to hinglish.
2. Estimate the rough native% / english% mix of the *balanced* output you will produce. They should sum to 100.
3. Produce three rewrites of the user's draft for the chosen platform:
   - more_native: ~70-80% native lexicon, particle-dense
   - balanced: ~50/50 mix, the natural creator voice
   - more_english: ~70-80% English with 2-3 well-placed native particles
4. Roman script only. No Devanagari, no Tamil script.
5. Do not translate; code-mix. Keep the user's intent and tone.
6. Do not add hashtags or emojis the user didn't ask for, except at most one tasteful emoji on Instagram if it genuinely fits.

USER DRAFT:
${draft}

Respond with JSON only, matching this schema:
{
  "language": "hinglish" | "tanglish",
  "native_pct": number,
  "english_pct": number,
  "more_native": string,
  "balanced": string,
  "more_english": string
}`;
}

export function buildNaivePrompt(draft: string, platform: Platform): string {
  return `Rewrite this in Hinglish or Tanglish for ${platform}: ${draft}`;
}
