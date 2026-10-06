import { Circle, CircleDot, UserX } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/AppText';
import { BottomSheet } from '@/components/BottomSheet';
import { BrandButton, InitialsAvatar } from '@/components/Components';
import { PressableScale } from '@/components/PressableScale';
import { Rakaz } from '@/constants/theme';
import { type Student, studentInitials } from '@/types/models';

export const absenceReasons = ['لم يحضر إلى المحطة', 'أبلغ ولي الأمر بالغياب', 'مريض', 'لا أحد في المنزل', 'سبب آخر'];

export interface AbsenceSheetProps {
  student: Student | null;
  onDismiss: () => void;
  onConfirm: (reason: string) => void;
}

export function AbsenceSheet({ student, onDismiss, onConfirm }: AbsenceSheetProps) {
  const [reason, setReason] = useState(absenceReasons[0] ?? '');
  useEffect(() => {
    if (student) setReason(absenceReasons[0] ?? '');
  }, [student]);

  return (
    <BottomSheet visible={student != null} onDismiss={onDismiss}>
      {student ? (
        <>
          <View style={styles.header}>
            <InitialsAvatar initials={studentInitials(student)} size={48} fill={Rakaz.RedSoft} foreground={Rakaz.Red} corner={14} />
            <View>
              <AppText variant="labelSmall" color={Rakaz.Red}>
                تسجيل غياب
              </AppText>
              <AppText variant="titleLarge">{student.name}</AppText>
            </View>
          </View>
          <View style={styles.list}>
            {absenceReasons.map((item) => {
              const selected = item === reason;
              const Icon = selected ? CircleDot : Circle;
              return (
                <PressableScale
                  key={item}
                  onPress={() => setReason(item)}
                  accessibilityLabel={item}
                  style={[styles.reason, { backgroundColor: selected ? Rakaz.RedSoft : Rakaz.Canvas }]}
                >
                  <AppText variant="titleSmall" style={styles.flex}>
                    {item}
                  </AppText>
                  <Icon color={selected ? Rakaz.Red : Rakaz.Line} size={22} />
                </PressableScale>
              );
            })}
          </View>
          <AppText variant="bodySmall" color={Rakaz.InkSecondary}>
            سيتم تسجيل الوقت والموقع وإشعار ولي الأمر والإدارة
          </AppText>
          <BrandButton title="تأكيد الغياب" icon={UserX} kind="DANGER" onPress={() => onConfirm(reason)} />
        </>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  list: { gap: 8 },
  reason: {
    height: 50,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
