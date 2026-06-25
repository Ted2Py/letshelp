/**
 * Scam-Safety Engine for LetsHelp "Pause & Check"
 *
 * A two-layer engine that helps seniors decide whether a message, screenshot,
 * or phone call is a scam:
 *
 *   1. Rule layer (deterministic) — looks for hard red flags (gift cards, codes,
 *      remote access, crypto, urgency, secrecy...). Any hit forces the verdict to
 *      at least "caution" and never lets it be "likely_safe".
 *   2. LLM layer (explanatory) — Gemini explains WHY in plain, senior-friendly
 *      language and gives one clear next step. It may RAISE the risk level but the
 *      rule layer only ever clamps it UPWARD.
 *
 * CRITICAL SAFETY RULE: We never give a confident "this is safe." A false all-clear
 * to a senior is the worst possible outcome, so the wording always biases toward
 * "pause and verify through an official channel."
 *
 * Runs server-side only (uses GOOGLE_GENAI_API_KEY). Mirrors the JSON-generation
 * pattern in generateSessionSummary() in ./gemini.ts.
 */

import { getGeminiClient } from './gemini';

/** The three possible verdicts, ordered from most to least dangerous. */
export type RiskLevel = 'high' | 'caution' | 'likely_safe';

/** Severity ordering so we can clamp "upward" (toward more danger). */
const RISK_SEVERITY: Record<RiskLevel, number> = {
  likely_safe: 0,
  caution: 1,
  high: 2,
};

/** Return whichever of the two levels is more dangerous. */
function mostDangerous(a: RiskLevel, b: RiskLevel): RiskLevel {
  return RISK_SEVERITY[a] >= RISK_SEVERITY[b] ? a : b;
}

export interface ScamRiskResult {
  riskLevel: RiskLevel;
  /** One short, plain-language headline a senior will read first. */
  headline: string;
  /** Specific warning signs we found, in plain language. */
  redFlags: string[];
  /** 2-4 concrete, calm next steps. The first should be the most important. */
  whatToDo: string[];
  /** How to verify through an official/trusted channel. */
  verifyVia: string;
}

/** Structured answers from the "About a phone call" guided checklist. */
export interface CallAnswers {
  askedForCode?: boolean;
  askedForGiftCard?: boolean;
  askedForCryptoOrWire?: boolean;
  askedForRemoteAccess?: boolean;
  askedForSensitiveInfo?: boolean; // SSN, Medicare, bank login
  pressuredOrUrgent?: boolean;
  askedToKeepSecret?: boolean;
  claimedToBeCompany?: string; // e.g. "Microsoft", "my bank", "Medicare"
}

export interface AnalyzeScamInput {
  /** Pasted message text (SMS, email, pop-up wording). */
  text?: string;
  /** Base64-encoded image (screenshot/photo), WITHOUT the data: URL prefix. */
  imageBase64?: string;
  /** MIME type of the image, e.g. "image/jpeg" or "image/png". */
  imageMimeType?: string;
  /** Answers from the guided phone-call checklist. */
  callAnswers?: CallAnswers;
}

/**
 * Hard red-flag rules. If a rule's pattern is found in the text, the verdict can
 * never be "likely_safe". These are deliberately high-precision scam signals.
 */
