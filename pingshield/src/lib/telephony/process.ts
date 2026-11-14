import { getDb, getCallAttemptByProviderId, getIncidentById, updateCallAttempt, incrementOwnerCallAttempts } from '../db';
import { getPendingCallbacks } from './provider';
export function processDemoCallbacks() {
  const db = getDb();
  db.transaction(() => {
    for (const callback of getPendingCallbacks()) {
      const attempt = getCallAttemptByProviderId(callback.providerCallId);
      if (!attempt) continue;
      if (!attempt.callback_received) {
        updateCallAttempt(callback.providerCallId, { status: callback.status, durationSeconds: callback.duration, answeredBy: callback.answeredBy });
        const incident = getIncidentById(attempt.incident_id);
        if (attempt.call_type === 'owner' && callback.status === 'no-answer' && incident.status !== 'resolved' && Date.parse(incident.expires_at + 'Z') > Date.now()) incrementOwnerCallAttempts(incident.id);
      }
      db.prepare("UPDATE job_queue SET status = 'completed', completed_at = datetime('now') WHERE id = ?").run(callback.providerCallId);
    }
  })();
}
