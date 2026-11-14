export type TagPublicInfo = { tag_code: string; item_name: string; owner_alias: string };
export type RecoveryReport = {
  id: string; tag_code: string; message: string; finder_contact: string | null;
  latitude: number | null; longitude: number | null; accuracy: number | null;
  manual_location: string | null; created_at: string; updated_at: string;
  live_expires_at: string | null; sharing_stopped_at: string | null;
};
export type ReportInput = {
  tagCode: string; message: string; finderContact: string | null;
  latitude: number | null; longitude: number | null; accuracy: number | null;
  manualLocation: string | null; requesterHash: string; liveTokenHash?: string;
};
export type LocationFix = { latitude: number; longitude: number; accuracy: number | null };
