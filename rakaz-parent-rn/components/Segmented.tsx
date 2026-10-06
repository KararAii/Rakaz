import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { PressableScale } from '@/components/PressableScale';
import { shadow, Theme, withAlpha } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

export interface SegmentedProps<T extends string> {
  options: { value: T; title: string }[];
  value: T;
  onChange: (value: T) => void;
}

/** `Picker(...).pickerStyle(.segmented)`. */
export function Segmented<T extends string>({ options, value, onChange }: SegmentedProps<T>) {
  return (
    <View style={styles.track}>
      {options.map((o) => {
        const selected = o.value === value;
        return (
          <PressableScale
            key={o.value}
            scale={0.97}
            accessibilityLabel={o.title}
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selection();
              onChange(o.value);
            }}
            style={[styles.segment, selected ? styles.selected : null]}
          >
            <AppText size="footnote" weight={selected ? 'semibold' : 'medium'} align="center" numberOfLines={1}>
              {o.title}
            </AppText>
          </PressableScale>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: { flexDirection: 'row', padding: 2, borderRadius: 9, backgroundColor: withAlpha(Theme.muted, 0.16), alignSelf: 'stretch' },
  segment: { flex: 1, minHeight: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  selected: { backgroundColor: Theme.white, boxShadow: shadow(1, 3, 0.12, Theme.black) },
});
