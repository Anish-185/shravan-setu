// react-native-paper set-up shared by the screens copied from DhwaniSarathi (Apache-2.0, the DhwaniSarathi team).
// The theme is the one each original screen declared (e.g. audiometer/app/Screens/BeforeTest1.js). Changed by us:
// one provider at the app root instead of one per screen; Paper's icons come from our Lucide set (src/icons.tsx)
// instead of @expo/vector-icons, so no icon font is added.
import type { ReactNode } from 'react';
import { DefaultTheme, Provider as PaperProvider } from 'react-native-paper';

import { Icon, type IconName } from '@/icons';

export const theme = {
  ...DefaultTheme,
  roundness: 2,
  colors: {
    ...DefaultTheme.colors,
    primary: '#EB455F',
    accent: '#f1c40f',
  },
};

/** The original screens' colours (their StyleSheets): coral red, navy, sky. */
export const DS = { red: '#eb455f', navy: '#2b3467', sky: '#bad7e9', blue: '#0096FF', grey: '#f5f5f5' };

// Material icon names used by the original screens → our icons.
const ICON: Record<string, IconName> = {
  'play-circle': 'circle-play',
  'help-circle-outline': 'circle-help',
  share: 'share',
};

export function Paper({ children }: { children: ReactNode }) {
  return (
    <PaperProvider theme={theme} settings={{
      icon: ({ name, size, color }) => ICON[name as string]
        ? <Icon name={ICON[name as string]} size={size} color={color} />
        : null,
    }}>
      {children}
    </PaperProvider>
  );
}
