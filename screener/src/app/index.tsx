import { Link } from 'expo-router';
import { ScrollView, StyleSheet, Text } from 'react-native';

import { useT } from '@/i18n';
import { Banner, s } from '@/ui';

export default function Home() {
  const t = useT();
  return (
    <ScrollView contentContainerStyle={s.screen}>
      <Banner />
      <Text style={s.p}>{t('home.intro')}</Text>
      <Link href="/children" style={styles.link}>{t('home.screen')}</Link>
      <Link href="/sync" style={styles.link}>{t('home.sync')}</Link>
      <Link href="/settings" style={styles.link}>{t('home.settings')}</Link>
      <Link href="/spike" style={styles.dev}>{t('home.spike')}</Link>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  link: { fontSize: 20, color: '#0a58ca', paddingVertical: 10 },
  dev: { fontSize: 14, color: '#666', paddingTop: 24 },
});
