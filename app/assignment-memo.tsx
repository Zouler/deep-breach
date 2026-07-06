import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AssignmentMemoFrame } from '@/components/AssignmentMemoFrame';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';

/** Read-only review of the Act 1 assignment memorandum (e.g. from Service Record). */
export default function AssignmentMemoScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScreenShell
      scroll={false}
      backgroundImage={GAME_ASSETS.briefingRoomBackground}
      backgroundScrimOpacity={0.64}
    >
      <View style={styles.root}>
        <ScrollView
          contentContainerStyle={[styles.pad, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.banner}>Archive · Assignment memorandum</Text>
          <AssignmentMemoFrame />
          <Text style={styles.note}>
            This document is retained for command reference. Gameplay is unchanged.
          </Text>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <PrimaryButton title="Back" variant="ghost" onPress={() => router.back()} />
        </View>
      </View>
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  pad: { paddingHorizontal: 18, paddingTop: 8 },
  banner: {
    color: theme.textMuted,
    fontSize: 11,
    marginBottom: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  note: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 12 },
  footer: { paddingHorizontal: 18, paddingTop: 8, borderTopWidth: 1, borderTopColor: theme.panelBorderFaint },
});
