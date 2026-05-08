import { NextRequest, NextResponse } from "next/server";
import { buildTunedPrompt, buildNaivePrompt } from "@/lib/prompts";
import { Platform } from "@/lib/examples";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface TunedResult {
  language: "hinglish" | "tanglish";
  native_pct: number;
  english_pct: number;
  more_native: string;
  balanced: string;
  more_english: string;
}

const VALID_PLATFORMS: Platform[] = ["instagram", "x", "whatsapp"];

async function callGemini(prompt: string): Promise<TunedResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY not set");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.8,
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          language: { type: "STRING", enum: ["hinglish", "tanglish"] },
          native_pct: { type: "NUMBER" },
          english_pct: { type: "NUMBER" },
          more_native: { type: "STRING" },
          balanced: { type: "STRING" },
          more_english: { type: "STRING" },
        },
        required: [
          "language",
          "native_pct",
          "english_pct",
          "more_native",
          "balanced",
          "more_english",
        ],
      },
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Gemini error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");

  const parsed = JSON.parse(text) as TunedResult;
  return parsed;
}

async function callGroqNaive(prompt: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      temperature: 0.8,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Groq error ${res.status}: ${text}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error("Groq returned empty response");
  return content.trim();
}

export async function POST(req: NextRequest) {
  let body: { draft?: string; platform?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const draft = (body.draft ?? "").trim();
  const platform = body.platform as Platform;

  if (!draft) {
    return NextResponse.json({ error: "Draft is required" }, { status: 400 });
  }
  if (draft.length > 1000) {
    return NextResponse.json({ error: "Draft too long (max 1000 chars)" }, { status: 400 });
  }
  if (!VALID_PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Invalid platform" }, { status: 400 });
  }

  const tunedPrompt = buildTunedPrompt(draft, platform);
  const naivePrompt = buildNaivePrompt(draft, platform);

  const [tunedRes, naiveRes] = await Promise.allSettled([
    callGemini(tunedPrompt),
    callGroqNaive(naivePrompt),
  ]);

  if (tunedRes.status === "rejected") {
    return NextResponse.json(
      { error: "Tuned pipeline failed", detail: String(tunedRes.reason?.message ?? tunedRes.reason) },
      { status: 500 }
    );
  }

  const naive = naiveRes.status === "fulfilled" ? naiveRes.value : null;

  return NextResponse.json({
    tuned: tunedRes.value,
    naive,
  });
}
