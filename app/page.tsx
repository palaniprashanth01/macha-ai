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
    <main className="relative min-h-screen w-full overflow-hidden px-4 py-8 sm:py-12">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[420px] dot-grid opacity-50" />

      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex items-center justify-between">
          <a href="/" className="flex flex-col gap-0.5">
            <Wordmark />
            <span className="pl-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-neutral-500">
              your language. <span className="text-orange-500">tuned.</span>
            </span>
          </a>
          <a
            href="https://github.com/palaniprashanth01/macha-ai"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full border border-neutral-800 px-3 py-1 text-xs text-neutral-400 transition hover:border-neutral-700 hover:text-neutral-100 sm:flex"
          >
            <GithubIcon /> GitHub
          </a>
        </header>

        <section className="mb-10 max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-3 py-1 text-xs text-orange-300">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-orange-400" />
            Hinglish · Tanglish · Code-mix
          </div>
          <h2 className="text-3xl font-semibold leading-tight tracking-tight sm:text-5xl">
            Three rewrites,{" "}
            <span className="bg-gradient-to-br from-orange-300 via-orange-500 to-pink-500 bg-clip-text text-transparent">
              calibrated
            </span>{" "}
            <br className="hidden sm:block" />
            for the way you actually post.
          </h2>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-neutral-400 sm:text-lg">
            Type or speak a draft. Pick a platform. Get three versions —
            more native, balanced, more English — and hear them back in a real
            Indian voice. With a side-by-side look at what an untuned model would
            have written.
          </p>
        </section>

        <section className="glow-ring rounded-2xl border border-neutral-800 bg-panel/80 p-5 backdrop-blur-sm sm:p-6">
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
            <div className="fade-up mt-8 mb-4 flex flex-wrap items-center gap-3 text-sm">
              <span className="rounded-full border border-orange-500/40 bg-orange-500/10 px-2.5 py-0.5 text-xs uppercase tracking-wider text-orange-400">
                {result.tuned.language}
              </span>
              <MixBar
                native={result.tuned.native_pct}
                english={result.tuned.english_pct}
                language={result.tuned.language}
              />
            </div>

            <section className="grid gap-4 sm:grid-cols-3">
              <div className="fade-up fade-up-1">
                <VariantCard
                  title="More native"
                  text={result.tuned.more_native}
                  language={result.tuned.language}
                  accent={false}
                />
              </div>
              <div className="fade-up fade-up-2">
                <VariantCard
                  title="Balanced"
                  subtitle="recommended"
                  text={result.tuned.balanced}
                  language={result.tuned.language}
                  accent
                />
              </div>
              <div className="fade-up fade-up-3">
                <VariantCard
                  title="More English"
                  text={result.tuned.more_english}
                  language={result.tuned.language}
                  accent={false}
                />
              </div>
            </section>

            {result.naive !== null && (
              <section className="fade-up fade-up-3 mt-10">
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

        <section className="mt-16 border-t border-neutral-900 pt-8">
          <p className="mb-4 text-xs uppercase tracking-widest text-neutral-600">
            Powered by
          </p>
          <div className="grid gap-3 sm:grid-cols-3">
            <ProviderCard
              name="Gemini 2.5 Flash"
              role="Tuned rewrite (structured JSON, taxonomy + few-shot)"
            />
            <ProviderCard
              name="Groq · Llama 3.3 70B"
              role="Naive baseline (the demo contrast)"
            />
            <ProviderCard
              name="Sarvam"
              role="Indian voices in & out (saarika · bulbul)"
            />
          </div>
        </section>

        <footer className="mt-12 flex flex-col items-center gap-2 border-t border-neutral-900 pt-6 text-xs text-neutral-600 sm:flex-row sm:justify-between">
          <span>
            Built for Indian creators · code-mix without the cliché
          </span>
          <a
            href="https://github.com/palaniprashanth01/macha-ai"
            target="_blank"
            rel="noreferrer"
            className="hover:text-neutral-300"
          >
            github.com/palaniprashanth01/macha-ai
          </a>
        </footer>
      </div>
    </main>
  );
}

function Wordmark() {
  return (
    <span
      aria-label="macha.ai"
      className="flex items-baseline font-extrabold leading-none tracking-tight text-neutral-100"
      style={{ fontSize: "2rem" }}
    >
      <span className="text-orange-500">ma</span>
      <span className="relative inline-block">
        <span className="text-orange-500">c</span>
        <span
          aria-hidden
          className="pointer-events-none absolute left-0 top-0 text-neutral-100"
          style={{ clipPath: "inset(0 0 0 50%)" }}
        >
          c
        </span>
      </span>
      <span>ha</span>
      <span className="ml-[1px] text-[1.1rem] font-extrabold">
        <span className="text-orange-500">.</span>
        <span>ai</span>
      </span>
    </span>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.31.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function MixBar({
  native,
  english,
  language,
}: {
  native: number;
  english: number;
  language: "hinglish" | "tanglish";
}) {
  const total = Math.max(1, native + english);
  const nativePct = Math.round((native / total) * 100);
  const englishPct = 100 - nativePct;
  return (
    <div className="flex items-center gap-2 text-xs text-neutral-400">
      <span>
        {NATIVE_LABEL[language]} <span className="text-neutral-200">{nativePct}%</span>
      </span>
      <span className="relative h-1.5 w-32 overflow-hidden rounded-full bg-neutral-800">
        <span
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 to-pink-500"
          style={{ width: `${nativePct}%` }}
        />
      </span>
      <span>
        English <span className="text-neutral-200">{englishPct}%</span>
      </span>
    </div>
  );
}

function ProviderCard({ name, role }: { name: string; role: string }) {
  return (
    <div className="rounded-xl border border-neutral-900 bg-panel/50 p-4 transition hover:border-neutral-800">
      <div className="text-sm font-medium text-neutral-200">{name}</div>
      <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">{role}</div>
    </div>
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
      className={`group flex h-full flex-col rounded-xl border p-5 transition duration-300 hover:-translate-y-0.5 ${
        accent
          ? "border-orange-500/40 bg-gradient-to-br from-orange-500/[0.08] to-pink-500/[0.04] hover:border-orange-500/60"
          : "border-neutral-800 bg-panel hover:border-neutral-700"
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
