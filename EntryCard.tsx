import React, { useState } from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { JournalEntry } from '../types';
import { photoUri } from '../photoStore';
import { formatCoord, formatTimestamp } from '../format';
import { colors } from '../theme';

interface Props {
  entry: JournalEntry;
  maskCoords: boolean;
  onDelete: () => void;
}

export default function EntryCard({ entry, maskCoords, onDelete }: Props) {
  const [photoFailed, setPhotoFailed] = useState(false);

  return (
    <View style={styles.card}>
      {photoFailed ? (
        <View style={[styles.photo, styles.photoMissing]}>
          <Text style={styles.photoMissingText}>Photo unavailable</Text>
        </View>
      ) : (
        <Image
          source={{ uri: photoUri(entry.photoFile) }}
          style={styles.photo}
          resizeMode="cover"
          onError={() => setPhotoFailed(true)}
        />
      )}

      <View style={styles.body}>
        <Text style={styles.time}>{formatTimestamp(entry.createdAt)}</Text>
        <Text style={styles.note}>{entry.note}</Text>
        <Text style={styles.coords}>
          📍 {formatCoord(entry.latitude, maskCoords)}, {formatCoord(entry.longitude, maskCoords)}
        </Text>
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} accessibilityLabel="Delete entry">
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  photo: { width: '100%', height: 200, backgroundColor: '#e5e7eb' },
  photoMissing: { alignItems: 'center', justifyContent: 'center' },
  photoMissingText: { color: colors.muted },
  body: { padding: 14 },
  time: { color: colors.muted, fontSize: 13, marginBottom: 6 },
  note: { color: colors.text, fontSize: 16, lineHeight: 22, marginBottom: 8 },
  coords: { color: colors.primaryDark, fontSize: 14, fontWeight: '600' },
  deleteBtn: { alignSelf: 'flex-end', minHeight: 44, justifyContent: 'center', paddingHorizontal: 8, marginTop: 4 },
  deleteText: { color: colors.danger, fontWeight: '600' },
});
