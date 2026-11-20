# My Location Journal (Expo + React Native + TypeScript)

A photo journal that records each entry with a photo, GPS coordinates, a note, and a timestamp. Entries and photos are stored on the device and are still there after the app is closed and reopened.

## Setup and Run

Prerequisites: Node.js 18+ and the **Expo Go** app on a physical phone (recommended; camera and GPS work best on a real device).

**Option A: clone this repository**

```bash
git clone <your-repo-url>
cd LocationJournal
npm install
npx expo start
```

**Option B: add these files to a new project**

```bash
npx create-expo-app@latest LocationJournal --template blank-typescript
cd LocationJournal
npx expo install expo-camera expo-location expo-file-system \
  @react-native-async-storage/async-storage \
  @react-navigation/native @react-navigation/native-stack \
  react-native-screens react-native-safe-area-context
```

Copy `App.tsx` and `src/` into the project, and merge the `plugins` section of `app.json` (it holds the permission explanations shown to the user). Then run `npx expo start`.

Scan the QR code with Expo Go (Android) or the Camera app (iOS). On an emulator, use the virtual camera and set a fake location in the emulator's extended controls; the iOS Simulator has no camera.

## Features

| Requirement | Implementation |
|-------------|----------------|
| Home screen titled **My Location Journal** | `HomeScreen` (navigator header title) |
| Open camera and capture a photo | `NewEntryScreen` using `CameraView` from `expo-camera` |
| Permissions at appropriate moments | Camera: when the user taps **Open Camera**. Location: when the user taps **Get Current Location**. Neither is requested at app launch |
| Display latitude and longitude | Shown after tapping **Get Current Location**, with accuracy in meters |
| Journal note field | Multiline `TextInput` (required, max 500 characters) |
| Save photo + coordinates + note + timestamp | `addEntry` in `EntriesContext`; timestamp is an ISO string |
| Scrollable list | `FlatList` of `EntryCard`s, newest first |
| Persistence | Entry data in AsyncStorage; photos copied into the app's document directory (`src/photoStore.ts`) |
| Helpful error messages | Denied permissions (with an **Open Settings** button when the system won't ask again), location services off, capture failure, location failure, save failure, missing photo on disk, blank note |

## Privacy Notes

- Only **foreground** location is requested, once per entry. The app never tracks you in the background.
- All data stays on the device. There are no accounts and no network requests.
- **Privacy mode:** the toggle on the home screen masks coordinates on screen. Turn it on before taking screenshots or recording the demo video. Saved data is unchanged; only the display is masked.
- Photos live in the app's private storage, not in the repository. `.gitignore` also excludes image files.
- Entries can be deleted, which removes the photo file too.
- Do not publish real coordinates, private addresses, or sensitive photos in screenshots or the video. Use a neutral subject (a plant, a coffee cup) and privacy mode, or a mock location.

## Project Structure

```
App.tsx                         Navigation + provider
app.json                        Permission plugin settings
src/types.ts                    JournalEntry + route types
src/theme.ts, src/format.ts     Colors, coordinate/time formatting
src/photoStore.ts               Copies photos to permanent storage
src/EntriesContext.tsx          Entries + settings state, AsyncStorage persistence
src/components/EntryCard.tsx
src/screens/HomeScreen.tsx
src/screens/NewEntryScreen.tsx  Camera, permissions, location, form, save
```

## Reflection

The main challenge was making photos persist. The camera saves pictures to a cache folder that the system can clear, so each photo is copied into the app's document directory when an entry is saved. Only the file name is stored in AsyncStorage, and the full path is rebuilt on each launch, because absolute paths can change between app updates. Another challenge was handling the many ways a permission request can end, so every failure path shows a specific message instead of a blank screen.

Permissions are requested only when needed. Camera access is requested when the user taps Open Camera, and location access when they tap Get Current Location, each with a short explanation beforehand. If permission is denied, the app explains what is lost and, when the system will no longer show the prompt, offers a button that opens Settings. It also checks whether location services are turned off, and it wraps capture, location, and saving in try/catch blocks.

For privacy, the app requests foreground location only, never in the background, and reads it once per entry rather than tracking. Data stays on the device, with no network calls or accounts. A privacy mode masks coordinates on screen so I can record screenshots and a demo without exposing my real location, and entries can be deleted together with their photo files. The repository contains no photos or personal coordinates.