const RED_FLAG_RULES: Array<{ test: RegExp; reason: string; level: RiskLevel }> = [
  { test: /\bgift\s?cards?\b|\bsteam\s?cards?\b|\bapple\s?cards?\b|\bgoogle\s?play\s?cards?\b/i, reason: 'Asks you to buy gift cards', level: 'high' },
  { test: /\bbitcoin\b|\bcrypto(currency)?\b|\bwire\s?transfer\b|\bzelle\b|\bvenmo\b|\bcash\s?app\b/i, reason: 'Asks for crypto, a wire transfer, or an app payment', level: 'high' },
  { test: /\b(verification|security|one[-\s]?time|2fa|otp)\s?codes?\b|\bcode\s+(we|i)\s+(just\s+)?sent\b|\bread\s+(me\s+)?the\s+code\b/i, reason: 'Asks you to share a verification code', level: 'high' },
  { test: /\banydesk\b|\bteamviewer\b|\bremote(\s?ly)?\s?(access|control|connect)\b|\blet me (access|control) your (computer|screen)\b/i, reason: 'Wants remote access to your device', level: 'high' },
  { test: /\bsocial\s?security\s?(number|#)?\b|\bssn\b|\bmedicare\s?(number|#|id)\b|\bbank\s?(login|password|account number)\b|\brouting\s?number\b/i, reason: 'Asks for sensitive personal or financial information', level: 'high' },
  { test: /\b(your\s+)?(computer|device|pc)\s+(is\s+)?(infected|has a virus|compromised)\b|\bvirus\s+detected\b|\bcall\s+(this\s+number|us|support)\s+(now|immediately)\b/i, reason: 'Fake virus / tech-support warning', level: 'high' },
  { test: /\bsuspend(ed|ing)?\b|\blocked\b|\bunusual\s+activity\b|\bverify\s+your\s+account\b/i, reason: 'Claims your account is locked or suspended', level: 'caution' },
  { test: /\bact\s+now\b|\bimmediately\b|\burgent(ly)?\b|\bwithin\s+\d+\s+(hours?|minutes?)\b|\bfinal\s+(notice|warning)\b/i, reason: 'Pressures you to act fast', level: 'caution' },
  { test: /\bdo\s?n['o]?t\s+tell\b|\bkeep\s+(this\s+)?(a\s+)?secret\b|\bconfidential\b|\bdon['o]?t\s+(call|talk to)\b/i, reason: 'Tells you to keep it secret', level: 'caution' },
  { test: /\b(unpaid\s+)?toll\b|\be-?zpass\b|\busps\b|\bfedex\b|\bups\b|\bpackage\s+(could\s+not|failed|is\s+waiting)\b|\bdelivery\s+(problem|failed)\b/i, reason: 'Unexpected package or toll "problem" with a link', level: 'caution' },
  { test: /https?:\/\/(?!(?:www\.)?(?:letshelp|google|microsoft|apple|medicare|irs|ssa)\.gov?)[^\s]+|\bbit\.ly\b|\btinyurl\b|\b[a-z0-9-]+\.(xyz|top|info|click|live|buzz)\b/i, reason: 'Contains a suspicious link to click', level: 'caution' },
];

/**
 * Run the deterministic rule layer over a block of text.
 * Returns the floor risk level and the human-readable reasons found.
 */
function applyRuleLayer(text: string): { floor: RiskLevel; reasons: string[] } {
  let floor: RiskLevel = 'likely_safe';
  const reasons: string[] = [];

  for (const rule of RED_FLAG_RULES) {
    if (rule.test.test(text)) {
      floor = mostDangerous(floor, rule.level);
      reasons.push(rule.reason);
    }
  }

  return { floor, reasons };
}

/**
 * Turn the phone-call checklist into a floor risk + reasons, and a text blob the
 * LLM can reason about.
 */
function evaluateCallAnswers(a: CallAnswers): { floor: RiskLevel; reasons: string[]; summary: string } {
  const reasons: string[] = [];
  let floor: RiskLevel = 'likely_safe';

  const highFlags: Array<[boolean | undefined, string]> = [
    [a.askedForCode, 'They asked for a verification code'],
    [a.askedForGiftCard, 'They asked you to buy gift cards'],
    [a.askedForCryptoOrWire, 'They asked for crypto or a wire transfer'],
    [a.askedForRemoteAccess, 'They wanted remote access to your device'],
    [a.askedForSensitiveInfo, 'They asked for sensitive info (SSN, Medicare, or bank login)'],
  ];
  const cautionFlags: Array<[boolean | undefined, string]> = [
    [a.pressuredOrUrgent, 'They pressured you to act quickly'],
    [a.askedToKeepSecret, 'They told you to keep it secret'],
  ];

  for (const [hit, reason] of highFlags) {
    if (hit) { floor = mostDangerous(floor, 'high'); reasons.push(reason); }
  }
  for (const [hit, reason] of cautionFlags) {
    if (hit) { floor = mostDangerous(floor, 'caution'); reasons.push(reason); }
  }

  const summaryParts = [...reasons];
  if (a.claimedToBeCompany) {
    summaryParts.push(`The caller claimed to be from "${a.claimedToBeCompany}".`);
  }
  const summary = summaryParts.length
    ? `The senior received a phone call. ${summaryParts.join('. ')}.`
    : 'The senior received a phone call and was unsure whether it was a scam.';

  return { floor, reasons, summary };
}

/**
 * A deterministic, safe fallback used when the LLM is unavailable or returns
 * something unparseable. We never fail "open" (never claim safety).
 */
function fallbackResult(floor: RiskLevel, ruleReasons: string[]): ScamRiskResult {
  if (floor === 'high') {
    return {
      riskLevel: 'high',
      headline: 'This looks like a scam',
      redFlags: ruleReasons.length ? ruleReasons : ['It shows common scam warning signs'],
      whatToDo: [
        'Do not click any links, call any numbers, pay, or share any codes',
        'Stop and take a breath — real companies do not work this way',
        'Talk to someone you trust before doing anything',
      ],
      verifyVia: 'Contact the company using the official phone number on your card, bill, or their real website — not anything in this message.',
    };
  }
  if (floor === 'caution') {
    return {
      riskLevel: 'caution',
      headline: 'Be careful — check first',
      redFlags: ruleReasons.length ? ruleReasons : ['Something about this is worth double-checking'],
      whatToDo: [
        'Do not click links or share any personal information yet',
        'Slow down — there is no real emergency',
        'Verify who is really contacting you before you respond',
      ],
      verifyVia: 'Look up the company yourself and call their official number. Do not use the contact details in this message.',
    };
  }
  return {
    riskLevel: 'likely_safe',
    headline: 'No clear danger — but still verify',
    redFlags: ['We did not spot obvious scam signs, but we cannot be certain'],
    whatToDo: [
      'If it asks for money, codes, or personal information, treat it as suspicious',
      'When in doubt, ask a trusted family member or a LetsHelp helper',
    ],
    verifyVia: 'If it claims to be a company you use, contact them through their official number or website to be sure.',
  };
}

const SYSTEM_PROMPT = `You are a calm, plain-spoken scam-safety helper for older adults.
You look at a message, screenshot, or description of a phone call and decide how risky it is.

ABSOLUTE RULES:
- NEVER tell the user something is definitely safe or guaranteed safe. The most reassuring you may
  ever be is "no clear danger, but still verify." There is always a way to double-check.
- Bias toward caution. If you are unsure, choose the more cautious level.
- Speak simply, warmly, and briefly. Short sentences. No technical jargon. No blame.
- Never tell them to click a link, call a number, or pay anything that came FROM the suspicious item.
  Always steer them to an OFFICIAL channel they look up themselves (number on their card/bill, the
  real website, a trusted family member).

Respond with a JSON object ONLY (no markdown, no code fence) with EXACTLY these fields:
{
  "riskLevel": "high" | "caution" | "likely_safe",
  "headline": "a short, plain headline (max ~8 words)",
  "redFlags": ["specific warning signs in plain language", "..."],
  "whatToDo": ["2 to 4 concrete calm next steps; most important first"],
  "verifyVia": "one sentence on how to verify through an official/trusted channel"
}

riskLevel meaning:
- "high": clear scam signs (gift cards, codes, remote access, crypto/wire, fake virus, sensitive info).
- "caution": pressure, account-locked claims, suspicious links, unexpected package/toll problems.
- "likely_safe": nothing obviously dangerous — but still remind them to verify.`;

/**
 * Build the user-facing content payload for the Gemini call, combining whatever
 * inputs were provided (text, image, call answers).
 */
function buildContents(input: AnalyzeScamInput, ruleSummary: string): unknown {
  const parts: unknown[] = [];

  const textPieces: string[] = [];
  if (input.text && input.text.trim()) {
    textPieces.push(`The senior received this message and wants to know if it is a scam:\n"""\n${input.text.trim().slice(0, 4000)}\n"""`);
  }
  if (input.callAnswers) {
    textPieces.push(ruleSummary);
  }
  if (input.imageBase64) {
    textPieces.push('The senior uploaded the attached screenshot/photo and wants to know if it is a scam. Read any text in the image.');
  }
  if (textPieces.length === 0) {
    textPieces.push('The senior asked whether something might be a scam but gave little detail. Give cautious, general guidance.');
  }

  parts.push({ text: textPieces.join('\n\n') });

  if (input.imageBase64) {
    parts.push({
      inlineData: {
        mimeType: input.imageMimeType || 'image/jpeg',
        data: input.imageBase64,
      },
    });
  }

  return [{ role: 'user', parts }];
}

/**
 * Main entry point. Analyze whatever the senior gave us and return a structured,
 * senior-friendly verdict. Never throws — always returns a safe result.
 */
export async function analyzeScamRisk(input: AnalyzeScamInput): Promise<ScamRiskResult> {
  // --- Rule layer first (deterministic floor) ---
  let floor: RiskLevel = 'likely_safe';
  const ruleReasons: string[] = [];
  let callSummary = '';

  if (input.text) {
    const r = applyRuleLayer(input.text);
    floor = mostDangerous(floor, r.floor);
    ruleReasons.push(...r.reasons);
  }
  if (input.callAnswers) {
    const c = evaluateCallAnswers(input.callAnswers);
    floor = mostDangerous(floor, c.floor);
    ruleReasons.push(...c.reasons);
    callSummary = c.summary;
  }

  // --- LLM layer (explanatory) ---
  let llm: ScamRiskResult | null = null;
  try {
    const client = getGeminiClient();
    const response = await client.models.generateContent({
      model: 'gemini-2.0-flash',
      config: { systemInstruction: SYSTEM_PROMPT },
      contents: buildContents(input, callSummary) as never,
    });

    const raw = response.text?.trim() ?? '';
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(cleaned) as Partial<ScamRiskResult>;

    const level: RiskLevel =
      parsed.riskLevel === 'high' || parsed.riskLevel === 'caution' || parsed.riskLevel === 'likely_safe'
        ? parsed.riskLevel
        : 'caution';

    llm = {
      riskLevel: level,
      headline: String(parsed.headline ?? '').trim() || 'Let us check this together',
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags.map(String).filter(Boolean) : [],
      whatToDo: Array.isArray(parsed.whatToDo) ? parsed.whatToDo.map(String).filter(Boolean) : [],
      verifyVia: String(parsed.verifyVia ?? '').trim(),
    };
  } catch (err) {
    console.error('Scam analysis LLM call failed, using rule-based fallback:', err);
  }

  // --- Merge: rule layer can only clamp UPWARD (toward more danger) ---
  if (!llm) {
    return fallbackResult(floor, ruleReasons);
  }

  const finalLevel = mostDangerous(llm.riskLevel, floor);
  const safeFallback = fallbackResult(finalLevel, ruleReasons);

  // Combine red flags from both layers, de-duplicated.
  const mergedFlags = Array.from(new Set([...ruleReasons, ...llm.redFlags])).slice(0, 6);

  // If the rules pushed the level up beyond what the LLM said, the LLM's headline /
  // advice may be too reassuring — prefer the cautious fallback wording in that case.
  const ruleEscalated = RISK_SEVERITY[floor] > RISK_SEVERITY[llm.riskLevel];

  return {
    riskLevel: finalLevel,
    headline: ruleEscalated ? safeFallback.headline : llm.headline,
    redFlags: mergedFlags.length ? mergedFlags : safeFallback.redFlags,
    whatToDo: llm.whatToDo.length && !ruleEscalated ? llm.whatToDo.slice(0, 4) : safeFallback.whatToDo,
    verifyVia: llm.verifyVia || safeFallback.verifyVia,
  };
}
