import React from 'react';
import { ActivityIndicator, Alert, FlatList, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { RootStackParamList } from '../types';
import { useEntries } from '../EntriesContext';
import EntryCard from '../components/EntryCard';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { entries, loaded, loadError, maskCoords, setMaskCoords, deleteEntry } = useEntries();

  const confirmDelete = (id: string) => {
    Alert.alert('Delete entry', 'This removes the entry and its photo from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(id);
          } catch {
            Alert.alert('Could not delete', 'Something went wrong while deleting the entry. Please try again.');
          }
        },
      },
    ]);
  };

  if (!loaded) {
    return (
      <View style={[styles.screen, styles.center]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.muted}>Loading your journal…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={entries}
        keyExtractor={(e) => e.id}
        contentContainerStyle={entries.length === 0 ? styles.emptyContainer : { paddingBottom: 100 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.subtitle}>
              Capture a photo, attach where you were, and write a note.
            </Text>
            <View style={styles.privacyRow}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={styles.privacyTitle}>Hide coordinates on screen</Text>
                <Text style={styles.privacyHelp}>Use this before screenshots or recordings.</Text>
              </View>
              <Switch value={maskCoords} onValueChange={setMaskCoords} />
            </View>
            {!!loadError && <Text style={styles.error}>{loadError}</Text>}
            {entries.length > 0 && <Text style={styles.count}>{entries.length} saved {entries.length === 1 ? 'entry' : 'entries'}</Text>}
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No entries yet</Text>
            <Text style={styles.muted}>Tap "New Entry" to capture your first moment.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <EntryCard entry={item} maskCoords={maskCoords} onDelete={() => confirmDelete(item.id)} />
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('NewEntry')} accessibilityRole="button">
        <Text style={styles.fabText}>📷  New Entry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  header: { paddingTop: 16, paddingBottom: 8 },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 12 },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  privacyTitle: { fontWeight: '600', color: colors.text },
  privacyHelp: { color: colors.muted, fontSize: 13, marginTop: 2 },
  count: { fontWeight: '700', color: colors.text, marginBottom: 4 },
  error: { color: colors.danger, marginBottom: 8 },
  emptyContainer: { flexGrow: 1 },
  empty: { alignItems: 'center', padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 6 },
  muted: { color: colors.muted, textAlign: 'center', marginTop: 8 },
  fab: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  fabText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
