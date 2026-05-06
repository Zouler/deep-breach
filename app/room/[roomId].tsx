import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { PanelCard } from '@/components/PanelCard';
import { PrimaryButton } from '@/components/PrimaryButton';
import { SafeIcon } from '@/components/SafeIcon';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { repairTemplateIconSource } from '@/game/assetVisuals';
import { validateRepairPreconditions } from '@/game/repairOutcome';
import { getRoomStatus } from '@/game/statusHelpers';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { state, dispatch } = useGame();
  const dive = state.dive;
  const [banner, setBanner] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const prevEventLogLen = useRef(0);

  const room = useMemo(
    () => dive?.rooms.find((r) => r.id === roomId),
    [dive?.rooms, roomId],
  );

  useEffect(() => {
    if (!dive) return;
    prevEventLogLen.current = dive.eventLog.length;
  }, [roomId, dive]);

  useEffect(() => {
    if (!dive || !room) return;
    const len = dive.eventLog.length;
    if (len <= prevEventLogLen.current) return;
    prevEventLogLen.current = len;
    const last = dive.eventLog[len - 1];
    if (last.roomId !== room.id) return;
    if (last.type === 'repair_failed') {
      setBanner({ tone: 'err', text: last.message });
    } else if (last.type === 'repair_complete') {
      setBanner({ tone: 'ok', text: last.message });
    }
  }, [dive, room]);

  if (!dive || !room) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>Room not found.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  const derivedStatus = getRoomStatus(room);
  const stagedSupplies = room.loot.filter(
    (l) =>
      !l.collected && (l.kind === 'repair_supply' || l.kind === 'emergency_supply'),
  );

  return (
    <ScreenShell scroll backgroundImage={GAME_ASSETS.diveScreenBg} backgroundScrimOpacity={0.66}>
      <Text style={styles.title}>{room.name}</Text>
      <Text style={styles.meta}>Status: {derivedStatus}</Text>
      {banner ? (
        <View
          style={[
            styles.banner,
            banner.tone === 'ok' ? styles.bannerOk : styles.bannerErr,
          ]}
        >
          <Text style={styles.bannerText}>{banner.text}</Text>
        </View>
      ) : null}
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Cracks / leaks</Text>
        {room.cracks.length === 0 ? (
          <Text style={styles.muted}>No structural breaches.</Text>
        ) : (
          room.cracks.map((c) => (
            <View key={c.id} style={styles.crackBox}>
              <View style={styles.crackHead}>
                <SafeIcon source={GAME_ASSETS.icons.crack} size={28} />
                <Text style={styles.crackMeta}>
                  {c.severity.toUpperCase()} · leak {c.leakRatePerSecond.toFixed(2)} u/s
                </Text>
              </View>
              {(dive.expeditionRepairInventory ?? [])
                .filter((item) => item.kind !== 'oxygen')
                .map((item) => {
                return (
                  <PrimaryButton
                    key={`${c.id}_${item.id}`}
                    title={`Repair with ${item.name} (${item.quantity})`}
                    variant="ghost"
                    iconLeft={repairTemplateIconSource(item.id)}
                    iconLeftSize={22}
                    disabled={item.quantity <= 0}
                    onPress={() => {
                      const pre = validateRepairPreconditions(c, item);
                      if (!pre.ok) {
                        setBanner({ tone: 'err', text: pre.reason });
                        return;
                      }
                      dispatch({
                        type: 'REPAIR_CRACK',
                        roomId: room.id,
                        crackId: c.id,
                        repairItemId: item.id,
                      });
                    }}
                  />
                );
              })}
            </View>
          ))
        )}
        <Text style={styles.helper}>
          Repair supplies are carried in expedition cargo. Recover more through external contacts or
          collect staged overflow from recoveries.
        </Text>
      </PanelCard>
      <PanelCard style={styles.consoleCard}>
        <Text style={styles.cardTitle}>Emergency supplies (staged)</Text>
        {stagedSupplies.length === 0 ? (
          <Text style={styles.muted}>
            No emergency kits staged here — recoveries from external contacts may deposit supplies.
          </Text>
        ) : (
          stagedSupplies.map((l) => (
            <View key={l.id} style={styles.lootRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.lootName}>{l.name}</Text>
                <Text style={styles.meta}>
                  {l.kind === 'emergency_supply' ? 'emergency supply' : 'repair supply'}
                </Text>
              </View>
              <PrimaryButton
                title="Collect"
                variant="ghost"
                disabled={l.collected}
                onPress={() => {
                  dispatch({ type: 'COLLECT_LOOT', roomId: room.id, lootId: l.id });
                  setBanner({ tone: 'ok', text: 'Item secured for surface transfer.' });
                }}
              />
            </View>
          ))
        )}
      </PanelCard>
      <PrimaryButton title="Back to dive" onPress={() => router.back()} />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  consoleCard: {
    borderColor: '#38bdf855',
    backgroundColor: '#020617cc',
  },
  title: { color: theme.text, fontSize: 22, fontWeight: '800', marginBottom: 4 },
  meta: { color: theme.textMuted, marginBottom: 6 },
  crackMeta: { color: theme.textMuted, marginBottom: 0, flex: 1, fontWeight: '700' },
  cardTitle: { color: theme.text, fontWeight: '700', marginBottom: 8 },
  muted: { color: theme.textMuted, fontStyle: 'italic' },
  crackHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4 },
  crackBox: { marginBottom: 12, gap: 8 },
  lootRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  lootName: { color: theme.text, fontWeight: '600' },
  banner: { borderRadius: 12, borderWidth: 1, padding: 10, marginBottom: 10 },
  bannerOk: { borderColor: '#166534', backgroundColor: '#052e1644' },
  bannerErr: { borderColor: '#b91c1c', backgroundColor: '#450a0a55' },
  bannerText: { color: theme.text, fontWeight: '600' },
  helper: { color: theme.textMuted, fontSize: 12, lineHeight: 18, marginTop: 8 },
});
