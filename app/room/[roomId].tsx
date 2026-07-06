import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text } from 'react-native';

import { CommandIntentModal } from '@/components/CommandIntentModal';
import { BreachCard } from '@/components/room/BreachCard';
import { EngineHeatPanel } from '@/components/room/EngineHeatPanel';
import { RepairFeedbackBanner } from '@/components/room/RepairFeedbackBanner';
import { RepairSuppliesSummary } from '@/components/room/RepairSuppliesSummary';
import { RoomDamageHeader } from '@/components/room/RoomDamageHeader';
import { StagedSuppliesPanel } from '@/components/room/StagedSuppliesPanel';
import { HudPanel, HudSectionTitle } from '@/components/hud/HudPrimitives';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenShell } from '@/components/ScreenShell';
import { GAME_ASSETS } from '@/constants/assets';
import { theme } from '@/constants/theme';
import { useGame } from '@/context/GameContext';
import { canVentEngineHeat, ENGINE_HEAT_VENT_COOLDOWN_MS } from '@/game/engineHeat';
import { isPropulsionRoom } from '@/game/rooms';
import { validateRepairPreconditions } from '@/game/repairOutcome';
import { roomBackgroundForId, roomBackgroundScrimForId } from '@/game/roomBackgrounds';
import {
  countActiveCracks,
  countHullRepairUnitsInExpedition,
} from '@/game/repairResourceStatus';
import {
  getRoomDamageBadge,
  getTotalLeakRate,
} from '@/game/roomDetailHelpers';
import type { RepairItem } from '@/types';

