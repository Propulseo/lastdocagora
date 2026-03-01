export interface GoogleEvent {
  id: string;
  status: string;
  summary?: string;
  description?: string;
  location?: string;
  organizer?: { email?: string; displayName?: string };
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
}

export interface GoogleEventsResponse {
  items?: GoogleEvent[];
  nextSyncToken?: string;
  nextPageToken?: string;
}

export interface SyncResult {
  upserted: number;
  deleted: number;
  error?: string;
}
