export interface JournalEntry {
  id: string;
  photoFile: string; // file name only; the full path is rebuilt at runtime
  latitude: number;
  longitude: number;
  accuracy: number | null; // meters, if the device reports it
  note: string;
  createdAt: string; // ISO timestamp
}

export type RootStackParamList = {
  Home: undefined;
  NewEntry: undefined;
};
