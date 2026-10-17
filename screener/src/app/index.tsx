import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text>Screening and referral tool, not a diagnostic device.</Text>
      <Link href="/spike" style={styles.link}>
        Open audio spike
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 16 },
  link: { fontSize: 18, color: '#0a58ca' },
});
