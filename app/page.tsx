"use client";

import { useRef, useState } from "react";

type Platform = "instagram" | "x" | "whatsapp";

interface TunedResult {
  language: "hinglish" | "tanglish";
  native_pct: number;
  english_pct: number;
  more_native: string;
  balanced: string;
  more_english: string;
}

interface ApiResponse {
  tuned: TunedResult;
  naive: string | null;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  instagram: "Instagram",
  x: "X",
  whatsapp: "WhatsApp",
};

const PRESETS: { label: string; draft: string; platform: Platform }[] = [
  {
    label: "Weekend plan",
    draft: "weekend ku plan?",
    platform: "whatsapp",
  },
  {
    label: "Coffee post",
    draft: "morning coffee and a good book, that's the vibe",
    platform: "instagram",
  },
  {
    label: "Hot take",
    draft: "every chennai auto guy thinks he is a startup founder",
    platform: "x",
  },
];

const NATIVE_LABEL: Record<"hinglish" | "tanglish", string> = {
  hinglish: "Hindi",
  tanglish: "Tamil",
};

export default function Page() {
  const [draft, setDraft] = useState("");
  const [platform, setPlatform] = useState<Platform>("instagram");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [naiveOpen, setNaiveOpen] = useState(false);

  const [recState, setRecState] = useState<"idle" | "recording" | "transcribing">("idle");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  async function startRecording() {
    if (recState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        if (blob.size === 0) {
          setRecState("idle");
          return;
        }
        setRecState("transcribing");
        try {
          const fd = new FormData();
          fd.append("file", blob, "audio.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: fd });
          const json = await res.json();
          if (!res.ok || !json.transcript) {
            setError(json?.error ?? "Transcription failed");
          } else {
            setDraft((prev) => {
              const sep = prev.trim().length > 0 ? " " : "";
              return (prev + sep + json.transcript).slice(0, 1000);
            });
          }
        } catch (e: any) {
          setError(e?.message ?? "Transcription failed");
        } finally {
          setRecState("idle");
        }
      };
      recorderRef.current = mr;
      mr.start();
      setRecState("recording");
    } catch {
      setError("Mic permission denied");
      setRecState("idle");
    }
  }

  function stopRecording() {
    if (recState !== "recording") return;
    recorderRef.current?.stop();
  }

  async function handleRewrite() {
    if (!draft.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft: draft.trim(), platform }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json?.error ?? "Something went wrong");
      } else {
        setResult(json as ApiResponse);
      }
    } catch (e: any) {
      setError(e?.message ?? "Network error");
    } finally {
      setLoading(false);
    }
  }

  function loadPreset(p: (typeof PRESETS)[number]) {
    setDraft(p.draft);
    setPlatform(p.platform);
    setResult(null);
    setError(null);
  }

  return (
    <main className="min-h-screen w-full px-4 py-10 sm:py-16">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex items-baseline justify-between">
          <h1 className="text-3xl font-semibold tracking-tight">
            Macha<span className="text-orange-500">.ai</span>
          </h1>
          <span className="hidden text-xs text-neutral-500 sm:block">
            code-mix writing for Indian creators
          </span>
        </header>

        <section className="rounded-2xl border border-neutral-800 bg-panel p-5 sm:p-6">
          <div className="mb-4 flex flex-wrap gap-2">
            {(Object.keys(PLATFORM_LABELS) as Platform[]).map((p) => (
              <button
                key={p}
                onClick={() => setPlatform(p)}
                className={`rounded-full border px-4 py-1.5 text-sm transition ${
                  platform === p
                    ? "border-orange-500 bg-orange-500/10 text-orange-400"
                    : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200"
                }`}
              >
                {PLATFORM_LABELS[p]}
              </button>
            ))}
          </div>

          <div className="relative">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              placeholder="weekend ku plan? / kya scene hai bhai / type or speak your draft…"
              rows={4}
              className="w-full resize-none rounded-xl border border-neutral-800 bg-[#0d0d0d] p-4 pr-14 text-base text-neutral-100 placeholder:text-neutral-600 focus:border-orange-500/60 focus:outline-none"
            />
            <button
              onClick={recState === "recording" ? stopRecording : startRecording}
              disabled={recState === "transcribing"}
              title={
                recState === "recording"
                  ? "Stop recording"
                  : recState === "transcribing"
                  ? "Transcribing…"
                  : "Speak your draft (Sarvam ASR)"
              }
              className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border text-sm transition ${
                recState === "recording"
                  ? "border-red-500/60 bg-red-500/20 text-red-300 animate-pulse"
                  : recState === "transcribing"
                  ? "border-neutral-700 bg-neutral-800 text-neutral-500"
                  : "border-neutral-700 bg-neutral-900 text-neutral-300 hover:border-orange-500/60 hover:text-orange-400"
              }`}
            >
              {recState === "transcribing" ? "…" : "●"}
            </button>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.label}
                  onClick={() => loadPreset(p)}
                  className="rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-200"
                >
                  {p.label}
                </button>
              ))}
            </div>
            <span className="text-xs text-neutral-600">{draft.length}/1000</span>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              onClick={handleRewrite}
              disabled={!draft.trim() || loading}
              className="rounded-lg bg-orange-500 px-5 py-2 text-sm font-medium text-black transition hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? "Rewriting…" : "Rewrite"}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-6 rounded-xl border border-red-900/60 bg-red-950/30 p-4 text-sm text-red-300">
            {error}
          </div>
        )}

        {result && (
          <>
            <div className="mt-8 mb-4 flex items-center gap-3 text-sm">
              <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-0.5 text-xs uppercase tracking-wider text-orange-400">
                {result.tuned.language}
              </span>
              <span className="text-neutral-400">
                {NATIVE_LABEL[result.tuned.language]} {result.tuned.native_pct}% ·{" "}
                English {result.tuned.english_pct}%
              </span>
            </div>

            <section className="grid gap-4 sm:grid-cols-3">
              <VariantCard
                title="More native"
                text={result.tuned.more_native}
                language={result.tuned.language}
                accent={false}
              />
              <VariantCard
                title="Balanced"
                subtitle="recommended"
                text={result.tuned.balanced}
                language={result.tuned.language}
                accent
              />
              <VariantCard
                title="More English"
                text={result.tuned.more_english}
                language={result.tuned.language}
                accent={false}
              />
            </section>

            {result.naive !== null && (
              <section className="mt-10">
                <button
                  onClick={() => setNaiveOpen((v) => !v)}
                  className="flex items-center gap-2 text-sm text-neutral-400 hover:text-neutral-200"
                >
                  <span className="text-orange-500">{naiveOpen ? "▾" : "▸"}</span>
                  See what a naive prompt produces (Llama 3.3 70B, no tuning)
                </button>
                {naiveOpen && (
                  <div className="mt-3 rounded-xl border border-neutral-800 bg-panel p-5">
                    <p className="mb-3 text-sm text-neutral-500">
                      The naive prompt usually translates instead of code-mixing,
                      drops particles like <span className="text-neutral-300">yaar</span>
                      /<span className="text-neutral-300">da</span>, or
                      over-formalises the tone.
                    </p>
                    <pre className="whitespace-pre-wrap break-words font-sans text-base leading-relaxed text-neutral-200">
                      {result.naive}
                    </pre>
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}

function VariantCard({
  title,
  subtitle,
  text,
  language,
  accent,
}: {
  title: string;
  subtitle?: string;
  text: string;
  language: "hinglish" | "tanglish";
  accent: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  async function play() {
    if (playing) return;
    setPlaying(true);
    try {
      let url = audioUrl;
      if (!url) {
        const res = await fetch("/api/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, language }),
        });
        const json = await res.json();
        if (!res.ok || !json.audio) throw new Error(json.error ?? "TTS failed");
        const blob = base64ToBlob(json.audio, "audio/wav");
        url = URL.createObjectURL(blob);
        setAudioUrl(url);
      }
      const audio = new Audio(url);
      audio.onended = () => setPlaying(false);
      audio.onerror = () => setPlaying(false);
      await audio.play();
    } catch {
      setPlaying(false);
    }
  }

  return (
    <div
      className={`flex flex-col rounded-xl border p-5 transition ${
        accent
          ? "border-orange-500/40 bg-orange-500/[0.04]"
          : "border-neutral-800 bg-panel"
      }`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h3
            className={`text-sm font-medium ${
              accent ? "text-orange-400" : "text-neutral-300"
            }`}
          >
            {title}
          </h3>
          {subtitle && (
            <span className="text-[10px] uppercase tracking-wider text-orange-500/70">
              {subtitle}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={play}
            disabled={playing}
            className="text-xs text-neutral-500 hover:text-neutral-200 disabled:opacity-50"
            title="Play in a native voice (Sarvam TTS)"
          >
            {playing ? "playing…" : "▶ play"}
          </button>
          <button
            onClick={copy}
            className="text-xs text-neutral-500 hover:text-neutral-200"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
      </div>
      <p className="whitespace-pre-wrap break-words text-base leading-relaxed text-neutral-100">
        {text}
      </p>
    </div>
  );
}

function base64ToBlob(base64: string, mime: string): Blob {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}
