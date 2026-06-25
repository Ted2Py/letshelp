/**
 * Pause & Check — Scam-Safety intake + result UI for seniors.
 *
 * Lets a senior check whether something is a scam by:
 *   - pasting a message
 *   - answering a few questions about a phone call
 *   - uploading a picture (screenshot/photo)
 *   - or just talking to a live helper (reuses the existing session flow)
 *
 * Large text, simple language, and a calm colorblind-safe result (amber / blue /
 * slate — never red/green). Never claims something is guaranteed safe.
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquareText,
  Phone,
  Image as ImageIcon,
  Headphones,
  ShieldAlert,
  ShieldQuestion,
  ShieldCheck,
  ArrowLeft,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { createSupportSession } from '@/lib/actions/support';
import type { CallAnswers, RiskLevel, ScamRiskResult } from '@/lib/scam-safety';

type Mode = 'choose' | 'text' | 'call' | 'image';

const CALL_QUESTIONS: Array<{ key: keyof CallAnswers; label: string }> = [
  { key: 'askedForCode', label: 'Did they ask you to read back a code (from a text or email)?' },
  { key: 'askedForGiftCard', label: 'Did they ask you to buy gift cards?' },
  { key: 'askedForCryptoOrWire', label: 'Did they ask for crypto, a wire transfer, or an app payment?' },
  { key: 'askedForRemoteAccess', label: 'Did they want to connect to or control your computer?' },
  { key: 'askedForSensitiveInfo', label: 'Did they ask for your Social Security, Medicare, or bank details?' },
  { key: 'pressuredOrUrgent', label: 'Did they pressure you to act right away?' },
  { key: 'askedToKeepSecret', label: 'Did they tell you to keep it secret?' },
];

export function ScamCheck() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('choose');
  const [text, setText] = useState('');
  const [callAnswers, setCallAnswers] = useState<CallAnswers>({});
  const [imageData, setImageData] = useState<{ base64: string; mime: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScamRiskResult | null>(null);

  const reset = () => {
    setMode('choose');
    setText('');
    setCallAnswers({});
    setImageData(null);
    setError(null);
    setResult(null);
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please choose a picture (a photo or screenshot).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] ?? '';
      setImageData({ base64, mime: file.type, name: file.name });
      setError(null);
    };
    reader.onerror = () => setError('Sorry, that picture could not be read. Please try another.');
    reader.readAsDataURL(file);
  };

  const submit = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      if (mode === 'text') payload.text = text;
      if (mode === 'call') payload.callAnswers = callAnswers;
      if (mode === 'image' && imageData) {
        payload.imageBase64 = imageData.base64;
        payload.imageMimeType = imageData.mime;
      }

      const res = await fetch('/api/support/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }

      const data = (await res.json()) as ScamRiskResult;
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const buildHelperContext = (): string => {
    const parts: string[] = [];
    if (result) {
      parts.push('The senior just used the LetsHelp Scam-Safety check and wants to talk it through with you.');
      if (mode === 'text' && text.trim()) {
        parts.push(`They were checking this message: "${text.trim().slice(0, 600)}".`);
      } else if (mode === 'call') {
        const flags = CALL_QUESTIONS.filter((q) => callAnswers[q.key]).map((q) => q.label.replace(/^Did they /, '').replace(/\?$/, ''));
        parts.push(flags.length ? `It was about a phone call where: ${flags.join('; ')}.` : 'It was about a phone call they were unsure of.');
      } else if (mode === 'image') {
        parts.push('They uploaded a screenshot/photo of something they were unsure about.');
      }
      const verdict = result.riskLevel === 'high' ? 'looks like a scam' : result.riskLevel === 'caution' ? 'is worth being careful about' : 'showed no clear danger';
      parts.push(`Our check said it ${verdict} ("${result.headline}").`);
      if (result.redFlags.length) parts.push(`Warning signs noticed: ${result.redFlags.join('; ')}.`);
    } else {
      parts.push('The senior opened the LetsHelp "Pause & Check" scam-safety tool and chose to talk to a helper. They are unsure whether a message, call, or pop-up might be a scam and want to talk it through.');
    }
    return parts.join(' ');
  };

  const talkToHelper = async () => {
    setStartingSession(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('letshelp-helper-context', buildHelperContext());
    }
    const res = await createSupportSession({ source: 'pause_check' });
    if (res.success && res.sessionId) {
      router.push(`/senior/session/${res.sessionId}`);
    } else {
      setStartingSession(false);
      setError('Could not start a session right now. Please try again.');
    }
  };

  // ---------- RESULT ----------
  if (result) {
    return <ResultCard result={result} onCheckAnother={reset} onTalkToHelper={talkToHelper} startingSession={startingSession} />;
  }

  const canSubmit =
    (mode === 'text' && text.trim().length > 0) ||
    // On the phone-call screen you can always check — tapping items is optional.
    mode === 'call' ||
    (mode === 'image' && !!imageData);

  // ---------- CHOOSE ----------
  if (mode === 'choose') {
    const choices: Array<{ key: Mode | 'helper'; icon: typeof MessageSquareText; title: string; desc: string }> = [
      { key: 'text', icon: MessageSquareText, title: 'Paste a message', desc: 'A text or email you are unsure about' },
      { key: 'call', icon: Phone, title: 'About a phone call', desc: 'Answer a few quick questions' },
      { key: 'image', icon: ImageIcon, title: 'Upload a picture', desc: 'A photo or screenshot of what you see' },
      { key: 'helper', icon: Headphones, title: 'Just tell a helper', desc: 'Talk it through out loud' },
    ];
    return (
      <div className="grid sm:grid-cols-2 gap-4 sm:gap-6">
        {choices.map((c) => (
          <button
            key={c.key}
            onClick={() => (c.key === 'helper' ? talkToHelper() : setMode(c.key as Mode))}
            disabled={startingSession}
            className="text-left bg-white rounded-3xl shadow-lg p-6 sm:p-8 border-4 border-transparent hover:border-[#1E5A8D] hover:-translate-y-1 transition-all duration-200 disabled:opacity-60"
          >
            <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl bg-[#EEF4FB] flex items-center justify-center mb-4">
              {c.key === 'helper' && startingSession ? (
                <Loader2 className="h-7 w-7 sm:h-8 sm:w-8 text-[#1E5A8D] animate-spin" />
              ) : (
                <c.icon className="h-7 w-7 sm:h-8 sm:w-8 text-[#1E5A8D]" />
              )}
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] mb-1 font-[Fraunces,serif]">{c.title}</h3>
            <p className="text-base sm:text-lg text-[#5A6B7F] leading-snug">{c.desc}</p>
          </button>
        ))}
      </div>
    );
  }

  // ---------- INPUT FORMS ----------
  return (
    <Card className="p-5 sm:p-8 rounded-3xl shadow-lg bg-white border-0">
      <button
        onClick={reset}
        className="flex items-center gap-2 text-lg text-[#1E5A8D] font-semibold mb-6 hover:underline"
      >
        <ArrowLeft className="h-5 w-5" /> Back
      </button>

      {mode === 'text' && (
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            Paste the message here
          </h2>
          <p className="text-lg text-[#5A6B7F]">
            Copy the text or email you are unsure about and paste it below. I will take a look.
          </p>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste the suspicious message here..."
            className="min-h-40 text-lg sm:text-xl p-4 rounded-2xl border-2 border-gray-200 focus-visible:ring-[#1E5A8D]"
          />
        </div>
      )}

      {mode === 'call' && (
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            About the phone call
          </h2>
          <p className="text-lg text-[#5A6B7F]">
            Tap any that happened. If none of these did, that&apos;s okay — just tap
            &ldquo;Check it for me&rdquo; below and I&apos;ll still help.
          </p>
          <div className="space-y-3">
            {CALL_QUESTIONS.map((q) => {
              const checked = !!callAnswers[q.key];
              return (
                <button
                  key={q.key as string}
                  onClick={() => setCallAnswers((prev) => ({ ...prev, [q.key]: !prev[q.key] }))}
                  className={`w-full flex items-start gap-4 text-left p-4 rounded-2xl border-2 transition-colors ${
                    checked ? 'border-[#1E5A8D] bg-[#EEF4FB]' : 'border-gray-200 bg-white hover:bg-gray-50'
                  }`}
                >
                  <span
                    className={`mt-0.5 h-7 w-7 shrink-0 rounded-lg border-2 flex items-center justify-center ${
                      checked ? 'border-[#1E5A8D] bg-[#1E5A8D] text-white' : 'border-gray-300'
                    }`}
                  >
                    {checked && <CheckCircle2 className="h-5 w-5" />}
                  </span>
                  <span className="text-lg sm:text-xl text-[#1E3A5F]">{q.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {mode === 'image' && (
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] font-[Fraunces,serif]">
            Upload a picture
          </h2>
          <p className="text-lg text-[#5A6B7F]">
            Take a photo or screenshot of what you see, then choose it below.
          </p>
          <label className="block cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageFile(file);
              }}
            />
            <div className="border-4 border-dashed border-gray-300 rounded-2xl p-8 text-center hover:border-[#1E5A8D] transition-colors">
              {imageData ? (
                <p className="text-lg text-[#1E3A5F] font-semibold flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-6 w-6 text-teal-600" /> {imageData.name}
                </p>
              ) : (
                <p className="text-lg text-[#5A6B7F] flex items-center justify-center gap-2">
                  <ImageIcon className="h-6 w-6" /> Tap to choose a picture
                </p>
              )}
            </div>
          </label>
        </div>
      )}

      {error && (
        <p className="mt-4 text-lg text-amber-800 bg-amber-50 border-2 border-amber-200 rounded-xl p-3">{error}</p>
      )}

      <Button
        onClick={submit}
        disabled={!canSubmit || loading}
        size="lg"
        className="mt-6 w-full h-16 text-xl font-bold rounded-2xl bg-[#1E5A8D] hover:bg-[#1E4A6D] text-white"
      >
        {loading ? (
          <>
            <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Checking...
          </>
        ) : (
          'Check it for me'
        )}
      </Button>
    </Card>
  );
}

// ---------- Result presentation ----------

const RISK_STYLES: Record<RiskLevel, { icon: typeof ShieldAlert; label: string; card: string; chip: string; iconColor: string }> = {
  high: {
    icon: ShieldAlert,
    label: 'Warning',
    card: 'bg-amber-50 border-amber-300',
    chip: 'bg-amber-200 text-amber-900',
    iconColor: 'text-amber-700',
  },
  caution: {
    icon: ShieldQuestion,
    label: 'Be careful',
    card: 'bg-blue-50 border-blue-300',
    chip: 'bg-blue-200 text-blue-900',
    iconColor: 'text-blue-700',
  },
  likely_safe: {
    icon: ShieldCheck,
    label: 'No clear danger',
    card: 'bg-slate-50 border-slate-300',
    chip: 'bg-slate-200 text-slate-800',
    iconColor: 'text-slate-600',
  },
};

function ResultCard({
  result,
  onCheckAnother,
  onTalkToHelper,
  startingSession,
}: {
  result: ScamRiskResult;
  onCheckAnother: () => void;
  onTalkToHelper: () => void;
  startingSession: boolean;
}) {
  const style = RISK_STYLES[result.riskLevel];
  const Icon = style.icon;

  return (
    <Card className={`p-6 sm:p-10 rounded-3xl shadow-lg border-4 ${style.card}`}>
      <div className="flex items-start gap-4 sm:gap-6">
        <div className="shrink-0">
          <Icon className={`h-14 w-14 sm:h-20 sm:w-20 ${style.iconColor}`} />
        </div>
        <div className="min-w-0">
          <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold uppercase tracking-wide ${style.chip}`}>
            {style.label}
          </span>
          <h2 className="mt-2 text-2xl sm:text-4xl font-bold text-[#1E3A5F] font-[Fraunces,serif] leading-tight">
            {result.headline}
          </h2>
        </div>
      </div>

      {result.redFlags.length > 0 && (
        <div className="mt-6 sm:mt-8">
          <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-2">What I noticed</h3>
          <ul className="space-y-2">
            {result.redFlags.map((flag, i) => (
              <li key={i} className="flex items-start gap-3 text-lg sm:text-xl text-[#1E3A5F]">
                <span className={`mt-2 h-2.5 w-2.5 rounded-full shrink-0 ${style.iconColor.replace('text-', 'bg-')}`} />
                {flag}
              </li>
            ))}
          </ul>
        </div>
      )}

      {result.whatToDo.length > 0 && (
        <div className="mt-6 sm:mt-8 bg-white/70 rounded-2xl p-5 sm:p-6">
          <h3 className="text-lg sm:text-xl font-bold text-[#1E3A5F] mb-3">What to do now</h3>
          <ol className="space-y-3">
            {result.whatToDo.map((step, i) => (
              <li key={i} className="flex items-start gap-3 text-lg sm:text-xl text-[#1E3A5F]">
                <span className="shrink-0 h-8 w-8 rounded-full bg-[#1E5A8D] text-white font-bold flex items-center justify-center text-base">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {result.verifyVia && (
        <p className="mt-6 text-lg sm:text-xl text-[#1E3A5F] bg-white/70 rounded-2xl p-5">
          <span className="font-bold">How to be sure: </span>
          {result.verifyVia}
        </p>
      )}

      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <Button
          onClick={onTalkToHelper}
          disabled={startingSession}
          size="lg"
          className="flex-1 h-16 text-xl font-bold rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white"
        >
          {startingSession ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" /> Connecting...
            </>
          ) : (
            <>
              <Headphones className="mr-3 h-6 w-6" /> Talk to a helper about this
            </>
          )}
        </Button>
        <Button
          onClick={onCheckAnother}
          variant="outline"
          size="lg"
          className="flex-1 h-16 text-xl font-bold rounded-2xl border-2 border-[#1E5A8D] text-[#1E5A8D] bg-white hover:bg-[#EEF4FB]"
        >
          Check something else
        </Button>
      </div>
    </Card>
  );
}
