// Header banner in the style of the original DhwaniSarathi teacher page (audiometer/app/Screens/Educator/EducatorHome.js,
// Apache-2.0, the DhwaniSarathi team): a red title strip over the school-things illustration (their background.png),
// with an optional picture on the right. Ours, built from their pattern, for the older list screens.
import { Image, ImageBackground, StyleSheet, Text, View, type ImageSourcePropType } from 'react-native';

import { DS } from '@/original/paper';

export function Banner({ title, text, image }: { title: string; text?: string; image?: ImageSourcePropType }) {
  return (
    <View style={st.wrap}>
      <Text style={st.strip}>{title}</Text>
      <ImageBackground source={require('@/assets/images/original/background.png')} style={st.bg} resizeMode="cover">
        <View style={st.row}>
          {!!text && <Text style={st.text}>{text}</Text>}
          {image && <Image source={image} style={st.image} />}
        </View>
      </ImageBackground>
    </View>
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 14, overflow: 'hidden', backgroundColor: DS.navy },
  strip: { backgroundColor: DS.red, color: 'white', fontWeight: 'bold', fontSize: 18, textAlign: 'center', paddingVertical: 6 },
  bg: { minHeight: 110, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12 },
  text: { flex: 1, color: DS.navy, fontSize: 15, fontWeight: 'bold', backgroundColor: 'rgba(255,255,255,0.85)', padding: 8, borderRadius: 8 },
  image: { width: 86, height: 86, borderRadius: 10, borderWidth: 2, borderColor: 'white', marginLeft: 'auto' },
});
