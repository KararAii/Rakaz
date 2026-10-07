import type { LucideIcon } from 'lucide-react-native';
import { ActivityIndicator, type StyleProp, StyleSheet, View, type ViewStyle } from 'react-native';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { Theme, withAlpha } from '@/constants/theme';

export interface PrimaryButtonProps {
  title: string;
  onPress: () => void;
  icon?: LucideIcon;
  /** Icon placed after the title (e.g. a forward arrow) instead of before it. */
  trailingIcon?: boolean;
  fill?: string;
  foreground?: string;
  height?: number;
  loading?: boolean;
  disabled?: boolean;
  dimmed?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Filled call-to-action (SwiftUI `PrimaryButtonStyle`). */
export function PrimaryButton({
  title,
  onPress,
  icon: Icon,
  trailingIcon = false,
  fill = Theme.navy,
  foreground = Theme.white,
  height = 56,
  loading = false,
  disabled = false,
  dimmed = false,
  style,
}: PrimaryButtonProps) {
  const elevated = fill === Theme.navy || fill === Theme.teal;
  const icon = Icon ? <Icon size={17} color={foreground} strokeWidth={2.4} /> : null;
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled || loading}
      accessibilityLabel={title}
      style={[
        styles.primary,
        { minHeight: height, backgroundColor: fill, opacity: dimmed ? 0.6 : 1 },
        elevated ? { boxShadow: `0px 6px 12px ${withAlpha(fill, 0.25)}` } : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={Theme.white} />
      ) : (
        <View style={styles.row}>
          {trailingIcon ? null : icon}
          <AppText size="headline" weight="bold" color={foreground}>
            {title}
          </AppText>
          {trailingIcon ? icon : null}
        </View>
      )}
    </PressableScale>
  );
}

export interface OutlineButtonProps {
  title: string;
  onPress: () => void;
  icon?: LucideIcon;
  tint?: string;
  style?: StyleProp<ViewStyle>;
}

/** Outlined secondary action (white with hairline border). */
export function OutlineButton({ title, onPress, icon: Icon, tint = Theme.ink, style }: OutlineButtonProps) {
  return (
    <PressableScale onPress={onPress} accessibilityLabel={title} style={[styles.outline, style]}>
      <View style={styles.row}>
        {Icon ? <Icon size={16} color={tint} strokeWidth={2.4} /> : null}
        <AppText size="subheadline" weight="bold" color={tint}>
          {title}
        </AppText>
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  primary: {
    alignSelf: 'stretch',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  outline: {
    alignSelf: 'stretch',
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
