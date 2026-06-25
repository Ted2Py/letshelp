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
  // --- HIGH: near-certain scam signals ---
  { test: /gift\s?cards?|steam\s?cards?|apple\s?cards?|google\s?play|itunes\s?cards?|prepaid\s?cards?/i, reason: 'Asks you to buy gift cards', level: 'high' },
  { test: /\bbitcoin\b|\bcrypto|wire\s?transfer|\bzelle\b|\bvenmo\b|cash\s?app|moneygram|western\s?union/i, reason: 'Asks for crypto, a wire transfer, or an app payment', level: 'high' },
  { test: /verification\s?code|security\s?code|one[-\s]?time\s?(code|password|pin)|\b2fa\b|\botp\b|read\s+(me|us|back)\b[^.]*\bcode|the\s+code\s+(we|i|they)\s+(just\s+)?(sent|texted)|share\s+(the\s+|your\s+)?code/i, reason: 'Wants a verification code or PIN', level: 'high' },
  { test: /anydesk|teamviewer|remote\s?(access|control|desktop|connect)|access\s+your\s+(computer|device|screen)|control\s+your\s+(computer|device)|install[^.]*(software|app|program)/i, reason: 'Wants remote access to your device', level: 'high' },
  { test: /social\s?security\s?(number|#|no\b)|\bssn\b|medicare\s?(number|#|id|card)|bank\s?(login|password|account\s?number|details)|routing\s?number|\bcvv\b|card\s?number/i, reason: 'Asks for sensitive personal or financial information', level: 'high' },
  { test: /(your|the|this)\s+(computer|device|pc|mac|account)\s+(is|has been|may be|was)\s+(infected|hacked|compromised|at risk|locked)|virus\s+(detected|found)|malware\s+detected|(microsoft|apple|windows)\s+(support|security|defender)|call\s+(this\s+number|us|support|microsoft|apple)\s+(now|immediately|right away)/i, reason: 'Fake virus or tech-support warning', level: 'high' },
  { test: /\bIRS\b|internal\s+revenue|social\s+security\s+administration|government\s+grant|arrest\s+warrant|legal\s+action[^.]*(against you|immediately)|you\s+(have\s+)?won|you'?re\s+a\s+winner|claim\s+your\s+(prize|reward|winnings)|lottery|sweepstakes|inheritance/i, reason: 'Classic scam hook (prize, IRS, threats)', level: 'high' },

  // --- CAUTION: common but not always scams ---
  { test: /account\s+(is\s+)?(locked|suspended|on hold|disabled|limited|closed)|unusual\s+(activity|login|sign-?in)|verify\s+your\s+(account|identity|information)|confirm\s+your\s+(account|identity|payment|details)|update\s+your\s+(payment|billing|information)/i, reason: 'Claims your account has a problem', level: 'caution' },
  { test: /act\s+now|immediately|urgent(ly)?|right\s+away|within\s+\d+\s+(hours?|minutes?|days?)|final\s+(notice|warning|reminder)|expires?\s+(today|soon|in)|last\s+chance/i, reason: 'Pressures you to act fast', level: 'caution' },
  { test: /do\s?n.?t\s+tell|keep\s+(this\s+)?(a\s+)?secret|don.?t\s+(call|talk|tell)\s+(anyone|your|the)|confidential|between\s+us/i, reason: 'Tells you to keep it secret', level: 'caution' },
  { test: /unpaid\s+toll|e-?z\s?pass|\busps\b|\bfedex\b|\bups\b|\bdhl\b|package\s+(could\s+not|failed|is\s+waiting|on hold)|delivery\s+(problem|failed|attempt)|track\s+your\s+(package|parcel|shipment)/i, reason: 'Unexpected package or toll "problem"', level: 'caution' },
  { test: /(norton|mcafee|geek\s?squad|paypal|amazon|netflix|apple)\s+[^.]{0,30}(subscription|membership|renewal|charged|invoice|order)|auto.?renew|your\s+(subscription|membership)[^.]{0,30}(renewed|charged)|refund\s+(of|for)\s+\$?\d/i, reason: 'Fake subscription or refund bait', level: 'caution' },
  { test: /click\s+(here|the\s+link|below)|tap\s+(here|the\s+link)|https?:\/\/(bit\.ly|tinyurl|t\.co|goo\.gl|[a-z0-9-]+\.(xyz|top|info|click|live|buzz|cn|ru|tk))/i, reason: 'Asks you to click a suspicious link', level: 'caution' },
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
 * Build the full text prompt (instructions + the thing to analyze). We fold the
 * instructions into the prompt text — the exact shape that works in
 * generateSessionSummary() — instead of using a separate systemInstruction field.
 */
function buildPrompt(input: AnalyzeScamInput, ruleSummary: string): string {
  const pieces: string[] = [SYSTEM_PROMPT, 'Here is what to look at:'];

  if (input.text && input.text.trim()) {
    pieces.push(`A message the senior received:\n"""\n${input.text.trim().slice(0, 4000)}\n"""`);
  }
  if (input.callAnswers) {
    pieces.push(ruleSummary);
  }
  if (input.imageBase64) {
    pieces.push('The senior also attached a screenshot/photo (below). Read any text in the image and treat it as the thing to check.');
  }
  if (pieces.length === 2) {
    pieces.push('The senior asked whether something might be a scam but gave little detail. Give cautious, general guidance and choose "caution".');
  }

  return pieces.join('\n\n');
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

    // Build contents the same proven way generateSessionSummary does: a plain
    // string when there's no image, or [text, image] parts when there is one.
    const promptText = buildPrompt(input, callSummary);
    const contents: unknown = input.imageBase64
      ? [
          { text: promptText },
          { inlineData: { mimeType: input.imageMimeType || 'image/jpeg', data: input.imageBase64 } },
        ]
      : promptText;

    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: contents as never,
    });

    const raw = response.text?.trim() ?? '';
    const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();

    if (!cleaned) {
      throw new Error('Empty response from model');
    }

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

  // --- If the LLM did not actually run, NEVER say "safe". Fall back to at least
  // "caution" so a failed analysis can never reassure the senior by accident. ---
  if (!llm) {
    const safeFloor = mostDangerous(floor, 'caution');
    const reasons = ruleReasons.length ? ruleReasons : ["I couldn't fully check this one"];
    return fallbackResult(safeFloor, reasons);
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
