export type ReleaseRow = {
  id: string;
  mbid: string;
  title: string;
  artist: string;
  primary_type: string | null;
  secondary_types: string[];
  release_date: string | null;
};

export type TrackRow = {
  id: string;
  release_id: string;
  disc: number;
  position: number;
  title: string;
  length_ms: number | null;
};

export type RatingRow = {
  release_id: string;
  rhymes: number;
  structure: number;
  style: number;
  individuality: number;
  vibe: number;
  score: number;
  review: string | null;
  created_at: string;
  updated_at: string;
};

export type RatingWithRelease = RatingRow & {
  mbid: string;
  title: string;
  artist: string;
  primary_type: string | null;
  secondary_types: string[];
  release_date: string | null;
};

export type ListenWithRelease = {
  release_id: string;
  listened_at: string;
  source: "manual" | "lastfm";
  mbid: string;
  title: string;
  artist: string;
  primary_type: string | null;
  secondary_types: string[];
  release_date: string | null;
};

export type ReleaseStats = {
  ratings_count: number;
  avg_score: number | null;
  avg_rhymes: number | null;
  avg_structure: number | null;
  avg_style: number | null;
  avg_individuality: number | null;
  avg_vibe: number | null;
};

export type DiaryStats = ReleaseStats & {
  listens_count: number;
  favourites_count: number;
};

export type TopEntry = {
  position: number;
  release: ReleaseRow;
  score: number | null;
};

export type TopCandidate = ReleaseRow & {
  score: number | null;
  listened_at: string;
};

export type SettingsMap = Record<string, string>;

export type ListenState = {
  listened: boolean;
  listened_at: string | null;
  source: "manual" | "lastfm" | null;
};

export type SyncResult = {
  ok: boolean;
  message: string;
  scanned?: number;
  albums?: number;
  added?: number;
  known?: number;
  skipped?: number;
  remaining?: number;
};
