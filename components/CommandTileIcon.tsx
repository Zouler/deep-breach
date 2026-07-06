import { Ionicons } from '@expo/vector-icons';

import type { CommandIconKey } from '@/constants/assets';
import { theme } from '@/constants/theme';

type Props = {
  name: CommandIconKey;
  size?: number;
  color?: string;
};

/**
 * Command grid glyphs. SVG masters live in assets/icons/command/*.svg;
 * Ionicons used at runtime until react-native-svg file wiring is added.
 */
const GLYPH: Record<CommandIconKey, keyof typeof Ionicons.glyphMap> = {
  dock: 'construct-outline',
  missions: 'calendar-outline',
  crew: 'people-outline',
  inventory: 'cube-outline',
  upgrades: 'layers-outline',
  log: 'document-text-outline',
};

export function CommandTileIcon({
  name,
  size = 24,
  color = theme.instrumentCyan,
}: Props) {
  return <Ionicons name={GLYPH[name]} size={size} color={color} />;
}
