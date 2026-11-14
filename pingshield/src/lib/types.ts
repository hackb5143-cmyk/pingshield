/** Item categories */
export const ITEM_CATEGORIES = [
  { value: 'bag', label: 'Bag', icon: '🎒' },
  { value: 'phone', label: 'Phone', icon: '📱' },
  { value: 'laptop', label: 'Laptop', icon: '💻' },
  { value: 'keys', label: 'Keys', icon: '🔑' },
  { value: 'vehicle', label: 'Vehicle', icon: '🚗' },
  { value: 'wallet', label: 'Wallet', icon: '👛' },
  { value: 'other', label: 'Other', icon: '📦' },
] as const;

export type ItemCategory = typeof ITEM_CATEGORIES[number]['value'];

/** Incident statuses */
export const INCIDENT_STATUSES = [
  'reported',
  'contacting_owner',
  'owner_acknowledged',
  'family_contact_enabled',
  'family_acknowledged',
  'resolved',
] as const;

export type IncidentStatus = typeof INCIDENT_STATUSES[number];

/** Call types */
export type CallType = 'owner' | 'family';

/** Message directions */
export type MessageDirection = 'finder_to_owner' | 'owner_to_finder';

/** Sender types */
export type SenderType = 'finder' | 'owner' | 'system';

/** Consent statuses */
export type ConsentStatus = 'pending' | 'accepted' | 'declined' | 'withdrawn';

/** Notification types */
export const NOTIFICATION_TYPES = [
  'scan',
  'location_report',
  'message',
  'call_attempt',
  'family_unlocked',
  'incident_update',
  'abuse_report',
] as const;

export type NotificationType = typeof NOTIFICATION_TYPES[number];

/** Rate limit config */
export function getRateLimitConfig() {
  return {
    scanNotificationLimit: parseInt(process.env.SCAN_NOTIFICATION_LIMIT || '3'),
    scanNotificationWindowMinutes: parseInt(process.env.SCAN_NOTIFICATION_WINDOW_MINUTES || '5'),
    smsDailyCap: parseInt(process.env.SMS_DAILY_CAP || '20'),
    ownerCallHourlyLimit: parseInt(process.env.OWNER_CALL_HOURLY_LIMIT || '10'),
    familyCallHourlyLimit: parseInt(process.env.FAMILY_CALL_HOURLY_LIMIT || '5'),
    messageHourlyLimit: parseInt(process.env.MESSAGE_HOURLY_LIMIT || '30'),
    callRingDurationSeconds: parseInt(process.env.CALL_RING_DURATION_SECONDS || '30'),
    familyCallRequiredAttempts: parseInt(process.env.FAMILY_CALL_REQUIRED_ATTEMPTS || '2'),
    incidentSessionExpiryHours: parseInt(process.env.INCIDENT_SESSION_EXPIRY_HOURS || '24'),
  };
}
