import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/PrimaryButton';
import { theme } from '@/constants/theme';
import type { CrewAlertAction } from '@/types/crewAlerts';
import type { CutInTone, NarrativeCutIn } from '@/types';

const TYPEWRITER_MS = 26;

function toneBorder(tone: CutInTone): string {
  switch (tone) {
    case 'warning':
      return theme.warning;
    case 'critical':
      return '#fb923c';
    case 'success':
      return theme.ok;
    case 'mystery':
      return '#7dd3fc';
    default:
      return theme.accent;
  }
}

function speakerInitials(name: string, fallbackId: string): string {
  const n = (name || fallbackId).trim();
  if (!n) return '?';
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
}

function avatarBg(tone: CutInTone): string {
  switch (tone) {
    case 'warning':
      return 'rgba(251, 191, 36, 0.18)';
    case 'critical':
      return 'rgba(251, 146, 60, 0.2)';
    case 'success':
      return 'rgba(74, 222, 128, 0.18)';
    case 'mystery':
      return 'rgba(125, 211, 252, 0.16)';
    default:
      return 'rgba(34, 211, 238, 0.16)';
  }
}

type Props = {
  visible: boolean;
  cutIn: NarrativeCutIn | null;
  /** Shown after typing completes (may be filtered by caller). */
  extraActions?: CrewAlertAction[];
  onDismiss: () => void;
  onExtraAction?: (action: CrewAlertAction) => void;
};

export function NarrativeCutInModal({
  visible,
  cutIn,
  extraActions = [],
  onDismiss,
  onExtraAction,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [revealedLen, setRevealedLen] = useState(0);
  const typeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const text = cutIn?.text ?? '';
  const isTypingComplete = revealedLen >= text.length;
  const dismissMode = cutIn?.dismissMode ?? 'button';

  const clearTypeTimer = useCallback(() => {
    if (typeTimerRef.current) {
      clearInterval(typeTimerRef.current);
      typeTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!visible || !cutIn) {
      clearTypeTimer();
      setRevealedLen(0);
      return;
    }
    clearTypeTimer();
    setRevealedLen(0);
    let len = 0;
    typeTimerRef.current = setInterval(() => {
      len += 1;
      if (len >= text.length) {
        clearTypeTimer();
        setRevealedLen(text.length);
        return;
      }
      setRevealedLen(len);
    }, TYPEWRITER_MS);
    return clearTypeTimer;
  }, [visible, cutIn?.id, text.length, clearTypeTimer]);

  useEffect(() => () => clearTypeTimer(), [clearTypeTimer]);

  const revealAll = useCallback(() => {
    clearTypeTimer();
    setRevealedLen(text.length);
  }, [clearTypeTimer, text.length]);

  const onPrimary = useCallback(() => {
    if (!cutIn) return;
    if (!isTypingComplete) {
      revealAll();
      return;
    }
    onDismiss();
  }, [cutIn, isTypingComplete, revealAll, onDismiss]);

  const onPanelPress = useCallback(() => {
    if (!cutIn || !isTypingComplete) {
      revealAll();
      return;
    }
    if (dismissMode === 'tap') onDismiss();
  }, [cutIn, dismissMode, isTypingComplete, revealAll, onDismiss]);

  if (!cutIn) return null;

  const border = toneBorder(cutIn.tone);
  const initials = speakerInitials(cutIn.speakerName, cutIn.speakerId);
  const roleLine = [cutIn.speakerTitle, cutIn.department].filter(Boolean).join(' · ');
  const isCompact = height < 640 || width < 360;
  const primaryLabel = !isTypingComplete
    ? 'Show full message'
    : cutIn.tone === 'critical' || cutIn.type === 'system'
      ? 'Acknowledge'
      : 'Continue';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onPrimary}
      statusBarTranslucent
    >
      <View style={styles.root} accessibilityViewIsModal>
        <View style={styles.backdrop} pointerEvents="none" />
        <View
          style={[
            styles.foreground,
            {
              paddingTop: insets.top + 12,
              paddingBottom: insets.bottom + 12,
              paddingHorizontal: 16,
            },
          ]}
        >
          <Pressable
            onPress={dismissMode === 'tap' ? onPanelPress : undefined}
            style={[
              styles.panel,
              {
                borderColor: border,
                maxWidth: 560,
                width: '100%',
                alignSelf: 'center',
              },
            ]}
          >
            <View style={styles.frameAccent} pointerEvents="none" />

            <View style={[isCompact ? styles.rowCompact : styles.row]}>
              <View style={styles.portraitSlot}>
                <View
                  style={[
                    styles.portraitSilhouette,
                    { borderColor: border, backgroundColor: 'rgba(2, 6, 18, 0.92)' },
                  ]}
                />
                <View
                  style={[
                    styles.avatar,
                    { backgroundColor: avatarBg(cutIn.tone), borderColor: border },
                  ]}
                >
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              </View>
              <View style={styles.headerText}>
                <Text style={styles.speaker} numberOfLines={2}>
                  {cutIn.speakerName}
                </Text>
                {roleLine ? (
                  <Text style={styles.role} numberOfLines={2}>
                    {roleLine}
                  </Text>
                ) : null}
              </View>
            </View>

            {cutIn.title ? <Text style={styles.title}>{cutIn.title}</Text> : null}

            <Pressable
              onPress={revealAll}
              accessibilityRole="button"
              accessibilityLabel="Reveal full dialogue"
            >
              <Text style={styles.body}>{text.slice(0, revealedLen)}</Text>
            </Pressable>

            <PrimaryButton title={primaryLabel} onPress={onPrimary} style={styles.primaryBtn} />

            {isTypingComplete && extraActions.length > 0 && onExtraAction ? (
              <View style={styles.extraRow}>
                {extraActions.map((a) => (
                  <PrimaryButton
                    key={a.id}
                    title={a.label}
                    variant={a.style === 'danger' ? 'danger' : a.style === 'primary' ? 'primary' : 'ghost'}
                    onPress={() => onExtraAction(a)}
                    style={styles.extraBtn}
                  />
                ))}
              </View>
            ) : null}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 2, 10, 0.86)',
  },
  foreground: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  panel: {
    borderWidth: 2,
    borderRadius: theme.cardRadius,
    padding: 18,
    backgroundColor: 'rgba(4, 12, 28, 0.97)',
    overflow: 'hidden',
    marginBottom: 4,
  },
  frameAccent: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 2,
    backgroundColor: 'rgba(34, 211, 238, 0.35)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowCompact: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
  },
  portraitSlot: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portraitSilhouette: {
    position: 'absolute',
    width: 56,
    height: 72,
    borderRadius: 10,
    borderWidth: 1,
    opacity: 0.35,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: theme.text,
    fontFamily: theme.fontMono,
    fontSize: 19,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
    minWidth: 0,
  },
  speaker: {
    color: theme.text,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.2,
  },
  role: {
    color: theme.textMuted,
    fontSize: 12,
    marginTop: 4,
    fontFamily: theme.fontMono,
  },
  title: {
    color: theme.accent,
    fontSize: 14,
    fontWeight: '800',
    marginTop: 12,
    fontFamily: theme.fontMono,
    letterSpacing: 0.4,
  },
  body: {
    color: theme.text,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    fontFamily: theme.fontMono,
  },
  primaryBtn: {
    marginTop: 16,
  },
  extraRow: {
    marginTop: 10,
    gap: 8,
  },
  extraBtn: {
    marginTop: 0,
  },
});
