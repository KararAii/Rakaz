import { Navigation2 } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { Animated, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { Theme, withAlpha } from '@/constants/theme';
import { usePulse } from '@/hooks/useAnimatedNumber';

/** Circular pin used on the school and address maps. */
export function MapPinBadge({ icon: Icon, tint }: { icon: LucideIcon; tint: string }) {
  return (
    <View style={[styles.pin, { backgroundColor: tint }]}>
      <Icon size={15} color={Theme.white} fill={Theme.white} strokeWidth={2.2} />
    </View>
  );
}

/** Map label chip with a pin, e.g. "منزل العائلة". */
export function MapPlaceLabel({ icon: Icon, title, tint }: { icon: LucideIcon; title: string; tint: string }) {
  return (
    <View style={styles.place}>
      <View style={[styles.placeIcon, { backgroundColor: tint }]}>
        <Icon size={13} color={Theme.white} fill={Theme.white} strokeWidth={2.2} />
      </View>
      <View style={styles.placeText}>
        <AppText size={10} weight="bold" align="center" numberOfLines={1}>
          {title}
        </AppText>
      </View>
    </View>
  );
}

/** Navy capsule "الحافلة" marker from the design with a pulsing halo while moving. */
export function BusMarker({ moving, label = 'الحافلة' }: { moving: boolean; label?: string }) {
  const pulse = usePulse(moving, 1200);
  return (
    <View style={styles.busWrap}>
      {moving ? (
        <Animated.View
          style={[
            styles.halo,
            {
              opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.75, 0.45] }),
              transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] }) }],
            },
          ]}
        />
      ) : null}
      <View style={styles.bus}>
        <View style={styles.busArrow}>
          <Navigation2 size={11} color={Theme.white} fill={Theme.white} />
        </View>
        <AppText size="caption" weight="bold" color={Theme.white}>
          {label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 3,
    borderColor: Theme.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 3px 6px rgba(0,0,0,0.2)',
  },
  place: { alignItems: 'center', gap: 3, padding: 4 },
  placeIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2.5,
    borderColor: Theme.white,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0px 2px 4px rgba(0,0,0,0.18)',
  },
  placeText: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 6, backgroundColor: Theme.white, boxShadow: '0px 1px 3px rgba(0,0,0,0.08)' },
  busWrap: { width: 112, height: 56, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: 96, height: 44, borderRadius: 22, backgroundColor: withAlpha(Theme.gold, 0.3) },
  bus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: 12,
    borderRadius: 17,
    backgroundColor: Theme.navy,
    borderWidth: 2.5,
    borderColor: Theme.white,
    boxShadow: `0px 4px 8px ${withAlpha(Theme.navy, 0.35)}`,
  },
  busArrow: { transform: [{ rotate: '-45deg' }] },
});
