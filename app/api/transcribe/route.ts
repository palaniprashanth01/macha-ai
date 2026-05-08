import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "SARVAM_API_KEY not set" }, { status: 500 });
  }

  let inForm: FormData;
  try {
    inForm = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form-data" }, { status: 400 });
  }

  const file = inForm.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }
  if (file.size > 8 * 1024 * 1024) {
    return NextResponse.json({ error: "Audio too large (max 8MB)" }, { status: 400 });
  }

  const out = new FormData();
  out.append("file", file, "audio.webm");
  out.append("model", "saarika:v2.5");
  out.append("language_code", "unknown");

  const res = await fetch("https://api.sarvam.ai/speech-to-text", {
    method: "POST",
    headers: { "api-subscription-key": apiKey },
    body: out,
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("[transcribe] Sarvam STT failed", {
      status: res.status,
      detail,
      fileSize: file.size,
      fileType: (file as any).type,
    });
    return NextResponse.json(
      { error: "Sarvam STT failed", status: res.status, detail },
      { status: 502 }
    );
  }

  const json = await res.json();
  const transcript: string = json?.transcript ?? "";
  if (!transcript) {
    return NextResponse.json({ error: "Sarvam returned empty transcript" }, { status: 502 });
  }

  return NextResponse.json({ transcript });
}