export default function RoomDetailScreen() {
  const { roomId } = useLocalSearchParams<{ roomId: string }>();
  const router = useRouter();
  const { state, dispatch } = useGame();
  const dive = state.dive;

  const [topBanner, setTopBanner] = useState<{ tone: 'ok' | 'err'; text: string } | null>(null);
  const [breachInline, setBreachInline] = useState<{
    crackId: string;
    text: string;
    tone: 'ok' | 'err';
  } | null>(null);
  const [intentPickerOpen, setIntentPickerOpen] = useState(false);

  const pendingRepairRef = useRef<{ crackId: string } | null>(null);
  const lastEventIdRef = useRef<string | null>(null);
  const inlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const room = useMemo(
    () => dive?.rooms.find((r) => r.id === roomId),
    [dive?.rooms, roomId],
  );

  useEffect(() => {
    if (!dive) return;
    const last = dive.eventLog[dive.eventLog.length - 1];
    lastEventIdRef.current = last?.id ?? null;
    setTopBanner(null);
    setBreachInline(null);
    pendingRepairRef.current = null;
  }, [roomId, dive?.missionId]);

  useEffect(() => {
    if (!dive || !room) return;
    const last = dive.eventLog[dive.eventLog.length - 1];
    if (!last) return;
    if (lastEventIdRef.current === last.id) return;
    lastEventIdRef.current = last.id;
    if (last.roomId !== room.id) return;
    if (last.type !== 'repair_complete' && last.type !== 'repair_failed') return;

    setTopBanner({ tone: last.type === 'repair_complete' ? 'ok' : 'err', text: last.message });

    const pending = pendingRepairRef.current;
    pendingRepairRef.current = null;
    if (pending) {
      if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current);
      setBreachInline({ crackId: pending.crackId, text: last.message, tone: last.type === 'repair_complete' ? 'ok' : 'err' });
      inlineTimerRef.current = setTimeout(() => setBreachInline(null), 4500);
    }
  }, [dive, room, dive?.eventLog.length]);

  useEffect(() => {
    return () => {
      if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current);
    };
  }, []);

  if (!dive || !room) {
    return (
      <ScreenShell>
        <Text style={styles.muted}>Room not found.</Text>
        <PrimaryButton title="Back" onPress={() => router.back()} />
      </ScreenShell>
    );
  }

  if (dive.status !== 'active') {
    return (
      <ScreenShell>
        <Text style={styles.muted}>
          This compartment view is closed — the trial has ended. Open the Trial Report or return to base.
        </Text>
        <PrimaryButton
          title="Trial Report"
          onPress={() => router.replace('/mission-result')}
        />
        <PrimaryButton title="Back to Base" variant="ghost" onPress={() => router.replace('/base')} />
      </ScreenShell>
    );
  }

  const badge = getRoomDamageBadge(room);
  const totalLeak = getTotalLeakRate(room);
  const inventory = dive.expeditionRepairInventory ?? [];
  const hullKits = countHullRepairUnitsInExpedition(inventory);
  const breachesActive = countActiveCracks(dive);
  const stagedSupplies = room.loot.filter(
    (l) =>
      !l.collected && (l.kind === 'repair_supply' || l.kind === 'emergency_supply'),
  );

  const attemptRepair = (crackId: string, crack: (typeof room.cracks)[number], item: RepairItem) => {
    if (dive.status !== 'active') return;
    const pre = validateRepairPreconditions(crack, item);
    if (!pre.ok) {
      setTopBanner({ tone: 'err', text: pre.reason });
      if (inlineTimerRef.current) clearTimeout(inlineTimerRef.current);
      setBreachInline({ crackId, text: pre.reason, tone: 'err' });
      inlineTimerRef.current = setTimeout(() => setBreachInline(null), 4000);
      return;
    }
    pendingRepairRef.current = { crackId };
    dispatch({
      type: 'REPAIR_CRACK',
      roomId: room.id,
      crackId,
      repairItemId: item.id,
    });
  };

  const roomBg = roomId ? roomBackgroundForId(roomId) : GAME_ASSETS.diveScreenBg;
  const roomScrim = roomId ? roomBackgroundScrimForId(roomId) : 0.74;

  return (
    <ScreenShell scroll backgroundImage={roomBg} backgroundScrimOpacity={roomScrim}>
      {topBanner ? <RepairFeedbackBanner tone={topBanner.tone} text={topBanner.text} /> : null}
      {hullKits <= 0 && breachesActive > 0 ? (
        <HudPanel>
          <HudSectionTitle>HULL REPAIR STOCK</HudSectionTitle>
          <Text style={styles.warnBlock}>
            No repair supplies available for hull breaches. Search for salvage (command intent),
            stabilize systems, or return to base.
          </Text>
        </HudPanel>
      ) : null}

      <RoomDamageHeader
        roomName={room.name}
        badge={badge}
        breachCount={room.cracks.length}
        totalLeakPerSecond={totalLeak}
      />

      {isPropulsionRoom(room.id) ? (
        <EngineHeatPanel
          heatPercent={dive.engineHeatPercent}
          ventReady={canVentEngineHeat(dive.lastEngineHeatVentAt, Date.now())}
          ventCooldownLeftMs={
            ENGINE_HEAT_VENT_COOLDOWN_MS - (Date.now() - dive.lastEngineHeatVentAt)
          }
          onVent={() => dispatch({ type: 'VENT_ENGINE_HEAT', now: Date.now() })}
        />
      ) : null}

      <RepairSuppliesSummary inventory={inventory} />

      {room.cracks.length === 0 ? (
        <HudPanel>
          <HudSectionTitle>COMPARTMENT STATUS</HudSectionTitle>
          <Text style={styles.successLine}>All breaches sealed.</Text>
          <Text style={styles.successSub}>{room.name} is stable.</Text>
        </HudPanel>
      ) : (
        room.cracks.map((c, idx) => (
          <BreachCard
            key={c.id}
            breachIndex={idx + 1}
            crack={c}
            inventory={inventory}
            feedback={
              breachInline?.crackId === c.id
                ? { text: breachInline.text, tone: breachInline.tone }
                : null
            }
            onApply={(item) => attemptRepair(c.id, c, item)}
          />
        ))
      )}

      <StagedSuppliesPanel
        staged={stagedSupplies}
        onCollect={(lootId) => {
          if (dive.status !== 'active') return;
          dispatch({ type: 'COLLECT_LOOT', roomId: room.id, lootId });
          setTopBanner({ tone: 'ok', text: 'Supplies secured into expedition cargo.' });
        }}
      />

      <PrimaryButton
        title="Change Command Intent"
        variant="ghost"
        onPress={() => setIntentPickerOpen(true)}
      />
      <PrimaryButton title="Back to Dive" variant="ghost" onPress={() => router.back()} />
      <CommandIntentModal
        visible={intentPickerOpen && dive.status === 'active'}
        currentRoute={dive.currentRoute}
        onSelect={(route) => {
          dispatch({ type: 'SET_DIVE_ROUTE', route });
          setIntentPickerOpen(false);
        }}
        onClose={() => setIntentPickerOpen(false)}
      />
    </ScreenShell>
  );
}

const styles = StyleSheet.create({
  muted: { color: theme.textMuted, marginBottom: 12 },
  warnBlock: {
    color: theme.warning,
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fbbf2444',
    backgroundColor: theme.warningBg,
  },
  successLine: { color: '#86efac', fontWeight: '900', fontSize: 15, marginTop: 8 },
  successSub: { color: theme.textMuted, marginTop: 6, fontSize: 13 },
});
