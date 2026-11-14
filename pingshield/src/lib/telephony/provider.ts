/**
 * Simulated Telephony Provider for PingShield Demo
 *
 * IMPORTANT: This is a SIMULATED provider for local development and demos.
 * In production, replace with Twilio, Exotel, or an equivalent provider.
 *
 * Simulated behaviour:
 * - Calls are logged but no actual phone calls are made
 * - Call status transitions follow realistic patterns
 * - Callbacks are generated after a delay to simulate provider webhooks
 *
 * Production requirements:
 * - Twilio or Exotel account with verified numbers
 * - Number provisioning for masked calling
 * - Webhook endpoint for status callbacks
 * - TwiML/equivalent for call flow
 */

import { v4 as uuid } from 'uuid';
import { getDb } from '../db/connection';

export type CallStatus = 'initiated' | 'ringing' | 'in-progress' | 'completed' | 'no-answer' | 'busy' | 'failed' | 'cancelled';

export interface CallResult {
  providerCallId: string;
  status: CallStatus;
  fromNumber: string;
  toNumber: string;
}

export interface CallStatusCallback {
  providerCallId: string;
  status: CallStatus;
  duration?: number;
  answeredBy?: 'human' | 'machine' | 'unknown';
  timestamp: string;
}

// Simulated call outcomes for demo
const SIMULATED_OUTCOMES: { status: CallStatus; probability: number; duration?: number; answeredBy?: string }[] = [
  { status: 'no-answer', probability: 0.4 },
  { status: 'completed', probability: 0.3, duration: 45, answeredBy: 'human' },
  { status: 'busy', probability: 0.15 },
  { status: 'failed', probability: 0.1 },
  { status: 'cancelled', probability: 0.05 },
];

// Durable demo outcomes survive process restarts and are consumed by incident polling.
const pendingCallbacks = {
  set(id: string, entry: { callback: CallStatusCallback; resolveAt: number }) {
    getDb().prepare(`INSERT INTO job_queue (id, type, payload, scheduled_at) VALUES (?, 'demo_call', ?, ?) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, scheduled_at = excluded.scheduled_at, status = 'pending'`).run(id, JSON.stringify(entry.callback), new Date(entry.resolveAt).toISOString());
  },
};

/**
 * Initiate a masked call (SIMULATED)
 *
 * In production: would call Twilio/Exotel API to connect finder → relay number → owner
 * The finder's and owner's real numbers are never exposed to each other.
 */
export async function initiateCall(
  toNumber: string,
  fromDisplayNumber: string,
  callbackUrl: string,
  ringDurationSeconds: number = 30
): Promise<CallResult> {
  if (process.env.TELEPHONY_PROVIDER && process.env.TELEPHONY_PROVIDER !== 'simulated') throw new Error('Live telephony is not configured');
  const providerCallId = `sim_call_${uuid()}`;

  console.log(`[SIMULATED TELEPHONY] Call initiated:`, {
    providerCallId,
    to: '***MASKED***',
    from: '***MASKED***',
    ringDuration: ringDurationSeconds,
  });

  // Pick random outcome
  const roll = Math.random();
  let cumulative = 0;
  let outcome = SIMULATED_OUTCOMES[0];
  for (const o of SIMULATED_OUTCOMES) {
    cumulative += o.probability;
    if (roll < cumulative) {
      outcome = o;
      break;
    }
  }

  // Schedule simulated callback (2-5 seconds in demo)
  const delayMs = 2000 + Math.random() * 3000;
  pendingCallbacks.set(providerCallId, {
    callback: {
      providerCallId,
      status: outcome.status,
      duration: outcome.duration,
      answeredBy: outcome.answeredBy as any,
      timestamp: new Date(Date.now() + delayMs).toISOString(),
    },
    resolveAt: Date.now() + delayMs,
  });

  return {
    providerCallId,
    status: 'initiated',
    fromNumber: '***MASKED***',
    toNumber: '***MASKED***',
  };
}

/**
 * Check for pending simulated callbacks
 * In production: callbacks come via webhook POST from the provider
 */
export function getPendingCallbacks(): CallStatusCallback[] {
  const db = getDb();
  return db.prepare("SELECT payload FROM job_queue WHERE type = 'demo_call' AND status = 'pending' AND datetime(scheduled_at) <= datetime('now')").all().map(row => JSON.parse((row as { payload: string }).payload));
}

/**
 * Force a specific call outcome (for testing)
 */
export function forceCallOutcome(providerCallId: string, status: CallStatus, duration?: number) {
  pendingCallbacks.set(providerCallId, {
    callback: {
      providerCallId,
      status,
      duration,
      answeredBy: status === 'completed' ? 'human' : undefined,
      timestamp: new Date().toISOString(),
    },
    resolveAt: Date.now(),
  });
}

/**
 * Send an SMS (SIMULATED)
 *
 * In production: would use Twilio Messaging Service or equivalent.
 * Messages originate from the business service number, not personal numbers.
 */
export async function sendSMS(
  toNumber: string,
  message: string,
  fromServiceId?: string
): Promise<{ messageId: string; status: string }> {
  const messageId = `sim_sms_${uuid()}`;

  console.log(`[SIMULATED SMS] Message sent:`, {
    messageId,
    to: '***MASKED***',
    fromService: fromServiceId || 'PingShield',
    bodyLength: message.length,
  });

  return {
    messageId,
    status: 'sent',
  };
}

/**
 * Send a WhatsApp message via business API (SIMULATED)
 *
 * In production: requires WhatsApp Business API approval and template registration.
 */
export async function sendWhatsApp(
  toNumber: string,
  message: string,
  templateId?: string
): Promise<{ messageId: string; status: string }> {
  const messageId = `sim_wa_${uuid()}`;

  console.log(`[SIMULATED WHATSAPP] Message sent:`, {
    messageId,
    to: '***MASKED***',
    template: templateId,
    bodyLength: message.length,
  });

  return {
    messageId,
    status: 'sent',
  };
}

/**
 * Provider info for documentation and status display
 */
export const PROVIDER_INFO = {
  name: 'Simulated Provider',
  isSimulated: true,
  limitations: [
    'No actual calls or messages are made',
    'Call outcomes are randomly generated',
    'Callbacks are simulated with 2-5 second delay',
    'In production, use Twilio, Exotel, or equivalent',
  ],
  productionRequirements: [
    'Telephony provider account (Twilio recommended for India: Exotel)',
    'Verified phone number(s) for masked calling',
    'Messaging service SID for SMS',
    'WhatsApp Business API approval (optional)',
    'Webhook endpoint for call status callbacks',
    'Number provisioning for relay calling',
  ],
};
