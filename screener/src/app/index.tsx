import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { Banner, s } from '@/ui';

export default function Home() {
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Banner />
      <Text style={s.p}>School hearing screening and referral. Works offline; sync when you have a connection.</Text>
      <Link href="/children" style={styles.link}>Screen a child</Link>
      <Link href="/sync" style={styles.link}>Sync</Link>
      <Link href="/settings" style={styles.link}>Settings</Link>
      <Link href="/spike" style={styles.dev}>Audio spike (developer)</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 20, color: '#0a58ca', paddingVertical: 10 },
  dev: { fontSize: 14, color: '#666', paddingTop: 24 },
});
