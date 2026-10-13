export interface BroadcastDmPayload {
  title: string;
  body: string;
  author?: string;
  footer?: string;
  color?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  linkLabel?: string;
  linkUrl?: string;
}

export interface BroadcastDmProgress {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  currentMember: string;
  etaMinutes: number | null;
}

export interface BroadcastDmResult {
  total: number;
  sent: number;
  failed: number;
  skipped: number;
  durationMs: number;
}
