import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { JournalEntry } from './types';
import { deletePhoto } from './photoStore';

const ENTRIES_KEY = '@location_journal_entries_v1';
const SETTINGS_KEY = '@location_journal_settings_v1';

interface EntriesContextValue {
  entries: JournalEntry[];
  loaded: boolean;
  loadError: string;
  maskCoords: boolean;
  setMaskCoords: (value: boolean) => void;
  addEntry: (entry: JournalEntry) => Promise<void>; // throws if saving fails
  deleteEntry: (id: string) => Promise<void>;
}

const EntriesContext = createContext<EntriesContextValue | undefined>(undefined);

function isValidEntry(e: any): e is JournalEntry {
  return (
    e &&
    typeof e.id === 'string' &&
    typeof e.photoFile === 'string' &&
    typeof e.latitude === 'number' &&
    typeof e.longitude === 'number' &&
    typeof e.note === 'string' &&
    typeof e.createdAt === 'string'
  );
}

export function EntriesProvider({ children }: { children: React.ReactNode }) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [maskCoords, setMaskCoordsState] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [rawEntries, rawSettings] = await Promise.all([
          AsyncStorage.getItem(ENTRIES_KEY),
          AsyncStorage.getItem(SETTINGS_KEY),
        ]);
        if (rawEntries) {
          const parsed: unknown = JSON.parse(rawEntries);
          if (Array.isArray(parsed)) setEntries(parsed.filter(isValidEntry));
        }
        if (rawSettings) {
          const s = JSON.parse(rawSettings);
          if (typeof s?.maskCoords === 'boolean') setMaskCoordsState(s.maskCoords);
        }
      } catch {
        setLoadError('Your saved entries could not be loaded. Please restart the app.');
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  const persist = useCallback(async (next: JournalEntry[]) => {
    await AsyncStorage.setItem(ENTRIES_KEY, JSON.stringify(next));
    setEntries(next);
  }, []);

  const addEntry = useCallback(
    async (entry: JournalEntry) => {
      await persist([entry, ...entries]); // newest first
    },
    [entries, persist]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      const target = entries.find((e) => e.id === id);
      await persist(entries.filter((e) => e.id !== id));
      if (target) deletePhoto(target.photoFile);
    },
    [entries, persist]
  );

  const setMaskCoords = useCallback((value: boolean) => {
    setMaskCoordsState(value);
    AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ maskCoords: value })).catch(() => {});
  }, []);

  return (
    <EntriesContext.Provider
      value={{ entries, loaded, loadError, maskCoords, setMaskCoords, addEntry, deleteEntry }}
    >
      {children}
    </EntriesContext.Provider>
  );
}

export function useEntries() {
  const ctx = useContext(EntriesContext);
  if (!ctx) throw new Error('useEntries must be used inside EntriesProvider');
  return ctx;
}
