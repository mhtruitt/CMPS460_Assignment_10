import { Directory, File, Paths } from 'expo-file-system';

/**
 * The camera saves photos to a cache folder that the OS may clear. To keep photos
 * after the app is closed, each one is copied into the app's document directory.
 * Only the file name is stored with the entry (absolute paths can change between
 * app updates), and the URI is rebuilt on demand.
 */
const journalDir = () => new Directory(Paths.document, 'journal');

export function savePhoto(tempUri: string, id: string): string {
  const dir = journalDir();
  if (!dir.exists) dir.create();
  const fileName = `${id}.jpg`;
  new File(tempUri).copy(new File(dir, fileName));
  return fileName;
}

export function photoUri(fileName: string): string {
  return new File(journalDir(), fileName).uri;
}

export function deletePhoto(fileName: string): void {
  try {
    const file = new File(journalDir(), fileName);
    if (file.exists) file.delete();
  } catch {
    // ignore: the entry is being removed anyway
  }
}
