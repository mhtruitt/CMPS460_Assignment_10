import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { CameraType, CameraView, useCameraPermissions } from 'expo-camera';
import * as Location from 'expo-location';

import { RootStackParamList } from '../types';
import { useEntries } from '../EntriesContext';
import { savePhoto } from '../photoStore';
import { formatCoord } from '../format';
import { colors } from '../theme';

type Props = NativeStackScreenProps<RootStackParamList, 'NewEntry'>;

interface Coords {
  latitude: number;
  longitude: number;
  accuracy: number | null;
}

interface AppError {
  message: string;
  settings?: boolean; // show an "Open Settings" button
}

export default function NewEntryScreen({ navigation }: Props) {
  const { addEntry, maskCoords } = useEntries();
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);

  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [facing, setFacing] = useState<CameraType>('back');
  const [capturing, setCapturing] = useState(false);

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [coords, setCoords] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<AppError | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ photo?: string; location?: string; note?: string }>({});

  // ---- Camera: permission is requested only when the user taps "Open Camera" ----
  const openCamera = async () => {
    setError(null);
    try {
      let permission = cameraPermission;
      if (!permission?.granted) {
        permission = await requestCameraPermission();
      }
      if (!permission.granted) {
        setError({
          message: permission.canAskAgain
            ? 'Camera access was denied. Without it, the app cannot take a photo for your entry. Tap "Open Camera" to try again.'
            : 'Camera access is turned off for this app. Enable it in Settings to take photos.',
          settings: !permission.canAskAgain,
        });
        return;
      }
      setCameraReady(false);
      setCameraOpen(true);
    } catch {
      setError({ message: 'Could not open the camera. Please try again.' });
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || !cameraReady || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7 });
      if (!photo?.uri) throw new Error('No photo returned');
      setPhotoUri(photo.uri);
      setFieldErrors((f) => ({ ...f, photo: undefined }));
      setCameraOpen(false);
    } catch {
      setCameraOpen(false);
      setError({ message: 'The photo could not be captured. Please try again.' });
    } finally {
      setCapturing(false);
    }
  };

  // ---- Location: permission is requested only when the user taps "Get Current Location" ----
  const getLocation = async () => {
    setError(null);
    setLocating(true);
    try {
      const servicesOn = await Location.hasServicesEnabledAsync();
      if (!servicesOn) {
        setError({ message: 'Location services are turned off on this device. Turn them on and try again.', settings: true });
        return;
      }

      let permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        permission = await Location.requestForegroundPermissionsAsync();
      }
      if (!permission.granted) {
        setError({
          message: permission.canAskAgain
            ? 'Location permission was denied. The app needs it once per entry to attach coordinates. Tap "Get Current Location" to try again.'
            : 'Location access is turned off for this app. Enable it in Settings to attach coordinates.',
          settings: !permission.canAskAgain,
        });
        return;
      }

      const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy ?? null,
      });
      setFieldErrors((f) => ({ ...f, location: undefined }));
    } catch {
      setError({ message: 'Your location could not be determined. Move to an area with a better signal and try again.' });
    } finally {
      setLocating(false);
    }
  };

  // ---- Save ----
  const handleSave = async () => {
    const errors: typeof fieldErrors = {};
    if (!photoUri) errors.photo = 'Take a photo first.';
    if (!coords) errors.location = 'Get your current location first.';
    if (note.trim().length === 0) errors.note = 'Write a short note (it cannot be blank).';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0 || !photoUri || !coords) return;

    setSaving(true);
    setError(null);
    try {
      const id = `${Date.now()}`;
      const photoFile = savePhoto(photoUri, id); // copy to permanent storage
      await addEntry({
        id,
        photoFile,
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy,
        note: note.trim(),
        createdAt: new Date().toISOString(),
      });
      navigation.goBack();
    } catch {
      setError({ message: 'The entry could not be saved. Check that your device has free storage and try again.' });
    } finally {
      setSaving(false);
    }
  };

  // ---- Full-screen camera ----
  if (cameraOpen) {
    return (
      <View style={styles.cameraScreen}>
        <CameraView
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          facing={facing}
          onCameraReady={() => setCameraReady(true)}
          onMountError={() => {
            setCameraOpen(false);
            setError({ message: 'The camera failed to start. Please try again.' });
          }}
        />
        <View style={styles.cameraControls}>
          <TouchableOpacity style={styles.cameraSide} onPress={() => setCameraOpen(false)}>
            <Text style={styles.cameraSideText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.shutter, (!cameraReady || capturing) && { opacity: 0.5 }]}
            onPress={takePicture}
            disabled={!cameraReady || capturing}
            accessibilityLabel="Take photo"
          >
            <View style={styles.shutterInner} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.cameraSide}
            onPress={() => setFacing((f) => (f === 'back' ? 'front' : 'back'))}
          >
            <Text style={styles.cameraSideText}>Flip</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---- Entry form ----
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error.message}</Text>
            {error.settings && (
              <TouchableOpacity style={styles.settingsBtn} onPress={() => Linking.openSettings()}>
                <Text style={styles.settingsBtnText}>Open Settings</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 1. Photo */}
        <Text style={styles.stepTitle}>1. Photo</Text>
        {photoUri ? (
          <View>
            <Image source={{ uri: photoUri }} style={styles.preview} />
            <TouchableOpacity style={styles.secondaryBtn} onPress={openCamera}>
              <Text style={styles.secondaryBtnText}>Retake Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.panel}>
            <Text style={styles.panelText}>The camera is used only to take the photo for this entry.</Text>
            <TouchableOpacity style={styles.primaryBtn} onPress={openCamera}>
              <Text style={styles.primaryBtnText}>Open Camera</Text>
            </TouchableOpacity>
          </View>
        )}
        {!!fieldErrors.photo && <Text style={styles.fieldError}>{fieldErrors.photo}</Text>}

        {/* 2. Location */}
        <Text style={styles.stepTitle}>2. Location</Text>
        <View style={styles.panel}>
          {coords ? (
            <>
              <Text style={styles.coordLine}>Latitude: {formatCoord(coords.latitude, maskCoords)}</Text>
              <Text style={styles.coordLine}>Longitude: {formatCoord(coords.longitude, maskCoords)}</Text>
              {coords.accuracy != null && (
                <Text style={styles.accuracy}>Accuracy: about {Math.round(coords.accuracy)} m</Text>
              )}
            </>
          ) : (
            <Text style={styles.panelText}>Your location is read once, only when you tap the button.</Text>
          )}
          <TouchableOpacity
            style={[coords ? styles.secondaryBtn : styles.primaryBtn, locating && { opacity: 0.6 }]}
            onPress={getLocation}
            disabled={locating}
          >
            {locating ? (
              <ActivityIndicator color={coords ? colors.text : '#fff'} />
            ) : (
              <Text style={coords ? styles.secondaryBtnText : styles.primaryBtnText}>
                {coords ? 'Refresh Location' : 'Get Current Location'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
        {!!fieldErrors.location && <Text style={styles.fieldError}>{fieldErrors.location}</Text>}

        {/* 3. Note */}
        <Text style={styles.stepTitle}>3. Journal note</Text>
        <TextInput
          style={[styles.noteInput, !!fieldErrors.note && styles.inputError]}
          placeholder="What made this moment worth remembering?"
          value={note}
          onChangeText={(t) => {
            setNote(t);
            if (fieldErrors.note) setFieldErrors((f) => ({ ...f, note: undefined }));
          }}
          multiline
          maxLength={500}
        />
        {!!fieldErrors.note && <Text style={styles.fieldError}>{fieldErrors.note}</Text>}

        <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.6 }]} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryBtnText}>Save Entry</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  stepTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 18, marginBottom: 8 },
  panel: { backgroundColor: colors.card, borderRadius: 12, padding: 14 },
  panelText: { color: colors.muted, marginBottom: 12 },
  preview: { width: '100%', height: 240, borderRadius: 12, backgroundColor: '#e5e7eb', marginBottom: 10 },
  coordLine: { fontSize: 18, fontWeight: '600', color: colors.text, marginBottom: 4 },
  accuracy: { color: colors.muted, marginBottom: 12, marginTop: 2 },
  primaryBtn: { backgroundColor: colors.primary, minHeight: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondaryBtn: { backgroundColor: '#e5e7eb', minHeight: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryBtnText: { color: colors.text, fontWeight: '600', fontSize: 16 },
  noteInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
    minHeight: 110,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  inputError: { borderColor: colors.danger },
  fieldError: { color: colors.danger, marginTop: 6 },
  saveBtn: { backgroundColor: colors.primaryDark, minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  errorBox: { backgroundColor: colors.dangerBg, borderRadius: 10, padding: 12, marginBottom: 4 },
  errorText: { color: '#991b1b', lineHeight: 20 },
  settingsBtn: { alignSelf: 'flex-start', marginTop: 10, backgroundColor: colors.danger, borderRadius: 8, paddingHorizontal: 14, minHeight: 44, justifyContent: 'center' },
  settingsBtnText: { color: '#fff', fontWeight: '700' },
  cameraScreen: { flex: 1, backgroundColor: '#000' },
  cameraControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  cameraSide: { minWidth: 70, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  cameraSideText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  shutter: { width: 76, height: 76, borderRadius: 38, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: '#fff' },
});
