import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Language = "hinglish" | "tanglish";

const LANG_CONFIG: Record<Language, { target_language_code: string; speaker: string }> = {
  hinglish: { target_language_code: "hi-IN", speaker: "anushka" },
  tanglish: { target_language_code: "ta-IN", speaker: "vidya" },
};

export async function POST(req: NextRequest) {
  let body: { text?: string; language?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const text = (body.text ?? "").trim();
  const language = body.language as Language;

  if (!text) {
    return NextResponse.json({ error: "Text is required" }, { status: 400 });
  }
  if (text.length > 500) {
    return NextResponse.json({ error: "Text too long (max 500 chars)" }, { status: 400 });
  }
  if (language !== "hinglish" && language !== "tanglish") {
    return NextResponse.json({ error: "Invalid language" }, { status: 400 });
  }

  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SARVAM_API_KEY not set" }, { status: 500 });
  }

  const { target_language_code, speaker } = LANG_CONFIG[language];

  const res = await fetch("https://api.sarvam.ai/text-to-speech", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-subscription-key": apiKey,
    },
    body: JSON.stringify({
      inputs: [text],
      target_language_code,
      speaker,
      model: "bulbul:v2",
      pitch: 0,
      pace: 1.0,
      loudness: 1.0,
      speech_sample_rate: 22050,
      enable_preprocessing: true,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.json(
      { error: "Sarvam TTS failed", detail },
      { status: 502 }
    );
  }

  const json = await res.json();
  const base64 = json?.audios?.[0];
  if (!base64) {
    return NextResponse.json({ error: "Sarvam returned no audio" }, { status: 502 });
  }

  return NextResponse.json({ audio: base64 });
}
