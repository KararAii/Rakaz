import { ChevronDown, ChevronUp, Hand, WandSparkles, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { BrandButton } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz } from '@/constants/theme';
import { findStudent } from '@/store/driverState';
import { useDriverStore } from '@/store/driverStore';
import { RouteOptimizationMode, RouteOptimizationModeTitle, studentAddress } from '@/types/models';
import { ArabicFormat, arabicDigits } from '@/utils/arabicFormat';

function MoveButton({ icon: Icon, label, enabled, onPress }: { icon: LucideIcon; label: string; enabled: boolean; onPress: () => void }) {
  return (
    <PressableScale onPress={onPress} disabled={!enabled} accessibilityLabel={label} style={[styles.move, !enabled && styles.moveDisabled]}>
      <Icon color={Rakaz.Navy} size={24} />
    </PressableScale>
  );
}

/** Stop order editor: admin defines the route; the driver can adjust manually or optimise automatically. */
export function RouteOrderSheet({ visible, onDismiss }: { visible: boolean; onDismiss: () => void }) {
  const store = useDriverStore();
  const { route } = store.state;
  const lastIndex = route.stops.length - 1;

  return (
    <BottomSheet visible={visible} onDismiss={onDismiss}>
      <View>
        <AppText variant="titleLarge">ترتيب نقاط التوقف</AppText>
        <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
          {`مسار ${route.code} · أُنشئ بواسطة ${route.createdBy}`}
        </AppText>
        <AppText variant="labelMedium" color={Rakaz.GoldDeep}>
          {`طريقة الترتيب: ${RouteOptimizationModeTitle[route.optimizationMode]}`}
        </AppText>
      </View>
      <View style={styles.list}>
        {route.stops.map((stop, index) => {
          const student = findStudent(store.state, stop.studentId);
          if (!student) return null;
          return (
            <View key={stop.studentId} style={styles.row}>
              <View style={styles.number}>
                <AppText variant="labelSmall" color={Rakaz.White}>
                  {ArabicFormat.number(index + 1)}
                </AppText>
              </View>
              <View style={styles.flex}>
                <AppText variant="titleSmall">{student.name}</AppText>
                <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
                  {`${studentAddress(student)} · ${arabicDigits(stop.pickupTime)}`}
                </AppText>
              </View>
              <MoveButton icon={ChevronUp} label="تحريك للأعلى" enabled={index > 0} onPress={() => store.moveStop(index, index - 1)} />
              <MoveButton
                icon={ChevronDown}
                label="تحريك للأسفل"
                enabled={index < lastIndex}
                onPress={() => store.moveStop(index, index + 1)}
              />
            </View>
          );
        })}
      </View>
      <BrandButton
        title="تحسين تلقائي (الأقرب فالأقرب)"
        icon={WandSparkles}
        kind="NAVY"
        onPress={() => store.applyOptimization(RouteOptimizationMode.AUTOMATIC)}
      />
      <BrandButton
        title="اعتماد الترتيب الحالي يدوياً"
        icon={Hand}
        kind="OUTLINE"
        onPress={() => store.applyOptimization(RouteOptimizationMode.MANUAL)}
      />
      <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
        يتم إرسال الترتيب الجديد إلى الإدارة للمراجعة. يبقى التعديل اليدوي متاحاً دائماً.
      </AppText>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  list: { gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: Rakaz.Canvas,
    paddingStart: 12,
    paddingEnd: 4,
    paddingVertical: 6,
    gap: 12,
  },
  number: { width: 28, height: 28, borderRadius: 14, backgroundColor: Rakaz.Navy, alignItems: 'center', justifyContent: 'center' },
  move: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  moveDisabled: { opacity: 0.25 },
});
