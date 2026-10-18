// Share a text file (CSV) from the phone with the Android share sheet. Offline; nothing is uploaded by us.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function shareText(name: string, text: string, mimeType = 'text/csv') {
  const file = new File(Paths.cache, name);
  file.write(text);
  await Sharing.shareAsync(file.uri, { mimeType });
}
