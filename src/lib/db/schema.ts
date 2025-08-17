import type { Generated } from 'kysely'

export interface SongsTable {
  id: Generated<number>;
  song_name: string;
  artist: string;
  bpm: number;
  release_date: string;
  is_released: boolean;
  created_date: string;
  origin: string;
  r2_key: string;
}
